import { Router, type IRouter } from "express";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  db,
  cohortsTable,
  cohortVenturesTable,
  programsTable,
  venturesTable,
  upsertCohortSchema,
  upsertCohortVentureSchema,
  demoDayRsvpsTable,
  insertDemoDayRsvpSchema,
  cohortWeeksTable,
  cohortUpdatesTable,
  upsertCohortWeekSchema,
  upsertCohortUpdateSchema,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function badData(
  res: import("express").Response,
  err: { issues: Array<{ path: PropertyKey[]; message: string }> },
) {
  res.status(400).json({
    error: "بيانات غير صحيحة",
    details: err.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    })),
  });
}

// ─── Public list ────────────────────────────────────────────────────────────

router.get("/cohorts", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: cohortsTable.id,
        programId: cohortsTable.programId,
        programTitle: programsTable.title,
        name: cohortsTable.name,
        slug: cohortsTable.slug,
        summary: cohortsTable.summary,
        coverUrl: cohortsTable.coverUrl,
        startsAt: cohortsTable.startsAt,
        endsAt: cohortsTable.endsAt,
        demoDayAt: cohortsTable.demoDayAt,
        status: cohortsTable.status,
        ventureCount: sql<number>`COALESCE((SELECT COUNT(*)::int FROM cohort_ventures cv WHERE cv.cohort_id = cohorts.id), 0)`,
      })
      .from(cohortsTable)
      .innerJoin(programsTable, eq(programsTable.id, cohortsTable.programId))
      .where(sql`${cohortsTable.status} <> 'announced' OR ${cohortsTable.status} IS NOT NULL`)
      .orderBy(
        desc(cohortsTable.startsAt),
        asc(cohortsTable.sortOrder),
      );
    res.json({ cohorts: rows });
  } catch (err) {
    logger.error({ err }, "GET /cohorts failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/cohorts/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const [cohort] = await db
      .select({
        cohort: cohortsTable,
        program: {
          id: programsTable.id,
          title: programsTable.title,
          summary: programsTable.summary,
        },
      })
      .from(cohortsTable)
      .innerJoin(programsTable, eq(programsTable.id, cohortsTable.programId))
      .where(eq(cohortsTable.slug, slug))
      .limit(1);
    if (!cohort) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const ventures = await db
      .select({
        membership: cohortVenturesTable,
        venture: venturesTable,
      })
      .from(cohortVenturesTable)
      .innerJoin(venturesTable, eq(venturesTable.id, cohortVenturesTable.ventureId))
      .where(eq(cohortVenturesTable.cohortId, cohort.cohort.id))
      .orderBy(asc(cohortVenturesTable.joinedAt));
    res.json({ ...cohort, ventures });
  } catch (err) {
    logger.error({ err }, "GET /cohorts/:slug failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Demo Day RSVP ────────────────────────────────────────────────────────────
// Lightweight in-memory throttle (10 RSVPs / IP / 10 min) — enough to slow
// spam on this public endpoint without external infra.
const rsvpHits = new Map<string, number[]>();
function rsvpRateLimited(ip: string): boolean {
  const now = Date.now();
  const win = 10 * 60 * 1000;
  const arr = (rsvpHits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now);
  rsvpHits.set(ip, arr);
  return arr.length > 10;
}

router.post("/cohorts/:slug/rsvp", async (req, res) => {
  try {
    if (rsvpRateLimited(req.ip || "unknown")) {
      res.status(429).json({ error: "محاولات كثيرة، حاول لاحقًا" });
      return;
    }
    const slug = String(req.params.slug);
    const [cohort] = await db
      .select({ id: cohortsTable.id })
      .from(cohortsTable)
      .where(eq(cohortsTable.slug, slug))
      .limit(1);
    if (!cohort) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = insertDemoDayRsvpSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const [row] = await db
      .insert(demoDayRsvpsTable)
      .values({ ...parsed.data, cohortId: cohort.id })
      .returning();
    res.json({ ok: true, rsvp: { id: row.id } });
  } catch (err) {
    logger.error({ err }, "POST /cohorts/:slug/rsvp failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/cohorts/:id/rsvps", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const rows = await db
      .select()
      .from(demoDayRsvpsTable)
      .where(eq(demoDayRsvpsTable.cohortId, id))
      .orderBy(desc(demoDayRsvpsTable.createdAt));
    res.json({ rsvps: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/cohorts/:id/rsvps failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/programs/:id/cohorts", async (req, res) => {
  try {
    const programId = Number(req.params.id);
    if (!Number.isInteger(programId) || programId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const rows = await db
      .select()
      .from(cohortsTable)
      .where(eq(cohortsTable.programId, programId))
      .orderBy(desc(cohortsTable.startsAt));
    res.json({ cohorts: rows });
  } catch (err) {
    logger.error({ err }, "GET /programs/:id/cohorts failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin ──────────────────────────────────────────────────────────────────

router.get("/admin/cohorts", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: cohortsTable.id,
        programId: cohortsTable.programId,
        programTitle: programsTable.title,
        name: cohortsTable.name,
        slug: cohortsTable.slug,
        summary: cohortsTable.summary,
        coverUrl: cohortsTable.coverUrl,
        description: cohortsTable.description,
        startsAt: cohortsTable.startsAt,
        endsAt: cohortsTable.endsAt,
        demoDayAt: cohortsTable.demoDayAt,
        demoDayLocation: cohortsTable.demoDayLocation,
        demoDayUrl: cohortsTable.demoDayUrl,
        status: cohortsTable.status,
        sortOrder: cohortsTable.sortOrder,
        ventureCount: sql<number>`COALESCE((SELECT COUNT(*)::int FROM cohort_ventures cv WHERE cv.cohort_id = cohorts.id), 0)`,
      })
      .from(cohortsTable)
      .innerJoin(programsTable, eq(programsTable.id, cohortsTable.programId))
      .orderBy(desc(cohortsTable.startsAt));
    res.json({ cohorts: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/cohorts failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/cohorts", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertCohortSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(cohortsTable)
      .values({
        ...d,
        coverUrl: d.coverUrl ?? null,
        startsAt: d.startsAt ? new Date(d.startsAt) : null,
        endsAt: d.endsAt ? new Date(d.endsAt) : null,
        demoDayAt: d.demoDayAt ? new Date(d.demoDayAt) : null,
      })
      .returning();
    res.json({ cohort: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/cohorts failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/cohorts/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertCohortSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of [
      "programId",
      "name",
      "slug",
      "summary",
      "description",
      "demoDayLocation",
      "demoDayUrl",
      "status",
      "sortOrder",
    ] as const) {
      if (d[k] !== undefined) update[k] = d[k];
    }
    if (d.coverUrl !== undefined) update.coverUrl = d.coverUrl;
    if (d.startsAt !== undefined)
      update.startsAt = d.startsAt ? new Date(d.startsAt) : null;
    if (d.endsAt !== undefined)
      update.endsAt = d.endsAt ? new Date(d.endsAt) : null;
    if (d.demoDayAt !== undefined)
      update.demoDayAt = d.demoDayAt ? new Date(d.demoDayAt) : null;
    const [row] = await db
      .update(cohortsTable)
      .set(update)
      .where(eq(cohortsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ cohort: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/cohorts/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/cohorts/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(cohortsTable).where(eq(cohortsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/cohorts/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Cohort ↔ Venture management

router.post("/admin/cohorts/:id/ventures", requireAdmin, async (req, res) => {
  try {
    const cohortId = Number(req.params.id);
    if (!Number.isInteger(cohortId) || cohortId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertCohortVentureSchema
      .omit({ cohortId: true })
      .safeParse({ ...req.body, ventureId: Number(req.body?.ventureId) });
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    try {
      const [row] = await db
        .insert(cohortVenturesTable)
        .values({
          cohortId,
          ventureId: d.ventureId,
          status: d.status,
          notes: d.notes,
        })
        .returning();
      res.json({ membership: row });
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "cause" in err &&
        ((err as { cause: unknown }).cause as { code?: string })?.code === "23505"
      ) {
        res.status(409).json({ error: "هذا المشروع منضمّ بالفعل" });
        return;
      }
      throw err;
    }
  } catch (err) {
    logger.error({ err }, "POST /admin/cohorts/:id/ventures failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch(
  "/admin/cohorts/:cohortId/ventures/:ventureId",
  requireAdmin,
  async (req, res) => {
    try {
      const cohortId = Number(req.params.cohortId);
      const ventureId = Number(req.params.ventureId);
      if (
        !Number.isInteger(cohortId) ||
        cohortId <= 0 ||
        !Number.isInteger(ventureId) ||
        ventureId <= 0
      ) {
        res.status(404).json({ error: "غير موجود" });
        return;
      }
      const parsed = upsertCohortVentureSchema
        .omit({ cohortId: true, ventureId: true })
        .partial()
        .safeParse(req.body);
      if (!parsed.success) {
        badData(res, parsed.error);
        return;
      }
      const [row] = await db
        .update(cohortVenturesTable)
        .set(parsed.data)
        .where(
          and(
            eq(cohortVenturesTable.cohortId, cohortId),
            eq(cohortVenturesTable.ventureId, ventureId),
          ),
        )
        .returning();
      if (!row) {
        res.status(404).json({ error: "غير موجود" });
        return;
      }
      res.json({ membership: row });
    } catch (err) {
      logger.error({ err }, "PATCH cohort venture failed");
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  },
);

router.delete(
  "/admin/cohorts/:cohortId/ventures/:ventureId",
  requireAdmin,
  async (req, res) => {
    try {
      const cohortId = Number(req.params.cohortId);
      const ventureId = Number(req.params.ventureId);
      if (
        !Number.isInteger(cohortId) ||
        cohortId <= 0 ||
        !Number.isInteger(ventureId) ||
        ventureId <= 0
      ) {
        res.status(404).json({ error: "غير موجود" });
        return;
      }
      await db
        .delete(cohortVenturesTable)
        .where(
          and(
            eq(cohortVenturesTable.cohortId, cohortId),
            eq(cohortVenturesTable.ventureId, ventureId),
          ),
        );
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, "DELETE cohort venture failed");
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  },
);

// ─── Cohort journey: weekly curriculum + progress updates ─────────────────────

// Public — the journey for one cohort (by slug).
router.get("/cohorts/:slug/journey", async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const [cohort] = await db
      .select({ id: cohortsTable.id })
      .from(cohortsTable)
      .where(eq(cohortsTable.slug, slug))
      .limit(1);
    if (!cohort) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [weeks, updates] = await Promise.all([
      db
        .select()
        .from(cohortWeeksTable)
        .where(eq(cohortWeeksTable.cohortId, cohort.id))
        .orderBy(asc(cohortWeeksTable.weekNumber), asc(cohortWeeksTable.sortOrder)),
      db
        .select()
        .from(cohortUpdatesTable)
        .where(eq(cohortUpdatesTable.cohortId, cohort.id))
        .orderBy(desc(cohortUpdatesTable.postedAt)),
    ]);
    res.json({ weeks, updates });
  } catch (err) {
    logger.error({ err }, "GET /cohorts/:slug/journey failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Admin — journey by cohort id (for the editor).
router.get("/admin/cohorts/:id/journey", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [weeks, updates] = await Promise.all([
      db
        .select()
        .from(cohortWeeksTable)
        .where(eq(cohortWeeksTable.cohortId, id))
        .orderBy(asc(cohortWeeksTable.weekNumber)),
      db
        .select()
        .from(cohortUpdatesTable)
        .where(eq(cohortUpdatesTable.cohortId, id))
        .orderBy(desc(cohortUpdatesTable.postedAt)),
    ]);
    res.json({ weeks, updates });
  } catch (err) {
    logger.error({ err }, "GET /admin/cohorts/:id/journey failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/cohort-weeks", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertCohortWeekSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const [row] = await db
      .insert(cohortWeeksTable)
      .values(parsed.data)
      .returning();
    res.json({ week: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/cohort-weeks failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/cohort-weeks/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(cohortWeeksTable).where(eq(cohortWeeksTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/cohort-weeks/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/cohort-updates", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertCohortUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(cohortUpdatesTable)
      .values({
        cohortId: d.cohortId,
        ventureId: d.ventureId ?? null,
        weekNumber: d.weekNumber ?? null,
        title: d.title,
        body: d.body,
        sortOrder: d.sortOrder,
        ...(d.postedAt ? { postedAt: new Date(d.postedAt) } : {}),
      })
      .returning();
    res.json({ update: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/cohort-updates failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/cohort-updates/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(cohortUpdatesTable).where(eq(cohortUpdatesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/cohort-updates/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
