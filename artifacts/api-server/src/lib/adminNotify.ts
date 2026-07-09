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
    // Match "@FullName" as a whole token: longest name first (so "Ali Hassan"
    // wins over "Ali"), each match "claims" its span (blanked out) so a shorter
    // prefix name can't re-match the same text, and the char after the name must
    // be a boundary (end / whitespace / punctuation) — not another name char.
    const BOUNDARY = /[\s.,!?،؛:)\]}"'«»]/u;
    let remaining = text;
    const hits = new Set<number>();
    const sorted = staff
      .filter((s) => s.fullName)
      .sort((a, b) => b.fullName.length - a.fullName.length);
    for (const s of sorted) {
      const needle = "@" + s.fullName;
      let idx = remaining.indexOf(needle);
      while (idx !== -1) {
        const after = remaining[idx + needle.length];
        if (after === undefined || BOUNDARY.test(after)) {
          if (s.id !== exceptId) hits.add(s.id);
          // Blank the claimed span so a prefix name won't also match here.
          remaining =
            remaining.slice(0, idx) + " ".repeat(needle.length) + remaining.slice(idx + needle.length);
          idx = remaining.indexOf(needle);
        } else {
          idx = remaining.indexOf(needle, idx + 1);
        }
      }
    }
    return [...hits];
  } catch (err) {
    logger.error({ err }, "resolveMentionedAdminIds failed");
    return [];
  }
}
