#!/usr/bin/env bash
# Spin up the multi-instance topology locally WITHOUT Docker, to prove it end to
# end: 2× api (producers) + 1 worker (consumer) + a failover LB, all on the local
# Redis + Postgres. Ctrl-C tears everything down.
#
#   REDIS_URL=redis://localhost:6379 ./run.sh
#
# Requires: a running Redis, a reachable Postgres (DATABASE_URL in api-server/.env
# or the environment), and a built dist (`pnpm -C artifacts/api-server build`).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
API="$HERE/../../artifacts/api-server"
: "${REDIS_URL:=redis://localhost:6379}"
: "${RATE_LIMIT_GENERAL_MAX:=1000000}"

command -v redis-cli >/dev/null && redis-cli ping >/dev/null || {
  echo "Redis not reachable at $REDIS_URL"; exit 1; }
[ -f "$API/dist/index.mjs" ] || { echo "build first: pnpm -C artifacts/api-server build"; exit 1; }

pids=()
cleanup() { echo; echo "tearing down…"; kill "${pids[@]}" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

cd "$API"
echo "worker (consumer)…"
REDIS_URL="$REDIS_URL" node --env-file=.env --enable-source-maps ./dist/worker.mjs & pids+=($!)

for port in 3041 3042; do
  echo "api instance :$port (producer)…"
  REDIS_URL="$REDIS_URL" ENABLE_DAILY_DIGEST_CRON=1 \
    RATE_LIMIT_GENERAL_MAX="$RATE_LIMIT_GENERAL_MAX" PORT="$port" \
    node --env-file=.env --enable-source-maps ./dist/index.mjs & pids+=($!)
done

echo "load balancer :3040 -> 3041,3042…"
BACKENDS="3041,3042" LB_PORT=3040 node "$HERE/lb.mjs" & pids+=($!)

echo
echo "up — try:  curl -s localhost:3040/api/healthz"
echo "     digest singleton:  redis-cli ZCARD bull:daily-digest:repeat   (=> 1)"
echo "     rolling restart:   kill -TERM <one api pid>  (LB fails over, 0 downtime)"
echo "Ctrl-C to stop."
wait
