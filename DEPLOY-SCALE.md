# Scaling Island Haven (toward ~1M requests/min)

1M req/min ≈ **16,700 req/sec**. A single Node+Postgres process cannot do this.
The app is **stateless** (cookie token, no server session store) so it scales
horizontally well. This guide lists what's already in place and what's needed.

## Already in code (this build)
- **Anonymous public reads are edge-cacheable.** `app.ts` sets
  `Cache-Control: public, max-age=60, stale-while-revalidate=300` on GETs to
  public list endpoints (content, numbers, stats, gallery, partners, team,
  programs, cohorts, resources, jobs, investors, opportunities, perks, stories,
  daily, ventures, courses, experts, members, search) **only when no session
  cookie is present** — so personalized/admin responses are never cached.
  Put a CDN (Cloudflare / Fastly / CloudFront) in front and the bulk of a viral
  read spike is served from the edge, never touching Node or Postgres.
- **Tunable DB pool** (`lib/db`): `DB_POOL_MAX` (default 20), idle/conn timeouts.
- **Tunable rate limits**: `RATE_LIMIT_GENERAL_MAX` (300/min), `RATE_LIMIT_AUTH_MAX`
  (20/15min), `RATE_LIMIT_GENERAL_WINDOW_MS`.
- **Cacheable public window**: `PUBLIC_CACHE_MAX_AGE` (seconds).

## Required to actually hit ~1M/min
1. **CDN in front of everything.** Cache the web SPA (`dist/public`) and the
   public API GETs at the edge. This alone offloads the majority of traffic.
2. **Horizontal API scaling.** Run many stateless API instances behind a load
   balancer / autoscaler (Fly.io, Render, ECS, k8s). No sticky sessions needed.
   Optionally `cluster`/PM2 to use all cores per box.
3. **Postgres for scale.** Managed Postgres + **PgBouncer** (transaction pooling)
   so N×`DB_POOL_MAX` stays under the server limit; add **read replicas** and
   route read-heavy public queries to them.
4. **Redis.** (a) Shared rate-limit store (`rate-limit-redis`) so limits are
   global across instances; (b) cache hot read queries (numbers/stats/content/
   experts) with short TTL to shield Postgres.
5. **Object storage + CDN** for images/CVs (already using object storage —
   front it with a CDN).
6. **Raise/redesign rate limits** for production traffic shapes; keep auth strict.
7. **Load test** with k6 / Artillery; watch p99 latency, pool saturation, event-loop lag.
8. **Observability**: structured logs (pino — present) → aggregator; add metrics
   (RPS, latency, DB pool in-use) and alerts.

## Rough capacity
- Now (1 instance, pool=20, no CDN/Redis): low **thousands/min** sustained.
- + CDN on public reads: **most anonymous read traffic → edge** (the 1M/min case
  for browsing is largely solved here).
- + horizontal API + PgBouncer + replicas + Redis: writes/authenticated traffic
  scale to the target.
