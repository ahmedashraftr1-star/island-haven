import {
  pgTable,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Persists password-reset tokens so they survive a server restart.
 * Only the SHA-256 hash of the raw token is stored — the raw token
 * is sent to the user in an email and never written here.
 *
 * Rows are deleted on consumption (single-use) or pruned by the
 * cleanup helper once they have expired.
 */
export const passwordResetTokensTable = pgTable(
  "password_reset_tokens",
  {
    tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
    email: varchar("email", { length: 160 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    emailIdx: index("password_reset_tokens_email_idx").on(t.email),
    expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(t.expiresAt),
  }),
);

export type PasswordResetToken =
  typeof passwordResetTokensTable.$inferSelect;
