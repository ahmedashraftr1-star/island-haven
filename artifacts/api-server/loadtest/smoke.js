// Scenario (a) — smoke: 1 VU, confirm the API responds at all before load.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE || "http://127.0.0.1:3001";

export const options = {
  vus: 1,
  duration: "20s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  check(http.get(`${BASE}/api/healthz`), { "healthz 200": (r) => r.status === 200 });
  check(http.get(`${BASE}/api/programs`), { "programs 200": (r) => r.status === 200 });
  check(http.get(`${BASE}/api/ventures`), { "ventures 200": (r) => r.status === 200 });
  sleep(0.5);
}
