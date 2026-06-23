import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { rateLimit } from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

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

// Apply strict rate limiting to auth routes, general limiter to everything else.
app.use("/api/auth", authLimiter);
app.use("/api/admin/auth", authLimiter);
app.use("/api", generalLimiter);

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

export default app;
