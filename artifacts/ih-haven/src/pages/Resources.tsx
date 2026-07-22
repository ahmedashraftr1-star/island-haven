import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Download, ExternalLink, Lock } from "lucide-react";
import { PageShell, EmptyState } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { EASE_OUT_EXPO } from "@/lib/motion";
import {
  RESOURCE_CATEGORY_LABELS,
  type ResourceCategory,
  type ResourceVisibility,
} from "@/lib/labels";

interface ResourceCard {
  id: number;
  title: string;
  summary: string;
  category: ResourceCategory;
  visibility: ResourceVisibility;
  coverUrl: string | null;
  externalUrl: string;
  fileUrl: string;
  tags: string;
  featured: boolean;
}

// English counterparts to the Arabic-only RESOURCE_CATEGORY_LABELS in @/lib/labels.
const RESOURCE_CATEGORY_LABELS_EN: Record<ResourceCategory, string> = {
  template: "Template",
  guide: "Guide",
  tool: "Tool",
  perk: "Perk",
  recording: "Recording",
  legal: "Legal",
};

const FILTERS: Array<{ key: "" | ResourceCategory; label: { ar: string; en: string } }> = [
  { key: "", label: { ar: "الكلّ", en: "All" } },
  { key: "guide", label: { ar: "أدلّة", en: "Guides" } },
  { key: "template", label: { ar: "قوالب", en: "Templates" } },
  { key: "tool", label: { ar: "أدوات", en: "Tools" } },
  { key: "perk", label: { ar: "حوافز", en: "Perks" } },
  { key: "recording", label: { ar: "تسجيلات", en: "Recordings" } },
  { key: "legal", label: { ar: "قانونيّة", en: "Legal" } },
];

// Display order when we group the full library (no filter) into chapters. Each
// resource's category maps to one of these editorial sections; "legal" folds
// into the templates chapter so the page never sprouts a one-card section.
const GROUP_ORDER: ResourceCategory[] = [
  "tool",
  "guide",
  "template",
  "perk",
  "recording",
  "legal",
];

const GROUP_META: Record<
  ResourceCategory,
  { ar: string; en: string; blurb: { ar: string; en: string } }
> = {
  tool: {
    ar: "أدوات",
    en: "Tools",
    blurb: {
      ar: "البرمجيّات والمنصّات التي يعمل عليها فريقك يوميًّا.",
      en: "The software and platforms your team works in every day.",
    },
  },
  guide: {
    ar: "تعلّم",
    en: "Learn",
    blurb: {
      ar: "أدلّة ومسارات تختصر عليك سنوات من المحاولة والخطأ.",
      en: "Guides and playbooks that save you years of trial and error.",
    },
  },
  template: {
    ar: "قوالب",
    en: "Templates",
    blurb: {
      ar: "نماذج جاهزة — عروض، عقود، خطط — تبدأ من منتصف الطريق.",
      en: "Ready-made decks, contracts and plans — start from halfway there.",
    },
  },
  perk: {
    ar: "حوافز",
    en: "Perks",
    blurb: {
      ar: "أرصدة سحابيّة وخصومات شركاء تخفّض كلفة الإطلاق.",
      en: "Cloud credits and partner discounts that lower the cost of launching.",
    },
  },
  recording: {
    ar: "تسجيلات",
    en: "Recordings",
    blurb: {
      ar: "ورش وجلسات سابقة، محفوظة لتشاهدها وقتما تشاء.",
      en: "Past workshops and sessions, saved for you to watch anytime.",
    },
  },
  legal: {
    ar: "قانونيّة",
    en: "Legal",
    blurb: {
      ar: "نماذج تأسيس وحماية حقوق — الأساس الذي يقف عليه المشروع.",
      en: "Incorporation and rights-protection templates — the ground your venture stands on.",
    },
  },
};

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}
// Category label localised by language.
function categoryLabel(category: ResourceCategory, lang: Lang): string {
  return lang === "ar"
    ? RESOURCE_CATEGORY_LABELS[category]
    : RESOURCE_CATEGORY_LABELS_EN[category];
}

// Fallback cover when the featured resource carries no coverUrl — a real space
// photo keeps the opener anchored on photography rather than going blank.
const RESOURCES_FALLBACK_COVER = "/photos/IMG_8347.webp";

// First tag reads as the "provider / source" of a resource (e.g. "AWS", "Figma").
function providerOf(r: ResourceCard): string {
  const first = (r.tags || "").split(/[,،]/)[0]?.trim();
  return first || "";
}

export default function Resources() {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<ResourceCard[] | null>(null);
  const [gated, setGated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"" | ResourceCategory>("");

  useEffect(() => {
    document.title =
      lang === "ar" ? "دليل الرّائد — Island Haven" : "Resources — Island Haven";
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    api<{ resources: ResourceCard[]; gated: boolean }>("/resources")
      .then((r) => {
        if (cancelled) return;
        setRows(r.resources);
        setGated(r.gated);
      })
      .catch(
        (e) =>
          !cancelled &&
          setError(
            lang === "ar"
                ? "تعذّر التحميل"
                : "Couldn't load resources",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // Featured-first ordering, applied within both the flat view and each chapter.
  const sortFeatured = (a: ResourceCard, b: ResourceCard) =>
    Number(b.featured) - Number(a.featured);

  const all = rows ?? [];
  const total = all.length;
  // How many filter chips actually have content — so the toolbar never offers a
  // category that returns an empty list.
  const presentCategories = useMemo(
    () => new Set(all.map((r) => r.category)),
    [all],
  );
  const visibleFilters = FILTERS.filter(
    (f) => f.key === "" || presentCategories.has(f.key as ResourceCategory),
  );

  const flat = filter
    ? all.filter((r) => r.category === filter).sort(sortFeatured)
    : [];

  // When unfiltered, present the library as curated chapters (only the ones that
  // have content), each with a count + one-line purpose.
  const groups = useMemo(() => {
    if (filter) return [];
    return GROUP_ORDER.map((cat) => ({
      cat,
      items: all.filter((r) => r.category === cat).sort(sortFeatured),
    })).filter((g) => g.items.length > 0);
  }, [all, filter]);

  const showFlat = !!filter;
  const isEmpty = rows !== null && total === 0;
  // View-aware count: when a category is active the toolbar must reflect the
  // filtered view (flat.length), not the full library size.
  const shown = filter ? flat.length : total;

  // Featured/first resource carries the page's cover photography. Fall back to a
  // space photo so the anchor never goes blank when coverUrl is null.
  const featured = all.find((r) => r.featured) ?? all[0] ?? null;
  const featuredCover = featured?.coverUrl || RESOURCES_FALLBACK_COVER;

  return (
    <PageShell
      eyebrow={t({ ar: "دليل الرّائد · The Playbook", en: "The Founder's Playbook" })}
      title={t({ ar: "صندوق", en: "The founder's" })}
      highlight={t({ ar: "الأدوات", en: "toolkit" })}
      subtitle={t({
        ar: "كلّ ما نفتحه لمنتسبينا في مكان واحد — أرصدة سحابيّة، حلول دفع، أدلّة، وقوالب جاهزة. انتقيناها بأيدينا لتقفز من فكرة على ورقة إلى منتج يعمل، دون أن تبدأ من الصفر.",
        en: "Everything we open up for our members, in one place — cloud credits, payment rails, learning, and ready-made templates. Hand-picked so you leap from an idea on paper to a working product without starting from zero.",
      })}
    >
      {/* ── Monumental opener — one calm line, one crimson word, acres of space.
          Replaces the numbered 01/02/03 axis ledger; scale carries the register. ── */}
      <Reveal as="section" className="mb-[clamp(4rem,9vw,7rem)]" data-testid="resources-intro">
        <div className="grid grid-cols-1 items-center gap-[clamp(2.5rem,5vw,4.5rem)] lg:grid-cols-[1fr_minmax(0,22rem)]">
          <div>
            <h2
              className="font-display text-foreground max-w-[16ch]"
              style={{
                fontSize: "clamp(2.6rem, 7vw, 5rem)",
                lineHeight: 0.99,
                letterSpacing: "-0.045em",
                fontWeight: 700,
              }}
            >
              {[
                t({ ar: "لا تبدأ", en: "Don't build" }),
                t({ ar: "من ", en: "from " }),
                <span key="accent" className="text-primary">{t({ ar: "الصّفر.", en: "scratch." })}</span>,
              ].map((ln, i) => (
                <motion.span
                  key={i}
                  className="block will-change-transform"
                  initial={reduce ? false : { opacity: 0, y: 30 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.85, delay: i * 0.09, ease: EASE_OUT_EXPO }}
                >
                  {ln}
                </motion.span>
              ))}
            </h2>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.85, delay: 0.42, ease: EASE_OUT_EXPO }}
              className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
              style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
            >
              {t({
                ar: "ما تدفع شركةٌ ناشئة آلاف الدّولارات لتجمعه — أرصدةٌ سحابيّة، حلول دفع، أدلّة، وقوالب — نضعه بين يديك مجّانًا. لأنّ الوقت في غزّة أغلى من أن يُهدر في إعادة اختراع العجلة.",
                en: "What a startup pays thousands to assemble — cloud credits, payment rails, guides and templates — we put in your hands for free. Because in Gaza, time is too precious to spend reinventing the wheel.",
              })}
            </motion.p>
          </div>

          {featured && (
            <FeaturedCover src={featuredCover} caption={featured.title} />
          )}
        </div>
      </Reveal>

      {/* ── Members-gate notice — most of the library unlocks on membership. Told as
          a calm editorial line behind a hairline, not a glass icon-tile card. ── */}
      {gated && (
        <Reveal
          as="section"
          className="mb-[clamp(2.5rem,5vw,4rem)] border-y border-border-strong/60 py-[clamp(1.75rem,3.5vw,2.5rem)]"
          data-testid="resources-gate"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="max-w-2xl">
              <h3
                className="font-display font-bold text-foreground"
                style={{ fontSize: "clamp(1.3rem,2.6vw,1.85rem)", letterSpacing: "-0.024em", lineHeight: 1.12 }}
              >
                {t({ ar: "الجزء الأعمق من المكتبة للمنتسبين", en: "The deepest shelf is for members" })}
              </h3>
              <p className="t-body text-[15px] md:text-[16px] mt-3">
                {t({
                  ar: "نُبقي الأدلّة العامّة مفتوحةً للجميع، ونحجز الأرصدة، القوالب الخاصّة، وحوافز الشّركاء للمنتسبين — حتّى تذهب لمن يبني فعلًا. سجّل دخولك إن كنت منتسبًا، أو قدّم للانضمام.",
                  en: "We keep the general guides open to everyone, and reserve credits, private templates and partner perks for members — so they reach the people actually building. Log in if you're a member, or apply to join.",
                })}
              </p>
            </div>
            <div className="flex items-center gap-x-6 gap-y-3 flex-wrap shrink-0">
              <Link
                href="/login"
                data-testid="resources-gate-login"
                className="group inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                style={{ fontSize: "clamp(0.95rem,1.5vw,1.1rem)", fontWeight: 600 }}
              >
                {t({ ar: "تسجيل الدخول", en: "Log in" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
              <Link
                href="/apply"
                data-testid="resources-gate-apply"
                className="group inline-flex items-center gap-2 text-fg-secondary hover:text-foreground transition-colors"
                style={{ fontSize: "clamp(0.95rem,1.5vw,1.1rem)", fontWeight: 600 }}
              >
                {t({ ar: "قدّم على الانتساب", en: "Apply to join" })}
              </Link>
            </div>
          </div>
        </Reveal>
      )}

      {error && (
        <div
          data-testid="resources-error"
          className="card-base p-5 text-center text-[13.5px] font-medium text-destructive border-destructive/30 mb-8"
        >
          {error}
        </div>
      )}

      {/* ── Toolbar — category filters (only those with content) + live count. ── */}
      {!isEmpty && (
        <div className="flex items-center justify-between gap-3 mb-[clamp(2rem,4vw,3rem)] flex-wrap">
          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label={t({ ar: "تصفية الموارد", en: "Filter resources" })}>
            {visibleFilters.map((f) => {
              const isActive = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={isActive}
                  data-testid={`resources-filter-${f.key || "all"}`}
                  className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors border ${
                    isActive
                      ? "cta-fill border-transparent"
                      : "bg-surface-2 text-fg-secondary border-border-strong hover:text-foreground hover:bg-surface-3"
                  }`}
                >
                  {t(f.label)}
                </button>
              );
            })}
          </div>
          {!!total && (
            <span className="t-caption text-fg-secondary tnum whitespace-nowrap">
              {num(shown, lang)} {t({ ar: "موردًا", en: "resources" })}
            </span>
          )}
        </div>
      )}

      {/* ── Body — skeleton · empty · chapters · flat list. ── */}
      {rows === null && !error ? (
        <ResourcesSkeleton />
      ) : isEmpty ? (
        <ResourcesEmpty gated={gated} reduce={!!reduce} />
      ) : showFlat ? (
        flat.length === 0 ? (
          <EmptyState
            title={t({ ar: "لا موارد في هذا التصنيف بعد", en: "Nothing in this category yet" })}
            hint={t({
              ar: "جرّب تصنيفًا آخر — المكتبة تنمو مع كلّ دفعة.",
              en: "Try another category — the library grows with every cohort.",
            })}
          />
        ) : (
          <ul key={filter} className="border-t border-border-strong/60" data-testid="resources-grid">
            {flat.map((r, i) => (
              <ResourceRow key={r.id} r={r} i={i} reduce={!!reduce} />
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-[clamp(3.5rem,7vw,6rem)]" data-testid="resources-grid">
          {groups.map((g) => (
            <section key={g.cat} data-testid={`resources-group-${g.cat}`}>
              {/* Chapter head — name, purpose, count, hairline. No eyebrow kicker. */}
              <Reveal className="mb-2 flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-b border-border-strong pb-[clamp(1.25rem,2.5vw,2rem)]">
                <div className="max-w-2xl">
                  <h2
                    className="font-display font-bold text-foreground"
                    style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.6rem)", letterSpacing: "-0.028em", lineHeight: 1.06 }}
                  >
                    {t(GROUP_META[g.cat])}
                  </h2>
                  <p className="t-caption text-fg-secondary mt-2">
                    {t(GROUP_META[g.cat].blurb)}
                  </p>
                </div>
                <span className="shrink-0 font-display font-bold text-fg-faint tnum leading-none" style={{ fontSize: "clamp(1.1rem,2vw,1.6rem)" }}>
                  {num(g.items.length, lang)}
                </span>
              </Reveal>

              <ul>
                {g.items.map((r, i) => (
                  <ResourceRow key={r.id} r={r} i={i} reduce={!!reduce} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}

/**
 * FeaturedCover — anchors the monumental opener on large real photography with a
 * slow scroll parallax, mirroring Statement.tsx (useScroll/useTransform). The
 * image holds the page to the house bar; the transform is gated on reduced-motion.
 * Caption surfaces the featured resource title as a quiet editorial label.
 */
function FeaturedCover({
  src,
  caption,
}: {
  src: string;
  caption?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : ["-8%", "8%"],
  );

  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0 }}
      whileInView={reduce ? undefined : { opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1, delay: 0.2, ease: EASE_OUT_EXPO }}
      className="relative overflow-hidden rounded-[2px] bg-surface-2 aspect-[4/5] will-change-transform"
      data-testid="resources-featured-cover"
    >
      <motion.img
        src={src}
        alt={caption || ""}
        loading="lazy"
        style={{ y, scale: 1.16 }}
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/55 via-background/5 to-transparent" />
      {caption && (
        <span
          className="absolute inset-x-0 bottom-0 p-5 t-caption text-white/80"
          aria-hidden
        >
          {caption}
        </span>
      )}
    </motion.div>
  );
}

/**
 * ResourceRow — one entry from the toolkit, told as a calm editorial hairline
 * row (no card, no provider medallion, no chip cluster): a large title, the
 * provider, what it unlocks as prose, and a quiet "open / download" affordance.
 * Members-only items wear a small lock in the logical-end column. External vs
 * file links keep their original target/rel + testid.
 */
function ResourceRow({
  r,
  i,
  reduce,
}: {
  r: ResourceCard;
  i: number;
  reduce: boolean;
}) {
  const { lang, t } = useLanguage();
  const href = r.externalUrl || r.fileUrl;
  const provider = providerOf(r);
  const isExternal = !!r.externalUrl;
  const isMembers = r.visibility === "members";

  return (
    <li>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, delay: Math.min(i, 6) * 0.06, ease: EASE_OUT_EXPO }}
        className="will-change-transform"
      >
        <a
          href={href || "#"}
          target={href ? "_blank" : undefined}
          rel={href ? "noreferrer" : undefined}
          data-testid={`resource-card-${r.id}`}
          className="group grid grid-cols-1 md:grid-cols-[minmax(0,17rem)_1fr_auto] items-baseline gap-x-[clamp(1.5rem,3vw,2.75rem)] gap-y-2 py-[clamp(1.5rem,3vw,2.5rem)] border-b border-border-strong/60 transition-colors hover:border-border-strong"
        >
          {/* Title + provider — the name carries it, no medallion. */}
          <div className="min-w-0">
            <h3
              className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
              style={{ fontSize: "clamp(1.3rem,2.4vw,1.85rem)", letterSpacing: "-0.024em", lineHeight: 1.14 }}
            >
              {r.title}
            </h3>
            {provider && (
              <span className="block t-caption text-fg-secondary mt-1.5">{provider}</span>
            )}
          </div>

          {/* What it unlocks — the real value, as prose. */}
          {r.summary ? (
            <p className="t-body text-[15px] md:text-[16px] max-w-xl">{r.summary}</p>
          ) : (
            <span aria-hidden />
          )}

          {/* Access + open affordance — start-aligned to the logical end. */}
          <div className="flex items-center gap-x-5 whitespace-nowrap justify-self-start md:justify-self-end">
            <span className="t-caption text-fg-secondary">
              {categoryLabel(r.category, lang)}
            </span>
            <span className="inline-flex items-center gap-2 t-caption group-hover:text-foreground transition-colors">
              {isMembers ? (
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <Lock className="w-3.5 h-3.5" />
                  {t({ ar: "للمنتسبين", en: "Members" })}
                </span>
              ) : (
                <span className="text-fg-secondary">
                  {isExternal ? t({ ar: "فتح", en: "Open" }) : t({ ar: "تنزيل", en: "Download" })}
                </span>
              )}
              {href &&
                (isExternal ? (
                  <ExternalLink className="w-3.5 h-3.5 text-fg-faint group-hover:text-primary transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-fg-faint group-hover:text-primary transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:translate-y-0.5" />
                ))}
            </span>
          </div>
        </a>
      </motion.div>
    </li>
  );
}

// Loading skeleton — hairline rows, matching the editorial list (not a card deck).
function ResourcesSkeleton() {
  return (
    <ul className="border-t border-border-strong/60" data-testid="resources-loading">
      {[0, 1, 2, 3, 4].map((i) => (
        <li
          key={i}
          className="grid grid-cols-1 md:grid-cols-[minmax(0,17rem)_1fr_auto] items-baseline gap-x-[clamp(1.5rem,3vw,2.75rem)] gap-y-3 py-[clamp(1.5rem,3vw,2.5rem)] border-b border-border-strong/60"
        >
          <div className="h-7 w-48 max-w-[70%] rounded bg-surface-3 animate-pulse" />
          <div className="h-5 w-full max-w-md rounded bg-surface-3 animate-pulse" />
          <div className="h-5 w-24 rounded bg-surface-3 animate-pulse justify-self-start md:justify-self-end" />
        </li>
      ))}
    </ul>
  );
}

/**
 * ResourcesEmpty — educational, never a dead end. Tells the true story: the
 * library is hand-curated and grows with every cohort, explains how a member
 * unlocks it, and routes to the real next steps (apply / book / log in). Holds
 * the dark editorial register — a monumental line and a calm hairline list of
 * what's coming, no aura blob, no numbered icon ledger.
 */
function ResourcesEmpty({ gated, reduce }: { gated: boolean; reduce: boolean }) {
  const { t } = useLanguage();

  const coming = [
    {
      title: t({ ar: "أرصدة وأدوات", en: "Credits & tools" }),
      body: t({
        ar: "أرصدة سحابيّة وحلول دفع نتفاوض عليها مع شركائنا.",
        en: "Cloud credits and payment rails we negotiate with our partners.",
      }),
    },
    {
      title: t({ ar: "أدلّة وقوالب", en: "Guides & templates" }),
      body: t({
        ar: "نماذج عروض وعقود وخطط، مكتوبة لسياق صانعٍ في غزّة.",
        en: "Deck, contract and plan templates, written for a maker's context in Gaza.",
      }),
    },
    {
      title: t({ ar: "تسجيلات الورش", en: "Workshop recordings" }),
      body: t({
        ar: "كلّ ورشة تُقام تُحفظ هنا لتعود إليها وقتما تشاء.",
        en: "Every workshop we run is saved here for you to revisit anytime.",
      }),
    },
  ];

  return (
    <section data-testid="resources-empty">
      <motion.h2
        className="font-display text-foreground max-w-[15ch]"
        style={{ fontSize: "clamp(2.2rem, 5.6vw, 4.25rem)", lineHeight: 1.0, letterSpacing: "-0.04em", fontWeight: 700 }}
      >
        {[
          t({ ar: "مكتبةٌ", en: "A library" }),
          t({ ar: "ننتقيها ", en: "we curate" }),
          <span key="accent" className="text-primary">{t({ ar: "بأيدينا.", en: "by hand." })}</span>,
        ].map((ln, i) => (
          <motion.span
            key={i}
            className="block will-change-transform"
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, delay: i * 0.09, ease: EASE_OUT_EXPO }}
          >
            {ln}
          </motion.span>
        ))}
      </motion.h2>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.85, delay: 0.4, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
        style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
      >
        {t({
          ar: gated
            ? "أوّل دفعة من الموارد للمنتسبين تُجهَّز الآن. سجّل دخولك لتفتح ما هو متاح، أو قدّم للانضمام لمساحتنا والوصول إلى كلّ ما نبنيه."
            : "لا نملأ هذه الصفحة بروابط عامّة — نختار كلّ مورد بعناية ليخدم صانعًا حقيقيًّا. أوّل دفعة في الطريق، وتنمو المكتبة مع كلّ برنامج ودفعة.",
          en: gated
            ? "The first batch of member resources is being prepared. Log in to unlock what's available, or apply to join the space and reach everything we build."
            : "We don't pad this page with generic links — every resource is chosen to serve a real maker. The first batch is on the way, and the library grows with every program and cohort.",
        })}
      </motion.p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.8, delay: 0.52, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-center gap-x-7 gap-y-4"
      >
        {gated ? (
          <Link
            href="/login"
            data-testid="resources-empty-login"
            className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
          >
            {t({ ar: "تسجيل الدخول", en: "Log in" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
        ) : (
          <Link
            href="/apply"
            data-testid="resources-empty-apply"
            className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
          >
            {t({ ar: "قدّم على الانتساب", en: "Apply to join" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
        )}
        <Link
          href="/book"
          data-testid="resources-empty-book"
          className="group inline-flex items-center gap-2 text-[14px] font-semibold text-foreground/85 hover:text-foreground transition-colors"
        >
          {t({ ar: "احجز مقعدك", en: "Book a seat" })}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
      </motion.div>

      {/* What's coming — calm hairline rows, no numbered icon ledger. */}
      <ul className="mt-[clamp(3.5rem,7vw,6rem)] border-t border-border-strong/60">
        {coming.map((c, i) => (
          <Reveal
            as="li"
            key={c.title}
            delay={i * 0.06}
            className="grid grid-cols-1 md:grid-cols-[minmax(0,17rem)_1fr] items-baseline gap-x-[clamp(1.5rem,3vw,2.75rem)] gap-y-1.5 py-[clamp(1.5rem,3vw,2.25rem)] border-b border-border-strong/60"
          >
            <h3
              className="font-display font-bold text-foreground"
              style={{ fontSize: "clamp(1.2rem,2.2vw,1.6rem)", letterSpacing: "-0.022em", lineHeight: 1.15 }}
            >
              {c.title}
            </h3>
            <p className="t-body text-[15px] md:text-[16px] max-w-xl">{c.body}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
