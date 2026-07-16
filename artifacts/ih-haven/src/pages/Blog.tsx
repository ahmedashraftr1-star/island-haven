import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Clock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { PageShell } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { imageUrl } from "@/hooks/use-content";
import { EASE_OUT_EXPO } from "@/lib/motion";
import {
  BLOG_CATEGORIES,
  BLOG_CATEGORY_LABELS,
  BLOG_CATEGORY_LABELS_EN,
  type BlogCategory,
} from "@/lib/labels";

/* ────────────────────────────────────────────────────────────────────────────
   /blog — a real, API-backed, fully-bilingual editorial index. A featured lead
   story (newest published), client-side category filter tabs, and a responsive
   3-col deck of article cards — each linking to /blog/:slug (a real detail page,
   BlogDetail below). Every article carries AR + EN; the reader sees their language.
   Read-time is computed from the body; the date from publishedAt.
   ──────────────────────────────────────────────────────────────────────────── */

interface ApiPost {
  id: number;
  slug: string;
  category: BlogCategory;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  body: string;
  bodyEn: string;
  author: string;
  authorEn: string;
  coverUrl: string | null;
  publishedAt: string | null;
}

function readMinutes(body: string): number {
  const words = (body || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Grammatically-correct read-time label per language (Arabic pluralises 1/2/3-10/>10). */
function readLabel(n: number, lang: string): string {
  if (lang === "en") return `${n} min read`;
  if (n === 1) return "دقيقة قراءة";
  if (n === 2) return "دقيقتان قراءة";
  if (n <= 10) return `${n} دقائق قراءة`;
  return `${n} دقيقة قراءة`;
}

function CategoryChip({ category }: { category: BlogCategory }) {
  const { lang } = useLanguage();
  const label = lang === "en" ? BLOG_CATEGORY_LABELS_EN[category] : BLOG_CATEGORY_LABELS[category];
  return (
    <span className="chip-sand inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] rtl:tracking-normal">
      {label}
    </span>
  );
}

function PostMeta({
  author,
  minutes,
  date,
  className = "",
}: {
  author: string;
  minutes: number;
  date: string;
  className?: string;
}) {
  const { lang } = useLanguage();
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 t-caption text-fg-secondary ${className}`}>
      {author && <span className="font-semibold text-foreground">{author}</span>}
      {author && <span aria-hidden className="text-fg-faint">·</span>}
      <span className="inline-flex items-center gap-1.5 tnum">
        <Clock className="w-3.5 h-3.5 text-sand" aria-hidden />
        {readLabel(minutes, lang)}
      </span>
      {date && <span aria-hidden className="text-fg-faint">·</span>}
      {date && <span className="tnum">{date}</span>}
    </div>
  );
}

function fmtDate(iso: string | null, lang: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(lang === "en" ? "en-US" : "ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Resolve one field to the active language, falling back to the other if empty. */
function useResolve() {
  const { lang } = useLanguage();
  return (ar: string, en: string) => (lang === "en" ? en || ar : ar || en);
}

export default function Blog() {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();
  const resolve = useResolve();
  const [posts, setPosts] = useState<ApiPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<BlogCategory | "all">("all");

  useEffect(() => {
    document.title = t({ ar: "المدوّنة والرّؤى — آيلاند هيفن", en: "Blog & Insights — Island Haven" });
  }, [lang, t]);

  useEffect(() => {
    let alive = true;
    api<{ posts: ApiPost[] }>("/blog?limit=100")
      .then((r) => alive && setPosts(r.posts))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "تعذّر التحميل"));
    return () => {
      alive = false;
    };
  }, []);

  const featured = posts && posts.length > 0 ? posts[0] : null;
  const rest = useMemo(() => (posts ? posts.slice(1) : []), [posts]);
  const visible = useMemo(
    () => (active === "all" ? rest : rest.filter((p) => p.category === active)),
    [active, rest],
  );

  const tabs: { key: BlogCategory | "all"; label: string }[] = [
    { key: "all", label: t({ ar: "الكل", en: "All" }) },
    ...BLOG_CATEGORIES.map((c) => ({
      key: c,
      label: lang === "en" ? BLOG_CATEGORY_LABELS_EN[c] : BLOG_CATEGORY_LABELS[c],
    })),
  ];

  return (
    <PageShell
      eyebrow={t({ ar: "المدوّنة · INSIGHTS", en: "Blog · INSIGHTS" })}
      title={t({ ar: "رؤى", en: "Insights &" })}
      highlight={t({ ar: "وتقارير", en: "Reports" })}
      subtitle={t({
        ar: "تقارير واستراتيجيّات من خبراء المنظومة — من بناء الفريق المؤسّس إلى التمويل والتقنية والمجتمع.",
        en: "Reports & strategy from our ecosystem's experts — from building a founding team to funding, tech and community.",
      })}
    >
      <div className="space-y-[clamp(3.5rem,8vw,6rem)]">
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 t-caption text-rose-300">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {posts === null && !error && (
          <div className="animate-pulse space-y-8">
            <div className="h-[clamp(15rem,38vw,26rem)] rounded-[2rem] bg-white/[0.04]" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-white/[0.04]" />
              ))}
            </div>
          </div>
        )}

        {/* Empty — no published articles yet */}
        {posts !== null && posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border-strong/70 px-6 py-[clamp(3rem,7vw,5rem)] text-center">
            <p
              className="font-display font-bold text-fg-secondary"
              style={{ fontSize: "clamp(1.3rem, 2.4vw, 1.9rem)", letterSpacing: "-0.02em" }}
            >
              {t({ ar: "لا مقالات منشورة بعد.", en: "No published articles yet." })}
            </p>
            <p className="t-body text-[14.5px] mt-2.5">
              {t({ ar: "أوّل الرؤى في الطريق — تابعنا قريبًا.", en: "The first insights are on the way — check back soon." })}
            </p>
          </div>
        )}

        {/* FEATURED lead story */}
        {featured && (
          <section aria-label={t({ ar: "المقال المميّز", en: "Featured story" })}>
            <Reveal>
              <Link
                href={`/blog/${featured.slug}`}
                data-testid="blog-featured"
                className="group block overflow-hidden rounded-[clamp(1.5rem,3vw,2rem)] card-base card-hover"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="relative h-[clamp(15rem,38vw,26rem)] overflow-hidden lg:order-last bg-white/[0.04]">
                    {featured.coverUrl && (
                      <img
                        src={imageUrl(featured.coverUrl)}
                        alt={resolve(featured.title, featured.titleEn)}
                        loading="eager"
                        className="absolute inset-0 h-full w-full object-cover saturate-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:scale-[1.04]"
                      />
                    )}
                    <div
                      aria-hidden
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, hsl(0 0% 4% / 0.55) 0%, transparent 55%)" }}
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-5 p-[clamp(1.5rem,4vw,3rem)]">
                    <div className="flex items-center gap-3">
                      <span className="eyebrow eyebrow-sand">{t({ ar: "المقال المميّز", en: "Featured" })}</span>
                      <CategoryChip category={featured.category} />
                    </div>
                    <motion.h2
                      className="font-display font-bold text-foreground transition-colors group-hover:text-primary"
                      style={{ fontSize: "clamp(1.7rem, 3.4vw, 2.9rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}
                      initial={reduce ? false : { opacity: 0, y: 18 }}
                      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
                    >
                      {resolve(featured.title, featured.titleEn)}
                    </motion.h2>
                    <p className="t-body text-[15px] md:text-[16.5px] max-w-xl">
                      {resolve(featured.excerpt, featured.excerptEn)}
                    </p>
                    <PostMeta
                      author={resolve(featured.author, featured.authorEn)}
                      minutes={readMinutes(resolve(featured.body, featured.bodyEn))}
                      date={fmtDate(featured.publishedAt, lang)}
                    />
                    <span className="mt-1 inline-flex items-center gap-2 t-caption font-semibold uppercase tracking-[0.16em] rtl:tracking-normal text-primary">
                      {t({ ar: "اقرأ المقال", en: "Read the story" })}
                      <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          </section>
        )}

        {/* Filter tabs + article deck */}
        {rest.length > 0 && (
          <section aria-label={t({ ar: "كل الرّؤى", en: "All insights" })}>
            <Reveal>
              <div
                role="tablist"
                aria-label={t({ ar: "تصفية حسب التصنيف", en: "Filter by category" })}
                className="flex flex-wrap items-center gap-2 border-b border-border-strong/60 pb-[clamp(1.5rem,3vw,2.25rem)]"
              >
                {tabs.map((tab) => {
                  const isActive = active === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive ? "true" : "false"}
                      data-testid={`blog-tab-${tab.key}`}
                      onClick={() => setActive(tab.key)}
                      className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                        isActive
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border-strong/70 text-fg-secondary hover:border-foreground/30 hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </Reveal>

            {visible.length > 0 ? (
              <ul className="mt-[clamp(2rem,4vw,3rem)] grid grid-cols-1 gap-[clamp(1.25rem,2.5vw,2rem)] sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((post, i) => (
                  <li key={post.id}>
                    <Reveal delay={Math.min(i, 6) * 0.05}>
                      <Link
                        href={`/blog/${post.slug}`}
                        data-testid={`blog-card-${post.id}`}
                        className="group flex h-full flex-col overflow-hidden rounded-[clamp(1.25rem,2vw,1.5rem)] card-base card-hover"
                      >
                        <div className="relative h-[clamp(11rem,22vw,14rem)] overflow-hidden bg-white/[0.04]">
                          {post.coverUrl && (
                            <img
                              src={imageUrl(post.coverUrl)}
                              alt={resolve(post.title, post.titleEn)}
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover saturate-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:scale-[1.05]"
                            />
                          )}
                          <div
                            aria-hidden
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(to top, hsl(0 0% 4% / 0.45) 0%, transparent 60%)" }}
                          />
                          <div className="absolute top-3 start-3">
                            <CategoryChip category={post.category} />
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col gap-3 p-[clamp(1.1rem,2vw,1.4rem)]">
                          <h3
                            className="font-display font-bold text-foreground transition-colors group-hover:text-primary"
                            style={{ fontSize: "clamp(1.15rem, 1.8vw, 1.4rem)", lineHeight: 1.18, letterSpacing: "-0.02em" }}
                          >
                            {resolve(post.title, post.titleEn)}
                          </h3>
                          <p className="t-body text-[14px] line-clamp-3">
                            {resolve(post.excerpt, post.excerptEn)}
                          </p>
                          <PostMeta
                            author={resolve(post.author, post.authorEn)}
                            minutes={readMinutes(resolve(post.body, post.bodyEn))}
                            date={fmtDate(post.publishedAt, lang)}
                            className="mt-auto pt-1"
                          />
                        </div>
                      </Link>
                    </Reveal>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-[clamp(2rem,4vw,3rem)] rounded-2xl border border-dashed border-border-strong/70 px-6 py-[clamp(2.5rem,6vw,4rem)] text-center">
                <p
                  className="font-display font-bold text-fg-secondary"
                  style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.7rem)", letterSpacing: "-0.02em" }}
                >
                  {t({ ar: "لا توجد رؤى في هذا التصنيف بعد.", en: "No insights in this category yet." })}
                </p>
                <p className="t-body text-[14.5px] mt-2.5">
                  {t({ ar: "جرّب تصنيفًا آخر أو اعرض الكل.", en: "Try another category, or view all." })}
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </PageShell>
  );
}

/* ── /blog/:slug — the article detail page ── */
export function BlogDetail() {
  const { lang, t } = useLanguage();
  const resolve = useResolve();
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug ?? "";
  const [post, setPost] = useState<ApiPost | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    let alive = true;
    setState("loading");
    api<{ post: ApiPost }>(`/blog/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!alive) return;
        setPost(r.post);
        setState("ok");
      })
      .catch(() => alive && setState("missing"));
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (post) document.title = `${resolve(post.title, post.titleEn)} — آيلاند هيفن`;
  }, [post, resolve]);

  const backLink = (
    <Link
      href="/blog"
      className="inline-flex items-center gap-2 t-caption font-semibold text-primary hover:gap-3 transition-all"
    >
      <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
      {t({ ar: "كل المقالات", en: "All articles" })}
    </Link>
  );

  if (state === "missing") {
    return (
      <PageShell title={t({ ar: "المقال غير موجود", en: "Article not found" })}>
        <div className="py-10">{backLink}</div>
      </PageShell>
    );
  }

  if (state === "loading" || !post) {
    return (
      <PageShell title={t({ ar: "المدوّنة", en: "Blog" })}>
        <div className="animate-pulse space-y-6">
          <div className="h-[clamp(14rem,34vw,22rem)] rounded-[2rem] bg-white/[0.04]" />
          <div className="h-8 w-2/3 rounded bg-white/[0.05]" />
          <div className="h-64 rounded bg-white/[0.04]" />
        </div>
      </PageShell>
    );
  }

  const title = resolve(post.title, post.titleEn);
  const body = resolve(post.body, post.bodyEn);
  const author = resolve(post.author, post.authorEn);

  return (
    <PageShell title={t({ ar: "المدوّنة", en: "Blog" })}>
      <article className="mx-auto max-w-3xl">
        <div className="mb-6">{backLink}</div>

        <div className="flex items-center gap-3 mb-4">
          <CategoryChip category={post.category} />
        </div>

        <h1
          className="font-display font-bold text-foreground"
          style={{ fontSize: "clamp(1.9rem, 4vw, 3.1rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}
        >
          {title}
        </h1>

        <div className="mt-4">
          <PostMeta author={author} minutes={readMinutes(body)} date={fmtDate(post.publishedAt, lang)} />
        </div>

        {post.coverUrl && (
          <div className="mt-8 overflow-hidden rounded-[clamp(1.25rem,2.5vw,1.75rem)]">
            <img
              src={imageUrl(post.coverUrl)}
              alt={title}
              loading="eager"
              className="w-full object-cover saturate-[1.03]"
            />
          </div>
        )}

        <div
          className="mt-8 t-body whitespace-pre-line text-[16px] md:text-[17px] leading-[1.9] text-foreground/90"
          dir={lang === "en" ? "ltr" : "rtl"}
        >
          {body}
        </div>

        <div className="mt-12 border-t border-border-strong/60 pt-8">{backLink}</div>
      </article>
    </PageShell>
  );
}
