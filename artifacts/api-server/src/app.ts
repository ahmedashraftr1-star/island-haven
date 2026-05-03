import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// We are deployed behind Replit's reverse proxy. Trust exactly ONE hop so
// that req.ip uses the immediate proxy's X-Forwarded-For value rather than
// any client-supplied chain. This is the foundation for trustworthy rate
// limiting on the public booking endpoint.
app.set("trust proxy", 1);

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
