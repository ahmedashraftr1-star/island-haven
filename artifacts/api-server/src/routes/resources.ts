import { Router, type IRouter, type Request } from "express";
import { asc, desc, eq, or, inArray } from "drizzle-orm";
import {
  db,
  resourcesTable,
  upsertResourceSchema,
  type ResourceVisibility,
} from "@workspace/db";
import {
  optionalUser,
  requireAdmin,
  type UserSession,
} from "../lib/auth";
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

function sessionOf(req: Request): UserSession | undefined {
  return (req as Request & { userSession?: UserSession }).userSession;
}

// Public list — visibility-gated:
//   - anyone: public
//   - logged-in: public + members
//   - admins use /admin/resources to see everything
router.get("/resources", optionalUser, async (req, res) => {
  try {
    const session = sessionOf(req);
    const allowed: ResourceVisibility[] = session
      ? ["public", "members"]
      : ["public"];
    const rows = await db
      .select({
        id: resourcesTable.id,
        title: resourcesTable.title,
        summary: resourcesTable.summary,
        category: resourcesTable.category,
        visibility: resourcesTable.visibility,
        coverUrl: resourcesTable.coverUrl,
        externalUrl: resourcesTable.externalUrl,
        fileUrl: resourcesTable.fileUrl,
        tags: resourcesTable.tags,
        featured: resourcesTable.featured,
        createdAt: resourcesTable.createdAt,
      })
      .from(resourcesTable)
      .where(inArray(resourcesTable.visibility, allowed))
      .orderBy(
        desc(resourcesTable.featured),
        asc(resourcesTable.sortOrder),
        desc(resourcesTable.createdAt),
      );
    res.json({ resources: rows, gated: !session });
  } catch (err) {
    logger.error({ err }, "GET /resources failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/resources/:id", optionalUser, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [row] = await db
      .select()
      .from(resourcesTable)
      .where(eq(resourcesTable.id, id))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const session = sessionOf(req);
    if (row.visibility === "admins") {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    if (row.visibility === "members" && !session) {
      res.status(401).json({ error: "للمنتسبين فقط — سجّل دخولك." });
      return;
    }
    res.json({ resource: row });
  } catch (err) {
    logger.error({ err }, "GET /resources/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin ──────────────────────────────────────────────────────────────────

router.get("/admin/resources", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(resourcesTable)
      .orderBy(
        desc(resourcesTable.featured),
        asc(resourcesTable.sortOrder),
        desc(resourcesTable.createdAt),
      );
    res.json({ resources: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/resources failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/resources", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertResourceSchema.safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const d = parsed.data;
    const [row] = await db
      .insert(resourcesTable)
      .values({ ...d, coverUrl: d.coverUrl ?? null })
      .returning();
    res.json({ resource: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/resources failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/resources/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertResourceSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      badData(res, parsed.error);
      return;
    }
    const [row] = await db
      .update(resourcesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(resourcesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ resource: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/resources/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/resources/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(resourcesTable).where(eq(resourcesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/resources/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
