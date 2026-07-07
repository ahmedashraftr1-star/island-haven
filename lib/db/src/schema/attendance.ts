import {
  pgTable,
  serial,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { usersTable } from "./users";

// The physical incubator floor is a fixed 50-seat grid (mirrors the homepage
// SeatsBoard). Seat numbers run 1..TOTAL_SEATS.
export const TOTAL_SEATS = 50;

/**
 * seatAssignmentsTable — which REAL member is assigned to which physical seat.
 * History-preserving: releasing a seat sets `releasedAt` (a fresh row is
 * created on re-assignment) rather than deleting. Partial-unique indexes
 * guarantee at most ONE active assignment per seat AND per member (released
 * rows excluded). The occupant's name / specialty / avatar are read LIVE from
 * usersTable — never duplicated here, never invented.
 */
export const seatAssignmentsTable = pgTable(
  "seat_assignments",
  {
    id: serial("id").primaryKey(),
    seatNumber: integer("seat_number").notNull(), // 1..TOTAL_SEATS
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
  },
  (t) => ({
    // At most one ACTIVE assignment per seat / per member (released excluded).
    activeSeatUnique: uniqueIndex("seat_assignments_active_seat_unique")
      .on(t.seatNumber)
      .where(sql`released_at IS NULL`),
    activeUserUnique: uniqueIndex("seat_assignments_active_user_unique")
      .on(t.userId)
      .where(sql`released_at IS NULL`),
    userIdx: index("seat_assignments_user_idx").on(t.userId),
  }),
);

/**
 * attendanceSessionsTable — self-serve check-in / check-out (the owner's chosen
 * presence mechanism). A member opens a session on check-in (checkOutAt NULL =
 * present now) and closes it on check-out. A partial-unique index allows at
 * most ONE open session per member, so "present" is an unambiguous single
 * state. Closed rows accumulate as an honest attendance history.
 */
export const attendanceSessionsTable = pgTable(
  "attendance_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // The seat the member held at check-in time — a denormalized snapshot so
    // the history stays truthful even if the seat is later reassigned. Nullable:
    // a member may check in before an admin has assigned them a seat.
    seatNumber: integer("seat_number"),
    checkInAt: timestamp("check_in_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    checkOutAt: timestamp("check_out_at", { withTimezone: true }),
  },
  (t) => ({
    // At most one OPEN session per member → "present" is a single clear state.
    oneOpenPerUser: uniqueIndex("attendance_one_open_per_user")
      .on(t.userId)
      .where(sql`check_out_at IS NULL`),
    userIdx: index("attendance_user_idx").on(t.userId),
    openIdx: index("attendance_open_idx")
      .on(t.checkInAt)
      .where(sql`check_out_at IS NULL`),
  }),
);

// ── Validation ──
// Admin assigns a real member (userId) to a seat (1..TOTAL_SEATS).
export const assignSeatSchema = z.object({
  seatNumber: z.coerce.number().int().min(1).max(TOTAL_SEATS),
  userId: z.coerce.number().int().positive(),
});

export type SeatAssignment = typeof seatAssignmentsTable.$inferSelect;
export type AttendanceSession = typeof attendanceSessionsTable.$inferSelect;
