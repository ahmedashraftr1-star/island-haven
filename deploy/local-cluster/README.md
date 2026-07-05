# Local multi-instance cluster (no Docker)

Reproduces the production topology on one machine so you can **prove** the
scalability guarantees without provisioning anything. Same shape as
docker-compose.yml, but plain Node processes + a tiny failover LB — handy when
the Docker daemon isn't running.

```
  ┌── LB :3040 (lb.mjs, round-robin + failover) ──┐
  │                                               │
  api :3041 (producer)              api :3042 (producer)
  │                                               │
  └──────────── Redis + Postgres ─────────────────┘
                     │
              worker (consumer)
```

## Run
```bash
pnpm -C artifacts/api-server build         # once
REDIS_URL=redis://localhost:6379 deploy/local-cluster/run.sh
```

## What it proves (the same checks verified in this repo's history)

| Guarantee | How to check |
|-----------|--------------|
| **Shared cache** across instances | `redis-cli DEL cache:numbers`; `curl :3041/api/numbers`; `curl :3042/api/numbers` → instance 2 records a cache **hit** (read instance 1's value from Redis, no recompute). |
| **Digest fires once** (no dup emails) | both instances register the repeatable job, yet `redis-cli ZCARD bull:daily-digest:repeat` = **1**. |
| **Jobs offloaded to the worker** | trigger an email (`POST /api/auth/forgot-password` for a real user) on an api instance (a pure producer) → the **separate worker** process logs the send; the api instances have no worker thread. |
| **Zero-downtime rolling restart** | run load at the LB (`while true; do curl -s localhost:3040/api/healthz; done`), `kill -TERM` one api → the LB fails over to the other → **0 failed requests**; restart it and it rejoins. |

## Notes
- Requires a running Redis and a reachable Postgres (`DATABASE_URL` in
  `artifacts/api-server/.env`).
- Without `REDIS_URL` the app is single-instance (in-memory cache, inline jobs) —
  do **not** run two instances that way (the setInterval digest would duplicate).
- This is a **proof/dev** harness. For staging/prod use docker-compose.yml (adds
  Nginx edge cache + PgBouncer) — see SCALING.md.
