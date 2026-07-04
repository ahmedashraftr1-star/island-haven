// Scenario (b) — ramping load on multiple real endpoints. Per-endpoint
// thresholds (auth is rate-limited by design, so its 429s are tracked, not
// failed). Run against a server with RATE_LIMIT_GENERAL_MAX raised so the
// GENERAL limiter isn't the bottleneck — we want app throughput here, and the
// dedicated auth limiter (default 20/15m) is exercised in scenario (c).
import http from "k6/http";
import { Counter } from "k6/metrics";

const BASE = __ENV.BASE || "http://127.0.0.1:3001";
const auth429 = new Counter("auth_429");
const authOther = new Counter("auth_non429");

export const options = {
  stages: [
    { duration: "15s", target: 30 }, // ramp-up
    { duration: "30s", target: 30 }, // steady
    { duration: "10s", target: 0 },  // ramp-down
  ],
  thresholds: {
    "http_req_duration{ep:healthz}": ["p(95)<300", "p(99)<800"],
    "http_req_duration{ep:programs}": ["p(95)<800", "p(99)<1500"],
    "http_req_duration{ep:ventures}": ["p(95)<800", "p(99)<1500"],
    "http_req_failed{ep:healthz}": ["rate<0.01"],
    "http_req_failed{ep:programs}": ["rate<0.01"],
    "http_req_failed{ep:ventures}": ["rate<0.01"],
  },
};

export default function () {
  http.get(`${BASE}/api/healthz`, { tags: { ep: "healthz" } });
  http.get(`${BASE}/api/programs`, { tags: { ep: "programs" } });
  http.get(`${BASE}/api/ventures`, { tags: { ep: "ventures" } });
  if (Math.random() < 0.2) {
    const a = http.post(
      `${BASE}/api/auth/login`,
      JSON.stringify({ email: "x@example.com", password: "wrongpass" }),
      { headers: { "Content-Type": "application/json" }, tags: { ep: "auth" } },
    );
    if (a.status === 429) auth429.add(1);
    else authOther.add(1);
  }
}
