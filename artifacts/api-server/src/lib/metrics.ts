import type { Request, Response, NextFunction } from "express";
import { isRedisReady } from "./rateLimitStore";

// Minimal, dependency-free Prometheus metrics (text exposition format 0.0.4).
// We deliberately avoid prom-client: it hard-depends on @opentelemetry/api
// (which forks drizzle-orm's peer resolution and breaks the api-server type
// check) and its collectDefaultMetrics uses dynamic require() calls that don't
// survive the esbuild bundle. A tiny in-process registry covers what we need:
// request counts, request duration histogram, rate-limit decisions, redis_up.

type Labels = Record<string, string>;

function labelKey(labels: Labels): string {
  return Object.keys(labels)
    .sort()
    .map((k) => `${k}="${String(labels[k]).replace(/["\\\n]/g, "_")}"`)
    .join(",");
}

// ── counters: metric name → (labelKey → value) ──
const counters = new Map<string, Map<string, number>>();
function incCounter(metric: string, labels: Labels, by = 1): void {
  let series = counters.get(metric);
  if (!series) {
    series = new Map();
    counters.set(metric, series);
  }
  const k = labelKey(labels);
  series.set(k, (series.get(k) ?? 0) + by);
}

// ── histogram: labelKey → cumulative bucket counts + sum + count ──
const HIST_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5,
] as const;
interface Hist {
  buckets: number[];
  sum: number;
  count: number;
}
const durations = new Map<string, Hist>();
function observeDuration(labels: Labels, seconds: number): void {
  const k = labelKey(labels);
  let h = durations.get(k);
  if (!h) {
    h = { buckets: new Array(HIST_BUCKETS.length).fill(0), sum: 0, count: 0 };
    durations.set(k, h);
  }
  h.sum += seconds;
  h.count += 1;
  for (let i = 0; i < HIST_BUCKETS.length; i++) {
    if (seconds <= HIST_BUCKETS[i]!) h.buckets[i]! += 1; // cumulative le-buckets
  }
}

// Public: rate-limit decision counter (used by app.ts limiter handlers).
export const rateLimitEvents = {
  inc(labels: Labels): void {
    incCounter("rate_limit_events_total", labels);
  },
};

// Public: cache hit/miss counter (used by lib/cache.ts). Labels: {cache,result}
// where result ∈ {"hit","miss"} — mirrors rate_limit_events_total's shape.
export const cacheEvents = {
  inc(labels: Labels): void {
    incCounter("cache_events_total", labels);
  },
};

// Public: queue job outcome counter (used by queues/worker.ts). Labels:
// {queue,status} where status ∈ {"completed","failed"}.
export const queueEvents = {
  inc(labels: Labels): void {
    incCounter("queue_jobs_total", labels);
  },
};

// ── dynamic gauges: metric name → (labelKey → value) ──
// For values sampled at runtime (e.g. queue_depth per queue). The queue module
// refreshes these on a timer; redis_up stays a hardcoded gauge below.
const gauges = new Map<string, Map<string, number>>();
export function setGauge(metric: string, labels: Labels, value: number): void {
  let series = gauges.get(metric);
  if (!series) {
    series = new Map();
    gauges.set(metric, series);
  }
  series.set(labelKey(labels), value);
}

// Collapse numeric id path segments to bound label cardinality.
function normalizeRoute(req: Request): string {
  const matched = req.route?.path;
  if (matched)
    return `${req.baseUrl || ""}${matched}`.replace(/\/{2,}/g, "/") || "/";
  return (req.path || req.url)
    .replace(/\?.*$/, "")
    .replace(/\/\d+(?=\/|$)/g, "/:id");
}

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === "/metrics") return next();
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const labels: Labels = {
      method: req.method,
      route: normalizeRoute(req),
      status_code: String(res.statusCode),
    };
    incCounter("http_requests_total", labels);
    observeDuration(labels, Number(process.hrtime.bigint() - start) / 1e9);
  });
  next();
}

export function metricsHandler(_req: Request, res: Response): void {
  const out: string[] = [];

  out.push("# HELP http_requests_total Total HTTP requests.");
  out.push("# TYPE http_requests_total counter");
  for (const [lk, v] of counters.get("http_requests_total") ?? [])
    out.push(`http_requests_total{${lk}} ${v}`);

  out.push("# HELP rate_limit_events_total Rate-limit decisions.");
  out.push("# TYPE rate_limit_events_total counter");
  for (const [lk, v] of counters.get("rate_limit_events_total") ?? [])
    out.push(`rate_limit_events_total{${lk}} ${v}`);

  out.push("# HELP cache_events_total Response-cache hits and misses.");
  out.push("# TYPE cache_events_total counter");
  for (const [lk, v] of counters.get("cache_events_total") ?? [])
    out.push(`cache_events_total{${lk}} ${v}`);

  out.push("# HELP queue_jobs_total Background job outcomes by queue.");
  out.push("# TYPE queue_jobs_total counter");
  for (const [lk, v] of counters.get("queue_jobs_total") ?? [])
    out.push(`queue_jobs_total{${lk}} ${v}`);

  out.push("# HELP http_request_duration_seconds Request duration.");
  out.push("# TYPE http_request_duration_seconds histogram");
  for (const [lk, h] of durations) {
    for (let i = 0; i < HIST_BUCKETS.length; i++)
      out.push(
        `http_request_duration_seconds_bucket{${lk},le="${HIST_BUCKETS[i]}"} ${h.buckets[i]}`,
      );
    out.push(
      `http_request_duration_seconds_bucket{${lk},le="+Inf"} ${h.count}`,
    );
    out.push(`http_request_duration_seconds_sum{${lk}} ${h.sum}`);
    out.push(`http_request_duration_seconds_count{${lk}} ${h.count}`);
  }

  out.push("# HELP redis_up Shared rate-limit Redis store (1=up,0=down/in-memory).");
  out.push("# TYPE redis_up gauge");
  out.push(`redis_up ${isRedisReady() ? 1 : 0}`);

  // Dynamic gauges (e.g. queue_depth{queue="email"}), refreshed on a timer.
  for (const [metric, series] of gauges) {
    out.push(`# TYPE ${metric} gauge`);
    for (const [lk, v] of series) out.push(`${metric}{${lk}} ${v}`);
  }

  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.end(out.join("\n") + "\n");
}
