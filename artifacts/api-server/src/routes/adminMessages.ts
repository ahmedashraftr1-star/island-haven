import { Router, type IRouter, type Request } from "express";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import {
  db,
  adminThreadsTable,
  adminMessagesTable,
  teamMessagesTable,
  teamMessageReactionsTable,
  teamChannelReadsTable,
  usersTable,
  adminMessageBodySchema,
  startAdminThreadSchema,
} from "@workspace/db";
import {
  requireUser,
  requirePermission,
  getAdmin,
  type UserSession,
} from "../lib/auth";
import { notify } from "./notifications";
import { notifyAdmin, notifyAdmins, resolveMentionedAdminIds } from "../lib/adminNotify";
import { makeUserRateLimit } from "../lib/rateLimit";
import { logger } from "../lib/logger";

// ─────────────────────────────────────────────────────────────────────────────
// Internal communication.
//  • /admin/messages/*  — the TEAM side (gated messages:send): DM any member,
//    read/reply per-member threads, and a shared staff "team channel".
//  • /me/team-thread/*  — the MEMBER side (requireUser): read + reply to the
//    "من الإدارة" thread.
// Reuses the async-polling + body-validation pattern from member messaging.
// ─────────────────────────────────────────────────────────────────────────────

const router: IRouter = Router();
const PERM = "messages:send";
const EPOCH0 = sql`to_timestamp(0)`;

function sessionOf(req: Request): UserSession {
  return (req as Request & { userSession: UserSession }).userSession;
}
function adminName(req: Request): string {
  const a = getAdmin(req);
  return a?.fullName || a?.email || "فريق آيلاند هيفن";
}

const memberSendLimit = makeUserRateLimit({ max: 20, windowMs: 60_000 });

/** Find (or create) the single thread for a member. */
async function ensureThread(memberUserId: number): Promise<number> {
  const [existing] = await db
    .select({ id: adminThreadsTable.id })
    .from(adminThreadsTable)
    .where(eq(adminThreadsTable.memberUserId, memberUserId))
    .limit(1);
  if (existing) return existing.id;
  await db
    .insert(adminThreadsTable)
    .values({ memberUserId })
    .onConflictDoNothing();
  const [row] = await db
    .select({ id: adminThreadsTable.id })
    .from(adminThreadsTable)
    .where(eq(adminThreadsTable.memberUserId, memberUserId))
    .limit(1);
  return row.id;
}

// ─── ADMIN: owner ↔ member DMs ────────────────────────────────────────────────

router.get("/admin/messages/threads", requirePermission(PERM), async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: adminThreadsTable.id,
        memberUserId: adminThreadsTable.memberUserId,
        memberName: usersTable.fullName,
        memberAvatar: usersTable.avatarUrl,
        lastMessageAt: adminThreadsTable.lastMessageAt,
        preview: sql<string>`(SELECT body FROM admin_messages am WHERE am.thread_id = ${adminThreadsTable.id} ORDER BY am.created_at DESC LIMIT 1)`,
        unread: sql<number>`(SELECT count(*)::int FROM admin_messages am WHERE am.thread_id = ${adminThreadsTable.id} AND am.sender_kind = 'member' AND am.created_at > COALESCE(${adminThreadsTable.lastAdminReadAt}, ${EPOCH0}))`,
      })
      .from(adminThreadsTable)
      .innerJoin(usersTable, eq(usersTable.id, adminThreadsTable.memberUserId))
      .orderBy(desc(adminThreadsTable.lastMessageAt));
    res.json({ threads: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/messages/threads failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/messages/unread", requirePermission(PERM), async (_req, res) => {
  try {
    const [r] = await db
      .select({
        threads: sql<number>`count(*)::int`,
        messages: sql<number>`COALESCE(SUM((SELECT count(*) FROM admin_messages am WHERE am.thread_id = ${adminThreadsTable.id} AND am.sender_kind = 'member' AND am.created_at > COALESCE(${adminThreadsTable.lastAdminReadAt}, ${EPOCH0}))),0)::int`,
      })
      .from(adminThreadsTable)
      .where(
        sql`(SELECT count(*) FROM admin_messages am WHERE am.thread_id = ${adminThreadsTable.id} AND am.sender_kind = 'member' AND am.created_at > COALESCE(${adminThreadsTable.lastAdminReadAt}, ${EPOCH0})) > 0`,
      );
    res.json({ threads: r?.threads ?? 0, messages: r?.messages ?? 0 });
  } catch (err) {
    logger.error({ err }, "GET /admin/messages/unread failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Search members to start a new DM.
router.get("/admin/messages/members", requirePermission(PERM), async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim().slice(0, 80);
    const where = q
      ? and(
          eq(usersTable.status, "active"),
          or(ilike(usersTable.fullName, `%${q}%`), ilike(usersTable.email, `%${q}%`)),
        )
      : eq(usersTable.status, "active");
    const rows = await db
      .select({ id: usersTable.id, fullName: usersTable.fullName, email: usersTable.email, avatarUrl: usersTable.avatarUrl })
      .from(usersTable)
      .where(where)
      .orderBy(asc(usersTable.fullName))
      .limit(20);
    res.json({ members: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/messages/members failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/messages/threads/:id", requirePermission(PERM), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "معرّف غير صالح" });
      return;
    }
    const [thread] = await db
      .select({
        id: adminThreadsTable.id,
        memberUserId: adminThreadsTable.memberUserId,
        memberName: usersTable.fullName,
        memberAvatar: usersTable.avatarUrl,
      })
      .from(adminThreadsTable)
      .innerJoin(usersTable, eq(usersTable.id, adminThreadsTable.memberUserId))
      .where(eq(adminThreadsTable.id, id))
      .limit(1);
    if (!thread) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const messages = await db
      .select({
        id: adminMessagesTable.id,
        senderKind: adminMessagesTable.senderKind,
        senderName: adminMessagesTable.senderName,
        body: adminMessagesTable.body,
        createdAt: adminMessagesTable.createdAt,
      })
      .from(adminMessagesTable)
      .where(eq(adminMessagesTable.threadId, id))
      .orderBy(asc(adminMessagesTable.createdAt));
    // Mark read up to now.
    await db
      .update(adminThreadsTable)
      .set({ lastAdminReadAt: new Date() })
      .where(eq(adminThreadsTable.id, id));
    res.json({ thread, messages });
  } catch (err) {
    logger.error({ err }, "GET /admin/messages/threads/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

/** Insert an admin message into a thread + notify the member. */
async function postAdminMessage(req: Request, threadId: number, memberUserId: number, body: string) {
  const name = adminName(req);
  await db.insert(adminMessagesTable).values({
    threadId,
    senderKind: "admin",
    senderId: getAdmin(req)?.id ?? 0,
    senderName: name,
    body,
  });
  await db
    .update(adminThreadsTable)
    .set({ lastMessageAt: new Date(), lastAdminReadAt: new Date() })
    .where(eq(adminThreadsTable.id, threadId));
  void notify(memberUserId, {
    type: "generic",
    title: "رسالة من فريق آيلاند هيفن",
    body: body.slice(0, 120),
    link: "/messages/team",
  });
}

router.post("/admin/messages/threads/:id", requirePermission(PERM), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "معرّف غير صالح" });
      return;
    }
    const parsed = adminMessageBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
      return;
    }
    const [thread] = await db
      .select({ memberUserId: adminThreadsTable.memberUserId })
      .from(adminThreadsTable)
      .where(eq(adminThreadsTable.id, id))
      .limit(1);
    if (!thread) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await postAdminMessage(req, id, thread.memberUserId, parsed.data.body);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /admin/messages/threads/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Start (or continue) a DM with a member by id.
router.post("/admin/messages/start", requirePermission(PERM), async (req, res) => {
  try {
    const parsed = startAdminThreadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
      return;
    }
    const { memberUserId, body } = parsed.data;
    const [member] = await db
      .select({ id: usersTable.id, status: usersTable.status })
      .from(usersTable)
      .where(eq(usersTable.id, memberUserId))
      .limit(1);
    if (!member || member.status !== "active") {
      res.status(404).json({ error: "العضو غير موجود" });
      return;
    }
    const threadId = await ensureThread(memberUserId);
    await postAdminMessage(req, threadId, memberUserId, body);
    res.status(201).json({ ok: true, threadId });
  } catch (err) {
    logger.error({ err }, "POST /admin/messages/start failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── ADMIN: staff team channel ────────────────────────────────────────────────

router.get("/admin/messages/team", requirePermission(PERM), async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(teamMessagesTable)
      .orderBy(desc(teamMessagesTable.createdAt))
      .limit(100);
    const meId = getAdmin(req)?.id ?? 0;
    // Reactions for the visible messages, grouped by emoji (with "did I react").
    const ids = rows.map((r) => r.id);
    const reactions = ids.length
      ? await db
          .select()
          .from(teamMessageReactionsTable)
          .where(inArray(teamMessageReactionsTable.messageId, ids))
      : [];
    const byMsg = new Map<number, Map<string, { count: number; mine: boolean }>>();
    for (const rc of reactions) {
      if (!byMsg.has(rc.messageId)) byMsg.set(rc.messageId, new Map());
      const m = byMsg.get(rc.messageId)!;
      const cur = m.get(rc.emoji) ?? { count: 0, mine: false };
      cur.count++;
      if (rc.adminUserId === meId) cur.mine = true;
      m.set(rc.emoji, cur);
    }
    const withReactions = rows.map((r) => ({
      ...r,
      reactions: [...(byMsg.get(r.id)?.entries() ?? [])].map(([emoji, v]) => ({ emoji, ...v })),
    }));
    await db
      .insert(teamChannelReadsTable)
      .values({ adminUserId: meId, lastReadAt: new Date() })
      .onConflictDoUpdate({ target: teamChannelReadsTable.adminUserId, set: { lastReadAt: new Date() } });
    res.json({ messages: withReactions.reverse(), meId });
  } catch (err) {
    logger.error({ err }, "GET /admin/messages/team failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/messages/team", requirePermission(PERM), async (req, res) => {
  try {
    const parsed = adminMessageBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
      return;
    }
    const meId = getAdmin(req)?.id ?? 0;
    const name = adminName(req);
    const [row] = await db
      .insert(teamMessagesTable)
      .values({ senderAdminId: meId, senderName: name, body: parsed.data.body })
      .returning();
    await db
      .insert(teamChannelReadsTable)
      .values({ adminUserId: meId, lastReadAt: new Date() })
      .onConflictDoUpdate({ target: teamChannelReadsTable.adminUserId, set: { lastReadAt: new Date() } });
    // @mentions in the team channel → notify the mentioned staff.
    const mentioned = await resolveMentionedAdminIds(parsed.data.body, meId);
    void notifyAdmins(mentioned, {
      type: "channel_mention",
      title: `ذكرك ${name} في قناة الفريق`,
      body: parsed.data.body.slice(0, 120),
      link: "channel",
      actor: name,
    });
    res.status(201).json({ message: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/messages/team failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

const ALLOWED_EMOJI = ["👍", "❤️", "🎉", "✅", "🙏", "🔥", "👀", "😄"];

// Toggle an emoji reaction on a team message.
router.post("/admin/messages/team/:id/react", requirePermission(PERM), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const emoji = String(req.body?.emoji ?? "");
    if (!Number.isInteger(id) || id <= 0 || !ALLOWED_EMOJI.includes(emoji)) {
      res.status(400).json({ error: "بيانات غير صحيحة" });
      return;
    }
    const meId = getAdmin(req)?.id ?? 0;
    const [existing] = await db
      .select({ id: teamMessageReactionsTable.id })
      .from(teamMessageReactionsTable)
      .where(
        and(
          eq(teamMessageReactionsTable.messageId, id),
          eq(teamMessageReactionsTable.adminUserId, meId),
          eq(teamMessageReactionsTable.emoji, emoji),
        ),
      )
      .limit(1);
    if (existing) {
      await db.delete(teamMessageReactionsTable).where(eq(teamMessageReactionsTable.id, existing.id));
      res.json({ ok: true, reacted: false });
    } else {
      await db
        .insert(teamMessageReactionsTable)
        .values({ messageId: id, adminUserId: meId, emoji })
        .onConflictDoNothing();
      res.json({ ok: true, reacted: true });
    }
  } catch (err) {
    logger.error({ err }, "POST team react failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Edit your OWN team message.
router.patch("/admin/messages/team/:id", requirePermission(PERM), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "معرّف غير صالح" });
      return;
    }
    const parsed = adminMessageBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
      return;
    }
    const meId = getAdmin(req)?.id ?? 0;
    const [existing] = await db
      .select({ senderAdminId: teamMessagesTable.senderAdminId })
      .from(teamMessagesTable)
      .where(eq(teamMessagesTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    if (existing.senderAdminId !== meId) {
      res.status(403).json({ error: "يمكنك تعديل رسائلك فقط" });
      return;
    }
    const [row] = await db
      .update(teamMessagesTable)
      .set({ body: parsed.data.body, editedAt: new Date() })
      .where(eq(teamMessagesTable.id, id))
      .returning();
    res.json({ message: row });
  } catch (err) {
    logger.error({ err }, "PATCH team message failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Delete your OWN team message.
router.delete("/admin/messages/team/:id", requirePermission(PERM), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "معرّف غير صالح" });
      return;
    }
    const meId = getAdmin(req)?.id ?? 0;
    const admin = getAdmin(req);
    const [existing] = await db
      .select({ senderAdminId: teamMessagesTable.senderAdminId })
      .from(teamMessagesTable)
      .where(eq(teamMessagesTable.id, id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    // Own message, or a super-admin (moderation).
    if (existing.senderAdminId !== meId && !admin?.isSuper) {
      res.status(403).json({ error: "يمكنك حذف رسائلك فقط" });
      return;
    }
    await db.delete(teamMessagesTable).where(eq(teamMessagesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE team message failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/messages/team/unread", requirePermission(PERM), async (req, res) => {
  try {
    const meId = getAdmin(req)?.id ?? 0;
    const [r] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(teamMessagesTable)
      .where(
        and(
          sql`${teamMessagesTable.senderAdminId} <> ${meId}`,
          sql`${teamMessagesTable.createdAt} > COALESCE((SELECT last_read_at FROM team_channel_reads WHERE admin_user_id = ${meId}), ${EPOCH0})`,
        ),
      );
    res.json({ count: r?.count ?? 0 });
  } catch (err) {
    logger.error({ err }, "GET /admin/messages/team/unread failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── MEMBER: the "من الإدارة" thread ──────────────────────────────────────────

router.get("/me/team-thread", requireUser, async (req, res) => {
  try {
    const { userId } = sessionOf(req);
    const [thread] = await db
      .select({ id: adminThreadsTable.id })
      .from(adminThreadsTable)
      .where(eq(adminThreadsTable.memberUserId, userId))
      .limit(1);
    if (!thread) {
      res.json({ messages: [] });
      return;
    }
    const messages = await db
      .select({
        id: adminMessagesTable.id,
        senderKind: adminMessagesTable.senderKind,
        senderName: adminMessagesTable.senderName,
        body: adminMessagesTable.body,
        createdAt: adminMessagesTable.createdAt,
      })
      .from(adminMessagesTable)
      .where(eq(adminMessagesTable.threadId, thread.id))
      .orderBy(asc(adminMessagesTable.createdAt));
    await db
      .update(adminThreadsTable)
      .set({ lastMemberReadAt: new Date() })
      .where(eq(adminThreadsTable.id, thread.id));
    res.json({ messages });
  } catch (err) {
    logger.error({ err }, "GET /me/team-thread failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/me/team-thread/unread", requireUser, async (req, res) => {
  try {
    const { userId } = sessionOf(req);
    const [r] = await db
      .select({
        count: sql<number>`(SELECT count(*)::int FROM admin_messages am WHERE am.thread_id = ${adminThreadsTable.id} AND am.sender_kind = 'admin' AND am.created_at > COALESCE(${adminThreadsTable.lastMemberReadAt}, ${EPOCH0}))`,
      })
      .from(adminThreadsTable)
      .where(eq(adminThreadsTable.memberUserId, userId))
      .limit(1);
    res.json({ count: r?.count ?? 0 });
  } catch (err) {
    logger.error({ err }, "GET /me/team-thread/unread failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/me/team-thread", requireUser, memberSendLimit, async (req, res) => {
  try {
    const { userId } = sessionOf(req);
    const parsed = adminMessageBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
      return;
    }
    const [member] = await db
      .select({ fullName: usersTable.fullName })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    const threadId = await ensureThread(userId);
    const memberName = member?.fullName ?? "عضو";
    await db.insert(adminMessagesTable).values({
      threadId,
      senderKind: "member",
      senderId: userId,
      senderName: memberName,
      body: parsed.data.body,
    });
    await db
      .update(adminThreadsTable)
      .set({ lastMessageAt: new Date(), lastMemberReadAt: new Date() })
      .where(eq(adminThreadsTable.id, threadId));
    // Notify the staff who've replied into this thread that the member wrote back.
    const participants = await db
      .selectDistinct({ id: adminMessagesTable.senderId })
      .from(adminMessagesTable)
      .where(and(eq(adminMessagesTable.threadId, threadId), eq(adminMessagesTable.senderKind, "admin")));
    void notifyAdmins(
      participants.map((p) => p.id),
      {
        type: "member_reply",
        title: `ردّ من ${memberName}`,
        body: parsed.data.body.slice(0, 120),
        link: "inbox",
        actor: memberName,
      },
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    logger.error({ err }, "POST /me/team-thread failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
