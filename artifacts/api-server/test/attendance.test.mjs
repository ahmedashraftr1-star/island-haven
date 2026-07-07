// Black-box integration tests for the Island Haven ATTENDANCE API.
// Runs against a LIVE server (default http://localhost:3001) with the dev seed
// data present. No app imports → no module-resolution / DATABASE_URL coupling.
//
//   pnpm test          (server must be running: pnpm run dev:local)
//
// ⚠️ MUTATES DEV DATA: this suite opens/closes an attendance session for the
// test member (check-in / check-out) and briefly assigns + releases a temporary
// seat (49) for that member. It cleans up after itself (member left checked-OUT
// and seat 49 released), but it does touch live rows — run against a dev DB.
// The server MUST be running the CURRENT build that includes the attendance
// routes (/attendance/* and /admin/attendance/*).
//
// Env: API_BASE, TEST_ADMIN_USER, TEST_ADMIN_PASS, TEST_MEMBER_EMAIL/PASS.

import { test, before, describe } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.API_BASE ?? "http://localhost:3001/api";
const ADMIN_USER = process.env.TEST_ADMIN_USER ?? "ahmedashraf";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? "ahmedadmin$$";
const MEMBER_EMAIL = process.env.TEST_MEMBER_EMAIL ?? "member.1@islandhaven.ps";
const MEMBER_PASS = process.env.TEST_MEMBER_PASS ?? "IslandHaven#2026";

// A high seat number, chosen to avoid colliding with seeded assignments.
const TEST_SEAT = 49;

let adminToken = "";
let memberToken = "";
let memberId = 0;

async function req(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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

before(async () => {
  // Admin token.
  const a = await req("/admin/login", {
    method: "POST",
    body: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  assert.equal(a.status, 200, "admin login should succeed — is the server running & seeded?");
  adminToken = a.json.token;
  assert.ok(adminToken, "admin login returns a token");

  // Member token.
  const m = await req("/auth/login", {
    method: "POST",
    body: { email: MEMBER_EMAIL, password: MEMBER_PASS },
  });
  assert.equal(m.status, 200, "seeded member should log in");
  memberToken = m.json.token;
  assert.ok(memberToken, "member login returns a token");

  // The member's own userId, read from their profile.
  const me = await req("/auth/me", { token: memberToken });
  assert.equal(me.status, 200, "member profile should be readable");
  memberId = me.json.user.id;
  assert.ok(Number.isInteger(memberId) && memberId > 0, "member profile carries a numeric id");

  // Start from a known-clean state: release the test seat and check the member
  // out so reruns never inherit a stale session/assignment.
  await req("/admin/attendance/release", {
    method: "POST",
    token: adminToken,
    body: { seatNumber: TEST_SEAT },
  });
  await req("/attendance/check-out", { method: "POST", token: memberToken });
});

describe("attendance authorization gating", () => {
  test("GET /attendance/board without a token → 401", async () => {
    const r = await req("/attendance/board");
    assert.equal(r.status, 401);
  });

  test("POST /attendance/check-in without a token → 401", async () => {
    const r = await req("/attendance/check-in", { method: "POST" });
    assert.equal(r.status, 401);
  });

  test("GET /attendance/me without a token → 401", async () => {
    const r = await req("/attendance/me");
    assert.equal(r.status, 401);
  });

  test("GET /admin/attendance/members without an admin token → 401", async () => {
    const r = await req("/admin/attendance/members");
    assert.equal(r.status, 401);
  });

  test("POST /admin/attendance/assign without an admin token → 401", async () => {
    const r = await req("/admin/attendance/assign", {
      method: "POST",
      body: { seatNumber: TEST_SEAT, userId: memberId },
    });
    assert.equal(r.status, 401);
  });

  test("a MEMBER token must NOT reach admin endpoints → 401", async () => {
    const members = await req("/admin/attendance/members", { token: memberToken });
    assert.equal(members.status, 401);
    const assign = await req("/admin/attendance/assign", {
      method: "POST",
      token: memberToken,
      body: { seatNumber: TEST_SEAT, userId: memberId },
    });
    assert.equal(assign.status, 401);
  });
});

describe("public attendance summary (PII-free)", () => {
  test("GET /attendance/summary → 200 with numeric aggregates only", async () => {
    const r = await req("/attendance/summary");
    assert.equal(r.status, 200);
    assert.equal(typeof r.json.totalSeats, "number");
    assert.equal(typeof r.json.assignedCount, "number");
    assert.equal(typeof r.json.presentCount, "number");
  });

  test("summary exposes NO names/PII keys", async () => {
    const r = await req("/attendance/summary");
    const keys = Object.keys(r.json);
    assert.deepEqual(
      keys.sort(),
      ["assignedCount", "presentCount", "totalSeats"],
      "only aggregate counts are returned",
    );
    const pii = ["seats", "members", "occupant", "fullName", "name", "email", "userId", "user"];
    for (const k of pii) {
      assert.ok(!(k in r.json), `summary must not leak "${k}"`);
    }
  });
});

describe("self check-in / check-out lifecycle (member)", () => {
  test("POST /attendance/check-in → 200 { present:true, since }", async () => {
    const r = await req("/attendance/check-in", { method: "POST", token: memberToken });
    assert.equal(r.status, 200);
    assert.equal(r.json.present, true);
    assert.ok(r.json.since, "an open session reports a since timestamp");
  });

  test("GET /attendance/me reflects present:true", async () => {
    const r = await req("/attendance/me", { token: memberToken });
    assert.equal(r.status, 200);
    assert.equal(r.json.present, true);
    assert.ok(r.json.since, "me reports the since timestamp while present");
  });

  test("a SECOND check-in is idempotent (still present, same-ish since)", async () => {
    const first = await req("/attendance/me", { token: memberToken });
    const second = await req("/attendance/check-in", { method: "POST", token: memberToken });
    assert.equal(second.status, 200);
    assert.equal(second.json.present, true);
    // Idempotent: the existing open session is returned as-is, so the since
    // timestamp is unchanged (never re-opened / re-stamped).
    assert.equal(second.json.since, first.json.since, "since is unchanged by the repeat check-in");
  });

  test("POST /attendance/check-out → 200 { present:false }", async () => {
    const r = await req("/attendance/check-out", { method: "POST", token: memberToken });
    assert.equal(r.status, 200);
    assert.equal(r.json.present, false);
  });

  test("GET /attendance/me reflects present:false after check-out", async () => {
    const r = await req("/attendance/me", { token: memberToken });
    assert.equal(r.status, 200);
    assert.equal(r.json.present, false);
    assert.equal(r.json.since, null, "no open session → no since");
  });
});

describe("the board (member)", () => {
  test("GET /attendance/board → 200 with a fully-populated seat grid", async () => {
    const r = await req("/attendance/board", { token: memberToken });
    assert.equal(r.status, 200);
    assert.equal(typeof r.json.totalSeats, "number");
    assert.equal(typeof r.json.presentCount, "number");
    assert.equal(typeof r.json.assignedCount, "number");
    assert.ok(Array.isArray(r.json.seats), "seats is an array");
    assert.equal(r.json.seats.length, r.json.totalSeats, "one entry per seat");

    for (const s of r.json.seats) {
      assert.equal(typeof s.number, "number", "seat has a number");
      assert.equal(typeof s.present, "boolean", "seat has a present boolean");
      // occupant is an object (assigned) or null (free) — never absent.
      assert.ok(
        s.occupant === null || typeof s.occupant === "object",
        "occupant is an object or null",
      );
    }
  });
});

describe("admin assign / release + idempotent short-circuit", () => {
  test("POST /admin/attendance/assign { seat, userId } → 200 { ok:true }", async () => {
    const r = await req("/admin/attendance/assign", {
      method: "POST",
      token: adminToken,
      body: { seatNumber: TEST_SEAT, userId: memberId },
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
  });

  test("GET /attendance/me now shows the assigned seat", async () => {
    const r = await req("/attendance/me", { token: memberToken });
    assert.equal(r.status, 200);
    assert.equal(r.json.seat, TEST_SEAT);
  });

  test("re-assigning the SAME (seat, user) short-circuits → still 200 { ok:true }", async () => {
    const r = await req("/admin/attendance/assign", {
      method: "POST",
      token: adminToken,
      body: { seatNumber: TEST_SEAT, userId: memberId },
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
  });

  test("POST /admin/attendance/release { seat } → 200 { ok:true }", async () => {
    const r = await req("/admin/attendance/release", {
      method: "POST",
      token: adminToken,
      body: { seatNumber: TEST_SEAT },
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
  });

  test("GET /attendance/me shows seat === null after release", async () => {
    const r = await req("/attendance/me", { token: memberToken });
    assert.equal(r.status, 200);
    assert.equal(r.json.seat, null);
  });
});

describe("admin assign validation", () => {
  test("out-of-range seatNumber (999) → 400", async () => {
    const r = await req("/admin/attendance/assign", {
      method: "POST",
      token: adminToken,
      body: { seatNumber: 999, userId: memberId },
    });
    assert.equal(r.status, 400);
  });

  test("a non-existent userId → 404 (user not found)", async () => {
    const r = await req("/admin/attendance/assign", {
      method: "POST",
      token: adminToken,
      body: { seatNumber: TEST_SEAT, userId: 99999999 },
    });
    assert.equal(r.status, 404);
  });

  // Safety net: make sure this suite never leaves the test seat occupied.
  test("cleanup — release the test seat", async () => {
    const r = await req("/admin/attendance/release", {
      method: "POST",
      token: adminToken,
      body: { seatNumber: TEST_SEAT },
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
  });
});
