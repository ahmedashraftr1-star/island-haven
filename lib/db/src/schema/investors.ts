import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const INVESTOR_TYPES = [
  "lead",
  "angel",
  "vc",
  "corporate",
  "ngo",
  "individual",
] as const;
export type InvestorType = (typeof INVESTOR_TYPES)[number];

export const INVESTOR_STATUSES = ["visible", "hidden"] as const;
export type InvestorStatus = (typeof INVESTOR_STATUSES)[number];

export const investorsTable = pgTable(
  "investors",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    logoUrl: text("logo_url"),
    websiteUrl: text("website_url").default("").notNull(),
    description: varchar("description", { length: 600 }).default("").notNull(),
    type: varchar("type", { length: 20 })
      .notNull()
      .$type<InvestorType>()
      .default("angel"),
    investmentFocus: varchar("investment_focus", { length: 300 })
      .default("")
      .notNull(),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<InvestorStatus>()
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
    statusIdx: index("investors_status_idx").on(t.status),
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

export const upsertInvestorSchema = z.object({
  name: safeText(200).min(1, "الاسم مطلوب"),
  logoUrl: z.string().trim().max(800).optional().nullable(),
  websiteUrl: httpUrl(400).default(""),
  description: safeText(600).default(""),
  type: z.enum(INVESTOR_TYPES).default("angel"),
  investmentFocus: safeText(300).default(""),
  status: z.enum(INVESTOR_STATUSES).default("visible"),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export type Investor = typeof investorsTable.$inferSelect;

export const INVESTOR_TYPE_LABELS: Record<InvestorType, string> = {
  lead: "مستثمر رئيسي",
  angel: "مستثمر ملاك",
  vc: "صندوق رأس مال مخاطر",
  corporate: "شراكة مؤسسية",
  ngo: "منظمة دولية",
  individual: "مانح فردي",
};
