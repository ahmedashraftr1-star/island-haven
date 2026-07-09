import { Router, type IRouter, type Request } from "express";
import { z } from "zod";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  notificationsTable,
  notificationPrefsTable,
  pushTokensTable,
  ALL_USER_ROLES,
} from "@workspace/db";
import { requirePermission, getAdmin } from "../lib/auth";
import { writeAudit, auditActor } from "../lib/audit";
import { sendEmail, emailConfigured, broadcastEmail } from "../lib/email";
import { sendExpoBatch, type ExpoPushMessage } from "./push";
import { logger } from "../lib/logger";

// ─────────────────────────────────────────────────────────────────────────────
// Broadcast an announcement to everyone on the site. Three independent channels:
//   • in-app   — a notifications row for every targeted member (shows in the bell)
//   • push     — Expo mobile push to their registered devices (honours pushEnabled)
//   • email    — Resend email to members who keep broadcast emails on (default on)
// Audience is "all" members or a single role. Gated by broadcast:send (adminGate).
// ─────────────────────────────────────────────────────────────────────────────

const router: IRouter = Router();
const PERM = "broadcast:send";

const AUDIENCES = ["all", ...ALL_USER_ROLES] as const;

const broadcastSchema = z.object({
  title: z.string().trim().min(1, "العنوان مطلوب").max(120),
  body: z.string().trim().min(1, "النصّ مطلوب").max(2000),
  url: z.string().trim().max(400).optional(),
  audience: z.enum(AUDIENCES).default("all"),
  channels: z
    .object({
      inApp: z.boolean().default(true),
      push: z.boolean().default(false),
      email: z.boolean().default(false),
    })
    .default({ inApp: true, push: false, email: false }),
});

/** Active users matching the audience (all members, or a single role). */
async function targetUsers(audience: (typeof AUDIENCES)[number]) {
  const where =
    audience === "all"
      ? eq(usersTable.status, "active")
      : and(eq(usersTable.status, "active"), eq(usersTable.role, audience));
  return db
    .select({ id: usersTable.id, email: usersTable.email, fullName: usersTable.fullName })
    .from(usersTable)
    .where(where);
}

// Audience sizes + push reach, for the compose-screen preview.
router.get("/admin/broadcast/audience", requirePermission(PERM), async (_req, res) => {
  try {
    const roleRows = await db
      .select({ role: usersTable.role, count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.status, "active"))
      .groupBy(usersTable.role);
    const byRole: Record<string, number> = {};
    let all = 0;
    for (const r of roleRows) {
      byRole[r.role] = r.count;
      all += r.count;
    }
    const [tok] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(pushTokensTable);
    res.json({ all, byRole, pushTokens: tok?.total ?? 0, emailConfigured: emailConfigured() });
  } catch (err) {
    logger.error({ err }, "GET /admin/broadcast/audience failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/broadcast", requirePermission(PERM), async (req: Request, res) => {
  const parsed = broadcastSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة", issues: parsed.error.issues });
    return;
  }
  const { title, body, url, audience, channels } = parsed.data;
  if (!channels.inApp && !channels.push && !channels.email) {
    res.status(400).json({ error: "اختر قناة واحدة على الأقلّ" });
    return;
  }

  try {
    const users = await targetUsers(audience);
    const userIds = users.map((u) => u.id);
    const link = url && /^https?:\/\//i.test(url) ? url : url && url.startsWith("/") ? url : "";

    const stats = {
      recipients: users.length,
      inApp: 0,
      push: { sent: 0, failed: 0 },
      email: { sent: 0, skipped: 0, configured: emailConfigured() },
    };

    // ── In-app: one notification row per targeted member (chunked insert) ──────
    if (channels.inApp && userIds.length) {
      const rows = userIds.map((userId) => ({
        userId,
        type: "admin_broadcast" as const,
        title: title.slice(0, 200),
        body: body.slice(0, 500),
        link: link.slice(0, 400),
      }));
      for (let i = 0; i < rows.length; i += 500) {
        await db.insert(notificationsTable).values(rows.slice(i, i + 500));
      }
      stats.inApp = rows.length;
    }

    // ── Push: Expo mobile push to targeted devices (honours pushEnabled) ───────
    if (channels.push) {
      // For "all", include anonymous device tokens (no userId); for a role,
      // only tokens owned by a user in the audience.
      const base = db
        .select({ token: pushTokensTable.token })
        .from(pushTokensTable)
        .leftJoin(
          notificationPrefsTable,
          eq(notificationPrefsTable.userId, pushTokensTable.userId),
        );
      const prefOn = or(
        isNull(notificationPrefsTable.userId),
        eq(notificationPrefsTable.pushEnabled, true),
      );
      const rows =
        audience === "all"
          ? await base.where(prefOn)
          : userIds.length
            ? await base.where(and(inArray(pushTokensTable.userId, userIds), prefOn))
            : [];
      const messages: ExpoPushMessage[] = rows
        .filter(
          (r) =>
            r.token.startsWith("ExponentPushToken[") ||
            r.token.startsWith("ExpoPushToken["),
        )
        .map((r) => ({
          to: r.token,
          sound: "default" as const,
          title,
          body,
          data: link ? { url: link } : undefined,
        }));
      const result = await sendExpoBatch(messages);
      stats.push = { sent: result.ok, failed: result.fail };
    }

    // ── Email: to members who keep broadcast emails on (default-on) ────────────
    if (channels.email && users.length) {
      if (!emailConfigured()) {
        stats.email.skipped = users.length;
      } else {
        const prefs = await db
          .select({ userId: notificationPrefsTable.userId, on: notificationPrefsTable.emailBroadcast })
          .from(notificationPrefsTable)
          .where(inArray(notificationPrefsTable.userId, userIds));
        const off = new Set(prefs.filter((p) => !p.on).map((p) => p.userId));
        const recipients = users.filter((u) => !off.has(u.id));
        stats.email.skipped = users.length - recipients.length;
        // Send in small concurrent batches so a large member list doesn't stall.
        for (let i = 0; i < recipients.length; i += 10) {
          const chunk = recipients.slice(i, i + 10);
          const results = await Promise.all(
            chunk.map((u) => {
              const { subject, html, text } = broadcastEmail(u.fullName, title, body, link || undefined);
              return sendEmail({ to: u.email, subject, html, text }).catch(() => false);
            }),
          );
          stats.email.sent += results.filter(Boolean).length;
        }
      }
    }

    void writeAudit({
      actor: auditActor(req),
      action: "broadcast_sent",
      targetType: "broadcast",
      targetId: audience,
      newValue: `${title} · in-app:${stats.inApp} push:${stats.push.sent} email:${stats.email.sent}`,
    });
    logger.info({ admin: getAdmin(req)?.email, audience, stats }, "broadcast sent");
    res.json({ ok: true, audience, ...stats });
  } catch (err) {
    logger.error({ err }, "POST /admin/broadcast failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
