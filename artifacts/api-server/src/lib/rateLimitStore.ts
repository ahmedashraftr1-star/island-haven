import { RedisStore } from "rate-limit-redis";
import type { Store } from "express-rate-limit";
import { getRedis, initRedis, isRedisReady } from "./redis";

// Shared rate-limit store. When several api-server instances run behind a load
// balancer, an in-memory limiter counts per-process — so the effective global
// limit becomes N × the configured max. Backing express-rate-limit with the
// shared Redis connection (see ./redis) makes the counter shared across every
// instance. Falls back to the default in-memory store when Redis is unavailable.
//
// The Redis client itself now lives in ./redis (one connection shared by the
// rate limiter, the response cache, and BullMQ). This module keeps its original
// public API — initRateLimitStore / rateLimitStore / isRedisReady — unchanged.

// Re-export so existing importers (metrics.ts) keep working without edits.
export { isRedisReady };

/** Back-compat init used by index.ts — delegates to the shared Redis boot probe. */
export async function initRateLimitStore(): Promise<void> {
  await initRedis();
}

/**
 * Returns a shared Redis-backed store when Redis is ready, otherwise `undefined`
 * so express-rate-limit uses its built-in in-memory MemoryStore.
 */
export function rateLimitStore(prefix: string): Store | undefined {
  const client = getRedis();
  if (!client) return undefined;
  return new RedisStore({
    prefix,
    // ioredis: call(command, ...args)
    sendCommand: (...args: string[]) =>
      client.call(args[0]!, ...args.slice(1)) as Promise<never>,
  });
}
