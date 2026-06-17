import { and, isNull, isNotNull, gte, lte, sql } from "drizzle-orm";
import { db, usersTable, expertProfilesTable } from "@workspace/db";
import { createResetToken } from "../routes/auth";
import { sendEmail, mentorPasswordReminderEmail } from "./email";
import { logger } from "./logger";

// Reminder window: send once between the 20-hour and 24-hour mark after approval.
// This gives the mentor ~4 hours to use the fresh link before it expires.
const REMINDER_AFTER_MS = 20 * 60 * 60 * 1000; // 20 h
const REMINDER_BEFORE_MS = 24 * 60 * 60 * 1000; // 24 h (outer bound)
const FRESH_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // fresh 24-hour window

/**
 * Scans expert_profiles for mentors approved between 20 h and 24 h ago whose
 * password has never been set and who haven't received a reminder yet.
 * For each match: mints a fresh 24-hour reset token, emails the reminder, and
 * marks reminder_sent_at so the reminder is sent exactly once per approval.
 *
 * Safe to call repeatedly — the WHERE clause is idempotent.
 */
export async function runMentorReminderJob(): Promise<void> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - REMINDER_BEFORE_MS);
    const windowEnd = new Date(now.getTime() - REMINDER_AFTER_MS);

    const candidates = await db
      .select({
        profileId: expertProfilesTable.id,
        email: usersTable.email,
        fullName: usersTable.fullName,
      })
      .from(expertProfilesTable)
      .innerJoin(usersTable, sql`${usersTable.id} = ${expertProfilesTable.userId}`)
      .where(
        and(
          isNotNull(expertProfilesTable.approvedAt),
          gte(expertProfilesTable.approvedAt, windowStart),
          lte(expertProfilesTable.approvedAt, windowEnd),
          isNull(expertProfilesTable.reminderSentAt),
          isNull(usersTable.passwordSetAt),
        ),
      );

    if (candidates.length === 0) {
      logger.debug("mentorReminderJob: no pending reminders");
      return;
    }

    logger.info(
      { count: candidates.length },
      "mentorReminderJob: sending password-setup reminders",
    );

    const frontendUrl =
      process.env.FRONTEND_URL ?? "https://islandhaven.replit.app";

    for (const candidate of candidates) {
      try {
        const rawToken = createResetToken(candidate.email, FRESH_TOKEN_TTL_MS);
        const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
        const mail = mentorPasswordReminderEmail(candidate.fullName, resetUrl);

        const delivered = await sendEmail({ to: candidate.email, ...mail });

        if (delivered) {
          await db
            .update(expertProfilesTable)
            .set({ reminderSentAt: now, updatedAt: now })
            .where(sql`${expertProfilesTable.id} = ${candidate.profileId}`);

          logger.info(
            { email: candidate.email, profileId: candidate.profileId },
            "mentorReminderJob: reminder sent",
          );
        } else {
          logger.warn(
            { email: candidate.email, profileId: candidate.profileId },
            "mentorReminderJob: email delivery failed — will retry on next run",
          );
        }
      } catch (err) {
        logger.error(
          { err, email: candidate.email },
          "mentorReminderJob: failed to send reminder for candidate",
        );
      }
    }
  } catch (err) {
    logger.error({ err }, "mentorReminderJob: scan failed");
  }
}

/**
 * Starts the recurring mentor password-setup reminder job.
 * Runs immediately on startup (to catch any missed reminders from before a
 * restart), then repeats every hour.  The interval is unref'd so it doesn't
 * prevent a clean process shutdown.
 */
export function startMentorReminderJob(): void {
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  void runMentorReminderJob();

  const handle = setInterval(() => {
    void runMentorReminderJob();
  }, INTERVAL_MS);

  handle.unref();

  logger.info("mentorReminderJob: scheduled (1 h interval)");
}
