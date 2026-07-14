import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Clock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { PageShell } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

/* ────────────────────────────────────────────────────────────────────────────
   /blog — an editorial-magazine INSIGHTS index. There is no blog API yet, so the
   posts below are a small inline SAMPLE set (bilingual). The page reads as a
   masthead: a featured lead story (full-width, large cover), client-side category
   filter tabs, then a responsive 3-col deck of article cards. Every card links to
   "/blog" for now (no detail route exists) so nothing is ever broken. New palette:
   GOLD category labels/chips (the spec's secondary accent), RED for the one accent
   word + meta glints. Bilingual + RTL-safe + reduced-motion + Reveal motion.
   ──────────────────────────────────────────────────────────────────────────── */

type Bi = { ar: string; en: string };
type Category = "startup" | "funding" | "tech" | "community";

interface Post {
  id: string;
  category: Category;
  title: Bi;
  excerpt: Bi;
  author: Bi;
  readTime: number; // minutes
  date: { ar: string; en: string };
  cover: string; // /photos/IMG_8xxx.webp — frames that exist on disk
}

/* Category taxonomy — bilingual labels, used by both the filter tabs and chips. */
const CATEGORIES: { key: Category; label: Bi }[] = [
  { key: "startup", label: { ar: "ريادة", en: "Startups" } },
  { key: "funding", label: { ar: "تمويل", en: "Funding" } },
  { key: "tech", label: { ar: "تقنية", en: "Tech" } },
  { key: "community", label: { ar: "مجتمع", en: "Community" } },
];

const CATEGORY_LABEL: Record<Category, Bi> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.label]),
) as Record<Category, Bi>;

/* ── SAMPLE insights — six bilingual posts. Covers are real /photos frames. ── */
const SAMPLE_POSTS: Post[] = [
  {
    id: "post-1",
    category: "startup",
    title: {
      ar: "كيف تبني فريقًا أوّليًّا من قلب غزّة",
      en: "Building a founding team from the heart of Gaza",
    },
    excerpt: {
      ar: "الفريق المؤسّس هو الأصل الأوّل لأيّ مشروع. هذه قواعد عمليّة لاختيار شركائك الأوائل تحت الضغط — والحفاظ عليهم.",
      en: "Your founding team is a startup's first real asset. Practical rules for choosing your earliest partners under pressure — and keeping them.",
    },
    author: { ar: "ليان أبو ندى", en: "Layan Abu Nada" },
    readTime: 7,
    date: { ar: "١٢ حزيران ٢٠٢٦", en: "Jun 12, 2026" },
    cover: "/photos/IMG_8307.webp",
  },
  {
    id: "post-2",
    category: "funding",
    title: {
      ar: "خريطة التمويل: من المنحة إلى الجولة الأولى",
      en: "A funding map: from grant to your first round",
    },
    excerpt: {
      ar: "المنح، المستثمرون الملائكة، ورأس المال المخاطر — متى يناسبك كلٌّ منها، وكيف تجهّز ملفّك قبل أن تطرق الباب.",
      en: "Grants, angels and venture capital — when each fits, and how to ready your story before you knock on a single door.",
    },
    author: { ar: "كريم الفرّا", en: "Karim Al-Farra" },
    readTime: 9,
    date: { ar: "٤ حزيران ٢٠٢٦", en: "Jun 4, 2026" },
    cover: "/photos/IMG_8344.webp",
  },
  {
    id: "post-3",
    category: "tech",
    title: {
      ar: "أرصدة سحابيّة بلا حدود: بنية خفيفة تكبر معك",
      en: "Cloud credits without borders: lean infra that scales",
    },
    excerpt: {
      ar: "كيف توظّف الأرصدة السحابيّة المجّانيّة لإطلاق منتجك الأوّل دون أن تغرق في الفواتير — قرارات معماريّة تدوم.",
      en: "How to turn free cloud credits into a shipped first product without drowning in bills — architecture decisions that last.",
    },
    author: { ar: "هبة شاهين", en: "Heba Shaheen" },
    readTime: 6,
    date: { ar: "٢٨ أيّار ٢٠٢٦", en: "May 28, 2026" },
    cover: "/photos/IMG_8313.webp",
  },
  {
    id: "post-4",
    category: "community",
    title: {
      ar: "لماذا تبدأ كلّ موهبة من مساحة مشتركة",
      en: "Why every talent begins in a shared space",
    },
    excerpt: {
      ar: "المساحة المشتركة ليست مكاتب فحسب — إنّها شبكة. كيف تحوّل غرفة عملٍ واحدة إلى مجتمع يصنع الفرص.",
      en: "A co-working space is more than desks — it's a network. How one working room becomes a community that manufactures opportunity.",
    },
    author: { ar: "رنا الهندي", en: "Rana Al-Hindi" },
    readTime: 5,
    date: { ar: "٢٠ أيّار ٢٠٢٦", en: "May 20, 2026" },
    cover: "/photos/IMG_8352.webp",
  },
  {
    id: "post-5",
    category: "startup",
    title: {
      ar: "من الفكرة إلى يوم العرض: ٩٠ يومًا",
      en: "From idea to Demo Day: the 90-day sprint",
    },
    excerpt: {
      ar: "مسار احتضانٍ مكثّف بلغة الأسابيع: ما الذي يجب أن تثبته في كلّ مرحلة قبل أن تقف أمام المستثمرين.",
      en: "An incubation track told in weeks: what you must prove at each stage before you stand in front of investors.",
    },
    author: { ar: "أحمد جابر", en: "Ahmed Jaber" },
    readTime: 8,
    date: { ar: "١١ أيّار ٢٠٢٦", en: "May 11, 2026" },
    cover: "/photos/IMG_8347.webp",
  },
  {
    id: "post-6",
    category: "tech",
    title: {
      ar: "حلول المدفوعات الدوليّة للمستقلّين الغزّيّين",
      en: "International payments for Gaza's freelancers",
    },
    excerpt: {
      ar: "أن تُنجز العمل شيء، وأن تُقبض ثمنه شيء آخر. خياراتٌ عمليّة لاستقبال المدفوعات عبر الحدود وأنت في غزّة.",
      en: "Doing the work is one thing; getting paid is another. Practical options for receiving cross-border payments from inside Gaza.",
    },
    author: { ar: "سارة مقداد", en: "Sara Miqdad" },
    readTime: 6,
    date: { ar: "٢ أيّار ٢٠٢٦", en: "May 2, 2026" },
    cover: "/photos/IMG_8356.webp",
  },
];

/** GOLD category chip — the spec's secondary accent for small category labels. */
function CategoryChip({ category }: { category: Category }) {
  const { t } = useLanguage();
  return (
    <span className="chip-sand inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] rtl:tracking-normal">
      {t(CATEGORY_LABEL[category])}
    </span>
  );
}

/** A quiet, RTL-safe meta line: author · readTime · date with tabular figures. */
function PostMeta({ post, className = "" }: { post: Post; className?: string }) {
  const { t } = useLanguage();
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 t-caption text-fg-secondary ${className}`}>
      <span className="font-semibold text-foreground">{t(post.author)}</span>
      <span aria-hidden className="text-fg-faint">·</span>
      <span className="inline-flex items-center gap-1.5 tnum">
        <Clock className="w-3.5 h-3.5 text-sand" aria-hidden />
        {t({
          ar: `${post.readTime} دقائق قراءة`,
          en: `${post.readTime} min read`,
        })}
      </span>
      <span aria-hidden className="text-fg-faint">·</span>
      <span className="tnum">{t(post.date)}</span>
    </div>
  );
}

export default function Blog() {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Category | "all">("all");

  useEffect(() => {
    document.title = t({ ar: "المدوّنة والرّؤى — آيلاند هيفن", en: "Blog & Insights — Island Haven" });
  }, [lang, t]);

  // The featured lead story is always the newest post (first in the array) and is
  // shown above the filter, so the masthead is stable regardless of the tab.
  const featured = SAMPLE_POSTS[0];
  const rest = useMemo(() => SAMPLE_POSTS.slice(1), []);

  const visible = useMemo(
    () => (active === "all" ? rest : rest.filter((p) => p.category === active)),
    [active, rest],
  );

  const tabs: { key: Category | "all"; label: Bi }[] = [
    { key: "all", label: { ar: "الكل", en: "All" } },
    ...CATEGORIES,
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
        {/* ── Sample note — a clear, honest bilingual disclaimer ── */}
        <Reveal>
          <div
            data-testid="blog-sample-note"
            className="flex items-start gap-3 rounded-2xl border border-border-strong/70 surface-2 px-5 py-4"
          >
            <span aria-hidden className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-primary" />
            <p className="t-caption text-fg-secondary">
              {t({
                ar: "هذه رؤى تجريبيّة لعرض شكل المدوّنة — المقالات الحقيقيّة في الطريق. الروابط تعود مؤقّتًا إلى صفحة المدوّنة.",
                en: "These are sample insights showing how the blog will look — real articles are on the way. Links return to the blog page for now.",
              })}
            </p>
          </div>
        </Reveal>

        {/* ── FEATURED lead story — full-width, large cover, big title ── */}
        <section aria-label={t({ ar: "المقال المميّز", en: "Featured story" })}>
          <Reveal>
            <Link
              href="/blog"
              data-testid="blog-featured"
              className="group block overflow-hidden rounded-[clamp(1.5rem,3vw,2rem)] card-base card-hover"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Cover */}
                <div className="relative h-[clamp(15rem,38vw,26rem)] overflow-hidden lg:order-last">
                  <img
                    src={featured.cover}
                    alt={t(featured.title)}
                    loading="eager"
                    className="absolute inset-0 h-full w-full object-cover saturate-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:scale-[1.04]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, hsl(0 0% 4% / 0.55) 0%, transparent 55%)",
                    }}
                  />
                </div>

                {/* Copy */}
                <div className="flex flex-col justify-center gap-5 p-[clamp(1.5rem,4vw,3rem)]">
                  <div className="flex items-center gap-3">
                    <span className="eyebrow eyebrow-sand">
                      {t({ ar: "المقال المميّز", en: "Featured" })}
                    </span>
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
                    {t(featured.title)}
                  </motion.h2>

                  <p className="t-body text-[15px] md:text-[16.5px] max-w-xl">
                    {t(featured.excerpt)}
                  </p>

                  <PostMeta post={featured} />

                  <span className="mt-1 inline-flex items-center gap-2 t-caption font-semibold uppercase tracking-[0.16em] rtl:tracking-normal text-primary">
                    {t({ ar: "اقرأ المقال", en: "Read the story" })}
                    <ArrowLeft className="w-3.5 h-3.5 ltr:rotate-180 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        </section>

        {/* ── Filter tabs + article deck ── */}
        <section aria-label={t({ ar: "كل الرّؤى", en: "All insights" })}>
          {/* Filter tabs — client-side category filter */}
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
                    {t(tab.label)}
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* Responsive 3-col grid of article cards */}
          {visible.length > 0 ? (
            <ul className="mt-[clamp(2rem,4vw,3rem)] grid grid-cols-1 gap-[clamp(1.25rem,2.5vw,2rem)] sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((post, i) => (
                <li key={post.id}>
                  <Reveal delay={Math.min(i, 6) * 0.05}>
                    <Link
                      href="/blog"
                      data-testid={`blog-card-${post.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-[clamp(1.25rem,2vw,1.5rem)] card-base card-hover"
                    >
                      {/* Cover + category chip overlay */}
                      <div className="relative h-[clamp(11rem,22vw,14rem)] overflow-hidden">
                        <img
                          src={post.cover}
                          alt={t(post.title)}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover saturate-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:scale-[1.05]"
                        />
                        <div
                          aria-hidden
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(to top, hsl(0 0% 4% / 0.45) 0%, transparent 60%)",
                          }}
                        />
                        <div className="absolute top-3 start-3">
                          <CategoryChip category={post.category} />
                        </div>
                      </div>

                      {/* Copy */}
                      <div className="flex flex-1 flex-col gap-3 p-[clamp(1.1rem,2vw,1.4rem)]">
                        <h3
                          className="font-display font-bold text-foreground transition-colors group-hover:text-primary"
                          style={{ fontSize: "clamp(1.15rem, 1.8vw, 1.4rem)", lineHeight: 1.18, letterSpacing: "-0.02em" }}
                        >
                          {t(post.title)}
                        </h3>
                        <p className="t-body text-[14px] line-clamp-3">{t(post.excerpt)}</p>
                        <PostMeta post={post} className="mt-auto pt-1" />
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
      </div>
    </PageShell>
  );
}
