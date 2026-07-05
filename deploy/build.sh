#!/usr/bin/env bash
# Production build for Island Haven: install → lib declarations → api-server →
# frontend. Run from anywhere; resolves the repo root itself.
#   deploy/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▸ 1/4 install dependencies (frozen lockfile)"
pnpm install --frozen-lockfile

echo "▸ 2/4 build workspace type declarations"
pnpm run typecheck:libs

echo "▸ 3/4 build api-server  → artifacts/api-server/dist"
pnpm -C artifacts/api-server build

echo "▸ 4/4 build frontend    → artifacts/ih-haven/dist/public"
pnpm -C artifacts/ih-haven build

echo ""
echo "✓ Build complete."
echo "  api:      artifacts/api-server/dist/index.mjs   (also serves the SPA in prod)"
echo "  worker:   artifacts/api-server/dist/worker.mjs  (run only if REDIS_URL is set)"
echo "  frontend: artifacts/ih-haven/dist/public"
echo ""
echo "Start (single process serves API + site):"
echo "  NODE_ENV=production node --env-file=artifacts/api-server/.env artifacts/api-server/dist/index.mjs"
