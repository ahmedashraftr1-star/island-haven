import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  perksTable,
  upsertPerkSchema,
  PERK_CATEGORIES,
  type PerkCategory,
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

// Published perks, newest/featured first. Optional ?category= filter.
router.get("/perks", async (req, res) => {
  try {
    const categoryParam = String(req.query.category ?? "");
    const categoryFilter = (PERK_CATEGORIES as readonly string[]).includes(
      categoryParam,
    )
      ? (categoryParam as PerkCategory)
      : null;

    const where = categoryFilter
      ? and(
          eq(perksTable.status, "published"),
          eq(perksTable.category, categoryFilter),
        )
      : eq(perksTable.status, "published");

    const rows = await db
      .select()
      .from(perksTable)
      .where(where)
      .orderBy(
        desc(perksTable.featured),
        asc(perksTable.sortOrder),
        desc(perksTable.createdAt),
      );
    res.json({ perks: rows });
  } catch (err) {
    logger.error({ err }, "GET /perks failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/perks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [row] = await db
      .select()
      .from(perksTable)
      .where(eq(perksTable.id, id))
      .limit(1);
    if (!row || row.status === "draft") {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ perk: row });
  } catch (err) {
    logger.error({ err }, "GET /perks/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin ───────────────────────────────────────────────────────────────────

router.get("/admin/perks", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(perksTable)
      .orderBy(
        desc(perksTable.featured),
        asc(perksTable.sortOrder),
        desc(perksTable.createdAt),
      );
    res.json({ perks: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/perks failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/perks", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertPerkSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(perksTable)
      .values({
        ...d,
        logoUrl: d.logoUrl ?? null,
      })
      .returning();
    res.json({ perk: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/perks failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/perks/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertPerkSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const [row] = await db
      .update(perksTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(perksTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ perk: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/perks/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/perks/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(perksTable).where(eq(perksTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/perks/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
