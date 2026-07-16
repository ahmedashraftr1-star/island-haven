import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// The blog's taxonomy — the four categories the (former) placeholder already used.
// Deliberately NOT daily_posts' tip/news/quote/story: a blog and a daily feed are
// different things.
export const BLOG_CATEGORIES = ["startup", "funding", "tech", "community"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const BLOG_STATUSES = ["draft", "published"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

/**
 * blog_posts — real, fully-bilingual articles. Unlike daily_posts (whose *En columns
 * are dead weight — never written or read), EVERY language column here is wired through
 * the zod schema, the API insert/update, the admin form, and the public render. `slug`
 * is the SEO URL for /blog/:slug; read-time is computed at render, never stored.
 */
export const blogPostsTable = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 200 }).notNull(),
    category: varchar("category", { length: 16 }).notNull().$type<BlogCategory>(),
    title: varchar("title", { length: 200 }).notNull(),
    titleEn: varchar("title_en", { length: 200 }).default("").notNull(),
    excerpt: varchar("excerpt", { length: 500 }).default("").notNull(),
    excerptEn: varchar("excerpt_en", { length: 500 }).default("").notNull(),
    body: text("body").default("").notNull(),
    bodyEn: text("body_en").default("").notNull(),
    author: varchar("author", { length: 120 }).default("").notNull(),
    authorEn: varchar("author_en", { length: 120 }).default("").notNull(),
    coverUrl: text("cover_url"),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<BlogStatus>()
      .default("draft"),
    // Nullable: a draft has never been published. Stamped when it first goes live.
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    slugUnique: uniqueIndex("blog_slug_unique").on(t.slug),
    statusIdx: index("blog_status_idx").on(t.status),
    publishedIdx: index("blog_published_idx").on(t.publishedAt),
    categoryIdx: index("blog_category_idx").on(t.category),
  }),
);

// Short fields (title/excerpt/author): block angle brackets outright — they never
// legitimately contain markup.
const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");
// Body: plain prose that may legitimately use "<"/">" (e.g. "5 < 10"); React escapes
// text nodes on render, so a length cap is enough.
const bodyText = (max: number) => z.string().trim().max(max);

// `slug` is NOT accepted from input — the server derives + de-duplicates it.
export const upsertBlogSchema = z.object({
  category: z.enum(BLOG_CATEGORIES),
  status: z.enum(BLOG_STATUSES).default("draft"),
  title: safeText(200).min(2, "العنوان قصير جدًّا"),
  titleEn: safeText(200).min(2, "English title is too short"),
  excerpt: safeText(500).default(""),
  excerptEn: safeText(500).default(""),
  body: bodyText(20000).min(10, "المحتوى قصير جدًّا"),
  bodyEn: bodyText(20000).min(10, "English body is too short"),
  author: safeText(120).default(""),
  authorEn: safeText(120).default(""),
  coverUrl: z.string().trim().max(800).optional().nullable(),
  publishedAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type BlogPost = typeof blogPostsTable.$inferSelect;

export const BLOG_CATEGORY_LABELS: Record<BlogCategory, string> = {
  startup: "ريادة الأعمال",
  funding: "التمويل والاستثمار",
  tech: "التقنية",
  community: "المجتمع",
};

export const BLOG_CATEGORY_LABELS_EN: Record<BlogCategory, string> = {
  startup: "Startups",
  funding: "Funding",
  tech: "Tech",
  community: "Community",
};

/** kebab-case slug from a title; ASCII for Latin, keeps Arabic letters, collapses the
 *  rest to hyphens. The route ensures uniqueness with a numeric suffix on collision. */
export function slugify(input: string): string {
  const base = (input || "")
    .toLowerCase()
    .trim()
    .replace(/['"’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "post";
}
