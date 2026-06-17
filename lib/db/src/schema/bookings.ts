import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { expertProfilesTable } from "./experts";

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
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  adminNotes: text("admin_notes").default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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
});

export type Booking = typeof bookingsTable.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
