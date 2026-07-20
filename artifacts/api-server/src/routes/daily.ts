import { Router, type IRouter } from "express";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import {
  db,
  dailyPostsTable,
  upsertDailySchema,
  DAILY_TYPES,
  type DailyType,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { writeAudit, auditActor } from "../lib/audit";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ─── Public list ────────────────────────────────────────────────────────────

router.get("/daily", async (req, res) => {
  try {
    const type = String(req.query.type ?? "");
    const pageSize = Math.min(Math.max(parseInt(String(req.query.limit ?? "12"), 10) || 12, 1), 100);
    const requestedPage = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const notDeleted = isNull(dailyPostsTable.deletedAt);
    const typeFilter = DAILY_TYPES.includes(type as DailyType)
      ? and(eq(dailyPostsTable.type, type as DailyType), notDeleted)
      : notDeleted;

    const [{ total }] = await db.select({ total: count() }).from(dailyPostsTable).where(typeFilter);

    // Clamp page to the valid range so a huge ?page never produces an
    // out-of-range deep offset.
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, totalPages);

    const rows = await db
      .select()
      .from(dailyPostsTable)
      .where(typeFilter)
      .orderBy(desc(dailyPostsTable.publishedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    res.json({ posts: rows, total, page, totalPages });
  } catch (err) {
    logger.error({ err }, "GET /daily failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/daily/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [row] = await db
      .select()
      .from(dailyPostsTable)
      .where(eq(dailyPostsTable.id, id))
      .limit(1);
    if (!row || row.deletedAt) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ post: row });
  } catch (err) {
    logger.error({ err }, "GET /daily/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin ──────────────────────────────────────────────────────────────────

router.get("/admin/daily", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(dailyPostsTable)
      .where(isNull(dailyPostsTable.deletedAt))
      .orderBy(desc(dailyPostsTable.publishedAt));
    res.json({ posts: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/daily failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/daily", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertDailySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "بيانات غير صحيحة",
        details: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(dailyPostsTable)
      .values({
        type: d.type,
        title: d.title,
        body: d.body,
        coverUrl: d.coverUrl ?? null,
        publishedAt: d.publishedAt ? new Date(d.publishedAt) : new Date(),
      })
      .returning();
    void writeAudit({ actor: auditActor(req), action: "daily_created", targetType: "daily", targetId: row.id, newValue: row.title });
    res.json({ post: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/daily failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/daily/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertDailySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "بيانات غير صحيحة",
        details: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }
    const d = parsed.data;
    const update: Record<string, unknown> = {};
    if (d.type !== undefined) update.type = d.type;
    if (d.title !== undefined) update.title = d.title;
    if (d.body !== undefined) update.body = d.body;
    if (d.coverUrl !== undefined) update.coverUrl = d.coverUrl;
    if (d.publishedAt) update.publishedAt = new Date(d.publishedAt);
    const [row] = await db
      .update(dailyPostsTable)
      .set(update)
      .where(eq(dailyPostsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    void writeAudit({ actor: auditActor(req), action: "daily_updated", targetType: "daily", targetId: id, newValue: Object.keys(update).join(",") });
    res.json({ post: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/daily/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/daily/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [before] = await db.select({ title: dailyPostsTable.title }).from(dailyPostsTable).where(eq(dailyPostsTable.id, id)).limit(1);
    // SOFT delete — retained + hidden from reads, restorable from Trash.
    await db.update(dailyPostsTable).set({ deletedAt: new Date() }).where(and(eq(dailyPostsTable.id, id), isNull(dailyPostsTable.deletedAt)));
    void writeAudit({ actor: auditActor(req), action: "daily_deleted", targetType: "daily", targetId: id, oldValue: before?.title ?? "" });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/daily/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
