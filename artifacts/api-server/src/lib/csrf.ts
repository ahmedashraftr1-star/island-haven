import type { Request, Response, NextFunction } from "express";
import { randomBytes } from "node:crypto";
import { fail } from "./apiError";

// ============================================================================
// CSRF protection for cookie-authenticated ADMIN mutations.
//
// Layered on top of the existing SameSite=Lax cookies + CORS allowlist:
//   1. Origin/Referer must be on our allowlist (a cross-site page can't forge it).
//   2. Double-submit token: a JS-readable `ih_csrf` cookie whose value the SPA
//      echoes in the `X-CSRF-Token` header — a cross-site attacker can neither
//      read the cookie (SOP) nor set a custom header cross-origin.
//
// Only COOKIE-authenticated browser requests are CSRF-vulnerable. Bearer-token
// requests (the API test suite, any non-browser client) can't be forged
// cross-site, and unauthenticated requests have nothing to abuse — both pass
// through untouched, which keeps the Bearer-based test suite green.
// ============================================================================

const CSRF_COOKIE = "ih_csrf";
const ADMIN_COOKIE = "ih_admin";
const CSRF_TTL_MS = 1000 * 60 * 60 * 24 * 7; // mirror the 7-day session

function cookieSecure(): boolean {
  const v = process.env.COOKIE_SECURE;
  if (v === "1" || v === "true") return true;
  if (v === "0" || v === "false") return false;
  return process.env.NODE_ENV === "production";
}

// Same allowlist logic as the CORS layer (kept self-contained + auditable).
function allowedOrigins(): Set<string> {
  const s = new Set<string>();
  for (const d of (process.env.REPLIT_DOMAINS ?? "").split(",")) {
    const t = d.trim();
    if (t) s.add(`https://${t}`);
  }
  const dev = process.env.REPLIT_DEV_DOMAIN?.trim();
  if (dev) s.add(`https://${dev}`);
  const expo = process.env.REPLIT_EXPO_DEV_DOMAIN?.trim();
  if (expo) s.add(`https://${expo}`);
  const fe = process.env.FRONTEND_URL?.trim();
  if (fe) {
    try {
      s.add(new URL(fe).origin);
    } catch {
      /* ignore a malformed FRONTEND_URL */
    }
  }
  return s;
}

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  try {
    const { protocol, hostname } = new URL(origin);
    // Local development over http.
    if (
      protocol === "http:" &&
      (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]")
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return allowedOrigins().has(origin);
}

/** Set a fresh, JS-readable double-submit token cookie. Returns the token. */
export function issueCsrfCookie(res: Response): string {
  const token = randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // MUST be readable by the SPA so it can echo it in a header
    sameSite: "lax",
    secure: cookieSecure(),
    maxAge: CSRF_TTL_MS,
    path: "/",
  });
  return token;
}

export function clearCsrfCookie(res: Response): void {
  res.clearCookie(CSRF_COOKIE, { path: "/" });
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Enforce CSRF on cookie-authed admin mutations. Mount on `/api/admin`.
 */
export function csrfProtect(req: Request, res: Response, next: NextFunction): void {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
  const isBearer = String(req.headers.authorization ?? "").startsWith("Bearer ");
  const hasCookieAuth = !!cookies[ADMIN_COOKIE];

  // Token-auth or unauthenticated → not a CSRF vector here.
  if (isBearer || !hasCookieAuth) return next();

  if (!MUTATING.has(req.method)) {
    // Safe method on an authed session → make sure the client holds a token to
    // echo on its next mutation (covers sessions created before this shipped).
    if (!cookies[CSRF_COOKIE]) issueCsrfCookie(res);
    return next();
  }

  // 1) Origin / Referer must be trusted.
  const origin = (() => {
    if (req.headers.origin) return String(req.headers.origin);
    if (req.headers.referer) {
      try {
        return new URL(String(req.headers.referer)).origin;
      } catch {
        return "";
      }
    }
    return "";
  })();
  if (!isAllowedOrigin(origin)) {
    return void fail(res, 403, "أصل الطلب غير موثوق (CSRF).");
  }

  // 2) Double-submit token must match.
  const cookieTok = cookies[CSRF_COOKIE];
  const headerTok = req.headers["x-csrf-token"];
  if (!cookieTok || !headerTok || String(headerTok) !== cookieTok) {
    return void fail(res, 403, "رمز حماية CSRF مفقود أو غير مطابق.");
  }

  next();
}
