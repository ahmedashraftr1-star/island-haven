import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

// ─── Talent roster ────────────────────────────────────────────────────────────
// The real Island Haven talent community (students · graduates · freelancers),
// surfaced publicly on /membership. This is DELIBERATELY a SEPARATE table from
// `users`: the signed /verify figure `members` counts active `users` (+ base)
// and MUST stay frozen at 44 — this roster is a different concept ("talent
// community"), so seeding it here never touches the attestation.
//
// PRIVACY (P0): the public API returns ONLY the PUBLIC block below. The SENSITIVE
// block (phone, birthYear, notes, cvUrl, internetUser) and the OPERATIONAL block
// (days, period, seat) are NEVER included in any public payload and are NEVER
// logged — they are readable only through the 401-protected admin API. The
// LinkedIn URL is public ONLY when `linkedinPublic` is explicitly true.

export const ROSTER_TYPES = ["student", "graduate", "freelancer"] as const;
export type RosterType = (typeof ROSTER_TYPES)[number];

export const ROSTER_GENDERS = ["male", "female"] as const;
export type RosterGender = (typeof ROSTER_GENDERS)[number];

export const ROSTER_STATUSES = ["visible", "hidden"] as const;
export type RosterStatus = (typeof ROSTER_STATUSES)[number];

export const rosterMembersTable = pgTable(
  "roster_members",
  {
    id: serial("id").primaryKey(),

    // ── PUBLIC block (safe to expose on /api/roster) ──
    fullName: varchar("full_name", { length: 200 }).notNull(),
    fullNameEn: varchar("full_name_en", { length: 200 }).default("").notNull(),
    type: varchar("type", { length: 16 }).$type<RosterType>().notNull(),
    gender: varchar("gender", { length: 8 }).$type<RosterGender>().notNull(),
    skill: varchar("skill", { length: 200 }).default("").notNull(),
    field: varchar("field", { length: 120 }).default("").notNull(),

    // ── LinkedIn — public ONLY when linkedinPublic is true ──
    linkedinUrl: text("linkedin_url").default("").notNull(),
    linkedinPublic: boolean("linkedin_public").default(false).notNull(),

    // ── SENSITIVE block (admin-only; never public, never logged) ──
    phone: varchar("phone", { length: 40 }).default("").notNull(),
    birthYear: integer("birth_year"),
    notes: text("notes").default("").notNull(),
    cvUrl: text("cv_url").default("").notNull(),
    internetUser: varchar("internet_user", { length: 120 }).default("").notNull(),

    // ── OPERATIONAL block (admin-only; attendance scheduling) ──
    days: varchar("days", { length: 120 }).default("").notNull(),
    period: varchar("period", { length: 40 }).default("").notNull(),
    seat: integer("seat"),

    // ── Meta ──
    status: varchar("status", { length: 16 })
      .$type<RosterStatus>()
      .default("visible")
      .notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    // Soft-delete: non-null = trashed; excluded from all reads.
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    statusIdx: index("roster_members_status_idx").on(t.status),
    typeIdx: index("roster_members_type_idx").on(t.type),
  }),
);

// The exact set of columns that are SAFE to select for the public API. Importing
// this in the route (rather than hand-listing columns) makes it structurally hard
// to leak a sensitive field — anything not here is never sent publicly.
export const ROSTER_PUBLIC_COLUMNS = {
  id: rosterMembersTable.id,
  fullName: rosterMembersTable.fullName,
  fullNameEn: rosterMembersTable.fullNameEn,
  type: rosterMembersTable.type,
  gender: rosterMembersTable.gender,
  skill: rosterMembersTable.skill,
  field: rosterMembersTable.field,
} as const;
