import { Router, type IRouter } from "express";
import { asc, desc, eq } from "drizzle-orm";
import {
  db,
  venturesTable,
  upsertVentureSchema,
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

router.get("/ventures", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(venturesTable)
      .where(eq(venturesTable.status, "published"))
      .orderBy(
        desc(venturesTable.featured),
        asc(venturesTable.sortOrder),
        desc(venturesTable.createdAt),
      );
    res.json({ ventures: rows });
  } catch (err) {
    logger.error({ err }, "GET /ventures failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/ventures/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [row] = await db
      .select()
      .from(venturesTable)
      .where(eq(venturesTable.id, id))
      .limit(1);
    if (!row || row.status !== "published") {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ venture: row });
  } catch (err) {
    logger.error({ err }, "GET /ventures/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin ───────────────────────────────────────────────────────────────────

router.get("/admin/ventures", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(venturesTable)
      .orderBy(
        desc(venturesTable.featured),
        asc(venturesTable.sortOrder),
        desc(venturesTable.createdAt),
      );
    res.json({ ventures: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/ventures failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/ventures", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertVentureSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(venturesTable)
      .values({ ...d, coverUrl: d.coverUrl ?? null, logoUrl: d.logoUrl ?? null })
      .returning();
    res.json({ venture: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/ventures failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/ventures/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertVentureSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const [row] = await db
      .update(venturesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(venturesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ venture: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/ventures/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/ventures/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(venturesTable).where(eq(venturesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/ventures/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
