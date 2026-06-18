import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  date,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// A job / internship / freelance gig / volunteer opportunity posted for members —
// the bridge to the job market that is the platform's core mission.

export const OPPORTUNITY_TYPES = [
  "job",
  "internship",
  "freelance",
  "gig",
  "volunteer",
] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const OPPORTUNITY_LOCATIONS = ["onsite", "remote", "hybrid"] as const;
export type OpportunityLocation = (typeof OPPORTUNITY_LOCATIONS)[number];

export const OPPORTUNITY_STATUSES = ["draft", "published", "closed"] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const opportunitiesTable = pgTable(
  "opportunities",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    organization: varchar("organization", { length: 200 })
      .default("")
      .notNull(),
    type: varchar("type", { length: 16 })
      .notNull()
      .$type<OpportunityType>()
      .default("job"),
    locationType: varchar("location_type", { length: 16 })
      .notNull()
      .$type<OpportunityLocation>()
      .default("onsite"),
    city: varchar("city", { length: 120 }).default("").notNull(),
    description: text("description").default("").notNull(),
    skills: text("skills").default("").notNull(), // comma-separated
    compensation: varchar("compensation", { length: 160 }).default("").notNull(),
    applyUrl: text("apply_url").default("").notNull(),
    applyEmail: varchar("apply_email", { length: 160 }).default("").notNull(),
    deadline: date("deadline"), // optional application deadline
    featured: boolean("featured").default(false).notNull(),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<OpportunityStatus>()
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
    statusIdx: index("opportunities_status_idx").on(t.status),
    typeIdx: index("opportunities_type_idx").on(t.type),
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

export const upsertOpportunitySchema = z.object({
  title: safeText(200).min(2, "العنوان قصير جدًّا"),
  organization: safeText(200).default(""),
  type: z.enum(OPPORTUNITY_TYPES).default("job"),
  locationType: z.enum(OPPORTUNITY_LOCATIONS).default("onsite"),
  city: safeText(120).default(""),
  description: safeText(6000).default(""),
  skills: safeText(500).default(""),
  compensation: safeText(160).default(""),
  applyUrl: httpUrl(400).default(""),
  applyEmail: z
    .string()
    .trim()
    .max(160)
    .email("بريد غير صحيح")
    .optional()
    .or(z.literal("")),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ غير صحيح")
    .nullable()
    .optional(),
  featured: z.boolean().default(false),
  status: z.enum(OPPORTUNITY_STATUSES).default("draft"),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export type Opportunity = typeof opportunitiesTable.$inferSelect;

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  job: "وظيفة",
  internship: "تدريب",
  freelance: "عمل حرّ",
  gig: "مهمّة قصيرة",
  volunteer: "تطوّع",
};

export const OPPORTUNITY_LOCATION_LABELS: Record<OpportunityLocation, string> = {
  onsite: "حضوريّ",
  remote: "عن بُعد",
  hybrid: "مَزيج",
};

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  draft: "مسوّدة",
  published: "منشور",
  closed: "مغلق",
};
