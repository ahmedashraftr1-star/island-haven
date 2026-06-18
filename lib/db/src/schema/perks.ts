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

// A partner deal / perk / member benefit — discounted tools, courses, cloud
// credits, etc. offered to members through the platform's partner network.

export const PERK_CATEGORIES = [
  "tool",
  "course",
  "cloud",
  "design",
  "finance",
  "other",
] as const;
export type PerkCategory = (typeof PERK_CATEGORIES)[number];

export const PERK_STATUSES = ["draft", "published", "expired"] as const;
export type PerkStatus = (typeof PERK_STATUSES)[number];

export const perksTable = pgTable(
  "perks",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    partnerName: varchar("partner_name", { length: 200 }).default("").notNull(),
    description: text("description").default("").notNull(),
    category: varchar("category", { length: 40 })
      .notNull()
      .$type<PerkCategory>()
      .default("tool"),
    code: varchar("code", { length: 80 }).default("").notNull(), // coupon/promo code
    url: text("url").default("").notNull(),
    logoUrl: text("logo_url"), // nullable
    featured: boolean("featured").default(false).notNull(),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<PerkStatus>()
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
    statusIdx: index("perks_status_idx").on(t.status),
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

export const upsertPerkSchema = z.object({
  title: safeText(200).min(2, "العنوان قصير جدًّا"),
  partnerName: safeText(200).default(""),
  description: safeText(6000).default(""),
  category: z.enum(PERK_CATEGORIES).default("tool"),
  code: safeText(80).default(""),
  url: httpUrl(400).default(""),
  logoUrl: httpUrl(400).nullable().optional(),
  featured: z.boolean().default(false),
  status: z.enum(PERK_STATUSES).default("draft"),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export type Perk = typeof perksTable.$inferSelect;

export const PERK_CATEGORY_LABELS: Record<PerkCategory, string> = {
  tool: "أداة",
  course: "كورس",
  cloud: "استضافة سحابيّة",
  design: "تصميم",
  finance: "ماليّ",
  other: "أخرى",
};

export const PERK_STATUS_LABELS: Record<PerkStatus, string> = {
  draft: "مسوّدة",
  published: "منشور",
  expired: "منتهٍ",
};
