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
import { expertProfilesTable } from "./experts";
import { mentorshipSessionsTable } from "./mentorshipSessions";

// Concrete time slots an expert opens for office hours / mentorship.
// Members book a *specific* slot instead of opening an ad-hoc request and
// waiting for the expert to propose a time. The slot transitions:
//   available → booked → cancelled or completed (via the linked session).

export const SLOT_STATUSES = [
  "available",
  "booked",
  "cancelled",
] as const;
export type SlotStatus = (typeof SLOT_STATUSES)[number];

export const SLOT_MODES = ["online", "onsite"] as const;
export type SlotMode = (typeof SLOT_MODES)[number];

export const expertAvailabilitySlotsTable = pgTable(
  "expert_availability_slots",
  {
    id: serial("id").primaryKey(),
    expertId: integer("expert_id")
      .notNull()
      .references(() => expertProfilesTable.id, { onDelete: "cascade" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    mode: varchar("mode", { length: 16 })
      .notNull()
      .$type<SlotMode>()
      .default("online"),
    location: varchar("location", { length: 400 }).default("").notNull(),
    status: varchar("status", { length: 16 })
      .notNull()
      .$type<SlotStatus>()
      .default("available"),
    bookedSessionId: integer("booked_session_id").references(
      () => mentorshipSessionsTable.id,
      { onDelete: "set null" },
    ),
    note: text("note").default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    expertIdx: index("expert_availability_expert_idx").on(t.expertId),
    statusIdx: index("expert_availability_status_idx").on(t.status),
    startAtIdx: index("expert_availability_start_at_idx").on(t.startAt),
  }),
);

const safeText = (max: number) =>
  z.string().trim().max(max).regex(/^[^<>]*$/u, "رموز غير مسموح بها");

// Inner shape exported so partial-update routes can chain `.partial()` on it
// (zod's ZodEffects — what `.refine()` returns — doesn't carry `.partial()`).
export const slotShape = z.object({
  expertId: z.number().int().positive(),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  mode: z.enum(SLOT_MODES).default("online"),
  location: safeText(400).default(""),
  status: z.enum(SLOT_STATUSES).default("available"),
  note: safeText(1000).default(""),
});

export const upsertSlotSchema = slotShape.refine(
  (v) => new Date(v.endAt).getTime() > new Date(v.startAt).getTime(),
  { message: "نهاية الجلسة يجب أن تكون بعد بدايتها", path: ["endAt"] },
);

// What a member sends to grab a slot. They only need to identify the slot
// and tell the expert what they want to discuss.
export const bookSlotSchema = z.object({
  topic: safeText(200).min(3, "اكتب موضوع الجلسة"),
  message: safeText(2000).default(""),
});

export type AvailabilitySlot =
  typeof expertAvailabilitySlotsTable.$inferSelect;

export const SLOT_STATUS_LABELS: Record<SlotStatus, string> = {
  available: "متاح",
  booked: "محجوز",
  cancelled: "ملغى",
};

export const SLOT_MODE_LABELS: Record<SlotMode, string> = {
  online: "عن بُعد",
  onsite: "في المساحة",
};
