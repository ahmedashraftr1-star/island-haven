import { Router, type IRouter, type Request } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import {
  checkAdminCredentials,
  clearSessionCookie,
  makeSessionToken,
  makeAdminToken,
  requireAdmin,
  resolveAdmin,
  getAdmin,
  setSessionCookie,
} from "../lib/auth";
import { randomBase32Secret, verifyTotp, otpauthUri } from "../lib/totp";

const router: IRouter = Router();

// ─── Rate limiter for admin login ────────────────────────────────────────────
// Stricter than the member limiter: 5 attempts per 15-minute sliding window.
// Admin login guards a single high-privilege shared password, so even a brief
// burst of guesses should be throttled immediately.
const ADMIN_WINDOW_MS = 15 * 60 * 1000;
// Default 5 attempts / 15 min — the secure production value. Overridable via env so a
// test run (which logs the admin in across several suites) or a trusted internal tool
// can raise it; matches how RATE_LIMIT_AUTH_MAX / RATE_LIMIT_GENERAL_MAX already work.
const ADMIN_MAX_ATTEMPTS = Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS ?? 5);
const adminAttempts = new Map<string, number[]>();
let adminLastSweep = 0;

function adminRateLimited(req: Request): boolean {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const arr = (adminAttempts.get(ip) || []).filter(
    (t) => now - t < ADMIN_WINDOW_MS,
  );
  arr.push(now);
  adminAttempts.set(ip, arr);
  if (now - adminLastSweep > ADMIN_WINDOW_MS) {
    adminLastSweep = now;
    for (const [k, v] of adminAttempts) {
      const fresh = v.filter((t) => now - t < ADMIN_WINDOW_MS);
      if (fresh.length === 0) adminAttempts.delete(k);
      else adminAttempts.set(k, fresh);
    }
  }
  return arr.length > ADMIN_MAX_ATTEMPTS;
}

router.post("/admin/login", async (req, res) => {
  try {
    if (adminRateLimited(req)) {
      res.status(429).json({ ok: false, error: "محاولات كثيرة، حاول لاحقًا" });
      return;
    }
    const identifier = String(req.body?.email ?? req.body?.username ?? "").trim();
    const password = String(req.body?.password ?? "");

    // 1) DB-backed team/staff account (identified by email + bcrypt).
    if (identifier.includes("@")) {
      const [row] = await db
        .select()
        .from(adminUsersTable)
        .where(eq(adminUsersTable.email, identifier.toLowerCase()))
        .limit(1);
      if (
        row &&
        row.status === "active" &&
        (await bcrypt.compare(password, row.passwordHash))
      ) {
        // Second factor: if enabled, a valid, NOT-YET-USED TOTP code is required.
        const loginPatch: { lastLoginAt: Date; totpLastCounter?: number } = { lastLoginAt: new Date() };
        if (row.totpEnabled) {
          const code = String(req.body?.code ?? "").trim();
          const matched = code && row.totpSecret ? verifyTotp(row.totpSecret, code) : -1;
          // Reject invalid codes AND any code at/below the last accepted step
          // (replay of a captured-but-still-valid code).
          if (matched < 0 || matched <= row.totpLastCounter) {
            res.status(401).json({
              ok: false,
              error: code ? "رمز التحقّق غير صحيح" : "يتطلّب رمز التحقّق الثنائيّ",
              twoFactorRequired: true,
            });
            return;
          }
          loginPatch.totpLastCounter = matched;
        }
        await db
          .update(adminUsersTable)
          .set(loginPatch)
          .where(eq(adminUsersTable.id, row.id));
        const token = makeAdminToken(row.id, row.sessionEpoch);
        setSessionCookie(res, token);
        res.json({ ok: true, token });
        return;
      }
    }

    // 2) Bootstrap ENV super-admin (ADMIN_USERNAME/ADMIN_PASSWORD).
    if (checkAdminCredentials(identifier, password)) {
      const token = makeSessionToken();
      setSessionCookie(res, token);
      res.json({ ok: true, token });
      return;
    }

    res.status(401).json({ ok: false, error: "بيانات الدخول غير صحيحة" });
  } catch {
    res.status(500).json({ ok: false, error: "خطأ في الخادم" });
  }
});

router.post("/admin/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/admin/me", async (req, res) => {
  const admin = await resolveAdmin(req);
  if (!admin) {
    res.json({ authenticated: false });
    return;
  }
  res.json({
    authenticated: true,
    admin: {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      isSuper: admin.isSuper,
      permissions: [...admin.permissions],
    },
  });
});

router.get("/admin/ping", requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

// ─── Two-factor (TOTP) — a staff member manages their OWN account ─────────────
// Under /admin/me/* so the RBAC gate treats it as authn-only (any admin).
// The ENV super-admin (id 0) has no DB row and cannot enrol.

router.get("/admin/me/2fa/status", requireAdmin, async (req, res) => {
  const me = getAdmin(req);
  if (!me || me.id <= 0) {
    res.json({ enabled: false, pending: false, available: false });
    return;
  }
  const [row] = await db
    .select({ enabled: adminUsersTable.totpEnabled, secret: adminUsersTable.totpSecret })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, me.id))
    .limit(1);
  res.json({ enabled: !!row?.enabled, pending: !!row?.secret && !row?.enabled, available: true });
});

router.post("/admin/me/2fa/setup", requireAdmin, async (req, res) => {
  const me = getAdmin(req);
  if (!me || me.id <= 0) {
    res.status(400).json({ error: "التحقّق الثنائيّ غير متاح لحساب النظام" });
    return;
  }
  const [row] = await db
    .select({ enabled: adminUsersTable.totpEnabled })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, me.id))
    .limit(1);
  if (row?.enabled) {
    res.status(409).json({ error: "التحقّق الثنائيّ مُفعّل بالفعل" });
    return;
  }
  const secret = randomBase32Secret();
  await db.update(adminUsersTable).set({ totpSecret: secret }).where(eq(adminUsersTable.id, me.id));
  res.json({ secret, otpauthUri: otpauthUri(secret, me.email) });
});

router.post("/admin/me/2fa/enable", requireAdmin, async (req, res) => {
  const me = getAdmin(req);
  if (!me || me.id <= 0) {
    res.status(400).json({ error: "غير متاح" });
    return;
  }
  const code = String(req.body?.code ?? "").trim();
  const [row] = await db
    .select({ secret: adminUsersTable.totpSecret, enabled: adminUsersTable.totpEnabled })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, me.id))
    .limit(1);
  if (!row?.secret) {
    res.status(400).json({ error: "ابدأ الإعداد أوّلًا" });
    return;
  }
  const matched = verifyTotp(row.secret, code);
  if (matched < 0) {
    res.status(400).json({ error: "رمز التحقّق غير صحيح" });
    return;
  }
  // Consume this code so it can't be replayed to log in.
  await db.update(adminUsersTable).set({ totpEnabled: true, totpLastCounter: matched }).where(eq(adminUsersTable.id, me.id));
  res.json({ ok: true, enabled: true });
});

router.post("/admin/me/2fa/disable", requireAdmin, async (req, res) => {
  const me = getAdmin(req);
  if (!me || me.id <= 0) {
    res.status(400).json({ error: "غير متاح" });
    return;
  }
  const code = String(req.body?.code ?? "").trim();
  const [row] = await db
    .select({ secret: adminUsersTable.totpSecret, enabled: adminUsersTable.totpEnabled })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, me.id))
    .limit(1);
  // Require a valid current code to turn 2FA off (can't disable someone's 2FA
  // just from a hijacked session without their device).
  if (row?.enabled && (!row.secret || verifyTotp(row.secret, code) < 0)) {
    res.status(400).json({ error: "رمز التحقّق غير صحيح" });
    return;
  }
  await db
    .update(adminUsersTable)
    .set({ totpEnabled: false, totpSecret: null, totpLastCounter: 0 })
    .where(eq(adminUsersTable.id, me.id));
  res.json({ ok: true, enabled: false });
});

export default router;
