import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Internal communication between the team and the community.
//
//  • admin_threads / admin_messages — a 1:1 DM channel between the TEAM and one
//    MEMBER. From the member's side it reads as a single "من الإدارة" inbox
//    thread; any admin may reply into it. senderKind distinguishes who wrote a
//    message (an admin_users id, or the member's users id). One thread per member.
//
//  • team_messages — a single shared STAFF channel (owner ↔ staff ↔ staff). Every
//    admin posts into one stream; senderAdminId is the admin_users id (0 = the
//    ENV super-admin, which has no row) and senderName is denormalised so the
//    ENV admin and deleted accounts still render.
//
//  • team_channel_reads — per-admin last-read marker for the staff channel's
//    unread badge.
// ─────────────────────────────────────────────────────────────────────────────

export const adminThreadsTable = pgTable(
  "admin_threads",
  {
    id: serial("id").primaryKey(),
    // The member this thread belongs to (users.id). One thread per member.
    memberUserId: integer("member_user_id").notNull().unique(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Read markers → unread counts are messages created after these.
    lastAdminReadAt: timestamp("last_admin_read_at", { withTimezone: true }),
    lastMemberReadAt: timestamp("last_member_read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    memberIdx: index("admin_threads_member_idx").on(t.memberUserId),
    lastMsgIdx: index("admin_threads_last_msg_idx").on(t.lastMessageAt),
  }),
);

export type AdminMessageSender = "admin" | "member";

export const adminMessagesTable = pgTable(
  "admin_messages",
  {
    id: serial("id").primaryKey(),
    threadId: integer("thread_id").notNull(),
    // Who wrote it: "admin" (senderId = admin_users.id, 0 = ENV super) or
    // "member" (senderId = users.id).
    senderKind: varchar("sender_kind", { length: 8 })
      .notNull()
      .$type<AdminMessageSender>(),
    senderId: integer("sender_id").notNull(),
    // Denormalised display name of the sender at write time.
    senderName: varchar("sender_name", { length: 120 }).default("").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    threadIdx: index("admin_messages_thread_idx").on(t.threadId),
  }),
);

export const teamMessagesTable = pgTable(
  "team_messages",
  {
    id: serial("id").primaryKey(),
    senderAdminId: integer("sender_admin_id").notNull(),
    senderName: varchar("sender_name", { length: 120 }).default("").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    createdIdx: index("team_messages_created_idx").on(t.createdAt),
  }),
);

export const teamChannelReadsTable = pgTable("team_channel_reads", {
  adminUserId: integer("admin_user_id").primaryKey(),
  lastReadAt: timestamp("last_read_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Shared body validation — same rules as member↔member messaging.
export const adminMessageBodySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "الرسالة فارغة")
    .max(4000, "الرسالة طويلة جدًّا")
    .regex(/^[^<>]*$/u, "رموز غير مسموح بها"),
});

export const startAdminThreadSchema = z.object({
  memberUserId: z.number().int().positive("معرّف غير صحيح"),
  body: z
    .string()
    .trim()
    .min(1, "الرسالة فارغة")
    .max(4000, "الرسالة طويلة جدًّا")
    .regex(/^[^<>]*$/u, "رموز غير مسموح بها"),
});

export type AdminThread = typeof adminThreadsTable.$inferSelect;
export type AdminMessage = typeof adminMessagesTable.$inferSelect;
export type TeamMessage = typeof teamMessagesTable.$inferSelect;
