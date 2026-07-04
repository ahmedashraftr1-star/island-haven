// Scenario (c) — spike that deliberately blows past the auth rate limit.
// Verifies the server keeps returning proper 429s under a concurrency spike and
// does NOT fall over (zero 5xx / connection errors). Run with the DEFAULT auth
// limit so the limiter engages quickly.
import http from "k6/http";
import { Counter } from "k6/metrics";

const BASE = __ENV.BASE || "http://127.0.0.1:3001";
const c429 = new Counter("count_429");
const c5xx = new Counter("count_5xx");
const cConnErr = new Counter("count_conn_err");
const c2xx4xx = new Counter("count_ok_or_4xx");

export const options = {
  stages: [
    { duration: "5s", target: 60 },  // spike up
    { duration: "10s", target: 60 }, // hold the spike
    { duration: "3s", target: 0 },
  ],
  thresholds: {
    count_5xx: ["count==0"],       // server must not 5xx under the spike
    count_conn_err: ["count==0"],  // and must not drop connections
  },
};

export default function () {
  const r = http.post(
    `${BASE}/api/auth/login`,
    JSON.stringify({ email: "spike@example.com", password: "x" }),
    { headers: { "Content-Type": "application/json" } },
  );
  if (r.status === 429) c429.add(1);
  else if (r.status >= 500) c5xx.add(1);
  else if (r.status === 0) cConnErr.add(1);
  else c2xx4xx.add(1);
}
