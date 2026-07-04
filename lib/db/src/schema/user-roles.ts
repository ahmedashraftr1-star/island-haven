// Pure, dependency-free user-role + link contracts. The single source of truth
// shared by the backend (via the normal schema re-export) AND the frontends
// (via the pg-free "@workspace/db/contracts" package export). NOTHING here may
// import drizzle / pg / zod, so a frontend can import these TYPES without ever
// pulling server runtime into its bundle.

// Roles a visitor may self-register as.
export const USER_ROLES = ["freelancer", "graduate", "student", "other"] as const;
// Roles only an admin can assign (never self-registerable). Experts/mentors
// power the incubator's mentorship system and can log in to their own dashboard.
export const STAFF_ROLES = ["expert"] as const;
// Every role the `role` column may hold.
export const ALL_USER_ROLES = [...USER_ROLES, ...STAFF_ROLES] as const;
export type UserRole = (typeof ALL_USER_ROLES)[number];

export const USER_STATUSES = ["active", "banned"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface ExtraLink {
  label: string;
  url: string;
}
