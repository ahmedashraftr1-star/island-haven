import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  index,
  jsonb,
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
    galleryUrls: jsonb("gallery_urls").$type<string[]>().default([]).notNull(),
    videoUrl: text("video_url").default("").notNull(),
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
    // Serves the public gallery feed too: `WHERE status IN ('visible','featured')
    // ORDER BY created_at DESC LIMIT n` is an Index-Scan-Backward + Filter here
    // (reads ~LIMIT rows, ~0.04ms at 200k rows). A composite (status, created_at)
    // was measured and NOT chosen — visible+featured are the row majority — so it
    // would be dead write-cost. Profile lists filter by user_id (userIdx).
    createdIdx: index("works_created_idx").on(t.createdAt),
  }),
);

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");

const httpUrl = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => v === "" || /^https?:\/\//i.test(v),
      "الرابط يجب أن يبدأ بـ http(s)://",
    );

export const upsertWorkSchema = z.object({
  title: safeText(200).min(2, "العنوان قصير جدًّا"),
  summary: safeText(400).default(""),
  description: safeText(8000).default(""),
  coverUrl: z.string().trim().max(800).optional().nullable(),
  galleryUrls: z
    .array(z.string().trim().max(800))
    .max(20, "عدد الصور كبير جدًّا")
    .default([]),
  videoUrl: httpUrl(800).default(""),
  link: httpUrl(800).default(""),
  tags: safeText(400).default(""),
});

export type Work = typeof worksTable.$inferSelect;
