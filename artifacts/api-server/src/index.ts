import { logger } from "./lib/logger";
import { ensureAuthConfigured } from "./lib/auth";
import { initRateLimitStore } from "./lib/rateLimitStore";
import { initQueues } from "./queues";
import { startWorkers } from "./queues/worker";
import { startDailyDigestSchedule } from "./lib/dailyDigest";
import { startMentorReminderJob } from "./lib/mentorReminderJob";

ensureAuthConfigured();

// Probe the shared rate-limit store (Redis) BEFORE importing the app, because
// express-rate-limit binds its store when the limiters are created at app load.
// Falls back to in-memory if REDIS_URL is unset/unreachable.
await initRateLimitStore();
// Create the queue producers on the same shared connection (no-op without
// Redis → the enqueue wrappers process inline).
initQueues();
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

  // In-process worker for dev / single-instance. In production run the separate
  // dist/worker.mjs instead and leave this unset (one dedicated consumer).
  if (process.env.RUN_WORKER_IN_PROCESS === "1") {
    startWorkers();
  }

  // Opt-in in-process daily digest schedule (ENABLE_DAILY_DIGEST_CRON=1).
  // No-op otherwise; the admin endpoint stays available regardless.
  startDailyDigestSchedule(8);
  // Mentor password-setup reminder job (sends reminders before links expire).
  startMentorReminderJob();
});
