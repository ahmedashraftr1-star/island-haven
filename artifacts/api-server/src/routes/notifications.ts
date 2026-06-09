import { Router, type IRouter, type Request } from "express";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import {
  db,
  notificationsTable,
  type NotificationType,
} from "@workspace/db";
import { requireUser, type UserSession } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function sessionOf(req: Request): UserSession {
  return (req as Request & { userSession: UserSession }).userSession;
}

/**
 * Create an in-app notification for a user. Fire-and-forget at call sites —
 * never let a notification failure break the main flow.
 */
export async function notify(
  userId: number,
  n: { type: NotificationType; title: string; body?: string; link?: string },
): Promise<void> {
  try {
    await db.insert(notificationsTable).values({
      userId,
      type: n.type,
      title: n.title.slice(0, 200),
      body: (n.body ?? "").slice(0, 500),
      link: (n.link ?? "").slice(0, 400),
    });
  } catch (err) {
    logger.error({ err, userId }, "notify failed");
  }
}

// ─── Member endpoints ─────────────────────────────────────────────────────────

router.get("/me/notifications", requireUser, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, sessionOf(req).userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json({ notifications: rows });
  } catch (err) {
    logger.error({ err }, "GET /me/notifications failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/me/notifications/unread-count", requireUser, async (req, res) => {
  try {
    const [row] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.userId, sessionOf(req).userId),
          isNull(notificationsTable.readAt),
        ),
      );
    res.json({ count: row?.count ?? 0 });
  } catch (err) {
    logger.error({ err }, "GET /me/notifications/unread-count failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/me/notifications/:id/read", requireUser, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationsTable.id, id),
          eq(notificationsTable.userId, sessionOf(req).userId),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /me/notifications/:id/read failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/me/notifications/read-all", requireUser, async (req, res) => {
  try {
    await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationsTable.userId, sessionOf(req).userId),
          isNull(notificationsTable.readAt),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /me/notifications/read-all failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
