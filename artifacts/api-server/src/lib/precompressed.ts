import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import type { RequestHandler } from "express";

/**
 * Serve build-time pre-compressed twins (`.br` / `.gz`) for static assets.
 *
 * The SPA's JS/CSS were previously shipped RAW by express.static — a cold
 * homepage pulled ~1.1 MB of uncompressed text. `ih-haven/scripts/precompress.mjs`
 * writes a `.br` and `.gz` next to every text asset at build time; this middleware
 * (mounted BEFORE express.static) rewrites the request to the twin the client
 * accepts and sets the encoding headers. Benefits over on-the-fly gzip:
 *
 *  - zero per-request CPU (the bytes are already compressed on disk),
 *  - brotli quality 11, which an on-the-fly middleware could never afford,
 *  - compression no longer DEPENDS on nginx being configured correctly.
 *
 * If no twin exists (or the client sent no Accept-Encoding), we simply fall
 * through and express.static serves the original — so this can never 404 an
 * asset that would otherwise have been served.
 */
const COMPRESSIBLE = new Set([
  ".js", ".mjs", ".css", ".html", ".json", ".svg", ".xml", ".txt", ".webmanifest", ".map",
]);

const TYPES: Record<string, string> = {
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".map": "application/json; charset=utf-8",
};

/** Which encoding may we use for this request? Honours `br;q=0` opt-outs. */
function negotiate(accept: string): "br" | "gzip" | null {
  const wantsBr = /(^|,)\s*br\s*(;q=(?!0(\.0+)?\s*(,|$)))?/i.test(accept);
  const wantsGz = /(^|,)\s*gzip\s*(;q=(?!0(\.0+)?\s*(,|$)))?/i.test(accept);
  return wantsBr ? "br" : wantsGz ? "gzip" : null;
}

/**
 * Compress DYNAMIC JSON responses (`res.json`) — the one thing the build-time
 * pre-compressor cannot reach. A cold homepage pulled ~91KB of raw JSON from the
 * public endpoints; brotli takes that to roughly a sixth.
 *
 * Deliberately narrow so it cannot destabilise the API:
 *  - only `res.json` (the API's single response path), never streams or files,
 *  - only bodies over 1KB (below that, headers cost more than we save),
 *  - only when the client advertises an encoding,
 *  - async compression (never blocks the event loop), and on ANY error it falls
 *    straight back to the original uncompressed `res.json`.
 *
 * In production nginx would normally gzip this too — but doing it here means
 * compression no longer DEPENDS on the edge being configured correctly.
 */
export function compressJson(minBytes = 1024): RequestHandler {
  return (req, res, next) => {
    const enc = negotiate(String(req.headers["accept-encoding"] ?? ""));
    if (!enc) return next();

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      let buf: Buffer;
      try {
        buf = Buffer.from(JSON.stringify(body) ?? "null", "utf8");
      } catch {
        return originalJson(body);
      }
      if (buf.length < minBytes || res.headersSent || res.getHeader("Content-Encoding")) {
        return originalJson(body);
      }

      const done = (err: Error | null, out: Buffer) => {
        if (err || res.headersSent) return void originalJson(body);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Content-Encoding", enc);
        res.setHeader("Vary", "Accept-Encoding");
        res.setHeader("Content-Length", String(out.length));
        res.end(out);
      };

      if (enc === "br") {
        // quality 4: near-gzip speed, better ratio. (Static assets use 11 — but
        // those are compressed once at build time, not per request.)
        zlib.brotliCompress(
          buf,
          { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } },
          done,
        );
      } else {
        zlib.gzip(buf, { level: 6 }, done);
      }
      return res;
    };
    next();
  };
}

/**
 * The SPA-fallback route (`/`, `/ventures`, …) has no file extension, so
 * `precompressedStatic` never sees it and the HTML shell shipped raw on every
 * cold load. Resolve the `.br`/`.gz` twin of index.html for the caller instead.
 */
export function indexTwin(
  clientDir: string,
  acceptEncoding: string,
): { file: string; enc: "br" | "gzip" } | null {
  const enc = negotiate(acceptEncoding);
  if (!enc) return null;
  const file = path.join(clientDir, enc === "br" ? "index.html.br" : "index.html.gz");
  return fs.existsSync(file) ? { file, enc } : null;
}

export function precompressedStatic(clientDir: string): RequestHandler {
  const root = path.resolve(clientDir);

  return (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();

    const ext = path.extname(req.path).toLowerCase();
    if (!COMPRESSIBLE.has(ext)) return next();

    const accept = String(req.headers["accept-encoding"] ?? "");
    // Prefer brotli; fall back to gzip. `br;q=0` means "explicitly not brotli".
    const wantsBr = /(^|,)\s*br\s*(;q=(?!0(\.0+)?\s*(,|$)))?/i.test(accept);
    const wantsGz = /(^|,)\s*gzip\s*(;q=(?!0(\.0+)?\s*(,|$)))?/i.test(accept);
    const enc = wantsBr ? "br" : wantsGz ? "gzip" : null;
    if (!enc) return next();

    const suffix = enc === "br" ? ".br" : ".gz";
    // Resolve inside the client dir and refuse anything that escapes it.
    const target = path.resolve(root, "." + req.path + suffix);
    if (!target.startsWith(root + path.sep)) return next();
    if (!fs.existsSync(target)) return next();

    // express.static would otherwise infer Content-Type from the `.br`/`.gz`
    // extension, so pin the ORIGINAL type and mark the encoding.
    res.setHeader("Content-Type", TYPES[ext] ?? "application/octet-stream");
    res.setHeader("Content-Encoding", enc);
    res.setHeader("Vary", "Accept-Encoding");

    // Rewrite only the path, preserving any query string.
    const qs = req.url.indexOf("?");
    req.url = qs === -1 ? req.url + suffix : req.url.slice(0, qs) + suffix + req.url.slice(qs);
    next();
  };
}
