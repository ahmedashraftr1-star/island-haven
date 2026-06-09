import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// Public RSVPs for a cohort's Demo Day. Plain `cohortId` int (no hard FK) keeps
// the schema import graph acyclic, matching the project's convention.
export const demoDayRsvpsTable = pgTable(
  "demo_day_rsvps",
  {
    id: serial("id").primaryKey(),
    cohortId: integer("cohort_id").notNull(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    email: varchar("email", { length: 160 }).default("").notNull(),
    attendees: integer("attendees").default(1).notNull(),
    note: varchar("note", { length: 600 }).default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    cohortIdx: index("demo_day_rsvps_cohort_idx").on(t.cohortId),
  }),
);

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");

export const insertDemoDayRsvpSchema = z.object({
  fullName: safeText(120).min(2, "الاسم قصير جدًّا"),
  email: z.string().trim().email("بريد غير صحيح").max(160),
  attendees: z.coerce.number().int().min(1).max(10).default(1),
  note: safeText(600).default(""),
});

export type DemoDayRsvp = typeof demoDayRsvpsTable.$inferSelect;
