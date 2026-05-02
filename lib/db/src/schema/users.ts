import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const USER_ROLES = ["freelancer", "graduate", "student", "other"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "banned"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface ExtraLink {
  label: string;
  url: string;
}

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 160 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    role: varchar("role", { length: 16 }).notNull().$type<UserRole>(),
    avatarUrl: text("avatar_url"),
    bio: text("bio").default("").notNull(),
    jobTitle: varchar("job_title", { length: 120 }).default("").notNull(),
    phone: varchar("phone", { length: 40 }).default("").notNull(),
    skills: text("skills").default("").notNull(), // comma-separated
    portfolioUrl: text("portfolio_url").default("").notNull(),
    linkedinUrl: text("linkedin_url").default("").notNull(),
    behanceUrl: text("behance_url").default("").notNull(),
    githubUrl: text("github_url").default("").notNull(),
    otherLinks: jsonb("other_links").$type<ExtraLink[]>().default([]).notNull(),
    status: varchar("status", { length: 16 })
      .default("active")
      .notNull()
      .$type<UserStatus>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
    roleIdx: index("users_role_idx").on(t.role),
  }),
);

const safeName = z
  .string()
  .trim()
  .min(2, "الاسم قصير جدًّا")
  .max(120)
  .regex(/^[^<>]*$/u, "رموز غير مسموح بها")
  .regex(/^[\p{L}\p{M}\s'’\-\.]+$/u, "أحرف غير صحيحة في الاسم");

const safePassword = z
  .string()
  .min(8, "كلمة السرّ يجب أن تكون 8 أحرف فأكثر")
  .max(200, "كلمة السرّ طويلة جدًّا");

export const registerUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("بريد غير صحيح").max(160),
  password: safePassword,
  fullName: safeName,
  role: z.enum(USER_ROLES),
});

export const loginUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("بريد غير صحيح").max(160),
  password: z.string().min(1, "أدخل كلمة السرّ").max(200),
});

const safeMultiline = (max: number) =>
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

export const updateProfileSchema = z.object({
  fullName: safeName.optional(),
  bio: safeMultiline(2000).optional(),
  jobTitle: safeMultiline(120).optional(),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[\d\s+()\-]*$/u, "رقم الهاتف يحتوي رموزًا غير صحيحة")
    .optional(),
  skills: safeMultiline(500).optional(),
  portfolioUrl: httpUrl(400).optional(),
  linkedinUrl: httpUrl(400).optional(),
  behanceUrl: httpUrl(400).optional(),
  githubUrl: httpUrl(400).optional(),
  otherLinks: z
    .array(
      z.object({
        label: safeMultiline(60).min(1, "العنوان مطلوب"),
        url: httpUrl(400),
      }),
    )
    .max(8, "روابط كثيرة")
    .optional(),
  avatarUrl: z.string().trim().max(800).optional(),
});

export type User = typeof usersTable.$inferSelect;
export type PublicUser = Omit<User, "passwordHash">;

export const ROLE_LABELS: Record<UserRole, string> = {
  freelancer: "مستقلّ",
  graduate: "خرّيج جامعي",
  student: "طالب جامعي",
  other: "عضو",
};
