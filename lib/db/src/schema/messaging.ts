import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

// Member-to-member direct messaging — async, no websockets. A conversation is a
// single row between exactly two members (ordering normalized so a↔b == b↔a);
// every message belongs to one conversation. The client polls for new messages.

export const conversationsTable = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    user1Id: integer("user1_id").notNull(),
    user2Id: integer("user2_id").notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    user1Idx: index("conversations_user1_idx").on(t.user1Id),
    user2Idx: index("conversations_user2_idx").on(t.user2Id),
  }),
);

export const messagesTable = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id").notNull(),
    senderId: integer("sender_id").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    conversationIdx: index("messages_conversation_idx").on(t.conversationId),
  }),
);

export const sendMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "الرسالة فارغة")
    .max(4000, "الرسالة طويلة جدًّا")
    .regex(/^[^<>]*$/u, "رموز غير مسموح بها"),
});

export const startConversationSchema = z.object({
  userId: z.number().int().positive("معرّف غير صحيح"),
});

export type Conversation = typeof conversationsTable.$inferSelect;
export type Message = typeof messagesTable.$inferSelect;
