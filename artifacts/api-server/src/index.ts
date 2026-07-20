import { pool } from "@workspace/db";
import { logger } from "./lib/logger";
import { ensureAuthConfigured } from "./lib/auth";
import { initRateLimitStore } from "./lib/rateLimitStore";
import { initQueues, closeQueues } from "./queues";
import { startWorkers, stopWorkers } from "./queues/worker";
import { startDailyDigestSchedule } from "./lib/dailyDigest";
import { startMentorReminderJob } from "./lib/mentorReminderJob";
import { publicKeyInfo } from "./lib/attest";

ensureAuthConfigured();

// Resolve the Ed25519 attestation signing key at boot. In production this THROWS
// if IH_ATTEST_PRIVATE_KEY_HEX is unset — failing loudly here rather than booting
// healthy and only 500-ing when the first /api/attestations/* request arrives.
// In dev it resolves a stable SESSION_SECRET-derived key and never throws.
{
  const attestKey = publicKeyInfo();
  logger.info({ keyId: attestKey.id }, "attestation signing key ready");
}

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

// Warm up the DB pool BEFORE we start accepting traffic, so the very first
// request never races an unconnected pool. That race surfaced as a cold-start
// 5xx on the first /api/jobs (and any other DB route) on slower hosts / behind a
// readiness-gated proxy. Bounded retries; if the DB is genuinely unreachable we
// still boot (liveness stays up and /readyz correctly reports degraded) rather
// than crash-loop.
async function warmUpDb(retries = 12, delayMs = 300): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      logger.info({ attempt }, "DB pool warmed up — ready to serve");
      return;
    } catch (err) {
      if (attempt === retries) {
        logger.warn(
          { err },
          "DB warm-up did not complete before listen — serving anyway (readiness will gate until the DB recovers)",
        );
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

await warmUpDb();

// Last-resort process guards. Installed only AFTER startup validation (auth,
// port, DB warm-up) so a genuine misconfiguration still fails loudly at boot —
// but once we're actually serving, a stray promise rejection or a throw that
// escaped every handler's try/catch AND the central error middleware must NOT
// take the whole server down (the reported "one bad request 500s every route"
// failure mode). We log with full context and keep serving.
// NOTE: continuing after an uncaughtException is normally discouraged (the
// process may be in an undefined state); it's a deliberate trade-off here to
// keep a single-instance server alive, since the realistic error paths (handler
// throws, idle-pool 'error', awaited rejections) are already contained upstream.
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "unhandledRejection — process kept alive");
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "uncaughtException — process kept alive");
});

const server = app.listen(port, (err) => {
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

// Graceful shutdown for zero-downtime rolling deploys: stop accepting new
// connections, drain in-flight jobs (stopWorkers waits on active jobs), then
// close the Redis + DB connections. Force-exit if it hangs past 10s.
let shuttingDown = false;
async function shutdown(sig: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ sig }, "graceful shutdown starting");
  const force = setTimeout(() => {
    logger.error("graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, 10_000);
  force.unref();
  server.close();
  await stopWorkers().catch(() => undefined);
  await closeQueues().catch(() => undefined);
  await pool.end().catch(() => undefined);
  clearTimeout(force);
  logger.info("graceful shutdown complete");
  process.exit(0);
}
for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.once(sig, () => void shutdown(sig));
}
