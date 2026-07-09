import type { Request } from "express";
import { db, auditLogTable } from "@workspace/db";
import { logger } from "./logger";
import { getAdmin } from "./auth";

/** The real actor for an audit row: the resolved admin's email (set by the
 *  RBAC gate / requireAdmin), falling back to "admin" for the ENV bootstrap. */
export function auditActor(req: Request): string {
  return getAdmin(req)?.email ?? "admin";
}

// Append-only audit trail for sensitive admin/staff mutations (OWASP A09 —
// security logging). Fire-and-forget + self-catching, like notify(): recording
// the change must NEVER break the mutation it describes. Values are truncated to
// the column limits (actor 160 / action 60 / target_type 40 / target_id 80).

export interface AuditEntry {
  actor: string; // admin email (getAdminEmail()) or "admin"
  action: string; // e.g. "user_status_changed"
  targetType: string; // "user" | "work" | "story" | …
  targetId?: string | number;
  oldValue?: string | null;
  newValue?: string | null;
}

const OLD_NEW_MAX = 2000;

/** Write one audit row. Never throws. */
export async function writeAudit(e: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogTable).values({
      actor: e.actor.slice(0, 160) || "admin",
      action: e.action.slice(0, 60),
      targetType: e.targetType.slice(0, 40),
      targetId: String(e.targetId ?? "").slice(0, 80),
      oldValue: String(e.oldValue ?? "").slice(0, OLD_NEW_MAX),
      newValue: String(e.newValue ?? "").slice(0, OLD_NEW_MAX),
    });
  } catch (err) {
    logger.error({ err, action: e.action }, "writeAudit failed");
  }
}
