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
import { usersTable } from "./users";

// An incubation program / cohort: a structured track startups apply to and
// progress through. Members apply; admins review applications.

export const PROGRAM_STATUSES = [
  "draft",
  "open",
  "in_progress",
  "done",
] as const;
export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];

export const programsTable = pgTable(
  "programs",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    // Optional English counterparts. Null = not yet translated → the client
    // falls back to the Arabic title/summary. Content is Arabic-first.
    titleEn: varchar("title_en", { length: 200 }),
    summary: varchar("summary", { length: 400 }).default("").notNull(),
    summaryEn: varchar("summary_en", { length: 400 }),
    description: text("description").default("").notNull(),
    coverUrl: text("cover_url"),
    durationWeeks: integer("duration_weeks").default(0).notNull(),
    seats: integer("seats").default(0).notNull(), // 0 = unlimited
    perks: text("perks").default("").notNull(), // newline-separated benefits
    tags: varchar("tags", { length: 400 }).default("").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    applyDeadline: timestamp("apply_deadline", { withTimezone: true }),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<ProgramStatus>()
      .default("draft"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    statusIdx: index("programs_status_idx").on(t.status),
  }),
);

export const PROGRAM_APPLICATION_STATUSES = [
  "new",
  "reviewing",
  "accepted",
  "rejected",
] as const;
export type ProgramApplicationStatus =
  (typeof PROGRAM_APPLICATION_STATUSES)[number];

export const programApplicationsTable = pgTable(
  "program_applications",
  {
    id: serial("id").primaryKey(),
    programId: integer("program_id")
      .notNull()
      .references(() => programsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    ventureName: varchar("venture_name", { length: 200 }).default("").notNull(),
    idea: text("idea").default("").notNull(),
    motivation: text("motivation").default("").notNull(),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<ProgramApplicationStatus>()
      .default("new"),
    notes: text("notes").default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    programIdx: index("program_applications_program_idx").on(t.programId),
    userIdx: index("program_applications_user_idx").on(t.userId),
    uniqUserProgram: uniqueIndex("program_applications_user_program_uniq").on(
      t.userId,
      t.programId,
    ),
  }),
);

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");

export const upsertProgramSchema = z.object({
  title: safeText(200).min(2, "العنوان قصير جدًّا"),
  titleEn: safeText(200).optional().nullable(),
  summary: safeText(400).default(""),
  summaryEn: safeText(400).optional().nullable(),
  description: safeText(8000).default(""),
  coverUrl: z.string().trim().max(800).optional().nullable(),
  durationWeeks: z.number().int().min(0).max(520).default(0),
  seats: z.number().int().min(0).max(100000).default(0),
  perks: safeText(2000).default(""),
  tags: safeText(400).default(""),
  startsAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  applyDeadline: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  status: z.enum(PROGRAM_STATUSES).default("draft"),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export const applyProgramSchema = z.object({
  ventureName: safeText(200).default(""),
  idea: safeText(4000).min(10, "اكتب فكرتك بإيجاز"),
  motivation: safeText(4000).default(""),
});

export type Program = typeof programsTable.$inferSelect;
export type ProgramApplication = typeof programApplicationsTable.$inferSelect;

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  draft: "مسوّدة",
  open: "التقديم مفتوح",
  in_progress: "جارٍ التنفيذ",
  done: "منتهٍ",
};

export const PROGRAM_APPLICATION_STATUS_LABELS: Record<
  ProgramApplicationStatus,
  string
> = {
  new: "جديد",
  reviewing: "قيد المراجعة",
  accepted: "مقبول",
  rejected: "مرفوض",
};
