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
import { usersTable } from "./users";

export const WORK_STATUSES = ["visible", "hidden", "featured"] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

export const worksTable = pgTable(
  "works",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    summary: varchar("summary", { length: 400 }).default("").notNull(),
    description: text("description").default("").notNull(),
    coverUrl: text("cover_url"),
    link: text("link").default("").notNull(),
    tags: varchar("tags", { length: 400 }).default("").notNull(), // comma-separated
    status: varchar("status", { length: 16 })
      .default("visible")
      .notNull()
      .$type<WorkStatus>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index("works_user_idx").on(t.userId),
    createdIdx: index("works_created_idx").on(t.createdAt),
  }),
);

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");

export const upsertWorkSchema = z.object({
  title: safeText(200).min(2, "العنوان قصير جدًّا"),
  summary: safeText(400).default(""),
  description: safeText(8000).default(""),
  coverUrl: z.string().trim().max(800).optional().nullable(),
  link: z
    .string()
    .trim()
    .max(800)
    .refine(
      (v) => v === "" || /^https?:\/\//i.test(v),
      "الرابط يجب أن يبدأ بـ http(s)://",
    )
    .default(""),
  tags: safeText(400).default(""),
});

export type Work = typeof worksTable.$inferSelect;
