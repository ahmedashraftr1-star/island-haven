import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  adminUsersTable,
  ALL_ADMIN_PERMISSIONS,
  type AdminRole,
} from "@workspace/db";

// ─────────────────────────────────────────────────────────────────────────────
// Sessions: HMAC-signed cookies, two flavours
//   • admin session  → cookie "ih_admin",  payload "admin.<exp>"
//   • user session   → cookie "ih_user",   payload "user.<id>.<exp>"
// We never store secrets client-side; the signature is the only proof.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_COOKIE = "ih_admin";
const USER_COOKIE = "ih_user";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days (user sessions)

// Admin IDLE timeout: an admin session that goes untouched for this long expires.
// It is SLIDING — each authenticated admin request that is more than a quarter of
// the way through the window re-issues a fresh cookie (see maybeSlideAdminCookie),
// so an actively-used session never logs out mid-work, but an abandoned one does.
// Cookie-based (browser) sessions only; Bearer clients manage their own tokens.
// Default 8h; override with ADMIN_SESSION_IDLE_MS.
const ADMIN_IDLE_TTL_MS = Math.max(
  5 * 60_000, // never below 5 min (safety floor)
  Number(process.env.ADMIN_SESSION_IDLE_MS) || 1000 * 60 * 60 * 8,
);
const ADMIN_SLIDE_AFTER_MS = ADMIN_IDLE_TTL_MS * 0.25;

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
  const expiresAt = Date.now() + ADMIN_IDLE_TTL_MS;
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

// ─── Identity-bearing admin tokens (RBAC) ────────────────────────────────────
// DB-backed admin accounts get a token that embeds who they are + their session
// epoch: "admin.<adminId>.<epoch>.<exp>.<sig>". The bootstrap ENV super-admin
// keeps the legacy 3-part "admin.<exp>.<sig>" token (parsed as adminId 0). Both
// verify HMAC + expiry the same way.

export interface ParsedAdmin {
  adminId: number;
  epoch: number;
}

export function makeAdminToken(adminId: number, epoch: number): string {
  const expiresAt = Date.now() + ADMIN_IDLE_TTL_MS;
  const payload = `admin.${adminId}.${epoch}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

/** Verify signature + expiry only (no DB). Returns identity or null. */
function parseAdminToken(token: string | undefined): ParsedAdmin | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts[0] !== "admin") return null;
  const now = Date.now();
  if (parts.length === 3) {
    // Legacy ENV super-admin token: admin.<exp>.<sig>
    const [, expStr, sig] = parts;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp < now) return null;
    if (!timingSafeEqualStr(sig, sign(`admin.${expStr}`))) return null;
    return { adminId: 0, epoch: 0 };
  }
  if (parts.length === 5) {
    const [, idStr, epochStr, expStr, sig] = parts;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp < now) return null;
    if (!timingSafeEqualStr(sig, sign(`admin.${idStr}.${epochStr}.${expStr}`))) return null;
    const adminId = Number(idStr);
    const epoch = Number(epochStr);
    if (!Number.isInteger(adminId) || !Number.isInteger(epoch)) return null;
    return { adminId, epoch };
  }
  return null;
}

// Cookie `Secure` flag. Defaults ON in production (real deploys serve over
// HTTPS). Set COOKIE_SECURE=0 to test a production build over plain
// http://localhost — browsers (Safari especially) DROP Secure cookies on http,
// which silently blocks login. COOKIE_SECURE=1 forces it on. Leave UNSET in
// real production so it stays tied to NODE_ENV=production.
function cookieSecure(): boolean {
  const v = process.env.COOKIE_SECURE;
  if (v === "0") return false;
  if (v === "1") return true;
  return process.env.NODE_ENV === "production";
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    maxAge: ADMIN_IDLE_TTL_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(ADMIN_COOKIE, { path: "/" });
}

/**
 * Sliding idle-timeout: on an authenticated admin request whose COOKIE token is
 * more than a quarter through its idle window, re-issue a fresh cookie so an
 * active session keeps rolling. Best-effort — any parse issue simply skips the
 * slide (never breaks the request). Bearer-authenticated requests are ignored
 * (those clients hold their own token). `res` headers must not be sent yet.
 */
export function maybeSlideAdminCookie(req: Request, res: Response, admin: ResolvedAdmin): void {
  try {
    const cookieToken = req.cookies?.[ADMIN_COOKIE];
    if (!cookieToken || typeof cookieToken !== "string") return; // bearer / none
    const parts = cookieToken.split(".");
    const expStr = parts.length === 3 ? parts[1] : parts.length === 5 ? parts[3] : null;
    const exp = Number(expStr);
    if (!Number.isFinite(exp)) return;
    const age = Date.now() - (exp - ADMIN_IDLE_TTL_MS);
    // Skip if too fresh, or implausible (a legacy longer-TTL token mid-migration).
    if (age < ADMIN_SLIDE_AFTER_MS || age > ADMIN_IDLE_TTL_MS) return;
    const epoch = parts.length === 5 ? Number(parts[2]) : 0;
    const fresh = admin.id === 0 ? makeSessionToken() : makeAdminToken(admin.id, epoch);
    setSessionCookie(res, fresh);
  } catch {
    /* never let a slide failure break an authenticated request */
  }
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
    secure: cookieSecure(),
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

export interface ResolvedAdmin {
  id: number;
  email: string;
  fullName: string;
  role: AdminRole;
  permissions: Set<string>;
  isSuper: boolean;
}

/**
 * Resolve the admin from the request (cookie or Bearer). For DB accounts this
 * checks the row still exists, is active, and the token's epoch matches (so
 * disabling/rotating revokes all prior tokens). The bootstrap ENV super-admin
 * (id 0) is virtual and always full-access. Returns null when not a valid admin.
 */
export async function resolveAdmin(req: Request): Promise<ResolvedAdmin | null> {
  const token = (req.cookies?.[ADMIN_COOKIE] as string | undefined) ?? readBearer(req);
  const parsed = parseAdminToken(token);
  if (!parsed) return null;
  if (parsed.adminId === 0) {
    return {
      id: 0,
      email: process.env.ADMIN_USERNAME || "super-admin",
      fullName: "Super Admin",
      role: "super_admin",
      permissions: new Set(ALL_ADMIN_PERMISSIONS),
      isSuper: true,
    };
  }
  const [row] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, parsed.adminId))
    .limit(1);
  if (!row || row.status !== "active" || row.sessionEpoch !== parsed.epoch) return null;
  const isSuper = row.role === "super_admin";
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    permissions: new Set(isSuper ? ALL_ADMIN_PERMISSIONS : row.permissions),
    isSuper,
  };
}

/** The resolved admin attached by requireAdmin/requirePermission (for audit actor etc.). */
export function getAdmin(req: Request): ResolvedAdmin | undefined {
  return (req as Request & { admin?: ResolvedAdmin }).admin;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // Reuse the admin already resolved by the global adminGate (no second lookup).
  const existing = getAdmin(req);
  if (existing) {
    next();
    return;
  }
  resolveAdmin(req)
    .then((admin) => {
      if (!admin) {
        res.status(401).json({ error: "غير مصرّح" });
        return;
      }
      (req as Request & { admin?: ResolvedAdmin }).admin = admin;
      next();
    })
    .catch(() => res.status(401).json({ error: "غير مصرّح" }));
}

/** Gate a route on a specific permission string. Super-admins bypass all checks. */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const decide = (admin: ResolvedAdmin | null | undefined): void => {
      if (!admin) {
        res.status(401).json({ error: "غير مصرّح" });
        return;
      }
      (req as Request & { admin?: ResolvedAdmin }).admin = admin;
      if (admin.isSuper || admin.permissions.has(permission)) {
        next();
        return;
      }
      res.status(403).json({ error: "ليس لديك صلاحيّة لهذا الإجراء" });
    };
    const existing = getAdmin(req);
    if (existing) {
      decide(existing);
      return;
    }
    resolveAdmin(req)
      .then(decide)
      .catch(() => res.status(401).json({ error: "غير مصرّح" }));
  };
}
