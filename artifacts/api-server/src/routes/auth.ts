import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  registerUserSchema,
  loginUserSchema,
  updateProfileSchema,
  type PublicUser,
} from "@workspace/db";
import {
  makeUserSessionToken,
  setUserSessionCookie,
  clearUserSessionCookie,
  requireUser,
  type UserSession,
} from "../lib/auth";
import { logger } from "../lib/logger";
import { getFlag } from "./adminExtra";

// Postgres unique-violation SQLSTATE — used to surface a friendly 409 instead
// of letting drizzle bubble up as a generic 500 on registration races.
const PG_UNIQUE_VIOLATION = "23505";
function isUniqueViolation(err: unknown): boolean {
  // Drizzle re-throws as DrizzleQueryError and stashes the original pg error
  // on `.cause`. Walk a couple of levels just in case.
  let cur: unknown = err;
  for (let i = 0; i < 4 && cur; i++) {
    if (
      typeof cur === "object" &&
      cur !== null &&
      "code" in cur &&
      (cur as { code: unknown }).code === PG_UNIQUE_VIOLATION
    ) {
      return true;
    }
    cur =
      typeof cur === "object" && cur !== null && "cause" in cur
        ? (cur as { cause: unknown }).cause
        : null;
  }
  return false;
}

const router: IRouter = Router();

// ─── In-memory rate limit for auth endpoints ────────────────────────────────
// Modest limits — per-IP, sliding 10-min window. Survives no restart but is
// good enough to slow basic credential stuffing in this single-instance app.
const ATTEMPTS_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, number[]>();
let lastSweep = 0;

// Rely on Express's `trust proxy=1` (set in app.ts) — it derives req.ip from
// the *last* hop in X-Forwarded-For, which is the trusted Replit edge proxy
// rather than any client-spoofable header. Parsing the raw header ourselves
// would re-open spoofing.
function rateLimited(req: Request): boolean {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const arr = (attempts.get(ip) || []).filter(
    (t) => now - t < ATTEMPTS_WINDOW_MS,
  );
  arr.push(now);
  attempts.set(ip, arr);
  // Periodically sweep stale buckets so the map can't grow without bound on
  // a long-running process under sustained scanner traffic.
  if (now - lastSweep > ATTEMPTS_WINDOW_MS) {
    lastSweep = now;
    for (const [k, v] of attempts) {
      const fresh = v.filter((t) => now - t < ATTEMPTS_WINDOW_MS);
      if (fresh.length === 0) attempts.delete(k);
      else attempts.set(k, fresh);
    }
  }
  return arr.length > MAX_ATTEMPTS;
}

function toPublic(u: typeof usersTable.$inferSelect): PublicUser {
  // Drop the hash before sending anywhere near the wire.
  const { passwordHash: _hash, ...rest } = u;
  void _hash;
  return rest;
}

// ─── Register ───────────────────────────────────────────────────────────────

router.post("/auth/register", async (req, res) => {
  try {
    if (rateLimited(req)) {
      res.status(429).json({ error: "محاولات كثيرة، حاول لاحقًا" });
      return;
    }
    if (!(await getFlag("registration_enabled"))) {
      res.status(403).json({ error: "التسجيل مغلق مؤقّتًا" });
      return;
    }
    const parsed = registerUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: "تحقّق من البيانات",
        issues: parsed.error.issues.map((i: { path: PropertyKey[]; message: string }) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }
    const { email, password, fullName, role } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);
    // Atomic insert: rely on the unique constraint on email to handle
    // concurrent registrations rather than a TOCTOU select-then-insert.
    let row;
    try {
      [row] = await db
        .insert(usersTable)
        .values({ email, passwordHash, fullName, role })
        .returning();
    } catch (err) {
      if (isUniqueViolation(err)) {
        // We deliberately confirm the conflict to keep UX clean for legitimate
        // users; the auth-route rate limiter (10/10min/IP) bounds enumeration.
        res.status(409).json({ error: "هذا البريد مسجّل مسبقًا" });
        return;
      }
      throw err;
    }
    const token = makeUserSessionToken(row.id);
    setUserSessionCookie(res, token);
    res.json({ ok: true, user: toPublic(row) });
  } catch (err) {
    logger.error({ err }, "register failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Login ──────────────────────────────────────────────────────────────────

router.post("/auth/login", async (req, res) => {
  try {
    if (rateLimited(req)) {
      res.status(429).json({ error: "محاولات كثيرة، حاول لاحقًا" });
      return;
    }
    const parsed = loginUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "تحقّق من البيانات" });
      return;
    }
    const { email, password } = parsed.data;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    // Always run a hash compare to keep timing constant whether or not the
    // user exists — prevents user-enumeration via response timing.
    const dummy = "$2b$12$ABCDEFGHIJKLMNOPQRSTUu5g5p3aZ1k9o0p0p0p0p0p0p0p0p0p0";
    const ok = user
      ? await bcrypt.compare(password, user.passwordHash)
      : (await bcrypt.compare(password, dummy), false);
    if (!user || !ok) {
      res.status(401).json({ error: "بريد أو كلمة سرّ خاطئة" });
      return;
    }
    if (user.status === "banned") {
      res.status(403).json({ error: "هذا الحساب مُعلَّق" });
      return;
    }
    const token = makeUserSessionToken(user.id);
    setUserSessionCookie(res, token);
    res.json({ ok: true, user: toPublic(user) });
  } catch (err) {
    logger.error({ err }, "login failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Logout ─────────────────────────────────────────────────────────────────

router.post("/auth/logout", (_req, res) => {
  clearUserSessionCookie(res);
  res.json({ ok: true });
});

// ─── Me ─────────────────────────────────────────────────────────────────────

router.get("/auth/me", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, session.userId))
      .limit(1);
    if (!user) {
      clearUserSessionCookie(res);
      res.status(401).json({ error: "الحساب غير موجود" });
      return;
    }
    res.json({ user: toPublic(user) });
  } catch (err) {
    logger.error({ err }, "me failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Update profile ─────────────────────────────────────────────────────────

router.patch("/auth/me", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: "تحقّق من البيانات",
        issues: parsed.error.issues.map((i: { path: PropertyKey[]; message: string }) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }
    const updates = { ...parsed.data, updatedAt: new Date() };
    const [user] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, session.userId))
      .returning();
    if (!user) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ user: toPublic(user) });
  } catch (err) {
    logger.error({ err }, "update profile failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
