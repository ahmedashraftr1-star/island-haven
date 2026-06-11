import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  notificationPrefsTable,
  updateNotificationPrefsSchema,
} from "@workspace/db";
import { requireUser, type UserSession } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function sessionOf(req: Request): UserSession {
  return (req as Request & { userSession: UserSession }).userSession;
}

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

// Read the caller's prefs, creating a defaults row on first access so the
// client always gets a concrete object to render the toggles from.
async function getOrCreatePrefs(userId: number) {
  const [existing] = await db
    .select()
    .from(notificationPrefsTable)
    .where(eq(notificationPrefsTable.userId, userId))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(notificationPrefsTable)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  // Lost an insert race — read the row the other request created.
  const [row] = await db
    .select()
    .from(notificationPrefsTable)
    .where(eq(notificationPrefsTable.userId, userId))
    .limit(1);
  return row;
}

// ─── Member endpoints ─────────────────────────────────────────────────────────

router.get("/me/notification-prefs", requireUser, async (req, res) => {
  try {
    const prefs = await getOrCreatePrefs(sessionOf(req).userId);
    res.json({ prefs });
  } catch (err) {
    logger.error({ err }, "GET /me/notification-prefs failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/me/notification-prefs", requireUser, async (req, res) => {
  try {
    const parsed = updateNotificationPrefsSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const userId = sessionOf(req).userId;
    // Ensure a row exists, then apply the provided boolean fields.
    await getOrCreatePrefs(userId);
    const [prefs] = await db
      .update(notificationPrefsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(notificationPrefsTable.userId, userId))
      .returning();
    res.json({ prefs });
  } catch (err) {
    logger.error({ err }, "PATCH /me/notification-prefs failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
