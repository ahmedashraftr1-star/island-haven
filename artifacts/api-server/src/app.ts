import path from "node:path";
import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { rateLimit } from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";
import { rateLimitStore } from "./lib/rateLimitStore";
import {
  metricsMiddleware,
  metricsHandler,
  rateLimitEvents,
} from "./lib/metrics";

const app: Express = express();

// We are deployed behind Replit's reverse proxy. Trust exactly ONE hop so
// that req.ip uses the immediate proxy's X-Forwarded-For value rather than
// any client-supplied chain. This is the foundation for trustworthy rate
// limiting on the public booking endpoint.
app.set("trust proxy", 1);

// Baseline security headers. This is a JSON API behind the Replit proxy, which
// also proxies object/image bytes, so we disable the default CSP (no HTML is
// served here) and set Cross-Origin-Resource-Policy to "cross-origin" so those
// images can still be embedded from the front-end origins.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Permissions-Policy — helmet no longer sets this. Lock down powerful browser
// features the app never uses, as defense-in-depth on any response that ends up
// in a browsing context.
app.use((_req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  next();
});

// ─── Metrics ──────────────────────────────────────────────────────────────────
// Record count + latency for every request, and expose Prometheus text at
// /metrics. Mounted before rate limiting so the scrape itself is never limited.
// NOTE: /metrics is UNAUTHENTICATED — it must NOT be reachable from the public
// internet. Restrict it at the reverse proxy (IP allowlist to the Prometheus
// scraper, or basic auth). That is a deployment/infra decision — not done here.
app.use(metricsMiddleware);
app.get("/metrics", metricsHandler);

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Strict limiter on auth endpoints (login, register, password reset) to block
// brute-force and credential-stuffing attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_AUTH_MAX ?? 20),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "طلبات كثيرة، أعد المحاولة بعد قليل" },
  skipSuccessfulRequests: false,
  store: rateLimitStore("rl:auth:"),
  handler: (_req, res, _next, options) => {
    rateLimitEvents.inc({ limiter: "auth", result: "blocked" });
    res.status(options.statusCode).json(options.message);
  },
});

// General limiter for all other API routes — prevents DDoS / scraping.
// NOTE: the default store is in-memory (per-process). When running multiple
// API instances, back this with a shared store (Redis) via RATE_LIMIT_* so the
// limit is global — see DEPLOY-SCALE.md.
const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_GENERAL_WINDOW_MS ?? 60 * 1000),
  max: Number(process.env.RATE_LIMIT_GENERAL_MAX ?? 300),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "طلبات كثيرة، أعد المحاولة بعد قليل" },
  store: rateLimitStore("rl:general:"),
  handler: (_req, res, _next, options) => {
    rateLimitEvents.inc({ limiter: "general", result: "blocked" });
    res.status(options.statusCode).json(options.message);
  },
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Restrict credentialed CORS to the explicit set of known app origins.
// Reflecting arbitrary origins back (origin: true) would let any third-party
// website make credentialed cross-origin requests to public write endpoints.
// We build the allowlist from Replit's own env vars so no manual config is
// needed in dev or production.
function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>();
  // Production/preview domains (comma-separated).
  for (const d of (process.env.REPLIT_DOMAINS ?? "").split(",")) {
    const t = d.trim();
    if (t) origins.add(`https://${t}`);
  }
  // Project-specific dev domain (e.g. <id>.riker.replit.dev).
  const devDomain = process.env.REPLIT_DEV_DOMAIN?.trim();
  if (devDomain) origins.add(`https://${devDomain}`);
  // Expo dev domain (used by the mobile app preview).
  const expoDomain = process.env.REPLIT_EXPO_DEV_DOMAIN?.trim();
  if (expoDomain) origins.add(`https://${expoDomain}`);
  return origins;
}
const allowedOrigins = buildAllowedOrigins();
app.use(
  cors({
    origin(origin, callback) {
      // No Origin header = same-origin / server-to-server / curl — allow.
      if (!origin) return callback(null, true);
      // Allow http://localhost, http://127.0.0.1, and http://[::1] for local
      // development. Use exact hostname matching — startsWith would incorrectly
      // allow origins like http://localhost.evil.com.
      try {
        const { protocol, hostname } = new URL(origin);
        if (
          protocol === "http:" &&
          (hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname === "[::1]")
        ) {
          return callback(null, true);
        }
      } catch {
        return callback(null, false);
      }
      // Allow only the explicitly enumerated project origins.
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }),
);

app.use(cookieParser());
// Tight JSON/body limits to prevent oversized payload attacks (text posts and
// comments are small; image/CV uploads go through multipart/multer, not JSON).
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Apply the STRICT limiter only to the sensitive credential/mutation endpoints
// (login, register, password reset). It must NOT cover the lightweight session
// probe GET /api/auth/me — that fires on every page load, so a 20-per-15-min
// cap there locks out normal browsing with HTTP 429. The session probe and all
// other authenticated reads/writes fall under the generous generalLimiter.
//
// NOTE: express-rate-limit only invokes the limiter for requests whose method
// matches; we still guard with an explicit method check so a GET to these paths
// (e.g. a probe) is never counted against the strict budget.
const STRICT_AUTH_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/admin/login",
];
app.use(STRICT_AUTH_PATHS, (req, res, next) => {
  if (req.method !== "POST") return next();
  return authLimiter(req, res, next);
});
app.use("/api", generalLimiter);
// A request that reaches here passed the general limiter (blocked ones are
// short-circuited in the limiter's handler above).
app.use("/api", (_req, _res, next) => {
  rateLimitEvents.inc({ limiter: "general", result: "allowed" });
  next();
});

// ─── Edge/browser caching for ANONYMOUS public reads ─────────────────────────
// The biggest scale lever without new infra: let a CDN/browser absorb the read
// traffic for non-personalized public list endpoints. Only set on GETs from
// unauthenticated clients (no session cookie AND no Authorization header) so
// personalized/admin responses are never cached or leaked across users.
// Authenticated requests stay fresh.
//
// NOTE: several of these endpoints use `optionalUser` and personalize the
// response (e.g. /works/:id exposes the author phone + likedByMe/savedByMe only
// to a signed-in viewer). Authenticated clients may present their session via a
// Bearer token instead of a cookie (the mobile app does exactly this), so it is
// NOT enough to check cookies — we must also bail out when an Authorization
// header is present, or a shared cache could serve one member's personalized
// response (including contact info) to another visitor.
const PUBLIC_CACHE_RE =
  /^\/api\/(content|numbers|stats|gallery|partners|team|programs|cohorts|resources|jobs|investors|opportunities|perks|stories|daily|ventures|courses|experts|members|search)(\/|$)/;
const PUBLIC_CACHE_MAX_AGE = Number(process.env.PUBLIC_CACHE_MAX_AGE ?? 60);
app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    !req.path.includes("/me/") &&
    !req.path.includes("/admin/") &&
    !req.headers.authorization &&
    !req.cookies?.["ih_user"] &&
    !req.cookies?.["ih_admin"] &&
    PUBLIC_CACHE_RE.test(req.path)
  ) {
    res.set(
      "Cache-Control",
      `public, max-age=${PUBLIC_CACHE_MAX_AGE}, stale-while-revalidate=300`,
    );
  }
  next();
});

app.use("/api", router);

// ─── Production: serve the built SPA from the same origin ─────────────────────
// The frontend fetches same-origin "/api", so serving it here lets ONE process
// serve both the API and the site — the simplest VPS topology (no nginx needed).
// Gated on NODE_ENV=production; set SERVE_STATIC=0 when a CDN/nginx fronts it.
if (
  process.env.NODE_ENV === "production" &&
  process.env.SERVE_STATIC !== "0"
) {
  const clientDir =
    process.env.CLIENT_DIR ??
    path.resolve(process.cwd(), "../ih-haven/dist/public");
  app.use(
    express.static(clientDir, {
      index: false,
      setHeaders: (res, filePath) => {
        // Content-hashed assets can be cached hard; index.html must not be.
        if (/[.-][A-Za-z0-9_]{8,}\.(js|css|woff2?|png|jpe?g|svg|webp|avif)$/.test(filePath))
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      },
    }),
  );
  // SPA fallback: any non-API GET returns index.html so the client router runs.
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path === "/metrics")
      return next();
    res.sendFile(path.join(clientDir, "index.html"), (err) =>
      err ? next() : undefined,
    );
  });
}

export default app;
