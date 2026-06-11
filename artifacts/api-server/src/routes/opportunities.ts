import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  opportunitiesTable,
  upsertOpportunitySchema,
  OPPORTUNITY_TYPES,
  type OpportunityType,
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

// ─── Public ──────────────────────────────────────────────────────────────────

// Published opportunities, newest/featured first. Optional ?type= filter.
router.get("/opportunities", async (req, res) => {
  try {
    const typeParam = String(req.query.type ?? "");
    const typeFilter = (OPPORTUNITY_TYPES as readonly string[]).includes(
      typeParam,
    )
      ? (typeParam as OpportunityType)
      : null;

    const where = typeFilter
      ? and(
          eq(opportunitiesTable.status, "published"),
          eq(opportunitiesTable.type, typeFilter),
        )
      : eq(opportunitiesTable.status, "published");

    const rows = await db
      .select()
      .from(opportunitiesTable)
      .where(where)
      .orderBy(
        desc(opportunitiesTable.featured),
        asc(opportunitiesTable.sortOrder),
        desc(opportunitiesTable.createdAt),
      );
    res.json({ opportunities: rows });
  } catch (err) {
    logger.error({ err }, "GET /opportunities failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/opportunities/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [row] = await db
      .select()
      .from(opportunitiesTable)
      .where(eq(opportunitiesTable.id, id))
      .limit(1);
    if (!row || row.status === "draft") {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ opportunity: row });
  } catch (err) {
    logger.error({ err }, "GET /opportunities/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin ───────────────────────────────────────────────────────────────────

router.get("/admin/opportunities", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(opportunitiesTable)
      .orderBy(
        desc(opportunitiesTable.featured),
        asc(opportunitiesTable.sortOrder),
        desc(opportunitiesTable.createdAt),
      );
    res.json({ opportunities: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/opportunities failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/opportunities", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertOpportunitySchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(opportunitiesTable)
      .values({
        ...d,
        applyEmail: d.applyEmail ?? "",
        deadline: d.deadline ?? null,
      })
      .returning();
    res.json({ opportunity: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/opportunities failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/opportunities/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertOpportunitySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const [row] = await db
      .update(opportunitiesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(opportunitiesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ opportunity: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/opportunities/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/opportunities/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(opportunitiesTable).where(eq(opportunitiesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/opportunities/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
