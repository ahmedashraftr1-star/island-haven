import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

// Durable store for public contact-form submissions. Previously the /contact
// route only fired an email (lost entirely when no provider was configured);
// this table makes every enquiry retrievable + triageable in the admin inbox.
// status: new → read → handled (or archived). Insert on submit; status updated
// by the team.

export const CONTACT_STATUSES = ["new", "read", "handled", "archived"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const contactMessagesTable = pgTable(
  "contact_messages",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 160 }).notNull(),
    subject: varchar("subject", { length: 200 }).default("").notNull(),
    enquiry: varchar("enquiry", { length: 20 }).default("").notNull(),
    message: text("message").notNull(),
    status: varchar("status", { length: 12 })
      .notNull()
      .$type<ContactStatus>()
      .default("new"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    handledAt: timestamp("handled_at", { withTimezone: true }),
  },
  (t) => ({
    statusIdx: index("contact_messages_status_idx").on(t.status),
    createdIdx: index("contact_messages_created_idx").on(t.createdAt),
  }),
);

export type ContactMessage = typeof contactMessagesTable.$inferSelect;
