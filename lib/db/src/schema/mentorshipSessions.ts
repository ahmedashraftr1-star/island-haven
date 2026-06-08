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
import { usersTable } from "./users";
import { expertProfilesTable } from "./experts";

// A mentorship-session request: a mentee (any logged-in user) asks an expert
// for a 1:1 session. The expert (or an admin) confirms/declines, and marks it
// completed afterwards.

export const SESSION_STATUSES = [
  "requested",
  "confirmed",
  "declined",
  "completed",
  "cancelled",
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_MODES = ["online", "onsite"] as const;
export type SessionMode = (typeof SESSION_MODES)[number];

export const mentorshipSessionsTable = pgTable(
  "mentorship_sessions",
  {
    id: serial("id").primaryKey(),
    expertId: integer("expert_id")
      .notNull()
      .references(() => expertProfilesTable.id, { onDelete: "cascade" }),
    menteeId: integer("mentee_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    topic: varchar("topic", { length: 200 }).notNull(),
    message: text("message").default("").notNull(),
    mode: varchar("mode", { length: 16 })
      .notNull()
      .$type<SessionMode>()
      .default("online"),
    preferredAt: timestamp("preferred_at", { withTimezone: true }),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<SessionStatus>()
      .default("requested"),
    expertNote: text("expert_note").default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    expertIdx: index("mentorship_sessions_expert_idx").on(t.expertId),
    menteeIdx: index("mentorship_sessions_mentee_idx").on(t.menteeId),
    statusIdx: index("mentorship_sessions_status_idx").on(t.status),
  }),
);

const safeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(/^[^<>]*$/u, "رموز غير مسموح بها");

// Mentee submits this to request a session.
export const requestSessionSchema = z.object({
  topic: safeText(200).min(3, "اكتب موضوع الجلسة"),
  message: safeText(2000).default(""),
  mode: z.enum(SESSION_MODES).default("online"),
  preferredAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
});

export type MentorshipSession = typeof mentorshipSessionsTable.$inferSelect;

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  requested: "بانتظار الرّد",
  confirmed: "مؤكَّدة",
  declined: "مرفوضة",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

export const SESSION_MODE_LABELS: Record<SessionMode, string> = {
  online: "عن بُعد",
  onsite: "في المساحة",
};
