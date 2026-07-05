-- Postgres production tuning + the Phase-1 indexes applied the SAFE way
-- (CONCURRENTLY = no table lock). Adjust the memory values to the actual box:
-- the numbers below assume ~4 GB RAM dedicated to Postgres. Use a calculator
-- like pgtune for your exact hardware.

-- ── Memory / planner (ALTER SYSTEM persists to postgresql.auto.conf) ──
-- shared_buffers  ≈ 25% of RAM
ALTER SYSTEM SET shared_buffers = '1GB';
-- effective_cache_size ≈ 50–75% of RAM (planner hint, not an allocation)
ALTER SYSTEM SET effective_cache_size = '3GB';
-- work_mem is PER sort/hash node — keep modest with many connections
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
-- SSD: random access is cheap; encourage index scans
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
-- Match to the CPU cores you want parallel queries to use
ALTER SYSTEM SET max_parallel_workers_per_gather = 2;

-- ── Connections ──
-- With PgBouncer in transaction mode you need FAR fewer real connections.
-- Rule of thumb: a couple hundred is plenty behind a pooler.
ALTER SYSTEM SET max_connections = 200;

-- Apply the reloadable ones now; shared_buffers/max_connections need a restart.
SELECT pg_reload_conf();

-- ── Indexes (idempotent + lock-free) ──
-- These match the drizzle schema. CONCURRENTLY cannot run inside a txn block —
-- run this file with psql (autocommit), not inside BEGIN/COMMIT.
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_active_role_idx
  ON users (role) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_visit_slot_idx
  ON bookings (visit_date, time_slot);
CREATE INDEX CONCURRENTLY IF NOT EXISTS session_ratings_expert_rating_idx
  ON session_ratings (expert_id, rating);
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_log_created_idx
  ON audit_log (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_log_target_idx
  ON audit_log (target_type, target_id);

-- Keep stats fresh so the planner actually chooses the indexes.
ANALYZE users;
ANALYZE bookings;
ANALYZE session_ratings;

-- Verify an index is USED, not just present (should show Index/Index Only Scan):
--   EXPLAIN (ANALYZE, BUFFERS) SELECT count(*) FROM users WHERE status='active';
--   EXPLAIN (ANALYZE, BUFFERS)
--     SELECT round(avg(rating),1), count(*) FROM session_ratings WHERE expert_id = 1;
