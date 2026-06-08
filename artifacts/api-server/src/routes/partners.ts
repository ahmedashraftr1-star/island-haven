import { Router, type IRouter } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { db, partnersTable, upsertPartnerSchema } from "@workspace/db";
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

router.get("/partners", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(partnersTable)
      .where(eq(partnersTable.status, "visible"))
      .orderBy(asc(partnersTable.sortOrder), desc(partnersTable.createdAt));
    res.json({ partners: rows });
  } catch (err) {
    logger.error({ err }, "GET /partners failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/partners", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(partnersTable)
      .orderBy(asc(partnersTable.sortOrder), desc(partnersTable.createdAt));
    res.json({ partners: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/partners failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/partners", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertPartnerSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(partnersTable)
      .values({ ...d, logoUrl: d.logoUrl ?? null })
      .returning();
    res.json({ partner: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/partners failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/partners/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertPartnerSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const [row] = await db
      .update(partnersTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(partnersTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ partner: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/partners/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/partners/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(partnersTable).where(eq(partnersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/partners/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
