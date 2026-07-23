import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { expertProfilesTable } from "./experts";
import { expertAvailabilitySlotsTable } from "./expertAvailability";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").default(""),
  visitDate: date("visit_date").notNull(),
  timeSlot: varchar("time_slot", { length: 24 }).notNull(),
  purpose: varchar("purpose", { length: 32 }).notNull(),
  attendees: integer("attendees").notNull().default(1),
  notes: text("notes").default(""),
  expertId: integer("expert_id").references(() => expertProfilesTable.id, {
    onDelete: "set null",
  }),
  slotId: integer("slot_id").references(() => expertAvailabilitySlotsTable.id, {
    onDelete: "set null",
  }),
  // Optional chosen seat (1–38). A partial UNIQUE index (visit_date, time_slot,
  // seat) WHERE seat IS NOT NULL AND status <> 'cancelled' is the DB-level lock
  // that makes concurrent double-booking of a seat impossible.
  seat: integer("seat"),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  adminNotes: text("admin_notes").default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (t) => ({
  // Every booking-create runs two capacity SUM(attendees) queries inside the
  // txn — one on (visit_date, time_slot), one on (visit_date). This composite
  // serves both (the second via the leading column) so the hot write path
  // never seq-scans the bookings table.
  slotIdx: index("bookings_visit_slot_idx").on(t.visitDate, t.timeSlot),
  // The DB-level double-booking lock: at most one LIVE booking per
  // (visit_date, time_slot, seat). Partial — it ignores rows with no chosen seat
  // and cancelled bookings, so those never block a fresh reservation. Declared
  // here (matching the deployed index name) so `drizzle-kit push` reproduces the
  // lock on every environment; without it a fresh push would create the `seat`
  // column but not the guarantee, and concurrent requests could double-book.
  seatUnique: uniqueIndex("bookings_seat_unique")
    .on(t.visitDate, t.timeSlot, t.seat)
    .where(sql`seat IS NOT NULL AND status <> 'cancelled'`),
}));

// Reject any HTML brackets / control chars to keep stored data clean
// (React escapes on render, but we also export to admin lists / future emails).
const safeText = (min: number, max: number, msg: string) =>
  z
    .string()
    .trim()
    .min(min, msg)
    .max(max)
    .regex(/^[^<>]*$/u, "رموز غير مسموح بها");

export const insertBookingSchema = z.object({
  fullName: safeText(2, 120, "الاسم قصير جدًّا").regex(
    /^[\p{L}\p{M}\s'’\-\.]+$/u,
    "أحرف غير صحيحة في الاسم",
  ),
  phone: z
    .string()
    .trim()
    .min(6, "رقم الهاتف قصير")
    .max(40)
    .regex(/^[\d\s+()\-]+$/u, "رقم الهاتف يحتوي رموزًا غير صحيحة"),
  email: z
    .string()
    .trim()
    .max(160)
    .email("بريد غير صحيح")
    .optional()
    .or(z.literal("")),
  visitDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ غير صحيح")
    .refine((d) => {
      // Today-or-later check anchored to Asia/Gaza local calendar day,
      // independent of server timezone. We compute "today in Gaza" as a
      // YYYY-MM-DD string and compare lexicographically.
      const todayGaza = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Gaza",
      }); // en-CA → "YYYY-MM-DD"
      return d >= todayGaza;
    }, "التاريخ يجب أن يكون اليوم أو لاحقًا")
    .refine((d) => {
      // Asia/Gaza is closed on Fridays. We derive day-of-week from the
      // calendar date using a fixed reference (UTC noon) so that the result
      // is the SAME regardless of the server's timezone.
      const day = new Date(d + "T12:00:00Z").getUTCDay();
      return day !== 5;
    }, "المساحة مغلقة يوم الجمعة — اختَر يومًا آخر")
    .refine((d) => {
      const day = new Date(d + "T12:00:00Z").getTime();
      return day - Date.now() < 1000 * 60 * 60 * 24 * 180;
    }, "التاريخ بعيد جدًّا"),
  timeSlot: z.enum(["morning", "midday", "afternoon", "fullday"]),
  purpose: z.enum(["work", "study", "meeting", "event", "tour", "guest", "other"]),
  attendees: z.coerce.number().int().min(1).max(8).default(1),
  notes: safeText(0, 1000, "").default(""),
  expertId: z.number().int().positive().optional().nullable(),
  slotId: z.number().int().positive().optional().nullable(),
  // Chosen seat (1–38 physical seats). Optional — booking without a seat is fine.
  seat: z.coerce.number().int().min(1).max(38).optional().nullable(),
});

export type Booking = typeof bookingsTable.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
