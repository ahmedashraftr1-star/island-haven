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
  setSessionCookie,
} from "../lib/auth";

const router: IRouter = Router();

// ─── Rate limiter for admin login ────────────────────────────────────────────
// Stricter than the member limiter: 5 attempts per 15-minute sliding window.
// Admin login guards a single high-privilege shared password, so even a brief
// burst of guesses should be throttled immediately.
const ADMIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_MAX_ATTEMPTS = 5;
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
        await db
          .update(adminUsersTable)
          .set({ lastLoginAt: new Date() })
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

export default router;
