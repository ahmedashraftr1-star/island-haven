import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Seat overrides ───────────────────────────────────────────────────────────
// Admin-set state for a PHYSICAL hall seat (1–38, matching the shared hall-plan).
// A seat with an active override is UNBOOKABLE: the public `/bookings/availability`
// surfaces it and `POST /bookings` rejects it, so /book and the homepage preview
// both reflect it. This is GLOBAL (applies to every date) — date-specific holds
// are already expressed as normal bookings. One row per seat (unique).
export const SEAT_OVERRIDE_STATES = ["disabled", "maintenance", "reserved"] as const;
export type SeatOverrideState = (typeof SEAT_OVERRIDE_STATES)[number];

export const seatOverridesTable = pgTable(
  "seat_overrides",
  {
    id: serial("id").primaryKey(),
    seatNumber: integer("seat_number").notNull(),
    state: varchar("state", { length: 16 }).$type<SeatOverrideState>().notNull(),
    note: text("note").default("").notNull(),
    createdBy: varchar("created_by", { length: 160 }).default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // One override per seat — POST upserts on this.
    seatUnique: uniqueIndex("seat_overrides_seat_unique").on(t.seatNumber),
  }),
);
