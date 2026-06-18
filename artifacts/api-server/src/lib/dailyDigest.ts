import { and, desc, eq, gte, lte, inArray } from "drizzle-orm";
import {
  db,
  usersTable,
  notificationPrefsTable,
  worksTable,
  opportunitiesTable,
  dailyPostsTable,
  DAILY_TYPE_LABELS,
  OPPORTUNITY_TYPE_LABELS,
  type DailyType,
  type OpportunityType,
} from "@workspace/db";
import { logger } from "./logger";
import { sendEmail, dailyDigestEmail, type DigestSection } from "./email";

// ─── Daily community digest ───────────────────────────────────────────────────
// Summarises the last 24h of new community activity and emails it to every
// active member who opted in (notification_prefs.email_daily = true). The
// digest content is computed once and shared by all recipients; only the
// greeting is personalised. Empty digests are never sent.

const DAY_MS = 24 * 60 * 60 * 1000;
const PER_SECTION_LIMIT = 5;
// Small delay between sends to stay friendly with the email provider's rate
// limits without serialising the whole batch behind slow individual sends.
const SEND_GAP_MS = 120;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Build the shared digest sections from the last `sinceMs`-window of activity. */
async function buildSections(since: Date): Promise<DigestSection[]> {
  const sections: DigestSection[] = [];

  // New works that are publicly visible (visible | featured). Filter status in
  // SQL so the limit never under-reports when recent works are hidden.
  const visibleWorks = await db
    .select({
      title: worksTable.title,
      summary: worksTable.summary,
    })
    .from(worksTable)
    .where(
      and(
        gte(worksTable.createdAt, since),
        inArray(worksTable.status, ["visible", "featured"]),
      ),
    )
    .orderBy(desc(worksTable.createdAt))
    .limit(PER_SECTION_LIMIT);
  if (visibleWorks.length) {
    sections.push({
      heading: "أعمال جديدة",
      items: visibleWorks.map((w) => ({
        title: w.title,
        meta: w.summary || undefined,
      })),
    });
  }

  // New published opportunities (jobs / internships / gigs / volunteer roles).
  const opportunities = await db
    .select({
      title: opportunitiesTable.title,
      organization: opportunitiesTable.organization,
      type: opportunitiesTable.type,
    })
    .from(opportunitiesTable)
    .where(
      and(
        gte(opportunitiesTable.createdAt, since),
        eq(opportunitiesTable.status, "published"),
      ),
    )
    .orderBy(desc(opportunitiesTable.createdAt))
    .limit(PER_SECTION_LIMIT);
  if (opportunities.length) {
    sections.push({
      heading: "فرص جديدة",
      items: opportunities.map((o) => {
        const typeLabel = OPPORTUNITY_TYPE_LABELS[o.type as OpportunityType];
        const parts = [typeLabel, o.organization].filter(Boolean);
        return {
          title: o.title,
          meta: parts.length ? parts.join(" · ") : undefined,
        };
      }),
    });
  }

  // New daily posts (tips / news / quotes / stories). Keyed off publishedAt and
  // bounded to now so future-scheduled posts never leak into the digest early.
  const posts = await db
    .select({
      title: dailyPostsTable.title,
      type: dailyPostsTable.type,
    })
    .from(dailyPostsTable)
    .where(
      and(
        gte(dailyPostsTable.publishedAt, since),
        lte(dailyPostsTable.publishedAt, new Date()),
      ),
    )
    .orderBy(desc(dailyPostsTable.publishedAt))
    .limit(PER_SECTION_LIMIT);
  if (posts.length) {
    sections.push({
      heading: "يوميّات المجتمع",
      items: posts.map((p) => ({
        title: p.title,
        meta: DAILY_TYPE_LABELS[p.type as DailyType],
      })),
    });
  }

  return sections;
}

export interface DigestResult {
  sent: number;
  skipped: number;
  /** True when there was no activity at all, so no email was sent to anyone. */
  empty: boolean;
}

/**
 * Computes the daily digest and emails it to every active, opted-in member.
 *
 * Safety guarantees:
 *  - Never emails opted-out (email_daily=false) or banned/inactive members
 *    (filtered in the DB query).
 *  - A failed send for one member is logged and skipped — it never aborts the
 *    batch (try/catch per recipient).
 *  - Sends sequentially with a tiny gap to respect provider rate limits.
 *  - Skips entirely (sends nothing) when there is no new activity.
 */
export async function sendDailyDigest(): Promise<DigestResult> {
  const since = new Date(Date.now() - DAY_MS);

  const sections = await buildSections(since);
  if (sections.length === 0) {
    logger.info("daily digest: no new activity in the last 24h — skipping");
    return { sent: 0, skipped: 0, empty: true };
  }

  // Single join: active members who opted into the daily digest. More efficient
  // than per-user prefAllows and guarantees we never email opted-out/banned users.
  const recipients = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      fullName: usersTable.fullName,
    })
    .from(usersTable)
    .innerJoin(
      notificationPrefsTable,
      eq(notificationPrefsTable.userId, usersTable.id),
    )
    .where(
      and(
        eq(usersTable.status, "active"),
        eq(notificationPrefsTable.emailDaily, true),
      ),
    );

  if (recipients.length === 0) {
    logger.info("daily digest: activity present but no opted-in recipients");
    return { sent: 0, skipped: 0, empty: false };
  }

  let sent = 0;
  let skipped = 0;

  for (const r of recipients) {
    try {
      const { subject, html, text } = dailyDigestEmail(r.fullName, sections);
      const accepted = await sendEmail({ to: r.email, subject, html, text });
      // `sendEmail` returns false when only logged (no API key) or on a soft
      // provider failure. Count an accepted/logged attempt as "sent" so a
      // missing-API-key dev run still reports progress; treat provider
      // rejection as skipped so the count reflects real delivery in prod.
      if (accepted || !process.env.RESEND_API_KEY) {
        sent += 1;
      } else {
        skipped += 1;
      }
    } catch (err) {
      skipped += 1;
      logger.error(
        { err, userId: r.id },
        "daily digest: failed to send to recipient — continuing",
      );
    }
    if (SEND_GAP_MS > 0) await sleep(SEND_GAP_MS);
  }

  logger.info(
    { sent, skipped, recipients: recipients.length, sections: sections.length },
    "daily digest run complete",
  );
  return { sent, skipped, empty: false };
}

// ─── In-process scheduler (opt-in) ────────────────────────────────────────────
// The codebase has no cron dependency; the established idiom for periodic work
// is `setInterval(...).unref()` (see routes/applications.ts, bookings.ts, …).
// We follow that idiom but keep it OPT-IN behind ENABLE_DAILY_DIGEST_CRON so it
// never fires in tests/CI and is only enabled on a single designated instance
// (avoids duplicate sends when running multiple app instances). The admin
// endpoint (POST /admin/notifications/daily-digest) remains the reliable,
// externally-cron-able trigger for production.

let digestTimer: ReturnType<typeof setInterval> | null = null;

/** Returns the ms until the next occurrence of `hour:00` local time. */
function msUntilNextHour(hour: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

/**
 * Schedules the daily digest to run once a day at `hour` (local time) when
 * ENABLE_DAILY_DIGEST_CRON=1. No-op otherwise. Safe to call once at startup.
 */
export function startDailyDigestSchedule(hour = 8): void {
  if (process.env.ENABLE_DAILY_DIGEST_CRON !== "1") return;
  if (digestTimer) return; // already scheduled

  const run = () => {
    sendDailyDigest().catch((err) =>
      logger.error({ err }, "daily digest scheduled run threw"),
    );
  };

  // Align the first run to the target hour, then repeat every 24h.
  const firstDelay = msUntilNextHour(hour);
  logger.info(
    { hour, firstRunInMs: firstDelay },
    "daily digest schedule enabled",
  );
  const kickoff = setTimeout(() => {
    run();
    digestTimer = setInterval(run, DAY_MS);
    digestTimer.unref();
  }, firstDelay);
  kickoff.unref();
}
