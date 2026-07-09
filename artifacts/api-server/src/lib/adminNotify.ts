import { eq } from "drizzle-orm";
import {
  db,
  adminNotificationsTable,
  adminUsersTable,
  type AdminNotificationType,
} from "@workspace/db";
import { logger } from "./logger";

// Staff-side notifications — the admin analog of notify(). Fire-and-forget:
// recording a notification must never break the action that triggered it.

export interface AdminNotifyInput {
  type: AdminNotificationType;
  title: string;
  body?: string;
  link?: string;
  actor?: string;
}

/** Write one notification for a staff account (adminUserId; 0 = ENV super). */
export async function notifyAdmin(
  adminUserId: number | null | undefined,
  n: AdminNotifyInput,
): Promise<void> {
  if (adminUserId == null || adminUserId < 0) return;
  try {
    await db.insert(adminNotificationsTable).values({
      adminUserId,
      type: n.type,
      title: n.title.slice(0, 200),
      body: (n.body ?? "").slice(0, 500),
      link: (n.link ?? "").slice(0, 200),
      actor: (n.actor ?? "").slice(0, 120),
    });
  } catch (err) {
    logger.error({ err, adminUserId }, "notifyAdmin failed");
  }
}

/** Notify several staff at once (deduped, never throws). */
export async function notifyAdmins(
  adminUserIds: number[],
  n: AdminNotifyInput,
): Promise<void> {
  const unique = [...new Set(adminUserIds.filter((id) => id != null && id >= 0))];
  await Promise.all(unique.map((id) => notifyAdmin(id, n)));
}

/**
 * Resolve @mentions in a body to active staff account ids by matching their full
 * name after an "@". Simple + robust for a small team (no separate mention store).
 * Excludes `exceptId` (don't notify yourself for mentioning yourself).
 */
export async function resolveMentionedAdminIds(
  text: string,
  exceptId?: number,
): Promise<number[]> {
  if (!text || !text.includes("@")) return [];
  try {
    const staff = await db
      .select({ id: adminUsersTable.id, fullName: adminUsersTable.fullName })
      .from(adminUsersTable)
      .where(eq(adminUsersTable.status, "active"));
    const hits: number[] = [];
    for (const s of staff) {
      if (s.fullName && s.id !== exceptId && text.includes("@" + s.fullName)) {
        hits.push(s.id);
      }
    }
    return hits;
  } catch (err) {
    logger.error({ err }, "resolveMentionedAdminIds failed");
    return [];
  }
}
