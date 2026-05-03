import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { sql, desc } from "drizzle-orm";
import { db, pageViewsTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

// ─── In-memory rate limiter for POST /track ──────────────────────────────────
// Per-IP: up to 60 track calls per 10 minutes (generous for real browsers).
// Global: up to 300 per minute to blunt scripted floods even across rotating IPs.
// req.ip is reliable here because app.ts sets `trust proxy: 1`, so Express
// derives the address from the trusted Replit reverse-proxy hop.
const MINUTE = 60_000;
const TEN_MIN = 10 * MINUTE;
const MAX_TRACK_PER_IP_TEN_MIN = 60;
const MAX_TRACK_GLOBAL_PER_MINUTE = 300;

type Bucket = number[];
const trackIpBuckets = new Map<string, Bucket>();
const trackGlobalBucket: Bucket = [];

function pruneAndPush(
  map: Map<string, Bucket>,
  ip: string,
  windowMs: number,
  now: number,
): Bucket {
  let b = map.get(ip);
  if (!b) {
    b = [];
    map.set(ip, b);
  }
  const cutoff = now - windowMs;
  while (b.length && b[0]! < cutoff) b.shift();
  return b;
}

function rateLimitTrack(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || "unknown";
  const now = Date.now();

  // Global guard — protects against distributed / IP-rotating floods.
  const globalCutoff = now - MINUTE;
  while (trackGlobalBucket.length && trackGlobalBucket[0]! < globalCutoff)
    trackGlobalBucket.shift();
  if (trackGlobalBucket.length >= MAX_TRACK_GLOBAL_PER_MINUTE) {
    res.status(429).json({ ok: false, error: "Too many requests" });
    return;
  }

  const ipBucket = pruneAndPush(trackIpBuckets, ip, TEN_MIN, now);
  if (ipBucket.length >= MAX_TRACK_PER_IP_TEN_MIN) {
    res.status(429).json({ ok: false, error: "Too many requests" });
    return;
  }

  // Increment atomically before async work.
  ipBucket.push(now);
  trackGlobalBucket.push(now);
  next();
}

// Periodic cleanup to prevent unbounded map growth under sustained attack.
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of trackIpBuckets) {
    const cutoff = now - TEN_MIN;
    while (b.length && b[0]! < cutoff) b.shift();
    if (!b.length) trackIpBuckets.delete(ip);
  }
}, 5 * MINUTE).unref();

// ─────────────────────────────────────────────────────────────────────────────

router.post("/track", rateLimitTrack, async (req, res) => {
  const path = String(req.body?.path ?? "/").slice(0, 256);
  const referrer = String(req.body?.referrer ?? "").slice(0, 512);
  const userAgent = String(req.headers["user-agent"] ?? "").slice(0, 512);
  await db.insert(pageViewsTable).values({ path, referrer, userAgent });
  res.json({ ok: true });
});

router.get("/admin/analytics", requireAdmin, async (_req, res) => {
  const totalRow = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pageViewsTable);
  const total = totalRow[0]?.count ?? 0;

  const byPath = await db
    .select({
      path: pageViewsTable.path,
      count: sql<number>`count(*)::int`,
    })
    .from(pageViewsTable)
    .groupBy(pageViewsTable.path)
    .orderBy(desc(sql`count(*)`))
    .limit(20);

  const byDay = await db
    .select({
      day: sql<string>`to_char(${pageViewsTable.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(pageViewsTable)
    .where(sql`${pageViewsTable.createdAt} > now() - interval '30 days'`)
    .groupBy(sql`to_char(${pageViewsTable.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${pageViewsTable.createdAt}, 'YYYY-MM-DD')`);

  const last24Row = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pageViewsTable)
    .where(sql`${pageViewsTable.createdAt} > now() - interval '24 hours'`);

  res.json({
    total,
    last24h: last24Row[0]?.count ?? 0,
    byPath,
    byDay,
  });
});

export default router;
