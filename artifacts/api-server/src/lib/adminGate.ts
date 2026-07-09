import type { Request, Response, NextFunction } from "express";
import { resolveAdmin, type ResolvedAdmin } from "./auth";

// ─────────────────────────────────────────────────────────────────────────────
// Centralized RBAC gate for EVERY /admin/* route — one source of truth, so a new
// admin route can never ship un-gated by accident. FAIL-CLOSED: an admin path
// whose 2nd segment isn't mapped here is denied (403). Method → action:
//   GET/HEAD → :view   ·   POST/PATCH/PUT/DELETE → :manage
// with per-section overrides (view-only / manage-only / send). Super-admins and
// the ENV super-admin bypass. Auth/util endpoints need only authn (or nothing).
// ─────────────────────────────────────────────────────────────────────────────

/** 2nd path segment after /admin/ → RBAC section key. */
const SEGMENT_SECTION: Record<string, string> = {
  // read-only dashboard data
  activity: "overview",
  totals: "overview",
  "pending-counts": "overview",
  analytics: "analytics",
  audit: "audit",
  // feature sections
  tasks: "tasks",
  bookings: "bookings",
  attendance: "attendance",
  applications: "applications",
  "program-applications": "applications",
  users: "users",
  experts: "experts",
  sessions: "sessions",
  programs: "programs",
  cohorts: "cohorts",
  "cohort-updates": "cohorts",
  "cohort-weeks": "cohorts",
  ventures: "ventures",
  milestones: "ventures",
  opportunities: "opportunities",
  jobs: "opportunities",
  perks: "perks",
  badges: "badges",
  slots: "slots",
  resources: "resources",
  stories: "stories",
  partners: "partners",
  investors: "partners",
  team: "team",
  works: "works",
  courses: "courses",
  enrollments: "courses",
  daily: "daily",
  content: "content",
  newsletter: "content",
  upload: "content",
  push: "broadcast",
  notifications: "broadcast",
  settings: "settings",
  staff: "staff",
};

const VIEW_ONLY = new Set(["overview", "audit"]);
const MANAGE_ONLY = new Set(["staff"]);
const SEND_ONLY = new Set(["broadcast"]);
/** Admin endpoints that need only authentication (any admin), no permission. */
const AUTHN_ONLY = new Set(["me", "ping"]);
/** Admin endpoints with NO auth at all. */
const OPEN = new Set(["login", "logout"]);

function permissionFor(method: string, segment: string): string | null {
  const section = SEGMENT_SECTION[segment];
  if (!section) return null; // unmapped → fail-closed at the caller
  if (SEND_ONLY.has(section)) return `${section}:send`;
  if (MANAGE_ONLY.has(section)) return `${section}:manage`;
  if (VIEW_ONLY.has(section)) return `${section}:view`;
  const read = method === "GET" || method === "HEAD";
  return `${section}:${read ? "view" : "manage"}`;
}

export function adminGate(req: Request, res: Response, next: NextFunction): void {
  const m = req.path.match(/^\/admin\/([a-z0-9-]+)/);
  if (!m) {
    next();
    return; // not an /admin/<segment> route
  }
  const segment = m[1];
  if (OPEN.has(segment)) {
    next();
    return; // login / logout — no auth
  }
  resolveAdmin(req)
    .then((admin) => {
      if (!admin) {
        res.status(401).json({ error: "غير مصرّح" });
        return;
      }
      (req as Request & { admin?: ResolvedAdmin }).admin = admin;
      if (AUTHN_ONLY.has(segment) || admin.isSuper) {
        next();
        return;
      }
      const perm = permissionFor(req.method, segment);
      if (perm && admin.permissions.has(perm)) {
        next();
        return;
      }
      res.status(403).json({ error: "ليس لديك صلاحيّة لهذا الإجراء" });
    })
    .catch(() => res.status(401).json({ error: "غير مصرّح" }));
}
