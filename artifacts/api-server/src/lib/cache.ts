import { getRedis } from "./redis";
import { cacheEvents } from "./metrics";

// Get-or-compute response cache over the shared Redis connection (see ./redis).
//
// - Redis present  → the entry is SHARED across every instance and can be busted
//   globally, so a mutation on any instance clears the cache for all.
// - Redis absent   → degrades to a per-process map with the same TTL, identical
//   to the in-memory micro-caches this replaces, so single-instance / local-dev
//   behaviour is unchanged (no regression).
//
// Only cache anonymous, non-personalised public read models (JSON-serialisable).
// Never wrap a response that varies by viewer — callers must gate on "no session".

const PREFIX = "cache:";
const redisKey = (key: string): string => PREFIX + key;

// Metric label = the namespace before the first ':' (bounds label cardinality):
// "numbers" → "numbers", "experts:list" → "experts".
function label(key: string): string {
  const i = key.indexOf(":");
  return i === -1 ? key : key.slice(0, i);
}

interface MemEntry {
  json: string;
  exp: number; // epoch ms
}
const mem = new Map<string, MemEntry>();

/**
 * Return the cached value for `key`, or compute + store it (TTL in seconds).
 * `key` is a logical name ("numbers", "experts:list"); the "*"-suffix form is
 * only for bust(). Cache read/write failures never break the request — they
 * fall through to compute().
 */
export async function cached<T>(
  key: string,
  ttlSec: number,
  compute: () => Promise<T>,
): Promise<T> {
  const lbl = label(key);
  const client = getRedis();

  if (client) {
    const rk = redisKey(key);
    try {
      const hit = await client.get(rk);
      if (hit !== null) {
        cacheEvents.inc({ cache: lbl, result: "hit" });
        return JSON.parse(hit) as T;
      }
    } catch {
      /* redis read failed — recompute below */
    }
    cacheEvents.inc({ cache: lbl, result: "miss" });
    const value = await compute();
    try {
      await client.set(rk, JSON.stringify(value), "EX", ttlSec);
    } catch {
      /* best-effort write */
    }
    return value;
  }

  // No Redis → per-process fallback (matches the old micro-caches).
  const rk = redisKey(key);
  const now = Date.now();
  const e = mem.get(rk);
  if (e && e.exp > now) {
    cacheEvents.inc({ cache: lbl, result: "hit" });
    return JSON.parse(e.json) as T;
  }
  cacheEvents.inc({ cache: lbl, result: "miss" });
  const value = await compute();
  mem.set(rk, { json: JSON.stringify(value), exp: now + ttlSec * 1000 });
  return value;
}

/**
 * Drop a cached entry (or a `prefix*` family) so the next read recomputes.
 * Exact key: bust("numbers"). Prefix: bust("experts*"). Best-effort — safe to
 * fire-and-forget. Clears both the per-process map and Redis.
 */
export async function bust(key: string): Promise<void> {
  const rk = redisKey(key);
  if (key.endsWith("*")) {
    const pfx = rk.slice(0, -1);
    for (const k of mem.keys()) if (k.startsWith(pfx)) mem.delete(k);
  } else {
    mem.delete(rk);
  }

  const client = getRedis();
  if (!client) return;
  try {
    if (key.endsWith("*")) {
      // Non-blocking SCAN + DEL (never KEYS in a hot path).
      let cursor = "0";
      do {
        const [next, keys] = await client.scan(
          cursor,
          "MATCH",
          rk,
          "COUNT",
          100,
        );
        cursor = next;
        if (keys.length) await client.del(...keys);
      } while (cursor !== "0");
    } else {
      await client.del(rk);
    }
  } catch {
    /* best-effort */
  }
}
