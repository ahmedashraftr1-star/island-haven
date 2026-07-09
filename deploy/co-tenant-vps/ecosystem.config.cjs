// PM2 config for Island Haven — runs UNDER the dedicated `islandhaven` user, so
// it has its own PM2 daemon/dump/startup, fully separate from NasToNas's PM2.
// Mirrors the proven working command:
//   NODE_ENV=production SERVE_STATIC=1 PORT=3020 node --env-file=.env dist/index.mjs
// (cwd = api-server so `.env`, `dist/index.mjs`, and `../ih-haven/dist/public` all resolve).
module.exports = {
  apps: [
    {
      name: "island-haven",
      cwd: "/var/www/island-haven/app/artifacts/api-server",
      script: "dist/index.mjs",
      interpreter: "node",
      // Node 20.6+ loads the env file itself (same as the verified :3020 build).
      node_args: "--env-file=.env",
      exec_mode: "fork",
      instances: 1,

      // Hard ceiling so Island Haven can NEVER starve NasToNas of memory.
      max_memory_restart: "400M",

      // Resilient, but not a crash-loop.
      autorestart: true,
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 3000,
      // Let the app's graceful shutdown (10s SIGTERM drain) finish before SIGKILL.
      kill_timeout: 12000,

      // Env mirrors .env (both agree); .env remains the single source of secrets.
      env: {
        NODE_ENV: "production",
        SERVE_STATIC: "1",
        PORT: "3020",
      },

      out_file: "/var/www/island-haven/logs/out.log",
      error_file: "/var/www/island-haven/logs/err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
