import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { writeAudit, auditActor } from "../lib/audit";
import { logger } from "../lib/logger";
import { z } from "zod";

const router: IRouter = Router();

// ─── Page visibility — owner hides/shows whole pages from the panel ───────────
// Stored as ONE jsonb array of hidden page keys under this site_settings key (no
// new table, no migration). Empty/missing = every page visible = current site.
const PAGES_KEY = "hidden_pages";

interface PageDef {
  key: string; // the route path, e.g. "/jobs"
  label: { ar: string; en: string };
  /** Protected pages can NEVER be hidden (essential / legal). */
  protected: boolean;
}

// The registry the panel manages. Protected entries render locked; the rest get a
// visibility toggle. Anything NOT here (member/admin/functional routes) is simply
// unmanaged and always reachable.
export const MANAGED_PAGES: PageDef[] = [
  // ── Protected — essential + legal, never hideable ──
  { key: "/", label: { ar: "الرئيسيّة", en: "Home" }, protected: true },
  { key: "/apply", label: { ar: "التقديم على الحاضنة", en: "Apply" }, protected: true },
  { key: "/book", label: { ar: "حجز مقعد ضيف", en: "Book a seat" }, protected: true },
  { key: "/verify", label: { ar: "الشرف القابل للتحقّق", en: "Verifiable Honesty" }, protected: true },
  { key: "/contact", label: { ar: "تواصل معنا", en: "Contact" }, protected: true },
  { key: "/terms", label: { ar: "شروط الاستخدام", en: "Terms of use" }, protected: true },
  { key: "/privacy", label: { ar: "سياسة الخصوصيّة", en: "Privacy policy" }, protected: true },
  // ── Hideable content pages ──
  { key: "/about", label: { ar: "من نحن", en: "About" }, protected: false },
  { key: "/programs", label: { ar: "مسارات الاحتضان", en: "Programs" }, protected: false },
  { key: "/ventures", label: { ar: "المشاريع", en: "Ventures" }, protected: false },
  { key: "/experts", label: { ar: "المرشدون", en: "Experts" }, protected: false },
  { key: "/events", label: { ar: "الفعاليّات", en: "Events" }, protected: false },
  { key: "/blog", label: { ar: "المدوّنة والرّؤى", en: "Blog & insights" }, protected: false },
  { key: "/jobs", label: { ar: "لوحة الوظائف", en: "Job board" }, protected: false },
  { key: "/investors", label: { ar: "المستثمرون", en: "Investors" }, protected: false },
  { key: "/partners", label: { ar: "الشركاء", en: "Partners" }, protected: false },
  { key: "/team", label: { ar: "الفريق", en: "Our team" }, protected: false },
  { key: "/cohorts", label: { ar: "الدّفعات", en: "Cohorts" }, protected: false },
  { key: "/freelancers", label: { ar: "المستقلّون", en: "Freelancers" }, protected: false },
  { key: "/members", label: { ar: "المنتسبون", en: "Members" }, protected: false },
  { key: "/careers", label: { ar: "انضمّ لفريقنا", en: "Join our team" }, protected: false },
  { key: "/media", label: { ar: "الغرفة الإعلاميّة", en: "Media kit" }, protected: false },
  { key: "/gallery", label: { ar: "المعرض", en: "Gallery" }, protected: false },
  { key: "/press", label: { ar: "الأخبار", en: "Press" }, protected: false },
  { key: "/learning", label: { ar: "التعلّم", en: "Learning" }, protected: false },
  { key: "/resources", label: { ar: "الموارد", en: "Resources" }, protected: false },
];

const MANAGED_KEYS = new Set(MANAGED_PAGES.map((p) => p.key));
const PROTECTED_KEYS = new Set(MANAGED_PAGES.filter((p) => p.protected).map((p) => p.key));

async function readHidden(): Promise<string[]> {
  const [row] = await db
    .select({ value: siteSettingsTable.value })
    .from(siteSettingsTable)
    .where(sql`${siteSettingsTable.key} = ${PAGES_KEY}`)
    .limit(1);
  const raw = row?.value;
  if (!Array.isArray(raw)) return [];
  // Only keep keys that are still managed AND not protected (defensive against a
  // stale/legacy value that names a page that was later protected or removed).
  return (raw as unknown[])
    .filter((k): k is string => typeof k === "string")
    .filter((k) => MANAGED_KEYS.has(k) && !PROTECTED_KEYS.has(k));
}

// ─── Dynamic sitemap.xml — respects the owner's hidden pages ──────────────────
// The curated, indexable URL set (path → crawl hints). Kept here, next to the
// page registry, so the sitemap and the visibility panel can never drift apart.
// At request time we drop any page the owner has hidden (prefix-matched, so
// hiding "/blog" also drops "/blog/:slug"), so a hidden page is never advertised
// to crawlers. Non-managed content routes (e.g. /numbers) can't be hidden and
// are always listed.
interface SitemapEntry {
  path: string;
  changefreq: string;
  priority: string;
}
const SITEMAP_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/team", changefreq: "monthly", priority: "0.8" },
  { path: "/cohorts", changefreq: "weekly", priority: "0.9" },
  { path: "/resources", changefreq: "weekly", priority: "0.8" },
  { path: "/programs", changefreq: "weekly", priority: "0.9" },
  { path: "/experts", changefreq: "weekly", priority: "0.9" },
  { path: "/ventures", changefreq: "weekly", priority: "0.9" },
  { path: "/members", changefreq: "weekly", priority: "0.8" },
  { path: "/numbers", changefreq: "weekly", priority: "0.7" },
  { path: "/courses", changefreq: "weekly", priority: "0.8" },
  { path: "/events", changefreq: "weekly", priority: "0.7" },
  { path: "/works", changefreq: "weekly", priority: "0.7" },
  { path: "/gallery", changefreq: "monthly", priority: "0.6" },
  { path: "/press", changefreq: "monthly", priority: "0.6" },
  { path: "/apply", changefreq: "monthly", priority: "0.9" },
  { path: "/book", changefreq: "monthly", priority: "0.7" },
  { path: "/careers", changefreq: "monthly", priority: "0.7" },
  { path: "/freelancers", changefreq: "weekly", priority: "0.8" },
  { path: "/investors", changefreq: "monthly", priority: "0.8" },
  { path: "/partners", changefreq: "monthly", priority: "0.7" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/contact", changefreq: "yearly", priority: "0.6" },
  { path: "/media", changefreq: "monthly", priority: "0.5" },
  { path: "/verify", changefreq: "weekly", priority: "0.7" },
  { path: "/stories", changefreq: "weekly", priority: "0.7" },
  { path: "/jobs", changefreq: "weekly", priority: "0.8" },
  { path: "/alumni", changefreq: "monthly", priority: "0.6" },
  { path: "/learning", changefreq: "weekly", priority: "0.7" },
  { path: "/leaderboard", changefreq: "weekly", priority: "0.6" },
  { path: "/process", changefreq: "monthly", priority: "0.7" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
];

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Build the sitemap XML for `origin` (no trailing slash), omitting hidden pages. */
export async function buildSitemapXml(origin: string): Promise<string> {
  const hidden = await readHidden();
  const isHidden = (p: string) =>
    hidden.some((h) => p === h || p.startsWith(h + "/"));
  const rows = SITEMAP_ENTRIES.filter((e) => !isHidden(e.path))
    .map(
      (e) =>
        `  <url>\n    <loc>${xmlEscape(origin + e.path)}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

// GET /site/pages — public: which pages the site should treat as hidden.
router.get("/site/pages", async (_req, res) => {
  try {
    res.json({ hidden: await readHidden() });
  } catch (err) {
    logger.error({ err }, "GET /site/pages failed");
    res.json({ hidden: [] }); // never break the site over a settings read
  }
});

// GET /admin/pages — the manageable registry + current visibility (for the editor).
router.get("/admin/pages", requireAdmin, async (_req, res) => {
  try {
    const hidden = new Set(await readHidden());
    res.json({
      pages: MANAGED_PAGES.map((p) => ({
        key: p.key,
        label: p.label,
        protected: p.protected,
        hidden: hidden.has(p.key),
      })),
      hidden: [...hidden],
    });
  } catch (err) {
    logger.error({ err }, "GET /admin/pages failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

const putSchema = z.object({ hidden: z.array(z.string()).max(100) });

// PUT /admin/pages — save the hidden set. Server-side enforcement: every key must
// be managed and NON-protected; any attempt to hide a protected/unknown page → 400.
router.put("/admin/pages", requireAdmin, async (req, res) => {
  const parsed = putSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "قيمة غير صالحة" });
    return;
  }
  const requested = [...new Set(parsed.data.hidden)];
  const unknown = requested.filter((k) => !MANAGED_KEYS.has(k));
  const protectedHit = requested.filter((k) => PROTECTED_KEYS.has(k));
  if (protectedHit.length > 0) {
    res.status(400).json({
      error: `لا يمكن إخفاء صفحات محميّة: ${protectedHit.join("، ")}`,
      code: "protected_page",
    });
    return;
  }
  if (unknown.length > 0) {
    res.status(400).json({ error: `صفحات غير معروفة: ${unknown.join("، ")}`, code: "unknown_page" });
    return;
  }
  try {
    await db
      .insert(siteSettingsTable)
      .values({ key: PAGES_KEY, value: requested })
      .onConflictDoUpdate({
        target: siteSettingsTable.key,
        set: { value: requested, updatedAt: sql`now()` },
      });
    void writeAudit({
      actor: auditActor(req),
      action: "pages_visibility_updated",
      targetType: "pages",
      newValue: requested.length ? `hidden: ${requested.join(",")}` : "all visible",
    });
    res.json({ ok: true, hidden: requested });
  } catch (err) {
    logger.error({ err }, "PUT /admin/pages failed");
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
