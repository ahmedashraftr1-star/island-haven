import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// During dev/preview the workspace runner injects PORT and BASE_PATH per
// artifact. During a standalone production build (and most deploy targets),
// neither is needed — fall back to safe defaults so `vite build` works.
const rawPort = process.env.PORT ?? "5000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Split rarely-changing vendor libs into their own long-cached chunks
        // (separate from app code, which redeploys often). A function form is
        // used so we can also peel heavy, admin-only libraries (recharts/d3)
        // and the shared icon set out of the big admin chunk, and group the
        // ~30 admin pages together instead of inlining them into one 670KB
        // module via AdminDashboard's static imports.
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Order matters: most-specific vendor buckets first.
            if (
              /[\\/]node_modules[\\/](react|react-dom|scheduler|wouter)[\\/]/.test(
                id,
              )
            ) {
              return "react-vendor";
            }
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("@tanstack")) return "query";
            // Tiny class-name utils shared by app, admin AND recharts. Giving
            // them their own vendor chunk keeps clsx out of the `admin` chunk,
            // which would otherwise create a charts -> admin -> charts cycle
            // (recharts imports clsx). Long-cached, ~1KB.
            if (
              /[\\/]node_modules[\\/](clsx|tailwind-merge|class-variance-authority)[\\/]/.test(
                id,
              )
            ) {
              return "utils";
            }
            // recharts (admin-only, ~380KB) plus its EXCLUSIVE deps — d3-*,
            // victory-vendor, react-smooth, recharts-scale, internmap,
            // eventemitter3, tiny-invariant. Keeping the whole recharts subtree
            // in one chunk avoids a charts<->admin circular split. Shared libs
            // (react, react-dom, react-is, clsx, lodash) are intentionally NOT
            // listed here so they stay in their own/natural chunks.
            if (
              /[\\/]node_modules[\\/](recharts|recharts-scale|react-smooth|victory-vendor|d3-[a-z]+|internmap|eventemitter3|tiny-invariant|fast-equals|decimal\.js|lodash)[\\/]/.test(
                id,
              )
            ) {
              return "charts";
            }
            // lucide is imported by ~120 files; its own long-cached chunk
            // keeps it out of every page/admin chunk.
            if (id.includes("lucide-react")) return "icons";
            return undefined;
          }
          // Admin pages are left to their natural React.lazy(AdminDashboard)
          // boundary. A manual `admin` group here became a shared-module sink:
          // modules imported by BOTH the eager public tree and admin got pulled
          // into it, forcing the public entry to static-import admin (and its
          // transitive charts dep) and modulepreload ~390KB of admin-only JS on
          // every public page. Dropping the group cuts eager critical-path JS
          // ~49% (measured) with admin/charts now loading only under /admin.
          return undefined;
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    // On Replit the workspace runner routes /api to the backend for us. For
    // local dev (no REPL_ID) proxy /api to the api-server so the SPA's
    // same-origin `/api` fetches reach it. Target is overridable via env.
    ...(process.env.REPL_ID === undefined
      ? {
          proxy: {
            "/api": {
              target:
                process.env.API_PROXY_TARGET ?? "http://localhost:3001",
              changeOrigin: true,
            },
          },
        }
      : {}),
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
