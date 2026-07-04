import { Queue } from "bullmq";
import type { JobsOptions, ConnectionOptions } from "bullmq";
import { bullConnection } from "../lib/redis";
import { setGauge } from "../lib/metrics";
import { logger } from "../lib/logger";

// Queue PRODUCER side. The app enqueues jobs here; a worker (in-process when
// RUN_WORKER_IN_PROCESS=1, else the separate dist/worker.mjs) consumes them.
// Everything degrades to inline processing when Redis is absent — see enqueue.ts.

export const QUEUE_NAMES = [
  "email",
  "notifications",
  "badges",
  "daily-digest",
  "mentor-reminders",
] as const;
export type QueueName = (typeof QUEUE_NAMES)[number];

// Retry transient failures (provider 5xx, network blip) with exponential
// backoff instead of losing the job, then clean up so Redis doesn't grow.
// attempts/backoff are env-tunable for ops + tests (defaults 5 / 1000ms).
const DEFAULT_JOB_OPTS: JobsOptions = {
  attempts: Number(process.env.QUEUE_ATTEMPTS ?? 5),
  backoff: {
    type: "exponential",
    delay: Number(process.env.QUEUE_BACKOFF_MS ?? 1000),
  },
  removeOnComplete: { count: 200, age: 3600 },
  removeOnFail: { count: 1000, age: 24 * 3600 },
};

let queues: Record<QueueName, Queue> | null = null;
let sampler: ReturnType<typeof setInterval> | null = null;

/** True once the producers exist (Redis present). Callers fall back inline otherwise. */
export function queuesEnabled(): boolean {
  return queues !== null;
}

export function getQueue(name: QueueName): Queue | null {
  return queues?.[name] ?? null;
}

/**
 * Create the queue producers on the shared Redis connection. No-op (queues stay
 * disabled → callers process inline) when Redis is unavailable. Call once at
 * boot, after initRedis()/initRateLimitStore().
 */
export function initQueues(): void {
  if (queues) return;
  const connection = bullConnection();
  if (!connection) {
    logger.info("[queues] Redis unavailable — jobs run inline (no queue)");
    return;
  }
  // ioredis instance ↔ BullMQ's ConnectionOptions is a nominal-only mismatch
  // (both are ioredis 5.x); safe to cast.
  const conn = connection as unknown as ConnectionOptions;
  const built = {} as Record<QueueName, Queue>;
  for (const name of QUEUE_NAMES) {
    built[name] = new Queue(name, {
      connection: conn,
      defaultJobOptions: DEFAULT_JOB_OPTS,
    });
  }
  queues = built;
  logger.info({ queues: QUEUE_NAMES }, "[queues] producers ready");
  startDepthSampler();
}

// Sample queue depth into the queue_depth / queue_failed gauges every 15s so
// /metrics reflects backlog without a per-request Redis call.
function startDepthSampler(): void {
  if (sampler || !queues) return;
  const sample = async (): Promise<void> => {
    if (!queues) return;
    for (const name of QUEUE_NAMES) {
      try {
        const c = await queues[name].getJobCounts(
          "waiting",
          "active",
          "delayed",
          "failed",
        );
        setGauge(
          "queue_depth",
          { queue: name },
          (c.waiting ?? 0) + (c.active ?? 0) + (c.delayed ?? 0),
        );
        setGauge("queue_failed", { queue: name }, c.failed ?? 0);
      } catch {
        /* best-effort */
      }
    }
  };
  void sample();
  sampler = setInterval(() => void sample(), 15_000);
  sampler.unref();
}

/** Graceful shutdown helper (tests / SIGTERM). */
export async function closeQueues(): Promise<void> {
  if (sampler) {
    clearInterval(sampler);
    sampler = null;
  }
  if (!queues) return;
  const qs = Object.values(queues);
  queues = null;
  await Promise.all(qs.map((q) => q.close().catch(() => undefined)));
}
