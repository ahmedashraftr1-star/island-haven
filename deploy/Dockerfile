# Multi-stage image for the api-server AND its worker (same bundle, different
# entrypoint). Build context = repo ROOT so the @workspace/db workspace dep is
# available:
#     docker build -f deploy/Dockerfile -t islandhaven-api .
#
# Run the api:      docker run … islandhaven-api
# Run the worker:   docker run … islandhaven-api node --enable-source-maps dist/worker.mjs
#
# esbuild bundles the app (bundle:true) so the runtime is mostly self-contained;
# we still ship node_modules for the externalized/native deps (see build.mjs).

FROM node:22-slim AS builder
RUN corepack enable
WORKDIR /repo
# Copy the whole workspace (a .dockerignore keeps node_modules/dist/.git out).
COPY . .
RUN pnpm install --frozen-lockfile \
 && pnpm -C artifacts/api-server build

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /repo/artifacts/api-server
# Copy the built repo (preserves the pnpm node_modules layout for externals).
COPY --from=builder /repo /repo
# Drop root.
USER node
EXPOSE 3001
# Default = the api server; override the command for the worker.
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
