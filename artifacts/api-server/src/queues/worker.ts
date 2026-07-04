import { Worker } from "bullmq";
import type { Job, ConnectionOptions } from "bullmq";
import { bullConnection } from "../lib/redis";
import { queueEvents } from "../lib/metrics";
import { logger } from "../lib/logger";
import {
  sendEmail,
  emailConfigured,
  type SendEmailOptions,
} from "../lib/email";
import { notify } from "../routes/notifications";
import { awardBadgeByKey } from "../routes/gamification";
import { sendDailyDigest } from "../lib/dailyDigest";
import { fireReminderById } from "../lib/mentorReminderJob";
import type { NotifyPayload } from "./enqueue";
import { QUEUE_NAMES, type QueueName } from "./index";

// Queue CONSUMER side. Each processor REUSES the existing helper (no logic
// duplicated). Runs in-process (RUN_WORKER_IN_PROCESS=1) or as the standalone
// dist/worker.mjs entry (src/worker.ts).

type Processor = (job: Job) => Promise<void>;

const processors: Record<QueueName, Processor> = {
  email: async (job) => {
    const ok = await sendEmail(job.data as SendEmailOptions);
    // No provider configured → dev no-op, let the job succeed. Provider set but
    // the send failed → throw so BullMQ retries with exponential backoff.
    if (!ok && emailConfigured()) throw new Error("email send failed");
  },
  notifications: async (job) => {
    const { userId, n } = job.data as { userId: number; n: NotifyPayload };
    await notify(userId, n);
  },
  badges: async (job) => {
    const { userId, key } = job.data as { userId: number; key: string };
    await awardBadgeByKey(userId, key);
  },
  "daily-digest": async () => {
    await sendDailyDigest();
  },
  "mentor-reminders": async (job) => {
    await fireReminderById((job.data as { id: number }).id);
  },
};

let workers: Worker[] = [];

/** Start one Worker per queue on the shared Redis connection. No-op if Redis is down. */
export function startWorkers(): void {
  if (workers.length) return;
  for (const name of QUEUE_NAMES) {
    const connection = bullConnection();
    if (!connection) {
      logger.warn("[worker] Redis unavailable — workers not started");
      return;
    }
    const w = new Worker(name, processors[name], {
      connection: connection as unknown as ConnectionOptions,
      concurrency: 5,
    });
    w.on("completed", () =>
      queueEvents.inc({ queue: name, status: "completed" }),
    );
    w.on("failed", (job, err) => {
      // BullMQ fires "failed" on every failing attempt. Count a terminal failure
      // (retries exhausted) as "failed" and an intermediate one as "retried" so
      // the metric reflects real outcomes, not attempt count.
      const terminal = !job || job.attemptsMade >= (job.opts.attempts ?? 1);
      queueEvents.inc({ queue: name, status: terminal ? "failed" : "retried" });
      logger.error(
        { err, queue: name, attempt: job?.attemptsMade },
        terminal
          ? "[worker] job failed (retries exhausted)"
          : "[worker] job attempt failed — will retry",
      );
    });
    workers.push(w);
  }
  logger.info({ queues: QUEUE_NAMES }, "[worker] processing jobs");
}

export async function stopWorkers(): Promise<void> {
  const ws = workers;
  workers = [];
  await Promise.all(ws.map((w) => w.close().catch(() => undefined)));
}
