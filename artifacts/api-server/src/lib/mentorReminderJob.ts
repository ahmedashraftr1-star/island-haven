import { and, eq, isNull } from "drizzle-orm";
import { db, usersTable, pendingRemindersTable } from "@workspace/db";
import { createResetToken } from "../routes/auth";
import { sendEmail, mentorPasswordReminderEmail } from "./email";
import { logger } from "./logger";

const FRESH_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24-hour window for the mentor

/**
 * Fires a single pending reminder row: mints a fresh 24-hour reset token,
 * sends the email, and marks the row sent.  Skips if the mentor has already
 * set their password.
 */
async function fireReminder(row: {
  id: number;
  email: string;
  fullName: string;
}): Promise<void> {
  try {
    // Skip if the mentor already set their password — nothing to remind.
    const [user] = await db
      .select({ passwordSetAt: usersTable.passwordSetAt })
      .from(usersTable)
      .where(eq(usersTable.email, row.email))
      .limit(1);

    if (user?.passwordSetAt) {
      logger.info(
        { email: row.email, id: row.id },
        "mentorReminderJob: mentor already set password — marking sent without emailing",
      );
      await db
        .update(pendingRemindersTable)
        .set({ sent: true, sentAt: new Date() })
        .where(eq(pendingRemindersTable.id, row.id));
      return;
    }

    // Mint a fresh 24-hour token so the mentor gets a full window.
    const frontendUrl =
      process.env.FRONTEND_URL ?? "https://islandhaven.replit.app";
    const rawToken = createResetToken(row.email, FRESH_TOKEN_TTL_MS);
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    const mail = mentorPasswordReminderEmail(row.fullName, resetUrl);

    const delivered = await sendEmail({ to: row.email, ...mail });

    if (delivered) {
      await db
        .update(pendingRemindersTable)
        .set({ sent: true, sentAt: new Date() })
        .where(eq(pendingRemindersTable.id, row.id));
      logger.info(
        { email: row.email, id: row.id },
        "mentorReminderJob: reminder sent",
      );
    } else {
      logger.warn(
        { email: row.email, id: row.id },
        "mentorReminderJob: email delivery failed — will retry on next startup",
      );
    }
  } catch (err) {
    logger.error(
      { err, email: row.email, id: row.id },
      "mentorReminderJob: failed to fire reminder",
    );
  }
}

/**
 * Schedules a single pending reminder for in-process delivery.
 * - If sendAt is in the past (or now): fires immediately.
 * - If sendAt is in the future: registers a setTimeout that fires at the
 *   right moment.  The handle is unref'd so it doesn't block process shutdown.
 *
 * Call this both at startup (for existing rows) AND right after inserting a
 * new row at approval time, so reminders are always delivered even if the
 * server never restarts.
 */
export function schedulePendingReminder(row: {
  id: number;
  email: string;
  fullName: string;
  sendAt: Date;
}): void {
  const delayMs = row.sendAt.getTime() - Date.now();

  if (delayMs <= 0) {
    void fireReminder(row);
  } else {
    const handle = setTimeout(() => {
      void fireReminder(row);
    }, delayMs);
    handle.unref();

    logger.info(
      {
        email: row.email,
        id: row.id,
        delayMinutes: Math.round(delayMs / 60_000),
      },
      "mentorReminderJob: scheduled future reminder",
    );
  }
}

/**
 * Starts the mentor password-setup reminder job.
 *
 * On startup it reads every unsent row from `pending_reminders` and calls
 * `schedulePendingReminder` for each one:
 *   - Overdue rows fire immediately.
 *   - Future rows are scheduled with setTimeout.
 *
 * Because the table is the source of truth, server restarts are safe: the
 * next startup re-reads the table and re-schedules whatever is still pending.
 * New approvals that happen while the server is running are handled by calling
 * `schedulePendingReminder` directly after inserting the row.
 */
export function startMentorReminderJob(): void {
  void (async () => {
    try {
      const rows = await db
        .select({
          id: pendingRemindersTable.id,
          email: pendingRemindersTable.email,
          fullName: pendingRemindersTable.fullName,
          sendAt: pendingRemindersTable.sendAt,
        })
        .from(pendingRemindersTable)
        .where(
          and(
            eq(pendingRemindersTable.sent, false),
            isNull(pendingRemindersTable.sentAt),
          ),
        );

      if (rows.length === 0) {
        logger.debug("mentorReminderJob: no pending reminders on startup");
      } else {
        logger.info(
          { count: rows.length },
          "mentorReminderJob: replaying pending reminders from DB",
        );
        for (const row of rows) {
          schedulePendingReminder(row);
        }
      }
    } catch (err) {
      logger.error({ err }, "mentorReminderJob: startup scan failed");
    }
  })();

  logger.info("mentorReminderJob: started");
}
