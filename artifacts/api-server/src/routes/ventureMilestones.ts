import { Router, type IRouter } from "express";
import { asc, desc, eq } from "drizzle-orm";
import {
  db,
  ventureMilestonesTable,
  upsertVentureMilestoneSchema,
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

// Public — timeline for one venture, oldest → newest.
router.get("/ventures/:id/milestones", async (req, res) => {
  try {
    const ventureId = Number(req.params.id);
    if (!Number.isInteger(ventureId) || ventureId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const rows = await db
      .select()
      .from(ventureMilestonesTable)
      .where(eq(ventureMilestonesTable.ventureId, ventureId))
      .orderBy(
        asc(ventureMilestonesTable.achievedAt),
        asc(ventureMilestonesTable.sortOrder),
      );
    res.json({ milestones: rows });
  } catch (err) {
    logger.error({ err }, "GET /ventures/:id/milestones failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Admin — flat list (for global timeline / admin editor)
router.get("/admin/milestones", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(ventureMilestonesTable)
      .orderBy(desc(ventureMilestonesTable.achievedAt));
    res.json({ milestones: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/milestones failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/milestones", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertVentureMilestoneSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(ventureMilestonesTable)
      .values({
        ...d,
        achievedAt: new Date(d.achievedAt),
        amount: d.amount ?? null,
        metricValue: d.metricValue ?? null,
      })
      .returning();
    res.json({ milestone: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/milestones failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/milestones/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertVentureMilestoneSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const update: Record<string, unknown> = {};
    for (const k of ["ventureId", "title", "body", "type", "link", "sortOrder"] as const) {
      if (d[k] !== undefined) update[k] = d[k];
    }
    if (d.achievedAt !== undefined) update.achievedAt = new Date(d.achievedAt);
    if (d.amount !== undefined) update.amount = d.amount ?? null;
    if (d.metricValue !== undefined)
      update.metricValue = d.metricValue ?? null;
    const [row] = await db
      .update(ventureMilestonesTable)
      .set(update)
      .where(eq(ventureMilestonesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ milestone: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/milestones/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/milestones/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db
      .delete(ventureMilestonesTable)
      .where(eq(ventureMilestonesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/milestones/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
