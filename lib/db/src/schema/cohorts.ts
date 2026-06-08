import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { programsTable } from "./programs";
import { venturesTable } from "./ventures";

// A cohort is a concrete run of a program: e.g. "Winter 2026" of the Builders
// Hackathon. Ventures join cohorts, demo day happens at the end. Cohorts give
// programs a heartbeat — without them programs are just templates.

export const COHORT_STATUSES = [
  "announced",
  "open",
  "in_progress",
  "demo_day",
  "completed",
] as const;
export type CohortStatus = (typeof COHORT_STATUSES)[number];

export const cohortsTable = pgTable(
  "cohorts",
  {
    id: serial("id").primaryKey(),
    programId: integer("program_id")
      .notNull()
      .references(() => programsTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull(),
    summary: varchar("summary", { length: 400 }).default("").notNull(),
    description: text("description").default("").notNull(),
    coverUrl: text("cover_url"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    demoDayAt: timestamp("demo_day_at", { withTimezone: true }),
    demoDayLocation: varchar("demo_day_location", { length: 400 })
      .default("")
      .notNull(),
    demoDayUrl: text("demo_day_url").default("").notNull(),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<CohortStatus>()
      .default("announced"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    programIdx: index("cohorts_program_idx").on(t.programId),
    statusIdx: index("cohorts_status_idx").on(t.status),
    slugUniq: uniqueIndex("cohorts_slug_uniq").on(t.slug),
  }),
);

export const COHORT_VENTURE_STATUSES = [
  "active",
  "graduated",
  "paused",
  "dropped",
] as const;
export type CohortVentureStatus = (typeof COHORT_VENTURE_STATUSES)[number];

// Many-to-many: a venture can be re-incubated across cohorts (rare but real).
export const cohortVenturesTable = pgTable(
  "cohort_ventures",
  {
    id: serial("id").primaryKey(),
    cohortId: integer("cohort_id")
      .notNull()
      .references(() => cohortsTable.id, { onDelete: "cascade" }),
    ventureId: integer("venture_id")
      .notNull()
      .references(() => venturesTable.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<CohortVentureStatus>()
      .default("active"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    notes: text("notes").default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    cohortIdx: index("cohort_ventures_cohort_idx").on(t.cohortId),
    ventureIdx: index("cohort_ventures_venture_idx").on(t.ventureId),
    uniqPair: uniqueIndex("cohort_ventures_pair_uniq").on(
      t.cohortId,
      t.ventureId,
    ),
  }),
);

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");
const slugRe = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const upsertCohortSchema = z.object({
  programId: z.number().int().positive(),
  name: safeText(200).min(2),
  slug: z.string().trim().min(2).max(80).regex(slugRe, "slug غير صالح"),
  summary: safeText(400).default(""),
  description: safeText(8000).default(""),
  coverUrl: z.string().trim().max(800).optional().nullable(),
  startsAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  endsAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  demoDayAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  demoDayLocation: safeText(400).default(""),
  demoDayUrl: z
    .string()
    .trim()
    .max(400)
    .refine(
      (v) => v === "" || /^https?:\/\//i.test(v),
      "الرابط يجب أن يبدأ بـ http(s)://",
    )
    .default(""),
  status: z.enum(COHORT_STATUSES).default("announced"),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export const upsertCohortVentureSchema = z.object({
  cohortId: z.number().int().positive(),
  ventureId: z.number().int().positive(),
  status: z.enum(COHORT_VENTURE_STATUSES).default("active"),
  notes: safeText(2000).default(""),
});

export type Cohort = typeof cohortsTable.$inferSelect;
export type CohortVenture = typeof cohortVenturesTable.$inferSelect;

export const COHORT_STATUS_LABELS: Record<CohortStatus, string> = {
  announced: "أُعلِنت",
  open: "التقديم مفتوح",
  in_progress: "جارٍ التنفيذ",
  demo_day: "يوم العرض",
  completed: "خُتِمت",
};

export const COHORT_VENTURE_STATUS_LABELS: Record<CohortVentureStatus, string> = {
  active: "نشط",
  graduated: "متخرّج",
  paused: "متوقّف مؤقّتًا",
  dropped: "منسحب",
};
