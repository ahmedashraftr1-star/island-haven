import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const JOB_TYPES = [
  "full-time",
  "part-time",
  "remote",
  "contract",
  "internship",
] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_STATUSES = ["active", "closed", "draft"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_CATEGORIES = [
  "tech",
  "design",
  "marketing",
  "sales",
  "operations",
  "finance",
  "other",
] as const;
export type JobCategory = (typeof JOB_CATEGORIES)[number];

export const jobListingsTable = pgTable(
  "job_listings",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    companyName: varchar("company_name", { length: 200 }).notNull(),
    companyLogoUrl: text("company_logo_url"),
    location: varchar("location", { length: 200 }).default("غزة").notNull(),
    type: varchar("type", { length: 20 })
      .notNull()
      .$type<JobType>()
      .default("full-time"),
    category: varchar("category", { length: 30 })
      .notNull()
      .$type<JobCategory>()
      .default("other"),
    description: text("description").default("").notNull(),
    requirements: text("requirements").default("").notNull(),
    salaryRange: varchar("salary_range", { length: 100 }).default("").notNull(),
    applyUrl: text("apply_url").default("").notNull(),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<JobStatus>()
      .default("draft"),
    featured: boolean("featured").default(false).notNull(),
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
    statusIdx: index("job_listings_status_idx").on(t.status),
    categoryIdx: index("job_listings_category_idx").on(t.category),
  }),
);

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");

export const upsertJobSchema = z.object({
  title: safeText(200).min(1, "العنوان مطلوب"),
  companyName: safeText(200).min(1, "اسم الشركة مطلوب"),
  companyLogoUrl: z.string().trim().max(800).optional().nullable(),
  location: safeText(200).default("غزة"),
  type: z.enum(JOB_TYPES).default("full-time"),
  category: z.enum(JOB_CATEGORIES).default("other"),
  description: z.string().trim().max(6000).default(""),
  requirements: z.string().trim().max(6000).default(""),
  salaryRange: safeText(100).default(""),
  applyUrl: z.string().trim().max(800).default(""),
  status: z.enum(JOB_STATUSES).default("draft"),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export type Job = typeof jobListingsTable.$inferSelect;

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  "full-time": "دوام كامل",
  "part-time": "دوام جزئي",
  remote: "عن بُعد",
  contract: "عقد مؤقت",
  internship: "تدريب",
};

export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  tech: "تقنية",
  design: "تصميم",
  marketing: "تسويق",
  sales: "مبيعات",
  operations: "عمليات",
  finance: "مالية",
  other: "أخرى",
};
