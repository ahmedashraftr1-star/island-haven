import { logger } from "./lib/logger";
import { initRedis, isRedisReady } from "./lib/redis";
import { startWorkers, stopWorkers } from "./queues/worker";

// Standalone worker process (dist/worker.mjs). The recommended production
// topology: run N stateless api instances (producers) + this one worker
// (consumer). Requires REDIS_URL — without it there is nothing to consume,
// since a no-Redis deployment processes jobs inline in the api process.

await initRedis();
if (!isRedisReady()) {
  logger.error(
    "[worker] REDIS_URL is required to run the worker process (no queue to consume without it)",
  );
  process.exit(1);
}

startWorkers();
logger.info("[worker] started — consuming email/notifications/badges/digest/reminders");

for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => {
    logger.info({ sig }, "[worker] shutting down");
    void stopWorkers().finally(() => process.exit(0));
  });
}
