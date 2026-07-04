import { logger } from "./lib/logger";
import { ensureAuthConfigured } from "./lib/auth";
import { initRateLimitStore } from "./lib/rateLimitStore";
import { startDailyDigestSchedule } from "./lib/dailyDigest";
import { startMentorReminderJob } from "./lib/mentorReminderJob";

ensureAuthConfigured();

// Probe the shared rate-limit store (Redis) BEFORE importing the app, because
// express-rate-limit binds its store when the limiters are created at app load.
// Falls back to in-memory if REDIS_URL is unset/unreachable.
await initRateLimitStore();
const { default: app } = await import("./app");

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Opt-in in-process daily digest schedule (ENABLE_DAILY_DIGEST_CRON=1).
  // No-op otherwise; the admin endpoint stays available regardless.
  startDailyDigestSchedule(8);
  // Mentor password-setup reminder job (sends reminders before links expire).
  startMentorReminderJob();
});
