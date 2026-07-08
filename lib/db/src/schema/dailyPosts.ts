import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const DAILY_TYPES = ["tip", "news", "quote", "story"] as const;
export type DailyType = (typeof DAILY_TYPES)[number];

export const dailyPostsTable = pgTable(
  "daily_posts",
  {
    id: serial("id").primaryKey(),
    type: varchar("type", { length: 16 }).notNull().$type<DailyType>(),
    title: varchar("title", { length: 200 }).notNull(),
    titleEn: varchar("title_en", { length: 200 }).default("").notNull(),
    body: text("body").default("").notNull(),
    bodyEn: text("body_en").default("").notNull(),
    coverUrl: text("cover_url"),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    typeIdx: index("daily_type_idx").on(t.type),
    publishedIdx: index("daily_published_idx").on(t.publishedAt),
  }),
);

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");

export const upsertDailySchema = z.object({
  type: z.enum(DAILY_TYPES),
  title: safeText(200).min(2, "العنوان قصير جدًّا"),
  body: safeText(8000).default(""),
  coverUrl: z.string().trim().max(800).optional().nullable(),
  publishedAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type DailyPost = typeof dailyPostsTable.$inferSelect;

export const DAILY_TYPE_LABELS: Record<DailyType, string> = {
  tip: "نصيحة",
  news: "خبر",
  quote: "اقتباس",
  story: "قصّة",
};
