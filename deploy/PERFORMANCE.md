# Performance & load-testing playbook

Extends PRE_RELEASE.md §5. The local k6 scenarios (`loadtest/{smoke,load,stress-spike}.js`)
prove correctness + relative gains on one box; **real** 10k/100k concurrency
needs distributed generation against prod-like infra.

## Local (one box) — what it proves
```bash
# raise the general limiter so app throughput (not the limiter) is measured
RATE_LIMIT_GENERAL_MAX=1000000 pnpm start &   # or the docker stack
k6 run loadtest/smoke.js
BASE=http://127.0.0.1:8080 k6 run loadtest/load.js      # via the Nginx LB
k6 run loadtest/stress-spike.js
```
Baseline captured this session (30 VUs, 55s, Redis + worker):
**all thresholds pass, 0.00% errors, ~3,535 req/s**, cached endpoints p95 7–10ms,
cache hit-rate ~99.9%. Use it as the regression floor.

## Distributed (staging) — for a real launch number
A single machine can't generate 10k+ real concurrency (it saturates its own CPU
before the server does). Options:

1. **k6 Cloud** — `k6 cloud loadtest/load.js` (set `K6_CLOUD_TOKEN`). Ramps from
   many load zones; gives global p95/p99 + saturation curves.
2. **Self-hosted distributed** — k6 operator on Kubernetes, or N generator VMs
   each running a slice of the VU count against the staging LB.

Point `BASE` at **staging**, not prod, and pre-seed a realistic dataset (the
48-row dev DB won't exercise the indexes — see the note below).

### Scale the target dataset first
The Phase-1 index wins only appear on realistic row counts. Seed staging to
prod-like volume (e.g. 100k+ users/works/bookings), then confirm with
`EXPLAIN (ANALYZE, BUFFERS)` that the hot queries use Index / Index-Only Scans
(the scaled-table proof from the perf commits).

## What to record (fill per run → attach to the release)

| Endpoint | VUs | p50 | p95 | p99 | RPS | error% | notes |
|----------|-----|-----|-----|-----|-----|--------|-------|
| /api/numbers  |  |  |  |  |  |  | cached |
| /api/experts  |  |  |  |  |  |  | cached |
| /api/programs |  |  |  |  |  |  | uncached |
| /api/book (POST) |  |  |  |  |  |  | write + capacity check |
| /api/auth/login  |  |  |  |  |  |  | rate-limited (429s expected) |

Also capture: `redis_up`, cache hit-rate, `queue_depth`/`queue_jobs_total`,
Postgres active connections, CPU/mem of each api + worker + PgBouncer.

## Finding the saturation point
Ramp VUs until p99 crosses your SLO (e.g. 500ms) or error% > 1%. That VU count
÷ (req/user/s) ≈ sustainable RPS per instance → divide your target load by it to
size the number of api instances. Re-run after adding instances to confirm it
scales ~linearly (it should, since the app is stateless behind Redis).
