import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  bio: text("bio").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("new"),
  notes: text("notes").default(""),
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

export const insertApplicationSchema = z.object({
  fullName: safeText(2, 120, "الاسم قصير جدًّا").regex(
    /^[\p{L}\p{M}\s'’\-\.]+$/u,
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
});

export type Application = typeof applicationsTable.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
