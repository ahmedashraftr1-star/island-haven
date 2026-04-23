import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";

// ─────────────────────────────────────────────────────────────────────────────
// Sessions: HMAC-signed cookies, two flavours
//   • admin session  → cookie "ih_admin",  payload "admin.<exp>"
//   • user session   → cookie "ih_user",   payload "user.<id>.<exp>"
// We never store secrets client-side; the signature is the only proof.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_COOKIE = "ih_admin";
const USER_COOKIE = "ih_user";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret || secret.length < 8) {
    throw new Error(
      "Refusing to operate without a strong session secret. Set ADMIN_PASSWORD (preferred) or SESSION_SECRET (>=8 chars).",
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

export function makeUserSessionToken(userId: number): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `user.${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export interface UserSession {
  userId: number;
  expiresAt: number;
}

export function verifyUserSessionToken(
  token: string | undefined,
): UserSession | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [kind, idStr, expiresAtStr, sig] = parts;
  if (kind !== "user") return null;
  const userId = Number(idStr);
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(userId) || userId <= 0) return null;
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  if (!timingSafeEqualStr(sig, sign(`user.${idStr}.${expiresAtStr}`))) {
    return null;
  }
  return { userId, expiresAt };
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

export function readUserSession(req: Request): UserSession | null {
  const token = req.cookies?.[USER_COOKIE];
  return verifyUserSessionToken(token);
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
  (req as Request & { userSession: UserSession }).userSession = session;
  next();
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
  if (session) {
    (req as Request & { userSession: UserSession }).userSession = session;
  }
  next();
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

export function ensureAuthConfigured(): void {
  getSecret();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.[ADMIN_COOKIE];
  if (!verifySessionToken(token)) {
    res.status(401).json({ error: "غير مصرّح" });
    return;
  }
  next();
}
