import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { desc, eq, sql } from "drizzle-orm";
import {
  applicationsTable,
  db,
  insertApplicationSchema,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { z } from "zod";

const router: IRouter = Router();

// ─── In-memory rate limiter for POST /applications ───────────────────────────
// Per-IP: up to 3 submissions per 10 minutes (generous for legitimate users).
// Global: up to 20 per minute to blunt scripted floods even across rotating IPs.
// req.ip is reliable here because app.ts sets `trust proxy: 1`, so Express
// derives the address from the trusted Replit reverse-proxy hop.
const MINUTE = 60_000;
const TEN_MIN = 10 * MINUTE;
const MAX_APPS_PER_IP_TEN_MIN = 3;
const MAX_APPS_GLOBAL_PER_MINUTE = 20;

type Bucket = number[];
const appIpBuckets = new Map<string, Bucket>();
const appGlobalBucket: Bucket = [];

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

function rateLimitApplications(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || "unknown";
  const now = Date.now();

  // Global guard — protects against distributed / IP-rotating floods.
  const globalCutoff = now - MINUTE;
  while (appGlobalBucket.length && appGlobalBucket[0]! < globalCutoff)
    appGlobalBucket.shift();
  if (appGlobalBucket.length >= MAX_APPS_GLOBAL_PER_MINUTE) {
    res.status(429).json({ ok: false, error: "حركة كثيفة الآن — حاول بعد دقيقة." });
    return;
  }

  const ipBucket = pruneAndPush(appIpBuckets, ip, TEN_MIN, now);
  if (ipBucket.length >= MAX_APPS_PER_IP_TEN_MIN) {
    res
      .status(429)
      .json({ ok: false, error: "محاولات كثيرة — أعد المحاولة بعد قليل." });
    return;
  }

  // Increment atomically before async work.
  ipBucket.push(now);
  appGlobalBucket.push(now);
  next();
}

// Periodic cleanup to prevent unbounded map growth under sustained attack.
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of appIpBuckets) {
    const cutoff = now - TEN_MIN;
    while (b.length && b[0]! < cutoff) b.shift();
    if (!b.length) appIpBuckets.delete(ip);
  }
}, 5 * MINUTE).unref();

// ─────────────────────────────────────────────────────────────────────────────

router.post("/applications", rateLimitApplications, async (req, res) => {
  const parsed = insertApplicationSchema.safeParse(req.body);
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
  const [row] = await db
    .insert(applicationsTable)
    .values(parsed.data)
    .returning({ id: applicationsTable.id });
  res.json({ ok: true, id: row.id });
});

router.get("/admin/applications", requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(applicationsTable)
    .orderBy(desc(applicationsTable.createdAt));
  res.json({ applications: rows });
});

const updateSchema = z.object({
  status: z.enum(["new", "reviewing", "accepted", "rejected"]).optional(),
  notes: z.string().max(4000).optional(),
});

router.patch("/admin/applications/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }
  const [row] = await db
    .update(applicationsTable)
    .set(parsed.data)
    .where(eq(applicationsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "غير موجود" });
    return;
  }
  res.json({ application: row });
});

router.delete("/admin/applications/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  await db.delete(applicationsTable).where(eq(applicationsTable.id, id));
  res.json({ ok: true });
});

router.get("/admin/applications/stats", requireAdmin, async (_req, res) => {
  const rows = await db
    .select({
      status: applicationsTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(applicationsTable)
    .groupBy(applicationsTable.status);
  res.json({ byStatus: rows });
});

export default router;
