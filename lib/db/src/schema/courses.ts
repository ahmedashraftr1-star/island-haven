import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const COURSE_TYPES = ["course", "workshop"] as const;
export type CourseType = (typeof COURSE_TYPES)[number];

export const COURSE_STATUSES = ["draft", "open", "closed", "done"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const coursesTable = pgTable(
  "courses",
  {
    id: serial("id").primaryKey(),
    type: varchar("type", { length: 16 }).notNull().$type<CourseType>(),
    title: varchar("title", { length: 200 }).notNull(),
    summary: varchar("summary", { length: 400 }).default("").notNull(),
    description: text("description").default("").notNull(),
    instructor: varchar("instructor", { length: 160 }).default("").notNull(),
    coverUrl: text("cover_url"),
    location: varchar("location", { length: 200 }).default("").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    capacity: integer("capacity").default(0).notNull(), // 0 = unlimited
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<CourseStatus>()
      .default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    typeIdx: index("courses_type_idx").on(t.type),
    statusIdx: index("courses_status_idx").on(t.status),
    startsAtIdx: index("courses_starts_at_idx").on(t.startsAt),
  }),
);

const safeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(/^[^<>]*$/u, "رموز غير مسموح بها");

export const upsertCourseSchema = z.object({
  type: z.enum(COURSE_TYPES),
  title: safeText(200).min(2, "العنوان قصير جدًّا"),
  summary: safeText(400).default(""),
  description: safeText(8000).default(""),
  instructor: safeText(160).default(""),
  coverUrl: z.string().trim().max(800).optional().nullable(),
  location: safeText(200).default(""),
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
  capacity: z.number().int().min(0).max(100000).default(0),
  status: z.enum(COURSE_STATUSES).default("draft"),
});

export type Course = typeof coursesTable.$inferSelect;

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  course: "كورس",
  workshop: "ورشة",
};

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: "مسوّدة",
  open: "تسجيل مفتوح",
  closed: "مكتمل العدد",
  done: "منتهٍ",
};
