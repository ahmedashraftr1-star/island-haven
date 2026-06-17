import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// A success story / testimonial from a graduate, founder, or member.

export const STORY_STATUSES = ["draft", "published", "hidden", "rejected"] as const;
export type StoryStatus = (typeof STORY_STATUSES)[number];

export const successStoriesTable = pgTable(
  "success_stories",
  {
    id: serial("id").primaryKey(),
    personName: varchar("person_name", { length: 200 }).notNull(),
    role: varchar("role", { length: 200 }).default("").notNull(),
    quote: varchar("quote", { length: 600 }).default("").notNull(),
    story: text("story").default("").notNull(),
    avatarUrl: text("avatar_url"),
    coverUrl: text("cover_url"),
    ventureName: varchar("venture_name", { length: 200 })
      .default("")
      .notNull(),
    projectUrl: text("project_url"),
    featured: boolean("featured").default(false).notNull(),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<StoryStatus>()
      .default("draft"),
    sortOrder: integer("sort_order").default(0).notNull(),
    submittedByUserId: integer("submitted_by_user_id"),
    rejectionNote: text("rejection_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    statusIdx: index("success_stories_status_idx").on(t.status),
    featuredIdx: index("success_stories_featured_idx").on(t.featured),
    submittedByIdx: index("success_stories_submitted_by_idx").on(t.submittedByUserId),
  }),
);

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");

export const upsertStorySchema = z.object({
  personName: safeText(200).min(2, "الاسم قصير جدًّا"),
  role: safeText(200).default(""),
  quote: safeText(600).default(""),
  story: safeText(8000).default(""),
  avatarUrl: z.string().trim().max(800).optional().nullable(),
  coverUrl: z.string().trim().max(800).optional().nullable(),
  ventureName: safeText(200).default(""),
  projectUrl: z.string().trim().max(800).optional().nullable(),
  featured: z.boolean().default(false),
  status: z.enum(STORY_STATUSES).default("draft"),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export const submitStorySchema = z.object({
  quote: safeText(600).min(10, "الاقتباس قصير جدًّا"),
  story: safeText(8000).default(""),
  ventureName: safeText(200).default(""),
  projectUrl: z.string().trim().max(800).optional().nullable(),
});

export type SuccessStory = typeof successStoriesTable.$inferSelect;

export const STORY_STATUS_LABELS: Record<StoryStatus, string> = {
  draft: "مسوّدة",
  published: "منشور",
  hidden: "مخفيّ",
  rejected: "مرفوض",
};
