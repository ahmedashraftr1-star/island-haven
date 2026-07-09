import { Router, type IRouter } from "express";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, adminNotificationsTable } from "@workspace/db";
import { requireAdmin, getAdmin } from "../lib/auth";
import { logger } from "../lib/logger";

// Personal staff-notification feed for the signed-in admin. Under /admin/me/*
// so the RBAC gate treats it as authn-only (any admin sees their OWN feed).
const router: IRouter = Router();

router.get("/admin/me/notifications", requireAdmin, async (req, res) => {
  try {
    const me = getAdmin(req);
    const rows = await db
      .select()
      .from(adminNotificationsTable)
      .where(eq(adminNotificationsTable.adminUserId, me?.id ?? -1))
      .orderBy(desc(adminNotificationsTable.createdAt))
      .limit(40);
    res.json({ notifications: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/me/notifications failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/me/notifications/unread-count", requireAdmin, async (req, res) => {
  try {
    const me = getAdmin(req);
    const [r] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminNotificationsTable)
      .where(
        and(
          eq(adminNotificationsTable.adminUserId, me?.id ?? -1),
          isNull(adminNotificationsTable.readAt),
        ),
      );
    res.json({ count: r?.count ?? 0 });
  } catch (err) {
    logger.error({ err }, "GET /admin/me/notifications/unread-count failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/me/notifications/read-all", requireAdmin, async (req, res) => {
  try {
    const me = getAdmin(req);
    await db
      .update(adminNotificationsTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(adminNotificationsTable.adminUserId, me?.id ?? -1),
          isNull(adminNotificationsTable.readAt),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /admin/me/notifications/read-all failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/me/notifications/:id/read", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "معرّف غير صالح" });
      return;
    }
    const me = getAdmin(req);
    await db
      .update(adminNotificationsTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(adminNotificationsTable.id, id),
          eq(adminNotificationsTable.adminUserId, me?.id ?? -1),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /admin/me/notifications/:id/read failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
