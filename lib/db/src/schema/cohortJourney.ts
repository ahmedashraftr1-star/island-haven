import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// The public "journey" of a cohort: its weekly curriculum (cohort_weeks) and a
// feed of progress updates (cohort_updates). Admin-curated, publicly displayed —
// so no user↔venture ownership link is required. Plain int FKs keep the schema
// import graph acyclic, matching the project's convention.

export const cohortWeeksTable = pgTable(
  "cohort_weeks",
  {
    id: serial("id").primaryKey(),
    cohortId: integer("cohort_id").notNull(),
    weekNumber: integer("week_number").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    theme: varchar("theme", { length: 400 }).default("").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    cohortIdx: index("cohort_weeks_cohort_idx").on(t.cohortId),
  }),
);

export const cohortUpdatesTable = pgTable(
  "cohort_updates",
  {
    id: serial("id").primaryKey(),
    cohortId: integer("cohort_id").notNull(),
    ventureId: integer("venture_id"), // optional attribution to a venture
    weekNumber: integer("week_number"), // optional link to a week
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").default("").notNull(),
    postedAt: timestamp("posted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => ({
    cohortIdx: index("cohort_updates_cohort_idx").on(t.cohortId),
  }),
);

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");

export const upsertCohortWeekSchema = z.object({
  cohortId: z.number().int().positive(),
  weekNumber: z.number().int().min(0).max(100),
  title: safeText(200).min(1, "العنوان مطلوب"),
  theme: safeText(400).default(""),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export const upsertCohortUpdateSchema = z.object({
  cohortId: z.number().int().positive(),
  ventureId: z.number().int().positive().nullable().optional(),
  weekNumber: z.number().int().min(0).max(100).nullable().optional(),
  title: safeText(200).min(1, "العنوان مطلوب"),
  body: safeText(4000).default(""),
  postedAt: z.string().datetime({ offset: true }).optional(),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export type CohortWeek = typeof cohortWeeksTable.$inferSelect;
export type CohortUpdate = typeof cohortUpdatesTable.$inferSelect;
