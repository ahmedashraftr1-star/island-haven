import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { desc, eq, inArray, sql } from "drizzle-orm";
import {
  applicationsTable,
  applicationReviewsTable,
  upsertApplicationReviewSchema,
  db,
  insertApplicationSchema,
} from "@workspace/db";
import { requireAdmin, getAdmin } from "../lib/auth";
import { toCsv, sendCsv } from "../lib/csv";
import { z } from "zod";
import { invalidateNumbersCache } from "./numbers";

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
  invalidateNumbersCache();
  res.json({ ok: true, id: row.id });
});

router.get("/admin/applications", requireAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(applicationsTable)
    .orderBy(desc(applicationsTable.createdAt));
  // Attach the review aggregate (avg score, count, #advance) to each applicant so
  // the list can be sorted/scanned by evidence, not gut feel.
  const ids = rows.map((r) => r.id);
  const aggs = ids.length
    ? await db
        .select({
          applicationId: applicationReviewsTable.applicationId,
          avg: sql<number>`round(avg(${applicationReviewsTable.score})::numeric, 1)`,
          count: sql<number>`count(*)::int`,
          advance: sql<number>`count(*) filter (where ${applicationReviewsTable.recommendation} = 'advance')::int`,
        })
        .from(applicationReviewsTable)
        .where(inArray(applicationReviewsTable.applicationId, ids))
        .groupBy(applicationReviewsTable.applicationId)
    : [];
  const map = new Map(aggs.map((a) => [a.applicationId, a]));
  res.json({
    applications: rows.map((r) => {
      const a = map.get(r.id);
      return { ...r, review: { avg: a ? Number(a.avg) : null, count: a ? a.count : 0, advance: a ? a.advance : 0 } };
    }),
  });
});

// CSV export of the applicant pipeline (identity + stage + review evidence).
router.get("/admin/applications/export", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(applicationsTable).orderBy(desc(applicationsTable.createdAt));
  const ids = rows.map((r) => r.id);
  const aggs = ids.length
    ? await db
        .select({
          applicationId: applicationReviewsTable.applicationId,
          avg: sql<number>`round(avg(${applicationReviewsTable.score})::numeric, 1)`,
          count: sql<number>`count(*)::int`,
        })
        .from(applicationReviewsTable)
        .where(inArray(applicationReviewsTable.applicationId, ids))
        .groupBy(applicationReviewsTable.applicationId)
    : [];
  const map = new Map(aggs.map((a) => [a.applicationId, a]));
  const csv = toCsv(
    ["الاسم", "البريد", "الهاتف", "الفئة", "المرحلة", "متوسط التقييم", "عدد التقييمات", "موعد المقابلة", "تاريخ التقديم"],
    rows.map((r) => {
      const a = map.get(r.id);
      return [
        r.fullName, r.email, r.phone, r.category, r.status,
        a ? Number(a.avg) : "", a ? a.count : 0,
        r.interviewAt ? new Date(r.interviewAt).toISOString() : "",
        new Date(r.createdAt).toISOString(),
      ];
    }),
  );
  sendCsv(res, "applications.csv", csv);
});

const STAGES = ["new", "reviewing", "screening", "interview", "offer", "waitlist", "accepted", "rejected"] as const;
const updateSchema = z.object({
  status: z.enum(STAGES).optional(),
  notes: z.string().max(4000).optional(),
  interviewAt: z.string().datetime().nullable().optional(),
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
  const { interviewAt, ...rest } = parsed.data;
  const patch: Record<string, unknown> = { ...rest };
  if (interviewAt !== undefined) patch.interviewAt = interviewAt ? new Date(interviewAt) : null;
  if (Object.keys(patch).length === 0) {
    // Nothing to update — drizzle .set({}) would emit an empty SET and error.
    res.status(400).json({ error: "لا تغييرات" });
    return;
  }
  const [row] = await db
    .update(applicationsTable)
    .set(patch)
    .where(eq(applicationsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "غير موجود" });
    return;
  }
  res.json({ application: row });
});

// ─── Applicant reviews (scoring) ─────────────────────────────────────────────
router.get("/admin/applications/:id/reviews", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  const reviews = await db
    .select()
    .from(applicationReviewsTable)
    .where(eq(applicationReviewsTable.applicationId, id))
    .orderBy(desc(applicationReviewsTable.updatedAt));
  const meId = getAdmin(req)?.id ?? 0;
  const mine = reviews.find((r) => r.reviewerId === meId) ?? null;
  const avg = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.score, 0) / reviews.length) * 10) / 10 : null;
  res.json({ reviews, mine, avg, count: reviews.length });
});

router.post("/admin/applications/:id/reviews", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  const [app] = await db.select({ id: applicationsTable.id }).from(applicationsTable).where(eq(applicationsTable.id, id)).limit(1);
  if (!app) {
    res.status(404).json({ error: "الطلب غير موجود" });
    return;
  }
  const parsed = upsertApplicationReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
    return;
  }
  const me = getAdmin(req);
  await db
    .insert(applicationReviewsTable)
    .values({
      applicationId: id,
      reviewerId: me?.id ?? 0,
      reviewerName: me?.fullName || me?.email || "admin",
      score: parsed.data.score,
      recommendation: parsed.data.recommendation,
      notes: parsed.data.notes ?? "",
    })
    .onConflictDoUpdate({
      target: [applicationReviewsTable.applicationId, applicationReviewsTable.reviewerId],
      set: { score: parsed.data.score, recommendation: parsed.data.recommendation, notes: parsed.data.notes ?? "", updatedAt: new Date() },
    });
  res.status(201).json({ ok: true });
});

router.delete("/admin/applications/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return;
  }
  // No hard FK (acyclic schema convention) → remove the reviews explicitly.
  await db.delete(applicationReviewsTable).where(eq(applicationReviewsTable.applicationId, id));
  await db.delete(applicationsTable).where(eq(applicationsTable.id, id));
  invalidateNumbersCache();
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
