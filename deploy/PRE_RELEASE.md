# Pre-release checklist

Run through this before every production deploy. It ties together the five
scalability axes (indexes, cache, queues, authz, load testing). Each item has a
concrete check — don't tick it from memory.

## 1. Database — indexes applied + used
- [ ] Schema pushed / indexes created (`CREATE INDEX CONCURRENTLY` in prod):
      `users_active_role_idx`, `bookings_visit_slot_idx`,
      `session_ratings_expert_rating_idx` (+ the pre-existing `*_idx`).
- [ ] Spot-check they're **used**, not just present: on prod-sized data,
      `EXPLAIN (ANALYZE, BUFFERS)` of the numbers.ts count query and the experts
      list shows **Index Scan / Index Only Scan**, not Seq Scan.
- [ ] `audit_log` table exists (`\d audit_log`).
- [ ] Connection ceiling holds: `N_api × DB_POOL_MAX + worker_pool` < the
      Postgres/PgBouncer `max_connections`.

## 2. Cache — Redis up, hit-rate sane
- [ ] `REDIS_URL` set; `/metrics` shows `redis_up 1`.
- [ ] After warm-up, `cache_events_total{result="hit"}` climbs and the hit-rate
      on `numbers`/`stats`/`partners`/`experts` is high (> ~0.8 under steady load).
- [ ] Personalized responses are NOT cached (only anon public projections;
      `PUBLIC_CACHE_RE` gate holds).

## 3. Queues — worker running, backlog flat
- [ ] A dedicated worker is running (`pnpm worker` / `dist/worker.mjs`), OR a
      single instance has `RUN_WORKER_IN_PROCESS=1`. **Never** run >1 in-process
      digest without the queue (duplicate emails).
- [ ] `/metrics`: `queue_depth{*}` ~0 at rest, `queue_jobs_total{status="failed"}`
      flat (not climbing).
- [ ] `ENABLE_DAILY_DIGEST_CRON=1` on the producer side → exactly ONE entry in
      `bull:daily-digest:repeat` (ZCARD 1) regardless of instance count.
- [ ] Email provider configured (`RESEND_API_KEY`, `EMAIL_FROM`); a real send
      succeeds (a failed one retries then lands in the failed set).

## 4. Authorization / security
- [ ] `SESSION_SECRET` set (≥32 chars, DIFFERS from `ADMIN_PASSWORD`); boot
      refuses to start otherwise.
- [ ] Per-user limits active: message spam → 429 after 30/min; session requests
      → 429 after 10/hr.
- [ ] Audit trail works: a test admin status change appears in `GET /admin/audit`.
- [ ] Security headers present (see SECURITY-HEADERS.md); helmet + CORS locked.

## 5. Load testing (before the gate opens)
- [ ] `k6 run loadtest/smoke.js` passes (all thresholds green).
- [ ] `k6 run loadtest/load.js` passes against an instance with raised
      `RATE_LIMIT_GENERAL_MAX` + Redis; record p95/p99 per endpoint.
- [ ] `k6 run loadtest/stress-spike.js` survives (0 × 5xx; 429s are expected).
- [ ] **Real concurrency** (10k+): out of scope for one box — run distributed
      (k6 Cloud) against prod-like infra before a hard launch.

## 6. Backups / recovery
- [ ] `scripts/backup-db.sh` scheduled; `scripts/restore-verify.sh` passed
      recently (row counts match). See BACKUPS.md.

## Rollback
- Indexes/tables are additive (safe to leave). Redis/queues/cache degrade to
  inline/in-memory if `REDIS_URL` is removed — so disabling Redis is a valid
  fast rollback of the cache+queue tiers (single-instance only afterwards).
