// Smoke + validation tests for public routes that had no coverage: the
// unauthenticated newsletter subscribe write path and the public opportunities /
// daily read endpoints. Runs against a LIVE server (default http://localhost:3001).
//
//   pnpm test
//
// Env: API_BASE.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.API_BASE ?? "http://localhost:3001/api";

async function req(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json };
}

describe("public read endpoints", () => {
  test("GET /opportunities returns an array", async () => {
    const r = await req("/opportunities");
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.json.opportunities), "opportunities is an array");
  });

  test("GET /daily returns a paginated post list", async () => {
    const r = await req("/daily");
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.json.posts), "posts is an array");
    assert.equal(typeof r.json.total, "number");
  });
});

describe("newsletter subscribe (public write)", () => {
  test("rejects an invalid email", async () => {
    const r = await req("/newsletter/subscribe", { method: "POST", body: { email: "not-an-email" } });
    assert.equal(r.status, 400);
  });

  test("subscribes a fresh email, then is idempotent on a repeat", async () => {
    const email = `test.subscriber.${Date.now()}@example.com`;
    const first = await req("/newsletter/subscribe", { method: "POST", body: { email } });
    assert.equal(first.status, 200);
    assert.equal(first.json.ok, true);
    assert.equal(first.json.alreadySubscribed, false, "first subscribe is new");

    const second = await req("/newsletter/subscribe", { method: "POST", body: { email } });
    assert.equal(second.status, 200);
    assert.equal(second.json.ok, true);
    assert.equal(second.json.alreadySubscribed, true, "re-subscribe is deduped, not a duplicate row");
  });
});
