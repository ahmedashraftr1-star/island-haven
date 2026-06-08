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

// The incubator playbook: templates, guides, partner perks, recordings.
// `visibility` gates access — public for marketing-facing material, members
// for actual playbook content, admins for internal-only.

export const RESOURCE_CATEGORIES = [
  "template",
  "guide",
  "tool",
  "perk",
  "recording",
  "legal",
] as const;
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const RESOURCE_VISIBILITIES = [
  "public",
  "members",
  "admins",
] as const;
export type ResourceVisibility = (typeof RESOURCE_VISIBILITIES)[number];

export const resourcesTable = pgTable(
  "resources",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    summary: varchar("summary", { length: 400 }).default("").notNull(),
    body: text("body").default("").notNull(), // markdown allowed
    category: varchar("category", { length: 16 })
      .notNull()
      .$type<ResourceCategory>()
      .default("guide"),
    visibility: varchar("visibility", { length: 16 })
      .notNull()
      .$type<ResourceVisibility>()
      .default("members"),
    coverUrl: text("cover_url"),
    externalUrl: text("external_url").default("").notNull(),
    fileUrl: text("file_url").default("").notNull(),
    tags: varchar("tags", { length: 400 }).default("").notNull(),
    featured: boolean("featured").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    visibilityIdx: index("resources_visibility_idx").on(t.visibility),
    categoryIdx: index("resources_category_idx").on(t.category),
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

export const upsertResourceSchema = z.object({
  title: safeText(200).min(2),
  summary: safeText(400).default(""),
  body: safeText(20000).default(""),
  category: z.enum(RESOURCE_CATEGORIES).default("guide"),
  visibility: z.enum(RESOURCE_VISIBILITIES).default("members"),
  coverUrl: z.string().trim().max(800).optional().nullable(),
  externalUrl: httpUrl(800).default(""),
  fileUrl: z.string().trim().max(800).default(""),
  tags: safeText(400).default(""),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export type Resource = typeof resourcesTable.$inferSelect;

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  template: "قالب",
  guide: "دليل",
  tool: "أداة",
  perk: "حافز / Perk",
  recording: "تسجيل",
  legal: "قانوني",
};

export const RESOURCE_VISIBILITY_LABELS: Record<ResourceVisibility, string> = {
  public: "للجميع",
  members: "للمنتسبين فقط",
  admins: "للإدارة فقط",
};
