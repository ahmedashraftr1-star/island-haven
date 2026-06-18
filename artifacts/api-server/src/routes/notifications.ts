import { Router, type IRouter, type Request } from "express";
import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";
import {
  db,
  notificationsTable,
  usersTable,
  type NotificationType,
} from "@workspace/db";
import { requireUser, type UserSession } from "../lib/auth";
import { logger } from "../lib/logger";
import { getAdminEmail } from "./adminExtra";

const router: IRouter = Router();

function sessionOf(req: Request): UserSession {
  return (req as Request & { userSession: UserSession }).userSession;
}

async function isAdminUser(userId: number): Promise<boolean> {
  try {
    const adminEmail = await getAdminEmail();
    if (!adminEmail) return false;
    const [row] = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    return !!row && row.email.toLowerCase() === adminEmail.toLowerCase();
  } catch {
    return false;
  }
}

const VALID_TYPES = new Set<string>([
  "mentor_application",
  "session_requested",
  "booking_confirmed",
  "generic",
]);

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

/**
 * GET /me/notifications
 *
 * Optional query param: ?type=<NotificationType>
 * When provided, only notifications of that type are returned.
 * Non-admin users cannot filter by mentor_application.
 */
router.get("/me/notifications", requireUser, async (req, res) => {
  try {
    const { userId } = sessionOf(req);
    const admin = await isAdminUser(userId);
    const typeParam = typeof req.query.type === "string" ? req.query.type : null;

    if (typeParam !== null && !VALID_TYPES.has(typeParam)) {
      res.status(400).json({ error: "نوع الإشعار غير صالح" });
      return;
    }

    if (!admin && typeParam === "mentor_application") {
      res.status(403).json({ error: "غير مصرح" });
      return;
    }

    const baseCondition = admin
      ? eq(notificationsTable.userId, userId)
      : and(
          eq(notificationsTable.userId, userId),
          ne(notificationsTable.type, "mentor_application"),
        );

    const whereCondition =
      typeParam !== null
        ? and(baseCondition, eq(notificationsTable.type, typeParam as NotificationType))
        : baseCondition;

    const rows = await db
      .select()
      .from(notificationsTable)
      .where(whereCondition)
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
    const { userId } = sessionOf(req);
    const admin = await isAdminUser(userId);
    const [row] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(notificationsTable)
      .where(
        admin
          ? and(
              eq(notificationsTable.userId, userId),
              isNull(notificationsTable.readAt),
            )
          : and(
              eq(notificationsTable.userId, userId),
              isNull(notificationsTable.readAt),
              ne(notificationsTable.type, "mentor_application"),
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
