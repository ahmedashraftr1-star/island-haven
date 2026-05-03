import { pgTable, serial, text, varchar, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

export const pushTokensTable = pgTable(
  "push_tokens",
  {
    id: serial("id").primaryKey(),
    token: text("token").notNull(),
    platform: varchar("platform", { length: 16 }).notNull(),
    userId: integer("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tokenUniq: uniqueIndex("push_tokens_token_uniq").on(t.token),
    userIdx: index("push_tokens_user_idx").on(t.userId),
  }),
);

export type PushToken = typeof pushTokensTable.$inferSelect;
