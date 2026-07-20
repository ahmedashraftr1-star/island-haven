import { Router, type IRouter } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, worksTable, usersTable, dailyPostsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * GET /api/gallery — every public image across the platform:
 *   • work cover images
 *   • work gallery images
 *   • daily-post cover images
 *
 * Ordered most-recent first, capped to a sensible page size.
 * Used by the "معرض الصور" public page.
 */
router.get("/gallery", async (_req, res) => {
  try {
    // Works: cover + gallery (gallery is a jsonb string[])
    const workRows = await db
      .select({
        id: worksTable.id,
        title: worksTable.title,
        coverUrl: worksTable.coverUrl,
        galleryUrls: worksTable.galleryUrls,
        createdAt: worksTable.createdAt,
        authorId: usersTable.id,
        authorName: usersTable.fullName,
      })
      .from(worksTable)
      .innerJoin(usersTable, eq(usersTable.id, worksTable.userId))
      .where(and(eq(worksTable.status, "visible"), eq(usersTable.status, "active")))
      .orderBy(desc(worksTable.createdAt))
      .limit(120);

    const items: Array<{
      id: string;
      url: string;
      title: string;
      author?: string;
      authorId?: number;
      workId?: number;
      kind: "work" | "post";
      at: string;
    }> = [];

    for (const w of workRows) {
      if (w.coverUrl) {
        items.push({
          id: `w${w.id}-cover`,
          url: w.coverUrl,
          title: w.title,
          author: w.authorName,
          authorId: w.authorId,
          workId: w.id,
          kind: "work",
          at: w.createdAt as unknown as string,
        });
      }
      const gallery = Array.isArray(w.galleryUrls) ? w.galleryUrls : [];
      gallery.forEach((url, idx) => {
        if (typeof url === "string" && url) {
          items.push({
            id: `w${w.id}-g${idx}`,
            url,
            title: w.title,
            author: w.authorName,
            authorId: w.authorId,
            workId: w.id,
            kind: "work",
            at: w.createdAt as unknown as string,
          });
        }
      });
    }

    const dailyRows = await db
      .select({
        id: dailyPostsTable.id,
        title: dailyPostsTable.title,
        coverUrl: dailyPostsTable.coverUrl,
        publishedAt: dailyPostsTable.publishedAt,
      })
      .from(dailyPostsTable)
      .where(isNull(dailyPostsTable.deletedAt))
      .orderBy(desc(dailyPostsTable.publishedAt))
      .limit(60);

    for (const p of dailyRows) {
      if (p.coverUrl) {
        items.push({
          id: `p${p.id}`,
          url: p.coverUrl,
          title: p.title,
          kind: "post",
          at: p.publishedAt as unknown as string,
        });
      }
    }

    items.sort((a, b) => (b.at < a.at ? -1 : b.at > a.at ? 1 : 0));
    res.json({ items: items.slice(0, 200) });
  } catch (err) {
    logger.error({ err }, "GET /gallery failed");
    res.status(500).json({ error: "تعذّر تحميل المعرض" });
  }
});

export default router;
