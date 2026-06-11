import { Router, type IRouter, type Request } from "express";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  db,
  badgesTable,
  userBadgesTable,
  usersTable,
  upsertBadgeSchema,
  awardBadgeSchema,
} from "@workspace/db";
import { requireAdmin, requireUser, type UserSession } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

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

// ─── Public ──────────────────────────────────────────────────────────────────

// All badges, in display order.
router.get("/badges", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(badgesTable)
      .orderBy(asc(badgesTable.sortOrder), asc(badgesTable.id));
    res.json({ badges: rows });
  } catch (err) {
    logger.error({ err }, "GET /badges failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Community leaderboard — top members ranked by
//   score = worksCount + badgeCount * 3
// Works are counted as visible/featured; experts/staff are excluded so the
// board reflects the member community.
router.get("/leaderboard", async (_req, res) => {
  try {
    const worksCount = sql<number>`(
      SELECT COUNT(*)::int FROM works w
      WHERE w.user_id = users.id
        AND w.status <> 'hidden'
    )`;
    const badgeCount = sql<number>`(
      SELECT COUNT(*)::int FROM user_badges ub
      WHERE ub.user_id = users.id
    )`;

    const rows = await db
      .select({
        userId: usersTable.id,
        fullName: usersTable.fullName,
        avatarUrl: usersTable.avatarUrl,
        worksCount,
        badgeCount,
        score: sql<number>`(${worksCount} + ${badgeCount} * 3)`,
      })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.status, "active"),
          sql`${usersTable.role} <> 'expert'`,
        ),
      )
      .orderBy(desc(sql`(${worksCount} + ${badgeCount} * 3)`), asc(usersTable.id))
      .limit(20);

    res.json({ leaderboard: rows });
  } catch (err) {
    logger.error({ err }, "GET /leaderboard failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// The caller's own awarded badges (joined with badge details).
router.get("/me/badges", requireUser, async (req, res) => {
  try {
    const { userId } = (req as Request & { userSession: UserSession })
      .userSession;
    const rows = await db
      .select({
        id: badgesTable.id,
        key: badgesTable.key,
        name: badgesTable.name,
        description: badgesTable.description,
        icon: badgesTable.icon,
        color: badgesTable.color,
        sortOrder: badgesTable.sortOrder,
        awardedAt: userBadgesTable.awardedAt,
      })
      .from(userBadgesTable)
      .innerJoin(badgesTable, eq(userBadgesTable.badgeId, badgesTable.id))
      .where(eq(userBadgesTable.userId, userId))
      .orderBy(desc(userBadgesTable.awardedAt));
    res.json({ badges: rows });
  } catch (err) {
    logger.error({ err }, "GET /me/badges failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin ───────────────────────────────────────────────────────────────────

router.get("/admin/badges", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(badgesTable)
      .orderBy(asc(badgesTable.sortOrder), asc(badgesTable.id));
    res.json({ badges: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/badges failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/badges", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertBadgeSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const [row] = await db.insert(badgesTable).values(parsed.data).returning();
    res.json({ badge: row });
  } catch (err) {
    if (err instanceof Error && /unique|duplicate/i.test(err.message)) {
      res.status(409).json({ error: "هذا المُعرّف مستخدم بالفعل" });
      return;
    }
    logger.error({ err }, "POST /admin/badges failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/badges/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertBadgeSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const [row] = await db
      .update(badgesTable)
      .set(parsed.data)
      .where(eq(badgesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ badge: row });
  } catch (err) {
    if (err instanceof Error && /unique|duplicate/i.test(err.message)) {
      res.status(409).json({ error: "هذا المُعرّف مستخدم بالفعل" });
      return;
    }
    logger.error({ err }, "PATCH /admin/badges/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/badges/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    // Revoke every award of this badge first to avoid orphaned rows.
    await db.delete(userBadgesTable).where(eq(userBadgesTable.badgeId, id));
    await db.delete(badgesTable).where(eq(badgesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/badges/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Award a badge to a user. Idempotent — re-awarding the same badge is a no-op.
router.post("/admin/users/:userId/badges", requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = awardBadgeSchema
      .pick({ badgeId: true })
      .safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const { badgeId } = parsed.data;

    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "المستخدم غير موجود" });
      return;
    }
    const [badge] = await db
      .select({ id: badgesTable.id })
      .from(badgesTable)
      .where(eq(badgesTable.id, badgeId))
      .limit(1);
    if (!badge) {
      res.status(404).json({ error: "الشّارة غير موجودة" });
      return;
    }

    const [existing] = await db
      .select({ id: userBadgesTable.id })
      .from(userBadgesTable)
      .where(
        and(
          eq(userBadgesTable.userId, userId),
          eq(userBadgesTable.badgeId, badgeId),
        ),
      )
      .limit(1);
    if (existing) {
      res.json({ ok: true, alreadyAwarded: true });
      return;
    }

    const [row] = await db
      .insert(userBadgesTable)
      .values({ userId, badgeId })
      .returning();
    res.json({ ok: true, userBadge: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/users/:userId/badges failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// Revoke a badge from a user.
router.delete(
  "/admin/users/:userId/badges/:badgeId",
  requireAdmin,
  async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const badgeId = Number(req.params.badgeId);
      if (
        !Number.isInteger(userId) ||
        userId <= 0 ||
        !Number.isInteger(badgeId) ||
        badgeId <= 0
      ) {
        res.status(404).json({ error: "غير موجود" });
        return;
      }
      await db
        .delete(userBadgesTable)
        .where(
          and(
            eq(userBadgesTable.userId, userId),
            eq(userBadgesTable.badgeId, badgeId),
          ),
        );
      res.json({ ok: true });
    } catch (err) {
      logger.error({ err }, "DELETE /admin/users/:userId/badges/:badgeId failed");
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  },
);

export default router;
