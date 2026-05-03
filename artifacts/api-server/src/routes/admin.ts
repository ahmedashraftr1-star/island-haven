import { Router, type IRouter, type Request } from "express";
import {
  checkPassword,
  clearSessionCookie,
  makeSessionToken,
  requireAdmin,
  setSessionCookie,
  verifySessionToken,
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

router.post("/admin/login", (req, res) => {
  if (adminRateLimited(req)) {
    res.status(429).json({ ok: false, error: "محاولات كثيرة، حاول لاحقًا" });
    return;
  }
  const password = String(req.body?.password ?? "");
  if (!checkPassword(password)) {
    res.status(401).json({ ok: false, error: "كلمة السرّ غير صحيحة" });
    return;
  }
  const token = makeSessionToken();
  setSessionCookie(res, token);
  res.json({ ok: true, token });
});

router.post("/admin/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/admin/me", (req, res) => {
  const token = req.cookies?.["ih_admin"];
  res.json({ authenticated: verifySessionToken(token) });
});

router.get("/admin/ping", requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

export default router;
