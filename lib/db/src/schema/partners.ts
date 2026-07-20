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

// A partner / supporter / sponsor of the incubator.

export const PARTNER_TIERS = ["partner", "supporter", "sponsor"] as const;
export type PartnerTier = (typeof PARTNER_TIERS)[number];

export const PARTNER_STATUSES = ["visible", "hidden"] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const partnersTable = pgTable(
  "partners",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    logoUrl: text("logo_url"),
    websiteUrl: text("website_url").default("").notNull(),
    description: varchar("description", { length: 400 }).default("").notNull(),
    tier: varchar("tier", { length: 16 })
      .notNull()
      .$type<PartnerTier>()
      .default("partner"),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<PartnerStatus>()
      .default("visible"),
    sortOrder: integer("sort_order").default(0).notNull(),
    // Soft-delete: non-null = trashed. Additive + nullable; excluded from all reads.
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    statusIdx: index("partners_status_idx").on(t.status),
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

export const upsertPartnerSchema = z.object({
  name: safeText(200).min(1, "الاسم مطلوب"),
  logoUrl: z.string().trim().max(800).optional().nullable(),
  websiteUrl: httpUrl(400).default(""),
  description: safeText(400).default(""),
  tier: z.enum(PARTNER_TIERS).default("partner"),
  status: z.enum(PARTNER_STATUSES).default("visible"),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export type Partner = typeof partnersTable.$inferSelect;

export const PARTNER_TIER_LABELS: Record<PartnerTier, string> = {
  partner: "شريك",
  supporter: "داعم",
  sponsor: "راعٍ",
};
