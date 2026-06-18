import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

// ─────────────────────────────────────────────────────────────────────────────
// Sessions: HMAC-signed cookies, two flavours
//   • admin session  → cookie "ih_admin",  payload "admin.<exp>"
//   • user session   → cookie "ih_user",   payload "user.<id>.<exp>"
// We never store secrets client-side; the signature is the only proof.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_COOKIE = "ih_admin";
const USER_COOKIE = "ih_user";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

let warnedDevSecret = false;

function getSecret(): string {
  const sessionSecret = process.env.SESSION_SECRET;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (process.env.NODE_ENV === "production") {
    // In production the HMAC signing key MUST be independent from the login
    // password. Reusing ADMIN_PASSWORD as the signing key leaks/couples the
    // two, so require a dedicated, strong SESSION_SECRET.
    if (
      !sessionSecret ||
      sessionSecret.length < 32 ||
      sessionSecret === adminPassword
    ) {
      throw new Error(
        "Refusing to operate without a dedicated session secret in production. " +
          "Set SESSION_SECRET to a strong value (>=32 chars) that DIFFERS from ADMIN_PASSWORD. " +
          "Generate one with: openssl rand -hex 32",
      );
    }
    return sessionSecret;
  }

  // Non-production: prefer SESSION_SECRET; fall back to ADMIN_PASSWORD for
  // local dev convenience, but warn (once) that this is insecure.
  const secret = sessionSecret || adminPassword;
  if (!secret || secret.length < 8) {
    throw new Error(
      "Refusing to operate without a session secret. Set SESSION_SECRET (preferred) or ADMIN_PASSWORD (>=8 chars).",
    );
  }
  if (!sessionSecret && !warnedDevSecret) {
    warnedDevSecret = true;
    console.warn(
      "[auth] SESSION_SECRET is not set; falling back to ADMIN_PASSWORD for HMAC signing. " +
        "This is dev-only and insecure — set a dedicated SESSION_SECRET in production.",
    );
  }
  return secret;
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

// ─── Admin sessions ─────────────────────────────────────────────────────────

export function makeSessionToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `admin.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expiresAtStr, sig] = parts;
  if (role !== "admin") return false;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  return timingSafeEqualStr(sig, sign(`${role}.${expiresAtStr}`));
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(ADMIN_COOKIE, { path: "/" });
}

// ─── User sessions ──────────────────────────────────────────────────────────

// `epoch` is the user's current sessionEpoch (from the DB). Embedding it lets a
// password change/reset (which bumps the stored epoch) invalidate every token
// issued before it — without any server-side session store.
export function makeUserSessionToken(userId: number, epoch: number): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `user.${userId}.${epoch}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export interface UserSession {
  userId: number;
  epoch: number;
  expiresAt: number;
}

export function verifyUserSessionToken(
  token: string | undefined,
): UserSession | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 5) return null;
  const [kind, idStr, epochStr, expiresAtStr, sig] = parts;
  if (kind !== "user") return null;
  const userId = Number(idStr);
  const epoch = Number(epochStr);
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(userId) || userId <= 0) return null;
  if (!Number.isInteger(epoch) || epoch < 0) return null;
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  if (
    !timingSafeEqualStr(sig, sign(`user.${idStr}.${epochStr}.${expiresAtStr}`))
  ) {
    return null;
  }
  return { userId, epoch, expiresAt };
}

export function setUserSessionCookie(res: Response, token: string): void {
  res.cookie(USER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function clearUserSessionCookie(res: Response): void {
  res.clearCookie(USER_COOKIE, { path: "/" });
}

function readBearer(req: Request): string | undefined {
  const h = req.headers["authorization"];
  if (typeof h !== "string") return undefined;
  if (!h.toLowerCase().startsWith("bearer ")) return undefined;
  return h.slice(7).trim() || undefined;
}

export function readUserSession(req: Request): UserSession | null {
  const cookieToken = req.cookies?.[USER_COOKIE];
  const fromCookie = verifyUserSessionToken(cookieToken);
  if (fromCookie) return fromCookie;
  return verifyUserSessionToken(readBearer(req));
}

export function requireUser(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const session = readUserSession(req);
  if (!session) {
    res.status(401).json({ error: "يجب تسجيل الدخول" });
    return;
  }
  // Re-check current user status on every request so that banning a user
  // immediately revokes access even for existing valid session cookies.
  db.select({
    status: usersTable.status,
    sessionEpoch: usersTable.sessionEpoch,
  })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1)
    .then(([row]) => {
      if (!row) {
        res.status(401).json({ error: "الحساب غير موجود" });
        return;
      }
      if (row.status === "banned") {
        res.status(403).json({ error: "هذا الحساب مُعلَّق" });
        return;
      }
      // Reject tokens issued before the last password change/reset.
      if (row.sessionEpoch !== session.epoch) {
        res
          .status(401)
          .json({ error: "انتهت صلاحية الجلسة، سجّل الدخول من جديد" });
        return;
      }
      (req as Request & { userSession: UserSession }).userSession = session;
      next();
    })
    .catch(() => {
      res.status(500).json({ error: "خطأ في الخادم" });
    });
}

// Soft variant — never blocks; just attaches the session if a valid cookie
// is present so handlers can show personalized state on otherwise-public
// endpoints (e.g. "isEnrolled" on a public course detail).
export function optionalUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const session = readUserSession(req);
  if (!session) {
    next();
    return;
  }
  // Also check ban status for optional sessions — banned users should not
  // receive personalised data even on public endpoints.
  db.select({
    status: usersTable.status,
    sessionEpoch: usersTable.sessionEpoch,
  })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1)
    .then(([row]) => {
      if (
        row &&
        row.status !== "banned" &&
        row.sessionEpoch === session.epoch
      ) {
        (req as Request & { userSession: UserSession }).userSession = session;
      }
      next();
    })
    .catch(() => {
      next();
    });
}

// ─── Password helpers ───────────────────────────────────────────────────────

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 8) return false;
  if (typeof password !== "string" || password.length === 0) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Full admin sign-in check: password (always) + username (only when
// ADMIN_USERNAME is configured). Both comparisons are timing-safe. When no
// ADMIN_USERNAME is set the login stays password-only for backward compat.
export function checkAdminCredentials(
  username: string,
  password: string,
): boolean {
  if (!checkPassword(password)) return false;
  const expectedUser = process.env.ADMIN_USERNAME;
  if (!expectedUser) return true;
  if (typeof username !== "string" || username.length === 0) return false;
  const a = Buffer.from(username);
  const b = Buffer.from(expectedUser);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function ensureAuthConfigured(): void {
  getSecret();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const cookieToken = req.cookies?.[ADMIN_COOKIE];
  if (verifySessionToken(cookieToken)) {
    next();
    return;
  }
  const bearer = readBearer(req);
  if (verifySessionToken(bearer)) {
    next();
    return;
  }
  res.status(401).json({ error: "غير مصرّح" });
}
