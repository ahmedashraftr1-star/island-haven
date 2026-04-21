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

export const insertApplicationSchema = z.object({
  fullName: z.string().trim().min(2, "الاسم قصير جداً").max(120),
  email: z.string().trim().email("بريد غير صحيح").max(160),
  phone: z.string().trim().min(6, "رقم قصير").max(40),
  category: z.enum(["freelancer", "graduate", "student", "other"]),
  bio: z.string().trim().min(10, "اكتب نبذة قصيرة").max(2000),
});

export type Application = typeof applicationsTable.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
