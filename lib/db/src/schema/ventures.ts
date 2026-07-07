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

// An incubated startup / venture showcased on the platform.

export const VENTURE_STAGES = ["idea", "mvp", "launched", "scaling"] as const;
export type VentureStage = (typeof VENTURE_STAGES)[number];

export const VENTURE_STATUSES = ["draft", "published", "hidden"] as const;
export type VentureStatus = (typeof VENTURE_STATUSES)[number];

export const venturesTable = pgTable(
  "ventures",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    tagline: varchar("tagline", { length: 300 }).default("").notNull(),
    description: text("description").default("").notNull(),
    logoUrl: text("logo_url"),
    coverUrl: text("cover_url"),
    websiteUrl: text("website_url").default("").notNull(),
    founderName: varchar("founder_name", { length: 200 })
      .default("")
      .notNull(),
    founderQuote: text("founder_quote").default("").notNull(),
    sector: varchar("sector", { length: 160 }).default("").notNull(),
    stage: varchar("stage", { length: 16 })
      .notNull()
      .$type<VentureStage>()
      .default("idea"),
    foundedYear: integer("founded_year").default(0).notNull(),
    teamSize: integer("team_size").default(1).notNull(),
    featured: boolean("featured").default(false).notNull(),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<VentureStatus>()
      .default("draft"),
    sortOrder: integer("sort_order").default(0).notNull(),
    // Optional link to a resource row that holds this venture's pitch deck.
    // Plain int (no hard FK) to keep the schema import graph acyclic.
    pitchDeckResourceId: integer("pitch_deck_resource_id"),
    // Optional link to the founder's member account (admin-assigned). Lets a
    // member see the ventures they founded. Plain int (acyclic).
    userId: integer("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    statusIdx: index("ventures_status_idx").on(t.status),
    featuredIdx: index("ventures_featured_idx").on(t.featured),
    // Founder lookups ("my ventures") filter by user_id — index it so the
    // scan doesn't grow linear with the table.
    userIdx: index("ventures_user_idx").on(t.userId),
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

export const upsertVentureSchema = z.object({
  name: safeText(200).min(2, "الاسم قصير جدًّا"),
  tagline: safeText(300).default(""),
  description: safeText(6000).default(""),
  logoUrl: z.string().trim().max(800).optional().nullable(),
  coverUrl: z.string().trim().max(800).optional().nullable(),
  websiteUrl: httpUrl(400).default(""),
  founderName: safeText(200).default(""),
  founderQuote: safeText(500).default(""),
  sector: safeText(160).default(""),
  stage: z.enum(VENTURE_STAGES).default("idea"),
  foundedYear: z.number().int().min(0).max(2100).default(0),
  teamSize: z.number().int().min(0).max(100000).default(1),
  featured: z.boolean().default(false),
  status: z.enum(VENTURE_STATUSES).default("draft"),
  sortOrder: z.number().int().min(0).max(100000).default(0),
  pitchDeckResourceId: z.number().int().positive().nullable().optional(),
  userId: z.number().int().positive().nullable().optional(),
});

export type Venture = typeof venturesTable.$inferSelect;

export const VENTURE_STAGE_LABELS: Record<VentureStage, string> = {
  idea: "فكرة",
  mvp: "نموذج أوّليّ",
  launched: "أُطلِق",
  scaling: "في توسّع",
};

export const VENTURE_STATUS_LABELS: Record<VentureStatus, string> = {
  draft: "مسوّدة",
  published: "منشور",
  hidden: "مخفيّ",
};
