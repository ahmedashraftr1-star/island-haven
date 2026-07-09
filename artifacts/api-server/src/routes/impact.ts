import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  ventureOutcomesTable,
  venturesTable,
  applicationsTable,
  cohortsTable,
  insertVentureOutcomeSchema,
  SURVIVING_STATUSES,
} from "@workspace/db";
import { requirePermission, getAdmin } from "../lib/auth";
import { writeAudit, auditActor } from "../lib/audit";
import { logger } from "../lib/logger";

// Monitoring & Evaluation (impact) API. Reads require impact:view, writes
// impact:manage (also enforced centrally by adminGate). Totals use each
// venture's LATEST snapshot (never sums across periods → no double counting).
const router: IRouter = Router();

const surviving = SURVIVING_STATUSES.map((s) => `'${s}'`).join(",");

// Executive impact overview: funnel + current totals + survival + trend.
router.get("/admin/impact/overview", requirePermission("impact:view"), async (_req, res) => {
  try {
    // Funnel from operational data.
    const [apps] = await db
      .select({
        total: sql<number>`count(*)::int`,
        accepted: sql<number>`count(*) filter (where ${applicationsTable.status} = 'accepted')::int`,
      })
      .from(applicationsTable);
    const [coh] = await db.select({ n: sql<number>`count(*)::int` }).from(cohortsTable);
    const [ven] = await db.select({ n: sql<number>`count(*)::int` }).from(venturesTable);

    // Latest snapshot per venture (window by created_at desc).
    const latest = sql`
      SELECT DISTINCT ON (vo.venture_id)
        vo.venture_id, vo.status, vo.jobs, vo.funding_usd, vo.revenue_usd
      FROM venture_outcomes vo
      ORDER BY vo.venture_id, vo.created_at DESC
    `;
    const [totals] = await db.execute<{
      tracked: number; surviving: number; jobs: number; funding: number; revenue: number;
    }>(sql`
      SELECT
        count(*)::int AS tracked,
        count(*) filter (where status IN (${sql.raw(surviving)}))::int AS surviving,
        COALESCE(sum(jobs),0)::int AS jobs,
        COALESCE(sum(funding_usd),0)::bigint AS funding,
        COALESCE(sum(revenue_usd),0)::bigint AS revenue
      FROM (${latest}) l
    `).then((r) => (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows) as [{ tracked: number; surviving: number; jobs: number; funding: number; revenue: number }]);

    // Trend: sum jobs + funding per period across all snapshots.
    const trendRaw = await db.execute(sql`
      SELECT period,
        COALESCE(sum(jobs),0)::int AS jobs,
        COALESCE(sum(funding_usd),0)::bigint AS funding,
        COALESCE(sum(revenue_usd),0)::bigint AS revenue
      FROM venture_outcomes
      GROUP BY period
      ORDER BY period ASC
    `);
    const trend = (Array.isArray(trendRaw) ? trendRaw : (trendRaw as { rows: unknown[] }).rows) as Array<{
      period: string; jobs: number; funding: number; revenue: number;
    }>;

    const tracked = Number(totals?.tracked ?? 0);
    const surv = Number(totals?.surviving ?? 0);
    res.json({
      funnel: {
        applications: apps?.total ?? 0,
        accepted: apps?.accepted ?? 0,
        cohorts: coh?.n ?? 0,
        ventures: ven?.n ?? 0,
        tracked,
      },
      totals: {
        jobs: Number(totals?.jobs ?? 0),
        fundingUsd: Number(totals?.funding ?? 0),
        revenueUsd: Number(totals?.revenue ?? 0),
        surviving: surv,
        survivalRate: tracked > 0 ? Math.round((surv / tracked) * 100) : 0,
      },
      trend: trend.map((t) => ({ period: t.period, jobs: Number(t.jobs), fundingUsd: Number(t.funding), revenueUsd: Number(t.revenue) })),
    });
  } catch (err) {
    logger.error({ err }, "GET /admin/impact/overview failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Ventures with their latest outcome snapshot (for the record-outcome table).
router.get("/admin/impact/ventures", requirePermission("impact:view"), async (_req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT v.id, v.name, v.sector, v.stage,
        l.status AS outcome_status, l.jobs, l.funding_usd, l.revenue_usd, l.period, l.created_at AS recorded_at
      FROM ventures v
      LEFT JOIN LATERAL (
        SELECT status, jobs, funding_usd, revenue_usd, period, created_at
        FROM venture_outcomes vo WHERE vo.venture_id = v.id
        ORDER BY vo.created_at DESC LIMIT 1
      ) l ON true
      ORDER BY v.sort_order ASC, v.id ASC
    `);
    const list = (Array.isArray(rows) ? rows : (rows as { rows: unknown[] }).rows) as Array<Record<string, unknown>>;
    res.json({
      ventures: list.map((v) => ({
        id: Number(v.id),
        name: v.name,
        sector: v.sector,
        stage: v.stage,
        latest: v.outcome_status
          ? {
              status: v.outcome_status,
              jobs: Number(v.jobs ?? 0),
              fundingUsd: Number(v.funding_usd ?? 0),
              revenueUsd: Number(v.revenue_usd ?? 0),
              period: v.period,
              recordedAt: v.recorded_at,
            }
          : null,
      })),
    });
  } catch (err) {
    logger.error({ err }, "GET /admin/impact/ventures failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/impact/ventures/:id/outcomes", requirePermission("impact:view"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
    const rows = await db
      .select()
      .from(ventureOutcomesTable)
      .where(eq(ventureOutcomesTable.ventureId, id))
      .orderBy(desc(ventureOutcomesTable.createdAt));
    res.json({ outcomes: rows });
  } catch (err) {
    logger.error({ err }, "GET venture outcomes failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/impact/ventures/:id/outcomes", requirePermission("impact:manage"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
    const [venture] = await db.select({ id: venturesTable.id }).from(venturesTable).where(eq(venturesTable.id, id)).limit(1);
    if (!venture) { res.status(404).json({ error: "المشروع غير موجود" }); return; }
    const parsed = insertVentureOutcomeSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }); return; }
    const [row] = await db
      .insert(ventureOutcomesTable)
      .values({
        ventureId: id,
        period: parsed.data.period,
        status: parsed.data.status,
        jobs: parsed.data.jobs ?? 0,
        fundingUsd: parsed.data.fundingUsd ?? 0,
        revenueUsd: parsed.data.revenueUsd ?? 0,
        note: parsed.data.note ?? "",
        recordedBy: getAdmin(req)?.fullName || getAdmin(req)?.email || "admin",
      })
      .returning();
    void writeAudit({
      actor: auditActor(req),
      action: "impact_outcome_recorded",
      targetType: "venture",
      targetId: id,
      newValue: `${parsed.data.period} · ${parsed.data.status} · jobs:${parsed.data.jobs ?? 0} · fund:${parsed.data.fundingUsd ?? 0}`,
    });
    res.status(201).json({ outcome: row });
  } catch (err) {
    logger.error({ err }, "POST venture outcome failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/impact/outcomes/:id", requirePermission("impact:manage"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "معرّف غير صالح" }); return; }
    await db.delete(ventureOutcomesTable).where(eq(ventureOutcomesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE outcome failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
