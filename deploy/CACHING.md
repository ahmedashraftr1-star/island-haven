# Caching strategy

Island Haven caches in **tiers**, cheapest/closest to the user first. Each tier is
optional and degrades safely — with nothing configured the app still serves correct
(just less cached) responses.

```
Browser  ──►  CDN  ──►  App (Redis)  ──►  Postgres (indexed)
 Tier 1      Tier 2       Tier 3            Tier 4
```

## Tier 1 — Browser `Cache-Control` (shipped)
`app.ts` sets `Cache-Control: public, max-age=${PUBLIC_CACHE_MAX_AGE}, stale-while-revalidate=300`
on **anonymous** GETs to a fixed allowlist of public routes (`PUBLIC_CACHE_RE`:
`content, numbers, stats, gallery, partners, team, programs, cohorts, resources, jobs,
investors, opportunities, perks, stories, daily, ventures, courses, experts, members,
search`). It is applied only when the request has **no** session — not `/me/…`, not
`/admin/…`, no `Authorization` header, no `ih_user` / `ih_admin` cookie. Default
`PUBLIC_CACHE_MAX_AGE=60`.

Never widen this to personalized responses.

## Tier 2 — CDN (owner decision)
Because Tier 1 already emits correct `Cache-Control` for anonymous public GETs, a CDN
(Cloudflare / Fastly / CloudFront) in front of the API can cache those responses with
**zero code changes**. Requirements:
- Honor `Cache-Control` / `Vary`; do **not** cache when `Authorization` or the
  `ih_user` / `ih_admin` cookies are present (they signal a personalized response).
- Respect `stale-while-revalidate`.

## Tier 3 — App Redis cache (shipped — `lib/cache.ts`)
`cached(key, ttlSec, compute)` is a get-or-compute over the **shared** Redis connection
(`lib/redis.ts`). `bust(key | "prefix*")` drops entries.

- **Redis present** → the entry is shared across **every** instance and a `bust` from
  any instance clears it everywhere. Metrics: `cache_events_total{cache,result}` on
  `/metrics` (result ∈ `hit|miss`).
- **Redis absent** → a per-process map with the same TTL (identical to the old
  in-memory micro-caches — single-instance behavior unchanged, no regression).

Only the **anonymous public projection** is cached — never per-viewer fields. Align a
key's TTL with the route's `Cache-Control` max-age.

Currently cached:

| Key        | TTL  | Busted by                         | Notes |
|------------|------|-----------------------------------|-------|
| `numbers`  | 30s  | `invalidateNumbersCache()` (→`bust`) called from admin/works/auth/etc. mutations | homepage "بالأرقام" aggregate |
| `stats`    | 5s   | `invalidateStatsCache()` (→`bust`) | homepage counters |
| `partners` | 60s  | TTL only (matches `Cache-Control`) | public partners list |
| `experts`  | 60s  | TTL only (matches `Cache-Control`) | public mentor directory |

To cache another **anonymous, session-independent** read: wrap the DB work in
`cached("<key>", <ttl>, async () => {...})`, and if it mutates often, call
`bust("<key>")` from the write paths (else the TTL bounds staleness).

## Tier 4 — Indexed Postgres (shipped — Phase 1)
Hot filtered/aggregate queries are backed by evidence-driven indexes (see the
`perf(db)` commit): partial `users(role) WHERE status='active'`,
`bookings(visit_date,time_slot)`, `session_ratings(expert_id,rating)`. This is the
floor — even on a full cache miss the DB answer is fast.

## Operational notes
- `REDIS_URL` unset ⇒ Tiers 3 falls back to per-process; safe for a **single** instance
  only. Multi-instance requires Redis so busts and counts are shared.
- Watch `cache_events_total` hit-ratio and `redis_up` on `/metrics`.
