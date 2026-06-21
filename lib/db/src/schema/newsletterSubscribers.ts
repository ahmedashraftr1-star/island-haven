import {
  pgTable,
  serial,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const NEWSLETTER_STATUSES = ["active", "unsubscribed"] as const;
export type NewsletterStatus = (typeof NEWSLETTER_STATUSES)[number];

export const newsletterSubscribersTable = pgTable(
  "newsletter_subscribers",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    name: varchar("name", { length: 200 }).default("").notNull(),
    status: varchar("status", { length: 20 })
      .notNull()
      .$type<NewsletterStatus>()
      .default("active"),
    subscribedAt: timestamp("subscribed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  },
  (t) => ({
    emailIdx: index("newsletter_email_idx").on(t.email),
    statusIdx: index("newsletter_status_idx").on(t.status),
  }),
);

export const subscribeSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح").max(320),
  name: z.string().trim().max(200).default(""),
});

export type NewsletterSubscriber =
  typeof newsletterSubscribersTable.$inferSelect;
