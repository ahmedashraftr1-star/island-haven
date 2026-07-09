// ─────────────────────────────────────────────────────────────────────────────
// Admin RBAC taxonomy — a PURE, dependency-free module (no DB, no server runtime)
// so both the API and the frontend permission-matrix UI import the SAME source of
// truth via "@workspace/db/contracts". Permissions are strings "<section>:<action>".
//
// Authorization model: an admin account holds a resolved SET of permission strings.
// A role preset is just a convenient starting set — the stored `permissions` array
// on admin_users is the authority. `super_admin` (and the bootstrap ENV admin)
// bypass all checks. Every mutating /admin route requires a specific permission.
// ─────────────────────────────────────────────────────────────────────────────

export type AdminAction = "view" | "manage" | "send";

export interface AdminSection {
  key: string;
  labelAr: string;
  labelEn: string;
  /** Which actions this section exposes as permissions. */
  actions: AdminAction[];
}

/** The admin sections, aligned to the dashboard tabs. `manage` implies `view`. */
export const ADMIN_SECTIONS: readonly AdminSection[] = [
  { key: "overview", labelAr: "النظرة العامّة", labelEn: "Overview", actions: ["view"] },
  { key: "analytics", labelAr: "التحليلات", labelEn: "Analytics", actions: ["view", "manage"] },
  { key: "tasks", labelAr: "المهامّ", labelEn: "Tasks", actions: ["view", "manage"] },
  { key: "bookings", labelAr: "الحجوزات", labelEn: "Bookings", actions: ["view", "manage"] },
  { key: "attendance", labelAr: "الحضور", labelEn: "Attendance", actions: ["view", "manage"] },
  { key: "applications", labelAr: "طلبات الانتساب", labelEn: "Applications", actions: ["view", "manage"] },
  { key: "users", labelAr: "المستخدمون", labelEn: "Users", actions: ["view", "manage"] },
  { key: "experts", labelAr: "الخبراء", labelEn: "Experts", actions: ["view", "manage"] },
  { key: "sessions", labelAr: "الجلسات", labelEn: "Sessions", actions: ["view", "manage"] },
  { key: "programs", labelAr: "البرامج", labelEn: "Programs", actions: ["view", "manage"] },
  { key: "cohorts", labelAr: "الدفعات", labelEn: "Cohorts", actions: ["view", "manage"] },
  { key: "ventures", labelAr: "المشاريع", labelEn: "Ventures", actions: ["view", "manage"] },
  { key: "opportunities", labelAr: "الفرص", labelEn: "Opportunities", actions: ["view", "manage"] },
  { key: "perks", labelAr: "الامتيازات", labelEn: "Perks", actions: ["view", "manage"] },
  { key: "badges", labelAr: "الأوسمة", labelEn: "Badges", actions: ["view", "manage"] },
  { key: "slots", labelAr: "المواعيد", labelEn: "Slots", actions: ["view", "manage"] },
  { key: "resources", labelAr: "الموارد", labelEn: "Resources", actions: ["view", "manage"] },
  { key: "stories", labelAr: "قصص النجاح", labelEn: "Stories", actions: ["view", "manage"] },
  { key: "partners", labelAr: "الشركاء", labelEn: "Partners", actions: ["view", "manage"] },
  { key: "team", labelAr: "فريق الموقع (CMS)", labelEn: "Team (CMS)", actions: ["view", "manage"] },
  { key: "works", labelAr: "الأعمال", labelEn: "Works", actions: ["view", "manage"] },
  { key: "courses", labelAr: "الدورات", labelEn: "Courses", actions: ["view", "manage"] },
  { key: "daily", labelAr: "اليوميّات", labelEn: "Daily", actions: ["view", "manage"] },
  { key: "content", labelAr: "المحتوى", labelEn: "Content", actions: ["view", "manage"] },
  { key: "contact", labelAr: "رسائل التواصل", labelEn: "Contact messages", actions: ["view", "manage"] },
  { key: "broadcast", labelAr: "بثّ الإشعارات", labelEn: "Broadcast", actions: ["send"] },
  { key: "messages", labelAr: "المراسلة الداخليّة", labelEn: "Internal messages", actions: ["send"] },
  { key: "audit", labelAr: "سجلّ التدقيق", labelEn: "Audit log", actions: ["view"] },
  { key: "settings", labelAr: "الإعدادات", labelEn: "Settings", actions: ["view", "manage"] },
  { key: "staff", labelAr: "الفريق والصلاحيّات", labelEn: "Team & permissions", actions: ["manage"] },
] as const;

/** Flat list of every permission string, e.g. "users:view", "users:manage". */
export const ALL_ADMIN_PERMISSIONS: readonly string[] = ADMIN_SECTIONS.flatMap((s) =>
  s.actions.map((a) => `${s.key}:${a}`),
);

const PERM_SET = new Set(ALL_ADMIN_PERMISSIONS);
export function isValidPermission(p: string): boolean {
  return PERM_SET.has(p);
}

export const ADMIN_ROLES = [
  "super_admin",
  "manager",
  "content_editor",
  "mentor_coordinator",
  "analyst",
  "support",
  "custom",
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

const perms = (...keys: string[]): string[] => keys.filter(isValidPermission);
// view+manage for a set of section keys
const vm = (...sections: string[]): string[] =>
  sections.flatMap((k) => [`${k}:view`, `${k}:manage`]).filter(isValidPermission);

/** Preset permission sets. `super_admin` = everything (also bypasses at runtime). */
export const ROLE_PRESETS: Record<Exclude<AdminRole, "custom">, string[]> = {
  super_admin: [...ALL_ADMIN_PERMISSIONS],
  manager: [
    ...ALL_ADMIN_PERMISSIONS.filter(
      (p) => p !== "staff:manage" && p !== "settings:manage",
    ),
  ],
  content_editor: [
    "overview:view",
    ...vm("content", "daily", "stories", "ventures", "resources", "partners", "team", "works", "perks", "opportunities"),
  ],
  mentor_coordinator: [
    "overview:view",
    ...vm("experts", "sessions", "slots", "applications", "programs", "cohorts", "badges"),
    ...perms("messages:send"),
  ],
  analyst: perms("overview:view", "analytics:view", "audit:view"),
  support: [
    "overview:view",
    ...vm("bookings", "attendance", "applications", "contact"),
    ...perms("users:view", "messages:send"),
  ],
};

/** Resolve a role to its preset permission set ("custom" → empty; caller supplies). */
export function permissionsForRole(role: AdminRole): string[] {
  if (role === "custom") return [];
  return [...ROLE_PRESETS[role]];
}

export const ADMIN_STATUSES = ["active", "disabled"] as const;
export type AdminStatus = (typeof ADMIN_STATUSES)[number];
