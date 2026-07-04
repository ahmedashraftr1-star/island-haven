import { Router, type IRouter, type Request } from "express";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import {
  db,
  conversationsTable,
  messagesTable,
  usersTable,
  sendMessageSchema,
  startConversationSchema,
} from "@workspace/db";
import { requireUser, type UserSession } from "../lib/auth";
import { makeUserRateLimit } from "../lib/rateLimit";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Per-user cap on outbound messages so one account can't flood conversations
// (in-memory, per-process — matches the rlWork/rlToggle precedent in works.ts).
const rlMessage = makeUserRateLimit({ max: 30, windowMs: 60_000 });

function sessionOf(req: Request): UserSession {
  return (req as Request & { userSession: UserSession }).userSession;
}

function badData(
  res: import("express").Response,
  err: { issues: Array<{ path: PropertyKey[]; message: string }> },
) {
  res.status(400).json({
    error: "بيانات غير صحيحة",
    details: err.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    })),
  });
}

// Normalize the pair so (a,b) and (b,a) map to the same conversation row:
// always store the smaller id as user1Id.
function orderPair(a: number, b: number): { user1Id: number; user2Id: number } {
  return a <= b ? { user1Id: a, user2Id: b } : { user1Id: b, user2Id: a };
}

// ─── Conversations ───────────────────────────────────────────────────────────

// The caller's conversations with the OTHER member's identity and a preview of
// the most recent message. Newest-active first.
router.get("/me/conversations", requireUser, async (req, res) => {
  try {
    const me = sessionOf(req).userId;

    // The "other" participant is whichever column isn't me.
    const otherId = sql<number>`CASE WHEN ${conversationsTable.user1Id} = ${me} THEN ${conversationsTable.user2Id} ELSE ${conversationsTable.user1Id} END`;

    const rows = await db
      .select({
        id: conversationsTable.id,
        otherUserId: otherId,
        otherFullName: usersTable.fullName,
        otherAvatarUrl: usersTable.avatarUrl,
        lastMessageAt: conversationsTable.lastMessageAt,
        lastMessage: sql<string | null>`(
          SELECT m.body FROM messages m
          WHERE m.conversation_id = ${conversationsTable.id}
          ORDER BY m.created_at DESC
          LIMIT 1
        )`,
      })
      .from(conversationsTable)
      .innerJoin(usersTable, eq(usersTable.id, otherId))
      .where(
        or(
          eq(conversationsTable.user1Id, me),
          eq(conversationsTable.user2Id, me),
        ),
      )
      .orderBy(desc(conversationsTable.lastMessageAt));

    res.json({ conversations: rows });
  } catch (err) {
    logger.error({ err }, "GET /me/conversations failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Find-or-create a conversation between the caller and `userId`.
router.post("/me/conversations", requireUser, async (req, res) => {
  try {
    const me = sessionOf(req).userId;
    const parsed = startConversationSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const other = parsed.data.userId;
    if (other === me) {
      res.status(400).json({ error: "لا يمكنك مراسلة نفسك" });
      return;
    }

    // The other party must be a real, active member.
    const [target] = await db
      .select({ id: usersTable.id, status: usersTable.status })
      .from(usersTable)
      .where(eq(usersTable.id, other))
      .limit(1);
    if (!target || target.status === "banned") {
      res.status(404).json({ error: "العضو غير موجود" });
      return;
    }

    const { user1Id, user2Id } = orderPair(me, other);

    const [existing] = await db
      .select()
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.user1Id, user1Id),
          eq(conversationsTable.user2Id, user2Id),
        ),
      )
      .limit(1);

    if (existing) {
      res.json({ conversation: existing });
      return;
    }

    const [created] = await db
      .insert(conversationsTable)
      .values({ user1Id, user2Id })
      .returning();
    res.json({ conversation: created });
  } catch (err) {
    logger.error({ err }, "POST /me/conversations failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Messages ────────────────────────────────────────────────────────────────

// Ensure the caller is one of the two participants; returns the row or null.
async function findParticipantConversation(id: number, me: number) {
  if (!Number.isInteger(id) || id <= 0) return null;
  const [row] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id))
    .limit(1);
  if (!row) return null;
  if (row.user1Id !== me && row.user2Id !== me) return null;
  return row;
}

router.get(
  "/me/conversations/:id/messages",
  requireUser,
  async (req, res) => {
    try {
      const me = sessionOf(req).userId;
      const id = Number(req.params.id);
      const convo = await findParticipantConversation(id, me);
      if (!convo) {
        res.status(403).json({ error: "غير مصرّح" });
        return;
      }

      const rows = await db
        .select({
          id: messagesTable.id,
          conversationId: messagesTable.conversationId,
          senderId: messagesTable.senderId,
          body: messagesTable.body,
          createdAt: messagesTable.createdAt,
        })
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, id))
        .orderBy(asc(messagesTable.createdAt));

      res.json({ messages: rows });
    } catch (err) {
      logger.error({ err }, "GET /me/conversations/:id/messages failed");
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  },
);

router.post(
  "/me/conversations/:id/messages",
  requireUser,
  rlMessage,
  async (req, res) => {
    try {
      const me = sessionOf(req).userId;
      const id = Number(req.params.id);
      const convo = await findParticipantConversation(id, me);
      if (!convo) {
        res.status(403).json({ error: "غير مصرّح" });
        return;
      }

      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        badData(res, parsed.error);
        return;
      }

      const [message] = await db
        .insert(messagesTable)
        .values({
          conversationId: id,
          senderId: me,
          body: parsed.data.body,
        })
        .returning();

      // Bump the conversation so it floats to the top of both inboxes.
      await db
        .update(conversationsTable)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversationsTable.id, id));

      res.json({ message });
    } catch (err) {
      logger.error({ err }, "POST /me/conversations/:id/messages failed");
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  },
);

export default router;
