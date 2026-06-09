// Black-box integration tests for the Island Haven incubator API.
// Runs against a LIVE server (default http://localhost:3001) with the dev seed
// data present. No app imports → no module-resolution / DATABASE_URL coupling.
//
//   pnpm test          (server must be running: pnpm run dev:local)
//
// Env: API_BASE, TEST_ADMIN_USER, TEST_ADMIN_PASS, TEST_MEMBER_EMAIL/PASS.

import { test, before, describe } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.API_BASE ?? "http://localhost:3001/api";
const ADMIN_USER = process.env.TEST_ADMIN_USER ?? "ahmedashraf";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? "ahmedadmin$$";
const MEMBER_EMAIL = process.env.TEST_MEMBER_EMAIL ?? "member.1@islandhaven.ps";
const MEMBER_PASS = process.env.TEST_MEMBER_PASS ?? "IslandHaven#2026";

let adminToken = "";

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
  const r = await req("/admin/login", {
    method: "POST",
    body: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  assert.equal(r.status, 200, "admin login should succeed — is the server running & seeded?");
  adminToken = r.json.token;
  assert.ok(adminToken, "admin login returns a token");
});

describe("admin authentication", () => {
  test("rejects a wrong password", async () => {
    const r = await req("/admin/login", {
      method: "POST",
      body: { username: ADMIN_USER, password: "definitely-wrong" },
    });
    assert.equal(r.status, 401);
  });

  test("enforces the username when configured", async () => {
    const r = await req("/admin/login", {
      method: "POST",
      body: { username: "not-the-admin", password: ADMIN_PASS },
    });
    assert.equal(r.status, 401);
  });
});

describe("public catalog endpoints", () => {
  const cases = [
    ["/experts", "experts"],
    ["/programs", "programs"],
    ["/ventures", "ventures"],
    ["/stories", "stories"],
    ["/partners", "partners"],
    ["/cohorts", "cohorts"],
    ["/resources", "resources"],
    ["/team", "team"],
    ["/courses", "courses"],
  ];
  for (const [path, key] of cases) {
    test(`GET ${path} → 200 with ${key}[]`, async () => {
      const r = await req(path);
      assert.equal(r.status, 200);
      assert.ok(Array.isArray(r.json[key]), `${key} should be an array`);
    });
  }
});

describe("aggregate counts (regression for the correlated-COUNT bug)", () => {
  test("/numbers reflects seeded data (not all zero)", async () => {
    const r = await req("/numbers");
    assert.equal(r.status, 200);
    const n = r.json.numbers;
    assert.ok(n.members > 0, "members > 0");
    assert.ok(n.works > 0, "works > 0");
    assert.ok(n.courses > 0, "courses > 0");
  });

  test("course.enrolled is an accurate per-row count", async () => {
    const r = await req("/courses");
    const total = r.json.courses.reduce((s, c) => s + (c.enrolled ?? 0), 0);
    for (const c of r.json.courses) {
      assert.equal(typeof c.enrolled, "number", `${c.title}.enrolled is numeric`);
    }
    assert.ok(total >= 1, "at least one enrollment is counted (was 0 under the bug)");
  });

  test("program.applicants is a per-row count", async () => {
    const r = await req("/programs");
    for (const p of r.json.programs) {
      assert.equal(typeof p.applicants, "number", `${p.title}.applicants is numeric`);
    }
  });

  test("member.worksCount is a per-row count", async () => {
    const r = await req("/members");
    const total = r.json.members.reduce((s, m) => s + (m.worksCount ?? 0), 0);
    assert.ok(total >= 1, "members' works are counted (was 0 under the bug)");
  });
});

describe("input validation", () => {
  test("RSVP rejects missing/invalid fields", async () => {
    const r = await req("/cohorts/cohort-01/rsvp", { method: "POST", body: {} });
    assert.equal(r.status, 400);
  });

  test("RSVP accepts a valid payload", async () => {
    const r = await req("/cohorts/cohort-01/rsvp", {
      method: "POST",
      body: { fullName: "زائر اختبار", email: "itest@example.com", attendees: 1 },
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
  });

  test("application rejects a name with digits", async () => {
    const r = await req("/applications", {
      method: "POST",
      body: {
        fullName: "متقدّم 1",
        email: "x@example.com",
        phone: "0599000000",
        category: "graduate",
        bio: "نبذة كافية الطول للاختبار.",
      },
    });
    assert.equal(r.status, 400);
  });
});

describe("authorization gating", () => {
  test("GET /experts/me/profile without a token → 401", async () => {
    const r = await req("/experts/me/profile");
    assert.equal(r.status, 401);
  });

  test("GET /admin/experts without a token → 401", async () => {
    const r = await req("/admin/experts");
    assert.equal(r.status, 401);
  });

  test("GET /admin/experts with an admin token → 200", async () => {
    const r = await req("/admin/experts", { token: adminToken });
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.json.experts));
  });

  test("member login works and /me/sessions is reachable", async () => {
    const login = await req("/auth/login", {
      method: "POST",
      body: { email: MEMBER_EMAIL, password: MEMBER_PASS },
    });
    assert.equal(login.status, 200, "seeded member should log in");
    const r = await req("/me/sessions", { token: login.json.token });
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.json.sessions));
  });
});

describe("in-app notifications", () => {
  test("require auth", async () => {
    const a = await req("/me/notifications");
    const b = await req("/me/notifications/unread-count");
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
  });

  test("member can read their notifications + unread count", async () => {
    const login = await req("/auth/login", {
      method: "POST",
      body: { email: MEMBER_EMAIL, password: MEMBER_PASS },
    });
    const token = login.json.token;
    const list = await req("/me/notifications", { token });
    assert.equal(list.status, 200);
    assert.ok(Array.isArray(list.json.notifications));
    const count = await req("/me/notifications/unread-count", { token });
    assert.equal(count.status, 200);
    assert.equal(typeof count.json.count, "number");
  });
});

describe("details & relations", () => {
  test("GET /ventures/:id returns the venture (+ linked pitch deck)", async () => {
    const list = await req("/ventures");
    const id = list.json.ventures[0].id;
    const r = await req(`/ventures/${id}`);
    assert.equal(r.status, 200);
    assert.ok(r.json.venture, "venture object present");
    // pitchDeck is null unless linked — just assert the field exists.
    assert.ok("pitchDeck" in r.json, "response carries a pitchDeck field");
  });

  test("GET /cohorts/:slug/journey returns weeks[] and updates[]", async () => {
    const r = await req("/cohorts/cohort-01/journey");
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.json.weeks));
    assert.ok(Array.isArray(r.json.updates));
  });

  test("GET /cohorts/:slug returns cohort + ventures", async () => {
    const r = await req("/cohorts/cohort-01");
    assert.equal(r.status, 200);
    assert.ok(r.json.cohort?.id);
    assert.ok(Array.isArray(r.json.ventures));
  });

  test("GET /ventures/:id/milestones returns milestones[]", async () => {
    const list = await req("/ventures");
    const id = list.json.ventures[0].id;
    const r = await req(`/ventures/${id}/milestones`);
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.json.milestones));
  });
});

const EXPERT_EMAIL = process.env.TEST_EXPERT_EMAIL ?? "mentor.layan@islandhaven.ps";
const EXPERT_PASS = process.env.TEST_EXPERT_PASS ?? "IslandHaven#2026";

describe("office-hours booking — atomic first-wins (write path)", () => {
  let expertToken = "";
  let memberToken = "";
  let slotId = 0;

  before(async () => {
    const e = await req("/auth/login", {
      method: "POST",
      body: { email: EXPERT_EMAIL, password: EXPERT_PASS },
    });
    expertToken = e.json?.token ?? "";
    const m = await req("/auth/login", {
      method: "POST",
      body: { email: MEMBER_EMAIL, password: MEMBER_PASS },
    });
    memberToken = m.json?.token ?? "";

    // A unique far-future slot each run, so reruns never collide.
    const start = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * 30 + Math.floor(Math.random() * 1e9),
    );
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const s = await req("/experts/me/slots", {
      method: "POST",
      token: expertToken,
      body: {
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        mode: "online",
      },
    });
    slotId = s.json?.slot?.id ?? 0;
  });

  test("expert created an availability slot", () => {
    assert.ok(slotId > 0, "expert login + slot creation should succeed");
  });

  test("first booking wins (200), double-booking is rejected (409)", async () => {
    const first = await req(`/slots/${slotId}/book`, {
      method: "POST",
      token: memberToken,
      body: { topic: "اختبار حجز موعد", message: "" },
    });
    assert.equal(first.status, 200);
    assert.ok(first.json.session?.id, "a confirmed session is created");

    const second = await req(`/slots/${slotId}/book`, {
      method: "POST",
      token: memberToken,
      body: { topic: "محاولة ثانية", message: "" },
    });
    assert.equal(second.status, 409, "the slot is already taken");
  });

  test("booking a non-existent slot → 404", async () => {
    const r = await req("/slots/999999999/book", {
      method: "POST",
      token: memberToken,
      body: { topic: "موعد غير موجود", message: "" },
    });
    assert.equal(r.status, 404);
  });
});
