import type { Request, Response, NextFunction } from "express";
import type { UserSession } from "./auth";

type Bucket = number[];

/**
 * Per-USER in-memory rate limiter for authenticated write endpoints.
 *
 * Keys on the session user, NOT the IP: Island Haven is a shared-network
 * coworking space, so many members sit behind one NAT IP — an IP-based limit
 * (like the public push limiter) would punish the innocent. Mount AFTER
 * requireUser so the session is present (falls back to IP if somehow absent).
 */
export function makeUserRateLimit(opts: { max: number; windowMs: number }) {
  const buckets = new Map<string, Bucket>();
  let lastSweep = 0;
  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const session = (req as Request & { userSession?: UserSession }).userSession;
    const key = session ? `u:${session.userId}` : `ip:${req.ip || "unknown"}`;
    const now = Date.now();
    const cutoff = now - opts.windowMs;

    // Opportunistic sweep so idle keys don't accumulate unbounded.
    if (now - lastSweep > opts.windowMs) {
      for (const [k, b] of buckets) {
        while (b.length && b[0]! < cutoff) b.shift();
        if (b.length === 0) buckets.delete(k);
      }
      lastSweep = now;
    }

    let b = buckets.get(key);
    if (!b) {
      b = [];
      buckets.set(key, b);
    }
    while (b.length && b[0]! < cutoff) b.shift();
    if (b.length >= opts.max) {
      res.status(429).json({ error: "طلبات كثيرة، أمهِلنا قليلًا" });
      return;
    }
    b.push(now);
    next();
  };
}
