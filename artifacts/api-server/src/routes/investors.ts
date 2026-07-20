import { Router, type IRouter } from "express";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import {
  db,
  investorsTable,
  upsertInvestorSchema,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { writeAudit, auditActor } from "../lib/audit";
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

router.get("/investors", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(investorsTable)
      .where(and(eq(investorsTable.status, "visible"), isNull(investorsTable.deletedAt)))
      .orderBy(asc(investorsTable.sortOrder), desc(investorsTable.createdAt));
    res.json({ investors: rows });
  } catch (err) {
    logger.error({ err }, "GET /investors failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/investors", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(investorsTable)
      .where(isNull(investorsTable.deletedAt))
      .orderBy(asc(investorsTable.sortOrder), desc(investorsTable.createdAt));
    res.json({ investors: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/investors failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/investors", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertInvestorSchema.safeParse(req.body);
    if (!parsed.success) { badData(res, parsed.error); return; }
    const d = parsed.data;
    const [row] = await db
      .insert(investorsTable)
      .values({ ...d, logoUrl: d.logoUrl ?? null })
      .returning();
    res.json({ investor: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/investors failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/investors/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) { res.status(404).json({ error: "غير موجود" }); return; }
    const parsed = upsertInvestorSchema.partial().safeParse(req.body);
    if (!parsed.success) { badData(res, parsed.error); return; }
    const [row] = await db
      .update(investorsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(investorsTable.id, id), isNull(investorsTable.deletedAt)))
      .returning();
    if (!row) { res.status(404).json({ error: "غير موجود" }); return; }
    res.json({ investor: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/investors/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/investors/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) { res.status(404).json({ error: "غير موجود" }); return; }
    // Soft-delete: move to Trash (restorable). NEVER hard-delete.
    const [row] = await db
      .update(investorsTable)
      .set({ deletedAt: new Date() })
      .where(and(eq(investorsTable.id, id), isNull(investorsTable.deletedAt)))
      .returning({ id: investorsTable.id, name: investorsTable.name });
    if (!row) { res.status(404).json({ error: "غير موجود" }); return; }
    void writeAudit({
      actor: auditActor(req),
      action: "investor_deleted",
      targetType: "investor",
      targetId: id,
      oldValue: row.name ?? "",
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/investors/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
