import { Router, type IRouter } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { db, successStoriesTable, upsertStorySchema } from "@workspace/db";
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

router.get("/stories", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(successStoriesTable)
      .where(eq(successStoriesTable.status, "published"))
      .orderBy(
        desc(successStoriesTable.featured),
        asc(successStoriesTable.sortOrder),
        desc(successStoriesTable.createdAt),
      );
    res.json({ stories: rows });
  } catch (err) {
    logger.error({ err }, "GET /stories failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/stories", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(successStoriesTable)
      .orderBy(
        desc(successStoriesTable.featured),
        asc(successStoriesTable.sortOrder),
        desc(successStoriesTable.createdAt),
      );
    res.json({ stories: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/stories failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/stories", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertStorySchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(successStoriesTable)
      .values({ ...d, avatarUrl: d.avatarUrl ?? null, coverUrl: d.coverUrl ?? null })
      .returning();
    res.json({ story: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/stories failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/stories/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertStorySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const [row] = await db
      .update(successStoriesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(successStoriesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ story: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/stories/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/stories/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(successStoriesTable).where(eq(successStoriesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/stories/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
