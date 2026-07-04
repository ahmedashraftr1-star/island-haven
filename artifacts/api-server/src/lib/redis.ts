import Redis from "ioredis";
import { logger } from "./logger";

// One shared ioredis connection for the whole process. The rate-limit store, the
// response cache (Phase 2), and BullMQ (Phase 3, via a dedicated duplicate) all
// reuse it, so a horizontally-scaled deployment opens ONE base Redis connection
// per instance instead of one per subsystem.
//
// Graceful degradation: when REDIS_URL is unset OR Redis is unreachable at boot,
// getRedis() returns null and every subsystem falls back to its in-memory/inline
// path — correct for local dev and single-instance deployments.

let client: Redis | null = null;
let ready = false;

/** Whether the shared Redis connection is live (drives the /metrics redis_up gauge). */
export function isRedisReady(): boolean {
  return ready;
}

/** The shared client when Redis is live, else null. Callers MUST handle null. */
export function getRedis(): Redis | null {
  return ready ? client : null;
}

/**
 * Probe Redis once at startup. Must run BEFORE the app assembles anything that
 * binds a Redis-backed store at creation time (express-rate-limit; see index.ts).
 * Idempotent: a second call while already connected is a no-op.
 */
export async function initRedis(): Promise<void> {
  if (ready) return;
  const url = process.env.REDIS_URL;
  if (!url) {
    logger.info(
      "[redis] REDIS_URL not set — in-memory/inline fallbacks active (single-instance only)",
    );
    return;
  }
  const c = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: true,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });
  try {
    await c.connect();
    await c.ping();
    client = c;
    ready = true;
    c.on("error", (err) =>
      logger.error({ err }, "[redis] connection error (subsystems continue)"),
    );
    logger.info("[redis] shared connection active (multi-instance safe)");
  } catch (err) {
    logger.warn(
      { err },
      "[redis] REDIS_URL set but Redis unreachable — using in-memory/inline fallbacks",
    );
    try {
      c.disconnect();
    } catch {
      /* noop */
    }
  }
}

/**
 * A DEDICATED connection for BullMQ. BullMQ requires `maxRetriesPerRequest: null`
 * on its connection (its blocking commands must never give up mid-wait), which
 * differs from the shared client's `2`. We duplicate the shared client with that
 * one override so BullMQ gets its own connection while reusing the same URL/config.
 * Returns null when Redis is unavailable (caller then processes jobs inline).
 */
export function bullConnection(): Redis | null {
  if (!ready || !client) return null;
  return client.duplicate({ maxRetriesPerRequest: null });
}
