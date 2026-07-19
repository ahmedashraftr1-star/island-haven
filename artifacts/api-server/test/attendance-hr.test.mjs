// Black-box integration tests for the STAFF + MEMBER attendance / absence / leave
// system (routes/attendanceHr.ts). Runs against a LIVE server (default
// http://localhost:3001) — no app imports, no DATABASE_URL coupling.
//
//   pnpm test          (server must be running the current build)
//
// SELF-PROVISIONING: this suite registers its OWN throwaway member and creates its
// OWN throwaway staff account, so it never depends on specific seed credentials and
// never mutates real seeded people. It cleans the staff account up at the end.
//
// Env: API_BASE, TEST_ADMIN_USER, TEST_ADMIN_PASS.

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.API_BASE ?? "http://localhost:3001/api";
const ADMIN_USER = process.env.TEST_ADMIN_USER ?? "ahmedashraf";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? "ahmedadmin$$";

const stamp = Date.now();
const MEMBER_EMAIL = `attn-hr-member-${stamp}@example.com`;
const STAFF_EMAIL = `attn-hr-staff-${stamp}@example.com`;
const PW = "AttnHr#2026test";

function ymd(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const TODAY = ymd();

let adminToken = ""; // env super-admin
let memberToken = "";
let memberId = 0;
let staffToken = "";
let staffId = 0;

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
  const a = await req("/admin/login", { method: "POST", body: { username: ADMIN_USER, password: ADMIN_PASS } });
  assert.equal(a.status, 200, "admin login should succeed — is the server running & seeded?");
  adminToken = a.json.token;
  assert.ok(adminToken, "admin login returns a token");

  // Throwaway member.
  const reg = await req("/auth/register", {
    method: "POST",
    body: { fullName: "عضو اختبار الحضور", email: MEMBER_EMAIL, password: PW, role: "freelancer" },
  });
  assert.ok(reg.status === 200 || reg.status === 201, "member registers");
  const ml = await req("/auth/login", { method: "POST", body: { email: MEMBER_EMAIL, password: PW } });
  assert.equal(ml.status, 200, "member logs in");
  memberToken = ml.json.token;
  const me = await req("/auth/me", { token: memberToken });
  memberId = me.json.user.id;
  assert.ok(memberId > 0, "member has a numeric id");

  // Throwaway staff account. `analyst` is the least-privileged preset (overview /
  // analytics / audit / impact view only — NO attendance permission at all), which
  // is exactly the point: self check-in must work for ANY authenticated admin, and
  // the manager report must stay closed to a role without attendance:view.
  const cs = await req("/admin/staff", {
    method: "POST",
    token: adminToken,
    body: { fullName: "موظّف اختبار الحضور", email: STAFF_EMAIL, password: PW, role: "analyst" },
  });
  assert.ok(cs.status === 200 || cs.status === 201, `staff account created (got ${cs.status})`);
  staffId = cs.json.member?.id ?? cs.json.id;
  assert.ok(staffId > 0, "created staff carries an id");
  const sl = await req("/admin/login", { method: "POST", body: { email: STAFF_EMAIL, password: PW } });
  assert.equal(sl.status, 200, "staff logs in");
  staffToken = sl.json.token;
  assert.ok(staffToken, "staff login returns a token");
});

after(async () => {
  // Best-effort cleanup: check the staff out, then delete BOTH throwaway
  // accounts. The member registers as a public `active` user, so leaving it
  // behind pollutes /members + the homepage — and with a Date.now()-stamped
  // email these would otherwise pile up one-per-run in the shared dev DB.
  await req("/admin/my-attendance/check-out", { method: "POST", token: staffToken }).catch(() => {});
  if (staffId) await req(`/admin/staff/${staffId}`, { method: "DELETE", token: adminToken }).catch(() => {});
  if (memberId) await req(`/admin/users/${memberId}`, { method: "DELETE", token: adminToken }).catch(() => {});
});

// ─────────────────────────────────────────────────────────────────────────────
describe("auth gates", () => {
  test("unauthenticated cannot file leave", async () => {
    const r = await req("/leave", { method: "POST", body: { kind: "leave", startDate: TODAY, endDate: TODAY } });
    assert.equal(r.status, 401);
  });

  test("a member cannot read the manager report", async () => {
    const r = await req("/admin/attendance/report", { token: memberToken });
    assert.ok(r.status === 401 || r.status === 403, `member is refused (got ${r.status})`);
  });

  test("a non-manager staffer cannot read the manager report", async () => {
    // support role lacks attendance:view → adminGate 403.
    const r = await req("/admin/attendance/report", { token: staffToken });
    assert.equal(r.status, 403);
  });

  test("but a staffer CAN reach their own self-service", async () => {
    const r = await req("/admin/my-attendance", { token: staffToken });
    assert.equal(r.status, 200, "self-service needs only authentication, not attendance:manage");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("member leave workflow", () => {
  let leaveId = 0;

  test("member files a leave request → pending, owned by them", async () => {
    const r = await req("/leave", {
      method: "POST",
      token: memberToken,
      body: { kind: "sick", startDate: TODAY, endDate: TODAY, reason: "اختبار" },
    });
    assert.equal(r.status, 200);
    assert.ok(r.json.id > 0);
    leaveId = r.json.id;

    const mine = await req("/leave/mine", { token: memberToken });
    assert.equal(mine.status, 200);
    const found = mine.json.requests.find((x) => x.id === leaveId);
    assert.ok(found, "the request appears in the member's own list");
    assert.equal(found.status, "pending");
    assert.equal(found.actorKind, "member");
    assert.equal(found.actorId, memberId, "actor is the caller, never forged from the body");
  });

  test("endDate before startDate is rejected", async () => {
    const r = await req("/leave", {
      method: "POST",
      token: memberToken,
      body: { kind: "leave", startDate: "2026-07-20", endDate: "2026-07-10" },
    });
    assert.equal(r.status, 400);
  });

  test("manager sees the pending request with the member's real name", async () => {
    const q = await req("/admin/attendance/leave?status=pending", { token: adminToken });
    assert.equal(q.status, 200);
    const row = q.json.requests.find((x) => x.id === leaveId);
    assert.ok(row, "request is in the queue");
    assert.equal(row.actorName, "عضو اختبار الحضور");
    assert.equal(row.kindLabel, "إجازة مرضيّة");
  });

  test("manager approves → member sees it approved, and it lands on their week", async () => {
    const d = await req(`/admin/attendance/leave/${leaveId}/decide`, {
      method: "POST",
      token: adminToken,
      body: { decision: "approved", decisionNote: "مقبول" },
    });
    assert.equal(d.status, 200);

    const mine = await req("/leave/mine", { token: memberToken });
    assert.equal(mine.json.requests.find((x) => x.id === leaveId).status, "approved");

    const hist = await req("/attendance/history", { token: memberToken });
    assert.equal(hist.status, 200);
    const todayCell = hist.json.days.find((x) => x.status === "إجازة");
    assert.ok(todayCell, "an approved leave day shows as إجازة on the week strip");
  });

  test("re-deciding an already-decided request is a 409", async () => {
    const d = await req(`/admin/attendance/leave/${leaveId}/decide`, {
      method: "POST",
      token: adminToken,
      body: { decision: "rejected" },
    });
    assert.equal(d.status, 409);
  });

  test("a member cannot cancel a request that was already decided", async () => {
    const c = await req(`/leave/${leaveId}/cancel`, { method: "POST", token: memberToken });
    assert.equal(c.status, 409);
  });

  test("a member CAN cancel their own still-pending request", async () => {
    const made = await req("/leave", {
      method: "POST",
      token: memberToken,
      body: { kind: "personal", startDate: "2026-08-01", endDate: "2026-08-02" },
    });
    const c = await req(`/leave/${made.json.id}/cancel`, { method: "POST", token: memberToken });
    assert.equal(c.status, 200);
    const mine = await req("/leave/mine", { token: memberToken });
    assert.equal(mine.json.requests.find((x) => x.id === made.json.id).status, "cancelled");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("member history is honest", () => {
  test("shape: week + 7 days + monthly summary", async () => {
    const h = await req("/attendance/history", { token: memberToken });
    assert.equal(h.status, 200);
    assert.ok(typeof h.json.week === "string");
    assert.equal(h.json.days.length, 7);
    for (const k of ["present", "absent", "holiday", "totalHours"])
      assert.ok(typeof h.json.monthlySummary[k] === "number", `summary has ${k}`);
  });

  test("Friday is a rest day (إجازة), never counted as absent", async () => {
    const h = await req("/attendance/history", { token: memberToken });
    // find the Friday cell in the week strip (Arabic day name)
    const fri = h.json.days.find((d) => d.day === "الجمعة");
    assert.ok(fri, "the week strip includes a Friday");
    assert.equal(fri.status, "إجازة");
  });

  test("no fabricated presence: a member with no sessions is never 'حاضر'", async () => {
    // This member has never checked in, so not a single day may read حاضر / في الحاضنة الآن.
    const h = await req("/attendance/history", { token: memberToken });
    const present = h.json.days.filter((d) => d.status === "حاضر" || d.status === "في الحاضنة الآن");
    assert.equal(present.length, 0, "presence is only ever real, never invented");
    assert.equal(h.json.monthlySummary.present, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("staff self check-in", () => {
  test("starts not-present, then check-in flips to present and shows in the report", async () => {
    const before = await req("/admin/my-attendance", { token: staffToken });
    assert.equal(before.status, 200);
    assert.equal(before.json.present, false);

    const ci = await req("/admin/my-attendance/check-in", { method: "POST", token: staffToken });
    assert.equal(ci.status, 200);
    assert.equal(ci.json.present, true);
    assert.ok(ci.json.since, "check-in returns a timestamp");

    const rep = await req(`/admin/attendance/report?day=${TODAY}`, { token: adminToken });
    assert.equal(rep.status, 200);
    const me = rep.json.staff.find((s) => s.id === staffId);
    assert.ok(me, "the staffer is in the staff roster of the report");
    assert.ok(me.status === "here-now" || me.status === "present", `present in report (got ${me.status})`);
  });

  test("check-in is idempotent (no duplicate open session)", async () => {
    const again = await req("/admin/my-attendance/check-in", { method: "POST", token: staffToken });
    assert.equal(again.status, 200);
    assert.equal(again.json.present, true);
  });

  test("check-out flips back to not-present", async () => {
    const co = await req("/admin/my-attendance/check-out", { method: "POST", token: staffToken });
    assert.equal(co.status, 200);
    assert.equal(co.json.present, false);
    const after = await req("/admin/my-attendance", { token: staffToken });
    assert.equal(after.json.present, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("the ENV root-admin has no staff attendance", () => {
  test("GET my-attendance reports isRoot, POST check-in is refused", async () => {
    const g = await req("/admin/my-attendance", { token: adminToken });
    assert.equal(g.status, 200);
    assert.equal(g.json.isRoot, true);

    const ci = await req("/admin/my-attendance/check-in", { method: "POST", token: adminToken });
    assert.equal(ci.status, 400, "the id-0 bootstrap admin cannot hold a staff session");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("manager daily marks", () => {
  test("a mark sets the member's status, and re-marking the same day UPSERTS (no dup)", async () => {
    const day = TODAY;
    const m1 = await req("/admin/attendance/mark", {
      method: "POST",
      token: adminToken,
      body: { actorKind: "member", actorId: memberId, day, status: "present", note: "أوّل" },
    });
    assert.equal(m1.status, 200);

    // NOTE: today also has an approved leave for this member from the leave suite,
    // but a manager MARK overrides leave in the resolver — so the report must read
    // the mark, and marking again must replace it, not stack.
    const m2 = await req("/admin/attendance/mark", {
      method: "POST",
      token: adminToken,
      body: { actorKind: "member", actorId: memberId, day, status: "absent", note: "ثانٍ" },
    });
    assert.equal(m2.status, 200);

    const rep = await req(`/admin/attendance/report?day=${day}`, { token: adminToken });
    const row = rep.json.members.find((x) => x.id === memberId);
    assert.ok(row, "member is in the report");
    assert.equal(row.status, "absent", "the latest mark wins (upsert, not append)");
    assert.equal(row.note, "ثانٍ");
  });

  test("marking a non-existent actor is a 404", async () => {
    const r = await req("/admin/attendance/mark", {
      method: "POST",
      token: adminToken,
      body: { actorKind: "member", actorId: 999999999, day: TODAY, status: "present" },
    });
    assert.equal(r.status, 404);
  });
});
