import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  notificationPrefsTable,
  updateNotificationPrefsSchema,
} from "@workspace/db";
import { requireUser, requireAdmin, type UserSession } from "../lib/auth";
import { logger } from "../lib/logger";
import { sendDailyDigest } from "../lib/dailyDigest";

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

// Channel defaults — must mirror notificationPrefsTable column defaults.
const PREF_DEFAULTS = {
  emailSessions: true,
  emailPrograms: true,
  emailDaily: false,
  pushEnabled: true,
} as const;

export type PrefKey = keyof typeof PREF_DEFAULTS;

/**
 * Whether `userId` allows notifications on `key`'s channel. Used to gate
 * fire-and-forget sends. Fail-open (returns true) on a lookup error so a
 * transient DB hiccup never silently drops a session/program email.
 */
export async function prefAllows(userId: number, key: PrefKey): Promise<boolean> {
  try {
    const [row] = await db
      .select({ value: notificationPrefsTable[key] })
      .from(notificationPrefsTable)
      .where(eq(notificationPrefsTable.userId, userId))
      .limit(1);
    if (!row) return PREF_DEFAULTS[key];
    return row.value;
  } catch (err) {
    logger.error({ err, userId, key }, "prefAllows lookup failed");
    return true;
  }
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

// ─── Admin endpoint ───────────────────────────────────────────────────────────

// Cooldown so an accidental double-trigger (or an over-eager external cron) can't
// re-blast the same digest to every member. Pass ?force=1 to override. NB:
// in-memory only — for multi-instance prod, prefer a persisted last-run guard.
const DIGEST_COOLDOWN_MS = 6 * 60 * 60 * 1000;
let lastDigestRunAt = 0;

// Manually trigger the daily digest run. In production a system cron should hit
// this endpoint once a day (e.g. 8:00 AM), or set ENABLE_DAILY_DIGEST_CRON=1 to
// run the in-process schedule instead. Returns the send/skip tallies.
router.post(
  "/admin/notifications/daily-digest",
  requireAdmin,
  async (req, res) => {
    try {
      const force = req.query.force === "1";
      const sinceLast = Date.now() - lastDigestRunAt;
      if (!force && lastDigestRunAt > 0 && sinceLast < DIGEST_COOLDOWN_MS) {
        res.json({
          sent: 0,
          skipped: 0,
          empty: false,
          throttled: true,
          message: "تم تشغيل النشرة مؤخّرًا — أضف ?force=1 لإعادة الإرسال",
        });
        return;
      }
      lastDigestRunAt = Date.now();
      const result = await sendDailyDigest();
      res.json(result);
    } catch (err) {
      logger.error({ err }, "POST /admin/notifications/daily-digest failed");
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  },
);

export default router;
