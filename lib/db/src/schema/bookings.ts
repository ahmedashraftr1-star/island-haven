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
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  adminNotes: text("admin_notes").default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const insertBookingSchema = z.object({
  fullName: z.string().trim().min(2, "الاسم قصير جدًّا").max(120),
  phone: z.string().trim().min(6, "رقم الهاتف قصير").max(40),
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
      const day = new Date(d + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return day >= today;
    }, "التاريخ يجب أن يكون اليوم أو لاحقًا"),
  timeSlot: z.enum(["morning", "midday", "afternoon", "fullday"]),
  purpose: z.enum(["work", "study", "meeting", "event", "tour", "other"]),
  attendees: z.coerce.number().int().min(1).max(8).default(1),
  notes: z.string().trim().max(1000).default(""),
});

export type Booking = typeof bookingsTable.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
