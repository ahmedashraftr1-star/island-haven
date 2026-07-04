import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";
import type { Store } from "express-rate-limit";
import { logger } from "./logger";

// Shared rate-limit store. When several api-server instances run behind a load
// balancer, an in-memory limiter counts per-process — so the effective global
// limit becomes N × the configured max. Backing express-rate-limit with Redis
// makes the counter shared across every instance.
//
// Fallback: if REDIS_URL is unset OR Redis is unreachable at boot, we fall back
// to the default in-memory store (correct for local dev / single instance).

let redisClient: Redis | null = null;
let redisReady = false;

/**
 * Probe Redis once at startup. Must run BEFORE the app assembles its limiters
 * (see index.ts), because express-rate-limit binds its store at creation time.
 */
export async function initRateLimitStore(): Promise<void> {
  const url = process.env.REDIS_URL;
  if (!url) {
    logger.info(
      "[rate-limit] REDIS_URL not set — using in-memory store (per-process; single-instance only)",
    );
    return;
  }
  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: true,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });
  try {
    await client.connect();
    await client.ping();
    redisClient = client;
    redisReady = true;
    client.on("error", (err) =>
      logger.error({ err }, "[rate-limit] redis error (limiter continues)"),
    );
    logger.info("[rate-limit] shared Redis store active (multi-instance safe)");
  } catch (err) {
    logger.warn(
      { err },
      "[rate-limit] REDIS_URL set but Redis unreachable — falling back to in-memory",
    );
    try {
      client.disconnect();
    } catch {
      /* noop */
    }
  }
}

/**
 * Returns a shared Redis-backed store when Redis is ready, otherwise `undefined`
 * so express-rate-limit uses its built-in in-memory MemoryStore.
 */
export function rateLimitStore(prefix: string): Store | undefined {
  if (!redisReady || !redisClient) return undefined;
  const client = redisClient;
  return new RedisStore({
    prefix,
    // ioredis: call(command, ...args)
    sendCommand: (...args: string[]) =>
      client.call(args[0]!, ...args.slice(1)) as Promise<never>,
  });
}
