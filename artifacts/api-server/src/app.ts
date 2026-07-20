import path from "node:path";
import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { rateLimit } from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";
import { codeFor } from "./lib/apiError";
import { publicKeyInfo } from "./lib/attest";
import { csrfProtect } from "./lib/csrf";
import { compressJson, indexTwin, precompressedStatic } from "./lib/precompressed";
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

// Baseline security headers (helmet) + a scoped Content-Security-Policy. The CSP
// is intentionally tuned to EXACTLY what the built SPA needs, so it protects the
// HTML this server serves (express.static of ih-haven/dist) without breaking it:
//  - script-src 'self'  → the app bundle is self-hosted; the only inline <script>
//    is a non-executable application/ld+json block (CSP doesn't gate that). This
//    is the XSS-critical directive — foreign/injected scripts are blocked.
//  - style-src allows 'unsafe-inline' (the app uses inline styles) + Google Fonts
//    CSS; font-src allows Google Fonts + data:.
//  - img-src allows data:/blob:/https: (photos, the data-URI grain, remote covers).
//  - frame-ancestors 'self' (clickjacking) + object-src 'none' + base-uri 'self'.
// crossOriginResourcePolicy stays cross-origin so image bytes embed from the FE.
// NOTE: if a reverse proxy serves the HTML instead of this server, mirror this CSP
// there too (infra decision).
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        // Webfonts are self-hosted now, so Google's origins are no longer allowed
        // to serve us stylesheets or fonts — a smaller attack surface, not just a
        // faster one.
        // `style-src` keeps 'unsafe-inline' deliberately: the React components use
        // inline `style={}` extensively, and the SPA shell is served as a
        // precompressed .br/.gz twin (see indexTwin), so a per-request style nonce
        // can't be templated in without giving up precompression. script-src stays
        // strict ('self', no inline) — the XSS-critical directive — and the only
        // inline <script> in index.html is non-executable ld+json.
        "style-src": ["'self'", "'unsafe-inline'"],
        "font-src": ["'self'", "data:"],
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "connect-src": ["'self'"],
        "frame-ancestors": ["'self'"],
        // Restrict where forms can POST to — belt-and-suspenders against a form
        // being repointed at an attacker origin via injected markup.
        "form-action": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "upgrade-insecure-requests": null,
      },
    },
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

// Compress JSON payloads over 1KB (a cold homepage pulled ~91KB of raw JSON).
// Must sit directly in front of the router so it wraps res.json for every route.
app.use("/api", compressJson());

// Normalize the API's error shape in ONE place: rewrite every legacy error body
// `{ error: "<string>", ... }` into the unified `{ error: { code, message }, ... }`
// — so all ~655 existing `res.json({ error: "…" })` sites are standardized without
// touching them. Only fires on error responses (statusCode ≥ 400) with a string
// `error`, so a 200 that happens to carry an `error` field is never mangled.
// Sibling fields (validation `details` / `issues`) stay top-level so their
// existing clients keep working. Wrapped AFTER compressJson so the transform runs
// before compression.
app.use("/api", (_req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    if (
      res.statusCode >= 400 &&
      body &&
      typeof body === "object" &&
      typeof (body as { error?: unknown }).error === "string"
    ) {
      const b = body as Record<string, unknown>;
      body = { ...b, error: { code: codeFor(res.statusCode), message: b.error } };
    }
    return originalJson(body as never);
  };
  next();
});

// CSRF: double-submit token + Origin/Referer check on cookie-authed admin
// mutations. Mounted before the router so it guards every /api/admin/* path.
// Bearer-token + unauthenticated requests pass through (not CSRF-vulnerable).
app.use("/api/admin", csrfProtect);

app.use("/api", router);

// Central API error handler — LAST in the chain. Catches anything a route
// forwards via next(err) or throws synchronously, so an unhandled route error
// returns a clean JSON error (never Express's default HTML page, never a leaked
// stack) and never escalates to a process-level crash. Async handlers already
// try/catch, but this is the belt-and-suspenders backstop the app was missing.
app.use("/api", (err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) return next(err);
  const status =
    typeof (err as { status?: unknown })?.status === "number"
      ? (err as { status: number }).status
      : 500;
  logger.error({ err, path: req.path, method: req.method }, "unhandled route error");
  res.status(status).json({
    error: {
      code: codeFor(status),
      message: status >= 500 ? "خطأ في الخادم" : ((err as { message?: string })?.message ?? "خطأ"),
    },
  });
});

// Public discovery of the Verifiable-Honesty signing key at a stable
// /.well-known path (public material only; mirrors GET /api/attestations/pubkey).
// Registered BEFORE the SPA fallback so it isn't swallowed by index.html.
app.get("/.well-known/ih-pubkey", (_req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  res.json({ keys: [publicKeyInfo()] });
});

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
  // Defense-in-depth: a source map would expose the original TypeScript. The web
  // build emits none (vite build.sourcemap:false), but hard-block any *.map
  // request here so a future build can never leak one — and it 404s instead of
  // falling through to the SPA shell.
  app.use((req, res, next) => {
    if (req.path.endsWith(".map")) return void res.status(404).end();
    next();
  });
  // Serve the build-time `.br`/`.gz` twins when the client accepts them. Must
  // come BEFORE express.static (it rewrites req.url to the compressed twin).
  app.use(precompressedStatic(clientDir));
  app.use(
    express.static(clientDir, {
      index: false,
      setHeaders: (res, filePath) => {
        // Content-hashed assets can be cached hard; index.html must not be.
        // The optional (\.br|\.gz) tail keeps the header on the precompressed
        // twins, whose path is e.g. `index-B4rXk9Qz.js.br`.
        if (
          /[.-][A-Za-z0-9_]{8,}\.(js|css|woff2?|png|jpe?g|svg|webp|avif)(\.br|\.gz)?$/.test(
            filePath,
          )
        )
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      },
    }),
  );
  // SPA fallback: any non-API GET returns index.html so the client router runs.
  // The route has no file extension, so precompressedStatic can't see it — serve
  // the `.br`/`.gz` twin here instead of shipping the shell raw on every load.
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path === "/metrics")
      return next();
    const twin = indexTwin(clientDir, String(req.headers["accept-encoding"] ?? ""));
    if (twin) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Encoding", twin.enc);
      res.setHeader("Vary", "Accept-Encoding");
      // The shell must never be cached hard — it points at the hashed assets.
      res.setHeader("Cache-Control", "no-cache");
      return void res.sendFile(twin.file, (err) => (err ? next() : undefined));
    }
    res.sendFile(path.join(clientDir, "index.html"), (err) =>
      err ? next() : undefined,
    );
  });
}

export default app;
