import { Router, type IRouter, type Request } from "express";
import { and, eq, isNull, inArray, gte, lte, desc } from "drizzle-orm";
import {
  db,
  usersTable,
  adminUsersTable,
  attendanceSessionsTable,
  staffAttendanceSessionsTable,
  leaveRequestsTable,
  attendanceMarksTable,
  createLeaveRequestSchema,
  decideLeaveSchema,
  upsertMarkSchema,
  LEAVE_KIND_LABELS,
  type AttendanceActor,
  type AttendanceMarkStatus,
} from "@workspace/db";
import { requireUser, requireAdmin, getAdmin, type UserSession } from "../lib/auth";
import { logger } from "../lib/logger";
import { writeAudit } from "../lib/audit";

const router: IRouter = Router();

// ── small helpers ────────────────────────────────────────────────────────────
const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const hoursBetween = (a: Date, b: Date): number =>
  Math.round(((b.getTime() - a.getTime()) / 3.6e6) * 10) / 10;

/** local YYYY-MM-DD for a Date (server tz). */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const AR_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

// The member-portal UI vocabulary (types/member.ts AttendanceStatus).
type UiStatus = "حاضر" | "غائب" | "إجازة" | "في الحاضنة الآن";

/**
 * Build a per-day timeline + monthly summary for ONE actor, in the shape the
 * existing member dashboard already renders (WeeklySchedule). Presence and hours
 * come from real sessions; "إجازة" from approved leave; a manager mark overrides.
 * Nothing fabricates an absence — a past day with no record shows غائب only when
 * it is a working day (Friday is the Gaza rest day).
 */
async function buildTimeline(
  actor: AttendanceActor,
  actorId: number,
  now: Date,
) {
  const sessionsTable =
    actor === "member" ? attendanceSessionsTable : staffAttendanceSessionsTable;
  const ownerCol =
    actor === "member"
      ? attendanceSessionsTable.userId
      : staffAttendanceSessionsTable.adminUserId;

  // window: first day of this month … today (covers both the week strip and the
  // monthly summary in one fetch).
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const sessions = await db
    .select({
      checkInAt: sessionsTable.checkInAt,
      checkOutAt: sessionsTable.checkOutAt,
    })
    .from(sessionsTable)
    .where(and(eq(ownerCol, actorId), gte(sessionsTable.checkInAt, monthStart)))
    .orderBy(sessionsTable.checkInAt);

  const leaves = await db
    .select({
      startDate: leaveRequestsTable.startDate,
      endDate: leaveRequestsTable.endDate,
      kind: leaveRequestsTable.kind,
    })
    .from(leaveRequestsTable)
    .where(
      and(
        eq(leaveRequestsTable.actorKind, actor),
        eq(leaveRequestsTable.actorId, actorId),
        eq(leaveRequestsTable.status, "approved"),
      ),
    );

  const marks = await db
    .select({ day: attendanceMarksTable.day, status: attendanceMarksTable.status })
    .from(attendanceMarksTable)
    .where(
      and(
        eq(attendanceMarksTable.actorKind, actor),
        eq(attendanceMarksTable.actorId, actorId),
        gte(attendanceMarksTable.day, ymd(monthStart)),
      ),
    );

  // index by day
  const byDay = new Map<
    string,
    { in: Date | null; out: Date | null; open: boolean; hours: number }
  >();
  for (const s of sessions) {
    const key = ymd(new Date(s.checkInAt));
    const cur = byDay.get(key) ?? { in: null, out: null, open: false, hours: 0 };
    const inAt = new Date(s.checkInAt);
    if (!cur.in || inAt < cur.in) cur.in = inAt;
    if (s.checkOutAt) {
      const outAt = new Date(s.checkOutAt);
      if (!cur.out || outAt > cur.out) cur.out = outAt;
      cur.hours += hoursBetween(inAt, outAt);
    } else {
      cur.open = true;
    }
    byDay.set(key, cur);
  }
  const markByDay = new Map(marks.map((m) => [m.day, m.status]));
  const leaveByDay = (day: string) =>
    leaves.find((l) => day >= l.startDate && day <= l.endDate) ?? null;

  const todayKey = ymd(now);
  function resolve(day: string, dow: number): {
    status: UiStatus;
    checkin: string | null;
    checkout: string | null;
    hours: number | null;
  } {
    const sess = byDay.get(day);
    const fmt = (d: Date | null) =>
      d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : null;
    if (sess?.open && day === todayKey)
      return { status: "في الحاضنة الآن", checkin: fmt(sess.in), checkout: null, hours: sess.hours || null };
    const mark = markByDay.get(day);
    if (mark === "absent") return { status: "غائب", checkin: null, checkout: null, hours: 0 };
    if (mark === "excused" || mark === "holiday")
      return { status: "إجازة", checkin: null, checkout: null, hours: 0 };
    if (sess && (sess.out || sess.hours > 0 || mark === "present"))
      return { status: "حاضر", checkin: fmt(sess.in), checkout: fmt(sess.out), hours: sess.hours || null };
    if (mark === "present")
      return { status: "حاضر", checkin: null, checkout: null, hours: null };
    if (leaveByDay(day)) return { status: "إجازة", checkin: null, checkout: null, hours: 0 };
    if (dow === 5) return { status: "إجازة", checkin: null, checkout: null, hours: 0 }; // Friday rest
    if (day < todayKey) return { status: "غائب", checkin: null, checkout: null, hours: 0 };
    return { status: "غائب", checkin: null, checkout: null, hours: null }; // future/today, no record yet
  }

  // week strip: the 7 days ending today
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = ymd(d);
    const r = resolve(key, d.getDay());
    days.push({ day: AR_DAYS[d.getDay()], date: String(d.getDate()), ...r });
  }
  const weekLabel = `${days[0].date} — ${days[6].date} ${AR_MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  // monthly summary over month-start … today
  let present = 0, absent = 0, holiday = 0, totalHours = 0;
  for (let d = new Date(monthStart); d <= now; d.setDate(d.getDate() + 1)) {
    const key = ymd(d);
    const r = resolve(key, d.getDay());
    if (r.status === "حاضر" || r.status === "في الحاضنة الآن") present++;
    else if (r.status === "إجازة") holiday++;
    else if (r.status === "غائب" && key < todayKey) absent++;
    totalHours += r.hours ?? 0;
  }

  return {
    week: weekLabel,
    days,
    monthlySummary: { present, absent, holiday, totalHours: Math.round(totalHours) },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMBER  (requireUser)
// ═══════════════════════════════════════════════════════════════════════════

// GET /attendance/history — the member's own week + monthly summary (real data
// replacing the old dashboard mock).
router.get("/attendance/history", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const timeline = await buildTimeline("member", session.userId, new Date());
    return res.json(timeline);
  } catch (err) {
    logger.error({ err }, "GET /attendance/history failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// GET /leave/mine — the member's own leave requests.
router.get("/leave/mine", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    const rows = await listLeaveFor("member", session.userId);
    return res.json({ requests: rows });
  } catch (err) {
    logger.error({ err }, "GET /leave/mine failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /leave — the member files a leave request.
router.post("/leave", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    return await createLeave(res, "member", session.userId, req.body);
  } catch (err) {
    logger.error({ err }, "POST /leave failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /leave/:id/cancel — the member cancels their own pending request.
router.post("/leave/:id/cancel", requireUser, async (req, res) => {
  try {
    const session = (req as Request & { userSession: UserSession }).userSession;
    return await cancelLeave(res, "member", session.userId, Number(req.params.id));
  } catch (err) {
    logger.error({ err }, "POST /leave/:id/cancel failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// STAFF SELF-SERVICE  (/admin/my-attendance/* — any authenticated admin)
// The ENV bootstrap super-admin (id 0) has no admin_users row, so it cannot hold
// a staff session; it is asked to use a real account.
// ═══════════════════════════════════════════════════════════════════════════

function staffId(req: Request): number | null {
  const me = getAdmin(req);
  if (!me || me.id === 0) return null;
  return me.id;
}

// GET /admin/my-attendance — my present state + my week + my leave requests.
router.get("/admin/my-attendance", requireAdmin, async (req, res) => {
  try {
    const id = staffId(req);
    // The ENV bootstrap super-admin has no staff record. Return a clean 200 flag
    // (not a 400) so the UI can show a friendly note instead of the api() helper
    // throwing and the page falling back to a check-in button that would no-op.
    if (id === null) return res.json({ isRoot: true, present: false });
    const [open] = await db
      .select({ checkInAt: staffAttendanceSessionsTable.checkInAt })
      .from(staffAttendanceSessionsTable)
      .where(and(eq(staffAttendanceSessionsTable.adminUserId, id), isNull(staffAttendanceSessionsTable.checkOutAt)))
      .limit(1);
    const timeline = await buildTimeline("staff", id, new Date());
    const leave = await listLeaveFor("staff", id);
    return res.json({ present: !!open, since: iso(open?.checkInAt ?? null), ...timeline, leave });
  } catch (err) {
    logger.error({ err }, "GET /admin/my-attendance failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /admin/my-attendance/check-in — idempotent.
router.post("/admin/my-attendance/check-in", requireAdmin, async (req, res) => {
  try {
    const id = staffId(req);
    if (id === null)
      return res.status(400).json({ error: "حساب المدير الجذر لا يسجّل حضورًا — استخدم حسابًا حقيقيًّا" });
    const [existing] = await db
      .select({ checkInAt: staffAttendanceSessionsTable.checkInAt })
      .from(staffAttendanceSessionsTable)
      .where(and(eq(staffAttendanceSessionsTable.adminUserId, id), isNull(staffAttendanceSessionsTable.checkOutAt)))
      .limit(1);
    if (existing) return res.json({ present: true, since: iso(existing.checkInAt) });
    const [row] = await db
      .insert(staffAttendanceSessionsTable)
      .values({ adminUserId: id })
      .returning({ checkInAt: staffAttendanceSessionsTable.checkInAt });
    return res.json({ present: true, since: iso(row.checkInAt) });
  } catch (err) {
    logger.error({ err }, "POST /admin/my-attendance/check-in failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /admin/my-attendance/check-out — no-op if not present.
router.post("/admin/my-attendance/check-out", requireAdmin, async (req, res) => {
  try {
    const id = staffId(req);
    if (id === null)
      return res.status(400).json({ error: "حساب المدير الجذر لا يسجّل حضورًا — استخدم حسابًا حقيقيًّا" });
    await db
      .update(staffAttendanceSessionsTable)
      .set({ checkOutAt: new Date() })
      .where(and(eq(staffAttendanceSessionsTable.adminUserId, id), isNull(staffAttendanceSessionsTable.checkOutAt)));
    return res.json({ present: false });
  } catch (err) {
    logger.error({ err }, "POST /admin/my-attendance/check-out failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /admin/my-attendance/leave — a staff member files leave.
router.post("/admin/my-attendance/leave", requireAdmin, async (req, res) => {
  try {
    const id = staffId(req);
    if (id === null)
      return res.status(400).json({ error: "حساب المدير الجذر لا يقدّم طلبات — استخدم حسابًا حقيقيًّا" });
    return await createLeave(res, "staff", id, req.body);
  } catch (err) {
    logger.error({ err }, "POST /admin/my-attendance/leave failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /admin/my-attendance/leave/:id/cancel
router.post("/admin/my-attendance/leave/:id/cancel", requireAdmin, async (req, res) => {
  try {
    const id = staffId(req);
    if (id === null) return res.status(400).json({ error: "غير متاح لحساب المدير الجذر" });
    return await cancelLeave(res, "staff", id, Number(req.params.id));
  } catch (err) {
    logger.error({ err }, "POST /admin/my-attendance/leave/:id/cancel failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// MANAGER  (/admin/attendance/* — gated attendance:view / attendance:manage by adminGate)
// ═══════════════════════════════════════════════════════════════════════════

// GET /admin/attendance/report?day=YYYY-MM-DD — unified day report: every active
// member and staff member, with their resolved status for that day.
router.get("/admin/attendance/report", async (req, res) => {
  try {
    const day = typeof req.query.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.day)
      ? req.query.day
      : ymd(new Date());
    const dayStart = new Date(`${day}T00:00:00`);
    const dayEnd = new Date(`${day}T23:59:59.999`);

    const [members, staff] = await Promise.all([
      db.select({ id: usersTable.id, fullName: usersTable.fullName, role: usersTable.role })
        .from(usersTable).where(eq(usersTable.status, "active")),
      db.select({ id: adminUsersTable.id, fullName: adminUsersTable.fullName, role: adminUsersTable.role })
        .from(adminUsersTable).where(eq(adminUsersTable.status, "active")),
    ]);

    const [memberSessions, staffSessions, dayLeaves, dayMarks] = await Promise.all([
      db.select({ userId: attendanceSessionsTable.userId, in: attendanceSessionsTable.checkInAt, out: attendanceSessionsTable.checkOutAt })
        .from(attendanceSessionsTable)
        .where(and(gte(attendanceSessionsTable.checkInAt, dayStart), lte(attendanceSessionsTable.checkInAt, dayEnd))),
      db.select({ adminUserId: staffAttendanceSessionsTable.adminUserId, in: staffAttendanceSessionsTable.checkInAt, out: staffAttendanceSessionsTable.checkOutAt })
        .from(staffAttendanceSessionsTable)
        .where(and(gte(staffAttendanceSessionsTable.checkInAt, dayStart), lte(staffAttendanceSessionsTable.checkInAt, dayEnd))),
      db.select({ actorKind: leaveRequestsTable.actorKind, actorId: leaveRequestsTable.actorId, kind: leaveRequestsTable.kind })
        .from(leaveRequestsTable)
        .where(and(eq(leaveRequestsTable.status, "approved"), lte(leaveRequestsTable.startDate, day), gte(leaveRequestsTable.endDate, day))),
      db.select({ actorKind: attendanceMarksTable.actorKind, actorId: attendanceMarksTable.actorId, status: attendanceMarksTable.status, note: attendanceMarksTable.note })
        .from(attendanceMarksTable).where(eq(attendanceMarksTable.day, day)),
    ]);

    const key = (k: string, id: number) => `${k}:${id}`;
    const sessMap = new Map<string, { in: Date; out: Date | null }>();
    for (const s of memberSessions) sessMap.set(key("member", s.userId), { in: new Date(s.in), out: s.out ? new Date(s.out) : null });
    for (const s of staffSessions) sessMap.set(key("staff", s.adminUserId), { in: new Date(s.in), out: s.out ? new Date(s.out) : null });
    const leaveMap = new Map(dayLeaves.map((l) => [key(l.actorKind, l.actorId), l.kind]));
    const markMap = new Map(dayMarks.map((m) => [key(m.actorKind, m.actorId), { status: m.status, note: m.note }]));

    const isFriday = new Date(`${day}T12:00:00`).getDay() === 5;
    const today = ymd(new Date());

    function row(actor: AttendanceActor, p: { id: number; fullName: string; role: string }) {
      const k = key(actor, p.id);
      const sess = sessMap.get(k);
      const mark = markMap.get(k);
      const leave = leaveMap.get(k);
      let status: "present" | "here-now" | "leave" | "absent" | "excused" | "holiday" | "none";
      let note = "";
      if (mark) { status = mark.status as AttendanceMarkStatus; note = mark.note; }
      else if (leave) { status = "leave"; note = LEAVE_KIND_LABELS[leave]; }
      else if (sess && !sess.out) status = "here-now";
      else if (sess) status = "present";
      else if (isFriday) status = "holiday";
      else if (day < today) status = "absent";
      else status = "none";
      const hours = sess && sess.out ? hoursBetween(sess.in, sess.out) : null;
      return {
        actor, id: p.id, name: p.fullName, role: p.role, status, note,
        checkIn: sess ? iso(sess.in) : null, checkOut: sess?.out ? iso(sess.out) : null, hours,
      };
    }

    const memberRows = members.map((m) => row("member", m));
    const staffRows = staff.map((s) => row("staff", s));
    const all = [...staffRows, ...memberRows];
    const count = (arr: typeof all, s: string) => arr.filter((r) => r.status === s).length;
    const presentOf = (arr: typeof all) => arr.filter((r) => r.status === "present" || r.status === "here-now").length;

    return res.json({
      day,
      staff: staffRows,
      members: memberRows,
      totals: {
        staff: { total: staffRows.length, present: presentOf(staffRows), absent: count(staffRows, "absent"), leave: count(staffRows, "leave") },
        members: { total: memberRows.length, present: presentOf(memberRows), absent: count(memberRows, "absent"), leave: count(memberRows, "leave") },
      },
    });
  } catch (err) {
    logger.error({ err }, "GET /admin/attendance/report failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /admin/attendance/mark — a manager sets/overrides an actor's daily status.
router.post("/admin/attendance/mark", async (req, res) => {
  try {
    const me = getAdmin(req);
    const parsed = upsertMarkSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" });
    const { actorKind, actorId, day, status, note } = parsed.data;
    if (!(await actorExists(actorKind, actorId)))
      return res.status(404).json({ error: "الشخص غير موجود" });

    await db
      .insert(attendanceMarksTable)
      .values({ actorKind, actorId, day, status, note, markedById: me?.id ?? 0 })
      .onConflictDoUpdate({
        target: [attendanceMarksTable.actorKind, attendanceMarksTable.actorId, attendanceMarksTable.day],
        set: { status, note, markedById: me?.id ?? 0, updatedAt: new Date() },
      });
    await writeAudit({ actor: me?.email ?? "admin", action: "attendance_marked", targetType: actorKind, targetId: String(actorId), newValue: JSON.stringify({ day, status }) });
    return res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /admin/attendance/mark failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// GET /admin/attendance/leave?status=pending — the approval queue (all actors).
router.get("/admin/attendance/leave", async (req, res) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : "pending";
    const rows = await db
      .select()
      .from(leaveRequestsTable)
      .where(status === "all" ? undefined : eq(leaveRequestsTable.status, status as never))
      .orderBy(desc(leaveRequestsTable.createdAt))
      .limit(200);
    // resolve actor names in one pass per realm
    const memberIds = rows.filter((r) => r.actorKind === "member").map((r) => r.actorId);
    const staffIds = rows.filter((r) => r.actorKind === "staff").map((r) => r.actorId);
    const [mNames, sNames] = await Promise.all([
      memberIds.length ? db.select({ id: usersTable.id, name: usersTable.fullName }).from(usersTable).where(inArray(usersTable.id, memberIds)) : Promise.resolve([]),
      staffIds.length ? db.select({ id: adminUsersTable.id, name: adminUsersTable.fullName }).from(adminUsersTable).where(inArray(adminUsersTable.id, staffIds)) : Promise.resolve([]),
    ]);
    const nameOf = new Map([...mNames.map((n) => [`member:${n.id}`, n.name] as const), ...sNames.map((n) => [`staff:${n.id}`, n.name] as const)]);
    return res.json({
      requests: rows.map((r) => ({
        ...r,
        actorName: nameOf.get(`${r.actorKind}:${r.actorId}`) ?? "—",
        kindLabel: LEAVE_KIND_LABELS[r.kind],
        createdAt: iso(r.createdAt),
        reviewedAt: iso(r.reviewedAt),
      })),
    });
  } catch (err) {
    logger.error({ err }, "GET /admin/attendance/leave failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /admin/attendance/leave/:id/decide — approve or reject.
router.post("/admin/attendance/leave/:id/decide", async (req, res) => {
  try {
    const me = getAdmin(req);
    const parsed = decideLeaveSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" });
    const id = Number(req.params.id);
    const [row] = await db.select().from(leaveRequestsTable).where(eq(leaveRequestsTable.id, id)).limit(1);
    if (!row) return res.status(404).json({ error: "الطلب غير موجود" });
    if (row.status !== "pending") return res.status(409).json({ error: "الطلب لم يعد قيد المراجعة" });
    await db
      .update(leaveRequestsTable)
      .set({ status: parsed.data.decision, decisionNote: parsed.data.decisionNote, reviewedById: me?.id ?? 0, reviewedAt: new Date() })
      .where(eq(leaveRequestsTable.id, id));
    await writeAudit({ actor: me?.email ?? "admin", action: `leave_${parsed.data.decision}`, targetType: "leave_request", targetId: String(id) });
    return res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /admin/attendance/leave/:id/decide failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ── shared helpers (leave create / cancel / list, actor existence) ────────────
async function actorExists(kind: AttendanceActor, id: number): Promise<boolean> {
  if (kind === "member") {
    const [r] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    return !!r;
  }
  const [r] = await db.select({ id: adminUsersTable.id }).from(adminUsersTable).where(eq(adminUsersTable.id, id)).limit(1);
  return !!r;
}

async function listLeaveFor(actor: AttendanceActor, actorId: number) {
  const rows = await db
    .select()
    .from(leaveRequestsTable)
    .where(and(eq(leaveRequestsTable.actorKind, actor), eq(leaveRequestsTable.actorId, actorId)))
    .orderBy(desc(leaveRequestsTable.createdAt))
    .limit(50);
  return rows.map((r) => ({
    ...r,
    kindLabel: LEAVE_KIND_LABELS[r.kind],
    createdAt: iso(r.createdAt),
    reviewedAt: iso(r.reviewedAt),
  }));
}

async function createLeave(
  res: Parameters<Parameters<typeof router.post>[1]>[1],
  actor: AttendanceActor,
  actorId: number,
  body: unknown,
) {
  const parsed = createLeaveRequestSchema.safeParse(body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" });
  const [row] = await db
    .insert(leaveRequestsTable)
    .values({ actorKind: actor, actorId, ...parsed.data })
    .returning({ id: leaveRequestsTable.id });
  return res.json({ ok: true, id: row.id });
}

async function cancelLeave(
  res: Parameters<Parameters<typeof router.post>[1]>[1],
  actor: AttendanceActor,
  actorId: number,
  id: number,
) {
  const [row] = await db.select().from(leaveRequestsTable).where(eq(leaveRequestsTable.id, id)).limit(1);
  if (!row || row.actorKind !== actor || row.actorId !== actorId)
    return res.status(404).json({ error: "الطلب غير موجود" });
  if (row.status !== "pending")
    return res.status(409).json({ error: "لا يمكن إلغاء طلبٍ تمّت مراجعته" });
  await db.update(leaveRequestsTable).set({ status: "cancelled" }).where(eq(leaveRequestsTable.id, id));
  return res.json({ ok: true });
}

export default router;
