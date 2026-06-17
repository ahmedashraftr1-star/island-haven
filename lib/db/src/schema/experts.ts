import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { usersTable } from "./users";

// An expert/mentor profile. 1:1 with a `users` row whose role is "expert".
// The user account lets the expert log in to their own dashboard; this table
// holds the mentorship-specific fields shown in the public experts directory.

export const EXPERT_STATUSES = ["pending", "active", "hidden"] as const;
export type ExpertStatus = (typeof EXPERT_STATUSES)[number];

export const expertProfilesTable = pgTable(
  "expert_profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    headline: varchar("headline", { length: 160 }).default("").notNull(),
    expertise: varchar("expertise", { length: 400 }).default("").notNull(), // comma-separated areas
    bio: text("bio").default("").notNull(),
    yearsExperience: integer("years_experience").default(0).notNull(),
    languages: varchar("languages", { length: 160 }).default("").notNull(), // comma-separated
    sessionMinutes: integer("session_minutes").default(45).notNull(),
    availabilityNote: varchar("availability_note", { length: 300 })
      .default("")
      .notNull(),
    acceptingSessions: boolean("accepting_sessions").default(true).notNull(),
    featured: boolean("featured").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    linkedinUrl: text("linkedin_url").default("").notNull(),
    websiteUrl: text("website_url").default("").notNull(),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<ExpertStatus>()
      .default("pending"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userUniq: uniqueIndex("expert_profiles_user_uniq").on(t.userId),
    statusIdx: index("expert_profiles_status_idx").on(t.status),
    featuredIdx: index("expert_profiles_featured_idx").on(t.featured),
  }),
);

const safeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(/^[^<>]*$/u, "رموز غير مسموح بها");

const httpUrl = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => v === "" || /^https?:\/\//i.test(v),
      "الرابط يجب أن يبدأ بـ http(s)://",
    );

// Fields an expert may edit on themselves (and an admin may edit too).
export const expertProfileSchema = z.object({
  headline: safeText(160).default(""),
  expertise: safeText(400).default(""),
  bio: safeText(4000).default(""),
  yearsExperience: z.number().int().min(0).max(80).default(0),
  languages: safeText(160).default(""),
  sessionMinutes: z.number().int().min(10).max(480).default(45),
  availabilityNote: safeText(300).default(""),
  acceptingSessions: z.boolean().default(true),
  linkedinUrl: httpUrl(400).default(""),
  websiteUrl: httpUrl(400).default(""),
});

// Admin-only moderation fields, layered on top of the editable content.
export const adminExpertProfileSchema = expertProfileSchema.extend({
  status: z.enum(EXPERT_STATUSES).default("active"),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

// Admin creates a brand-new expert account (user + profile) in one step.
export const createExpertSchema = z.object({
  fullName: safeText(120).min(2, "الاسم قصير جدًّا"),
  email: z.string().trim().toLowerCase().email("بريد غير صحيح").max(160),
  password: z.string().min(8, "كلمة السرّ 8 أحرف فأكثر").max(200),
  avatarUrl: z.string().trim().max(800).optional().nullable(),
  profile: adminExpertProfileSchema.partial().optional(),
});

// Public self-application schema — no password required; admin sets one later.
export const applyMentorSchema = z.object({
  fullName: safeText(120).min(2, "الاسم قصير جدًّا"),
  email: z.string().trim().toLowerCase().email("بريد غير صحيح").max(160),
  expertise: safeText(400).min(2, "أدخل مجالات الخبرة"),
  yearsExperience: z.number().int().min(0).max(80).default(0),
  bio: safeText(4000).min(20, "النبذة قصيرة جدًّا"),
  linkedinUrl: httpUrl(400).default(""),
});

export type ExpertProfile = typeof expertProfilesTable.$inferSelect;

export const EXPERT_STATUS_LABELS: Record<ExpertStatus, string> = {
  pending: "بانتظار التفعيل",
  active: "مُفعَّل",
  hidden: "مخفيّ",
};
