import app from "./app";
import { logger } from "./lib/logger";
import { ensureAuthConfigured } from "./lib/auth";
import { startDailyDigestSchedule } from "./lib/dailyDigest";

ensureAuthConfigured();

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
});
