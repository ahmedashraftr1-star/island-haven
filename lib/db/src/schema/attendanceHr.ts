import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { adminUsersTable } from "./adminUsers";

/**
 * The HR / absence layer that sits ON TOP OF the member seat-attendance in
 * `attendance.ts`. Three concerns the base system never modelled:
 *
 *   1. STAFF presence — the incubator's own team are `admin_users`, NOT `users`,
 *      and they are not seat-bound. They get their own self-serve check-in.
 *   2. LEAVE — a request→approval workflow (إجازة) for BOTH members and staff.
 *   3. MANAGER MARKS — an authoritative daily status a manager sets when the
 *      self-serve record is wrong or missing (present / absent / excused).
 *
 * MEMBERS and STAFF live in two separate identity tables (`users` vs
 * `admin_users`) with no shared key, so the cross-cutting tables (leave, marks)
 * are POLYMORPHIC: (`actor_kind`, `actor_id`) instead of a foreign key. The API
 * validates that the referenced row exists in the right table. Staff presence,
 * being single-realm, keeps a real FK to `admin_users`.
 */

// Which identity table an actor_id points into.
export const ATTENDANCE_ACTORS = ["member", "staff"] as const;
export type AttendanceActor = (typeof ATTENDANCE_ACTORS)[number];

// A manager's authoritative daily status. "leave" is deliberately NOT here — an
// approved leave request is the single source of truth for leave, so it can't
// drift from a separate mark.
export const ATTENDANCE_MARK_STATUSES = [
  "present",
  "absent",
  "excused",
  "holiday",
] as const;
export type AttendanceMarkStatus = (typeof ATTENDANCE_MARK_STATUSES)[number];

export const ATTENDANCE_MARK_LABELS: Record<AttendanceMarkStatus, string> = {
  present: "حاضر",
  absent: "غائب",
  excused: "معذور",
  holiday: "عطلة",
};

export const LEAVE_KINDS = ["leave", "sick", "personal"] as const;
export type LeaveKind = (typeof LEAVE_KINDS)[number];

export const LEAVE_KIND_LABELS: Record<LeaveKind, string> = {
  leave: "إجازة",
  sick: "إجازة مرضيّة",
  personal: "ظرفٌ خاصّ",
};

export const LEAVE_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "قيد المراجعة",
  approved: "معتمدة",
  rejected: "مرفوضة",
  cancelled: "ملغاة",
};

/**
 * staff_attendance_sessions — the staff mirror of `attendance_sessions`. A staff
 * member opens a session on check-in (check_out_at NULL = present now) and closes
 * it on check-out. FK → admin_users; at most one open session per staffer, so
 * "present" is a single unambiguous state, exactly like the member table.
 */
export const staffAttendanceSessionsTable = pgTable(
  "staff_attendance_sessions",
  {
    id: serial("id").primaryKey(),
    adminUserId: integer("admin_user_id")
      .notNull()
      .references(() => adminUsersTable.id, { onDelete: "cascade" }),
    checkInAt: timestamp("check_in_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    checkOutAt: timestamp("check_out_at", { withTimezone: true }),
  },
  (t) => ({
    oneOpenPerStaff: uniqueIndex("staff_attendance_one_open_per_staff")
      .on(t.adminUserId)
      .where(sql`check_out_at IS NULL`),
    staffIdx: index("staff_attendance_staff_idx").on(t.adminUserId),
    openIdx: index("staff_attendance_open_idx")
      .on(t.checkInAt)
      .where(sql`check_out_at IS NULL`),
  }),
);

/**
 * leave_requests — a request→approval workflow, shared by members and staff via
 * the polymorphic (actor_kind, actor_id). An approved request is the single
 * source of truth for "on leave" on any day inside [start_date, end_date].
 */
export const leaveRequestsTable = pgTable(
  "leave_requests",
  {
    id: serial("id").primaryKey(),
    actorKind: varchar("actor_kind", { length: 8 })
      .notNull()
      .$type<AttendanceActor>(),
    actorId: integer("actor_id").notNull(),
    kind: varchar("kind", { length: 16 }).notNull().$type<LeaveKind>(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    reason: varchar("reason", { length: 600 }).default("").notNull(),
    status: varchar("status", { length: 12 })
      .notNull()
      .$type<LeaveStatus>()
      .default("pending"),
    // The admin who approved/rejected (admin_users.id). Null while pending.
    reviewedById: integer("reviewed_by_id"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    decisionNote: varchar("decision_note", { length: 600 }).default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    actorIdx: index("leave_requests_actor_idx").on(t.actorKind, t.actorId),
    statusIdx: index("leave_requests_status_idx").on(t.status),
    rangeIdx: index("leave_requests_range_idx").on(t.startDate, t.endDate),
  }),
);

/**
 * attendance_marks — a manager's authoritative daily status for one actor on one
 * day, used to correct or fill the self-serve record (e.g. someone was present
 * but forgot to check in, or was genuinely absent). One mark per actor per day.
 * Polymorphic like leave_requests.
 */
export const attendanceMarksTable = pgTable(
  "attendance_marks",
  {
    id: serial("id").primaryKey(),
    actorKind: varchar("actor_kind", { length: 8 })
      .notNull()
      .$type<AttendanceActor>(),
    actorId: integer("actor_id").notNull(),
    day: date("day").notNull(),
    status: varchar("status", { length: 12 })
      .notNull()
      .$type<AttendanceMarkStatus>(),
    note: varchar("note", { length: 600 }).default("").notNull(),
    markedById: integer("marked_by_id").notNull(), // admin_users.id
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    oneMarkPerDay: uniqueIndex("attendance_marks_one_per_day").on(
      t.actorKind,
      t.actorId,
      t.day,
    ),
    dayIdx: index("attendance_marks_day_idx").on(t.day),
  }),
);

// ── Validation ──
const reason = z.string().trim().max(600).regex(/^[^<>]*$/u, "رموز غير مسموح بها");
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "التاريخ يجب أن يكون YYYY-MM-DD");

// A member/staff requesting leave (actor is taken from the session, never trusted
// from the body).
export const createLeaveRequestSchema = z
  .object({
    kind: z.enum(LEAVE_KINDS),
    startDate: ymd,
    endDate: ymd,
    reason: reason.default(""),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "تاريخ النهاية يجب ألّا يسبق تاريخ البداية",
    path: ["endDate"],
  });

// A manager deciding a request.
export const decideLeaveSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  decisionNote: reason.default(""),
});

// A manager setting a daily status for an actor.
export const upsertMarkSchema = z.object({
  actorKind: z.enum(ATTENDANCE_ACTORS),
  actorId: z.coerce.number().int().positive(),
  day: ymd,
  status: z.enum(ATTENDANCE_MARK_STATUSES),
  note: reason.default(""),
});

export type StaffAttendanceSession =
  typeof staffAttendanceSessionsTable.$inferSelect;
export type LeaveRequest = typeof leaveRequestsTable.$inferSelect;
export type AttendanceMark = typeof attendanceMarksTable.$inferSelect;
