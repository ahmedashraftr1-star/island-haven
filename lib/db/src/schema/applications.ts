import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  // ─── Identity ────────────────────────────────────────────────────────────
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  // ─── About ───────────────────────────────────────────────────────────────
  bio: text("bio").notNull(),
  motivation: text("motivation"),
  previousWork: text("previous_work"),
  // ─── Professional ────────────────────────────────────────────────────────
  skills: text("skills"),
  specialization: text("specialization"),
  yearsExperience: integer("years_experience"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  cvUrl: text("cv_url"),
  // ─── Availability ────────────────────────────────────────────────────────
  weeklyHours: integer("weekly_hours"),
  isEmployed: boolean("is_employed"),
  // ─── Admin ───────────────────────────────────────────────────────────────
  status: varchar("status", { length: 16 }).notNull().default("new"),
  notes: text("notes").default(""),
  // Scheduled interview slot (set from the review pipeline; null = none).
  interviewAt: timestamp("interview_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Reject HTML brackets to keep stored data clean for admin lists / future emails.
const safeText = (min: number, max: number, msg: string) =>
  z
    .string()
    .trim()
    .min(min, msg)
    .max(max)
    .regex(/^[^<>]*$/u, "رموز غير مسموح بها");

const safeUrl = z
  .string()
  .trim()
  .max(500)
  .regex(/^https?:\/\/.+/u, "رابط غير صحيح")
  .optional()
  .or(z.literal(""));

export const insertApplicationSchema = z.object({
  fullName: safeText(2, 120, "الاسم قصير جدًّا").regex(
    /^[\p{L}\p{M}\s''\-\.]+$/u,
    "أحرف غير صحيحة في الاسم",
  ),
  email: z.string().trim().email("بريد غير صحيح").max(160),
  phone: z
    .string()
    .trim()
    .min(6, "رقم قصير")
    .max(40)
    .regex(/^[\d\s+()\-]+$/u, "رقم الهاتف يحتوي رموزًا غير صحيحة"),
  category: z.enum(["freelancer", "graduate", "student", "other"]),
  bio: safeText(10, 2000, "اكتب نبذة قصيرة"),
  motivation: safeText(10, 2000, "أخبرنا لماذا تريد الانضمام").optional().or(z.literal("")),
  previousWork: safeText(3, 1000, "وصف قصير جدًّا").optional().or(z.literal("")),
  skills: safeText(2, 500, "حقل المهارات قصير").optional().or(z.literal("")),
  specialization: safeText(2, 200, "التخصص قصير").optional().or(z.literal("")),
  yearsExperience: z.number().int().min(0).max(50).optional(),
  linkedinUrl: safeUrl,
  portfolioUrl: safeUrl,
  cvUrl: z.string().trim().max(600).optional().or(z.literal("")),
  weeklyHours: z.number().int().min(1).max(168).optional(),
  isEmployed: z.boolean().optional(),
});

export type Application = typeof applicationsTable.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
