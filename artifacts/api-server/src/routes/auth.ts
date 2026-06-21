import { Router, type IRouter, type Request } from "express";
import { eq, sql, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import {
  db,
  usersTable,
  successStoriesTable,
  passwordResetTokensTable,
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
import { sendEmail, passwordResetEmail } from "../lib/email";
import { getFlag } from "./adminExtra";
import { invalidateNumbersCache } from "./numbers";

// ─── DB-backed password reset tokens ────────────────────────────────────────
// Tokens are stored in the `password_reset_tokens` table so they survive
// server restarts. Only the SHA-256 hash of the raw token is persisted —
// the raw hex token is embedded in the email URL and never written to the DB.
const RESET_TTL_MS = 15 * 60 * 1000;

/** Deletes all expired rows from the tokens table (fire-and-forget). */
function pruneExpiredTokens(): void {
  void db
    .delete(passwordResetTokensTable)
    .where(lt(passwordResetTokensTable.expiresAt, new Date()));
}

/**
 * Creates a password-reset token for the given email, persists its hash to
 * the DB, and returns the raw token suitable for embedding in a URL.
 *
 * @param email   - The account email to bind the token to.
 * @param ttlMs   - Time-to-live in milliseconds (defaults to 15 min).
 */
export async function createResetToken(
  email: string,
  ttlMs = RESET_TTL_MS,
): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  const expiresAt = new Date(Date.now() + ttlMs);
  await db
    .insert(passwordResetTokensTable)
    .values({ tokenHash, email, expiresAt })
    .onConflictDoUpdate({
      target: passwordResetTokensTable.tokenHash,
      set: { email, expiresAt },
    });
  return rawToken;
}

/**
 * Returns true if the given raw token exists in the DB and has not expired.
 * Used by the mentor-approval reminder to skip sending if the mentor already
 * clicked the link before the 20-hour reminder fires.
 */
export async function isResetTokenValid(rawToken: string): Promise<boolean> {
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  const [entry] = await db
    .select({ expiresAt: passwordResetTokensTable.expiresAt })
    .from(passwordResetTokensTable)
    .where(eq(passwordResetTokensTable.tokenHash, tokenHash))
    .limit(1);
  return !!entry && entry.expiresAt > new Date();
}

/**
 * Looks up a raw token in the DB, deletes it (single-use), and returns the
 * bound email. Returns null if the token is missing or expired.
 */
async function consumeResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  const [entry] = await db
    .delete(passwordResetTokensTable)
    .where(eq(passwordResetTokensTable.tokenHash, tokenHash))
    .returning();
  if (!entry || entry.expiresAt < new Date()) return null;
  return entry.email;
}

// Rate-limit forgot-password: 3 per email per hour
const forgotAttempts = new Map<string, number[]>();
function forgotRateLimited(email: string): boolean {
  const HOUR = 60 * 60 * 1000;
  const now = Date.now();
  const arr = (forgotAttempts.get(email) || []).filter(t => now - t < HOUR);
  if (arr.length >= 3) return true;
  arr.push(now);
  forgotAttempts.set(email, arr);
  return false;
}

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
  // Drop the hash and the internal session epoch before sending near the wire.
  const { passwordHash: _hash, sessionEpoch: _epoch, ...rest } = u;
  void _hash;
  void _epoch;
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
    const token = makeUserSessionToken(row.id, row.sessionEpoch);
    setUserSessionCookie(res, token);
    invalidateNumbersCache();
    res.json({ ok: true, user: toPublic(row), token });
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
    const now = new Date();
    await db
      .update(usersTable)
      .set({ lastLoginAt: now, updatedAt: now })
      .where(eq(usersTable.id, user.id));
    const token = makeUserSessionToken(user.id, user.sessionEpoch);
    setUserSessionCookie(res, token);
    res.json({ ok: true, user: toPublic({ ...user, lastLoginAt: now, updatedAt: now }), token });
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
    // Sync avatarUrl to any story submitted by this user
    if (parsed.data.avatarUrl !== undefined) {
      await db
        .update(successStoriesTable)
        .set({ avatarUrl: parsed.data.avatarUrl ?? null, updatedAt: new Date() })
        .where(eq(successStoriesTable.submittedByUserId, session.userId));
    }
    res.json({ user: toPublic(user) });
  } catch (err) {
    logger.error({ err }, "update profile failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Change password (authenticated) ────────────────────────────────────────

router.post("/auth/me/change-password", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const { currentPassword, newPassword } = req.body ?? {};

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      res.status(400).json({ error: "بيانات غير صحيحة" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "كلمة السرّ الجديدة يجب أن تكون 8 أحرف فأكثر" });
      return;
    }
    if (newPassword.length > 200) {
      res.status(400).json({ error: "كلمة السرّ طويلة جدًّا" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "غير موجود" }); return; }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) { res.status(401).json({ error: "كلمة السرّ الحالية خاطئة" }); return; }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    // Bump the session epoch to revoke all previously-issued tokens, then
    // re-issue a fresh cookie so the user who just changed their own password
    // stays logged in on this device.
    const [updated] = await db
      .update(usersTable)
      .set({
        passwordHash,
        sessionEpoch: sql`${usersTable.sessionEpoch} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, session.userId))
      .returning({ sessionEpoch: usersTable.sessionEpoch });
    if (!updated) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    setUserSessionCookie(
      res,
      makeUserSessionToken(session.userId, updated.sessionEpoch),
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "change-password failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Forgot password ─────────────────────────────────────────────────────────
// Stores a short-lived token in memory and emails the reset link via Resend.
// Without RESEND_API_KEY the email is NOT sent; in local dev you can surface the
// reset link by running with EMAIL_DEBUG_BODY=1 and LOG_LEVEL=debug (see src/lib/email.ts).

router.post("/auth/forgot-password", async (req, res) => {
  try {
    if (rateLimited(req)) { res.status(429).json({ error: "محاولات كثيرة، حاول لاحقًا" }); return; }

    const email = String(req.body?.email ?? "").trim().toLowerCase();
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      res.status(400).json({ error: "بريد غير صحيح" });
      return;
    }

    if (forgotRateLimited(email)) {
      // Always return success to prevent email enumeration
      res.json({ ok: true });
      return;
    }

    const [user] = await db.select({ id: usersTable.id, fullName: usersTable.fullName })
      .from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (user) {
      pruneExpiredTokens();
      const rawToken = await createResetToken(email);
      const resetUrl = `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/reset-password?token=${rawToken}`;
      const { subject, html, text } = passwordResetEmail(resetUrl, user.fullName);
      // Fire-and-forget: never let provider latency/failure leak timing info or
      // block the constant-time success response below.
      void sendEmail({ to: email, subject, html, text });
    }

    // Always return ok (don't reveal whether email exists)
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "forgot-password failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Reset password ──────────────────────────────────────────────────────────

router.post("/auth/reset-password", async (req, res) => {
  try {
    const rawToken = String(req.body?.token ?? "").trim();
    const newPassword = String(req.body?.newPassword ?? "");

    if (!rawToken || newPassword.length < 8) {
      res.status(400).json({ error: "بيانات غير صحيحة أو كلمة السرّ قصيرة" });
      return;
    }
    if (newPassword.length > 200) {
      res.status(400).json({ error: "كلمة السرّ طويلة جدًّا" });
      return;
    }

    const email = await consumeResetToken(rawToken);

    if (!email) {
      res.status(400).json({ error: "الرابط منتهٍ أو غير صحيح" });
      return;
    }

    const [user] = await db.select({ id: usersTable.id })
      .from(usersTable).where(eq(usersTable.email, email)).limit(1);

    if (!user) { res.status(404).json({ error: "الحساب غير موجود" }); return; }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const now = new Date();
    // Bump the session epoch so every session issued before this reset is
    // revoked (the whole point of a password reset after a compromise).
    await db
      .update(usersTable)
      .set({
        passwordHash,
        passwordSetAt: now,
        sessionEpoch: sql`${usersTable.sessionEpoch} + 1`,
        updatedAt: now,
      })
      .where(eq(usersTable.id, user.id));

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "reset-password failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
