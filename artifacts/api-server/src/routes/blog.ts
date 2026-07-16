import { Router, type IRouter } from "express";
import { and, count, desc, eq } from "drizzle-orm";
import {
  db,
  blogPostsTable,
  upsertBlogSchema,
  slugify,
  BLOG_CATEGORIES,
  type BlogCategory,
} from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const badRequest = (
  res: import("express").Response,
  issues: { path: (string | number)[]; message: string }[],
) =>
  res.status(400).json({
    error: "بيانات غير صحيحة",
    details: issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  });

/** Derive a unique slug from a title, appending -2, -3… on collision. Slugs are
 *  generated once at creation and never change (stable SEO URLs). */
async function uniqueSlug(fromTitle: string): Promise<string> {
  const base = slugify(fromTitle);
  let slug = base;
  let n = 1;
  // Bounded loop — degrades to base-2, base-3… ; a runaway is impossible in practice.
  for (let guard = 0; guard < 1000; guard++) {
    const [hit] = await db
      .select({ id: blogPostsTable.id })
      .from(blogPostsTable)
      .where(eq(blogPostsTable.slug, slug))
      .limit(1);
    if (!hit) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

// ─── Public list (published only) ─────────────────────────────────────────────

router.get("/blog", async (req, res) => {
  try {
    const category = String(req.query.category ?? "");
    const pageSize = Math.min(Math.max(parseInt(String(req.query.limit ?? "12"), 10) || 12, 1), 100);
    const requestedPage = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);

    const filters = [eq(blogPostsTable.status, "published")];
    if (BLOG_CATEGORIES.includes(category as BlogCategory)) {
      filters.push(eq(blogPostsTable.category, category as BlogCategory));
    }
    const where = filters.length === 1 ? filters[0] : and(...filters);

    const [{ total }] = await db.select({ total: count() }).from(blogPostsTable).where(where);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, totalPages);

    const rows = await db
      .select()
      .from(blogPostsTable)
      .where(where)
      .orderBy(desc(blogPostsTable.publishedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    res.json({ posts: rows, total, page, totalPages });
  } catch (err) {
    logger.error({ err }, "GET /blog failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/blog/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug ?? "").trim();
    if (!slug) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const [row] = await db
      .select()
      .from(blogPostsTable)
      .where(and(eq(blogPostsTable.slug, slug), eq(blogPostsTable.status, "published")))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    res.json({ post: row });
  } catch (err) {
    logger.error({ err }, "GET /blog/:slug failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ─── Admin ────────────────────────────────────────────────────────────────────

router.get("/admin/blog", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(blogPostsTable)
      .orderBy(desc(blogPostsTable.updatedAt));
    res.json({ posts: rows });
  } catch (err) {
    logger.error({ err }, "GET /admin/blog failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/blog", requireAdmin, async (req, res) => {
  try {
    const parsed = upsertBlogSchema.safeParse(req.body);
    if (!parsed.success) return void badRequest(res, parsed.error.issues);
    const d = parsed.data;

    const slug = await uniqueSlug(d.titleEn || d.title);
    // Publish time: the explicit date if given; else now when going live; else null (draft).
    const publishedAt = d.publishedAt
      ? new Date(d.publishedAt)
      : d.status === "published"
        ? new Date()
        : null;

    const [row] = await db
      .insert(blogPostsTable)
      .values({
        slug,
        category: d.category,
        status: d.status,
        title: d.title,
        titleEn: d.titleEn,
        excerpt: d.excerpt,
        excerptEn: d.excerptEn,
        body: d.body,
        bodyEn: d.bodyEn,
        author: d.author,
        authorEn: d.authorEn,
        coverUrl: d.coverUrl ?? null,
        publishedAt,
      })
      .returning();
    res.json({ post: row });
  } catch (err) {
    logger.error({ err }, "POST /admin/blog failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/blog/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    const parsed = upsertBlogSchema.partial().safeParse(req.body);
    if (!parsed.success) return void badRequest(res, parsed.error.issues);
    const d = parsed.data;

    const [current] = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, id))
      .limit(1);
    if (!current) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }

    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of [
      "category", "title", "titleEn", "excerpt", "excerptEn",
      "body", "bodyEn", "author", "authorEn", "status",
    ] as const) {
      if (d[k] !== undefined) update[k] = d[k];
    }
    if (d.coverUrl !== undefined) update.coverUrl = d.coverUrl;
    if (d.publishedAt) update.publishedAt = new Date(d.publishedAt);
    // First transition to published (and no explicit date) stamps publishedAt now.
    if (d.status === "published" && !current.publishedAt && !d.publishedAt) {
      update.publishedAt = new Date();
    }

    const [row] = await db
      .update(blogPostsTable)
      .set(update)
      .where(eq(blogPostsTable.id, id))
      .returning();
    res.json({ post: row });
  } catch (err) {
    logger.error({ err }, "PATCH /admin/blog/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/blog/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).json({ error: "غير موجود" });
      return;
    }
    await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /admin/blog/:id failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
