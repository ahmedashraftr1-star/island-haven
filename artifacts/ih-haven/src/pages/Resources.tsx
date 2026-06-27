import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Lock,
  Sparkles,
  Star,
} from "lucide-react";
import { PageShell, EmptyState } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
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

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
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

// First tag reads as the "provider / source" of a resource (e.g. "AWS", "Figma").
function providerOf(r: ResourceCard): string {
  const first = (r.tags || "").split(/[,،]/)[0]?.trim();
  return first || "";
}
function initialOf(s: string): string {
  const ch = (s || "").trim()[0];
  return ch ? ch.toUpperCase() : "•";
}

export default function Resources() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<ResourceCard[] | null>(null);
  const [gated, setGated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"" | ResourceCategory>("");
  const reduce = useReducedMotion();

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
            e instanceof ApiError
              ? e.message
              : lang === "ar"
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
  const featuredCount = all.filter((r) => r.featured).length;
  // How many filter chips actually have content — so the toolbar never offers a
  // category that returns an empty grid.
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
      {/* ── Toolkit ledger — what the library is, told as a numbered editorial
          strip rather than a row of icon tiles. Sets the register before cards. ── */}
      <Reveal as="section" className="mb-12 sm:mb-16" data-testid="resources-intro">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-9 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="flex items-center gap-3 mb-5">
              <span aria-hidden className="h-px w-9 bg-primary/50" />
              <span className="eyebrow">{t({ ar: "ما الذي نفتحه لك", en: "What we open for you" })}</span>
            </div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(1.7rem, 3.4vw, 2.6rem)", lineHeight: 1.07, letterSpacing: "-0.026em" }}
            >
              {t({ ar: "لا تبدأ من ", en: "Don't start from " })}
              <span className="text-primary">{t({ ar: "الصّفر.", en: "zero." })}</span>
            </h2>
            <p className="t-body mt-5 max-w-md">
              {t({
                ar: "ما تدفع شركةٌ ناشئة آلاف الدّولارات لتجمعه، نضعه بين يديك مجّانًا — لأنّ الوقت في غزّة أغلى من أن يُهدر في إعادة اختراع العجلة.",
                en: "What a startup pays thousands to assemble, we put in your hands for free — because in Gaza, time is too precious to spend reinventing the wheel.",
              })}
            </p>
          </div>

          {/* Four axes of the toolkit — numbered ledger, hairline-divided. */}
          <div className="lg:col-span-7">
            {[
              {
                kbar: "٠١",
                ken: "01",
                title: t({ ar: "أدوات وبنية", en: "Tools & infrastructure" }),
                body: t({
                  ar: "أرصدة سحابيّة، حلول دفع، ومنصّات تُشغّل منتجك دون كلفة الإطلاق الأولى.",
                  en: "Cloud credits, payment rails and platforms that run your product without the first-launch cost.",
                }),
              },
              {
                kbar: "٠٢",
                ken: "02",
                title: t({ ar: "تعلّم وأدلّة", en: "Learning & guides" }),
                body: t({
                  ar: "مسارات ومقالات تختصر سنوات التجربة في خطوات واضحة قابلة للتطبيق.",
                  en: "Playbooks and guides that compress years of experience into clear, actionable steps.",
                }),
              },
              {
                kbar: "٠٣",
                ken: "03",
                title: t({ ar: "قوالب جاهزة", en: "Ready-made templates" }),
                body: t({
                  ar: "عروض، عقود، وخطط ماليّة تبدأ من منتصف الطريق بدل الورقة البيضاء.",
                  en: "Decks, contracts and financial models that start you halfway, not at a blank page.",
                }),
              },
              {
                kbar: "٠٤",
                ken: "04",
                title: t({ ar: "تمويل وحوافز", en: "Funding & perks" }),
                body: t({
                  ar: "خصومات شركاء وفرص تمويل نتفاوض عليها بالنّيابة عن مجتمعنا.",
                  en: "Partner discounts and funding leads we negotiate on behalf of our community.",
                }),
              },
            ].map((p, i) => (
              <Reveal
                key={p.ken}
                delay={i * 0.05}
                className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-7 items-baseline border-t border-border-strong py-6 sm:py-7 first:border-t-0 first:pt-0"
              >
                <span className="font-display text-[clamp(1.3rem,2.2vw,1.85rem)] font-bold tnum text-fg-faint leading-none">
                  {lang === "ar" ? p.kbar : p.ken}
                </span>
                <div>
                  <h3
                    className="font-display font-bold text-foreground"
                    style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)", letterSpacing: "-0.015em", lineHeight: 1.2 }}
                  >
                    {p.title}
                  </h3>
                  <p className="t-body mt-2 max-w-xl">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── Members-gate notice — most of the library unlocks on membership. ── */}
      {gated && (
        <Reveal
          as="section"
          className="card-base mb-10 p-6 sm:p-7 flex flex-col sm:flex-row items-start gap-5"
          data-testid="resources-gate"
        >
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-primary/12 border border-primary/30 shrink-0">
            <Lock className="w-5 h-5 text-primary" />
          </span>
          <div className="flex-1">
            <div className="text-foreground font-display font-bold text-[17px] mb-1.5 leading-snug">
              {t({ ar: "الجزء الأعمق من المكتبة للمنتسبين", en: "The deepest shelf is for members" })}
            </div>
            <p className="t-body max-w-2xl">
              {t({
                ar: "نُبقي الأدلّة العامّة مفتوحةً للجميع، ونحجز الأرصدة، القوالب الخاصّة، وحوافز الشّركاء للمنتسبين — حتّى تذهب لمن يبني فعلًا. سجّل دخولك إن كنت منتسبًا، أو قدّم للانضمام.",
                en: "We keep the general guides open to everyone, and reserve credits, private templates and partner perks for members — so they reach the people actually building. Log in if you're a member, or apply to join.",
              })}
            </p>
            <div className="flex items-center gap-2.5 flex-wrap mt-4">
              <Link
                href="/login"
                data-testid="resources-gate-login"
                className="group inline-flex items-center gap-1.5 px-4 h-10 rounded-full cta-fill text-[13px] font-semibold"
              >
                {t({ ar: "تسجيل الدخول", en: "Log in" })}
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
              <Link
                href="/apply"
                data-testid="resources-gate-apply"
                className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-surface-2 border border-border-strong text-fg-secondary text-[13px] font-semibold hover:bg-surface-3 hover:text-foreground transition-colors"
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
        <div className="flex items-center justify-between gap-3 mb-9 flex-wrap">
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
            <div className="flex items-center gap-2 flex-wrap">
              {featuredCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-[11.5px] font-bold chip-sand">
                  <Star className="w-3 h-3 fill-sand-bright text-sand-bright" />
                  {num(featuredCount, lang)} {t({ ar: "مميّز", en: "featured" })}
                </span>
              )}
              <span className="inline-flex items-center px-3.5 h-7 rounded-full text-[12px] font-semibold chip-sand tnum">
                {num(total, lang)} {t({ ar: "موردًا", en: "resources" })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Body — skeleton · empty · chapters · flat grid. ── */}
      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="resources-loading">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-52 bg-surface-2 border border-border-strong shadow-soft animate-pulse"
            />
          ))}
        </div>
      ) : isEmpty ? (
        <ResourcesEmpty gated={gated} />
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
          <motion.div
            key={filter}
            variants={reduce ? undefined : stagger}
            initial={reduce ? undefined : "hidden"}
            animate={reduce ? undefined : "show"}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            data-testid="resources-grid"
          >
            {flat.map((r) => (
              <ResourceCardView key={r.id} r={r} reduce={!!reduce} />
            ))}
          </motion.div>
        )
      ) : (
        <div className="space-y-14" data-testid="resources-grid">
          {groups.map((g, gi) => (
            <section key={g.cat} data-testid={`resources-group-${g.cat}`}>
              {/* Chapter head — name, purpose, count, hairline. */}
              <Reveal className="mb-6 flex items-end justify-between gap-4 border-b border-border-strong pb-4">
                <div>
                  <h2
                    className="font-display font-extrabold text-foreground"
                    style={{ fontSize: "clamp(1.4rem, 2.6vw, 2rem)", letterSpacing: "-0.022em", lineHeight: 1.1 }}
                  >
                    {t(GROUP_META[g.cat])}
                  </h2>
                  <p className="t-caption text-muted-foreground mt-1.5 max-w-xl">
                    {t(GROUP_META[g.cat].blurb)}
                  </p>
                </div>
                <span className="shrink-0 font-display font-bold text-fg-faint tnum text-[clamp(1.1rem,2vw,1.6rem)] leading-none">
                  {num(g.items.length, lang)}
                </span>
              </Reveal>

              <motion.div
                variants={reduce ? undefined : stagger}
                initial={reduce ? undefined : "hidden"}
                whileInView={reduce ? undefined : "show"}
                viewport={{ once: true, amount: 0.1 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {g.items.map((r) => (
                  <ResourceCardView key={r.id} r={r} reduce={!!reduce} priority={gi === 0} />
                ))}
              </motion.div>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function ResourceCardView({
  r,
  reduce,
  priority = false,
}: {
  r: ResourceCard;
  reduce: boolean;
  priority?: boolean;
}) {
  const { lang, t } = useLanguage();
  const href = r.externalUrl || r.fileUrl;
  const provider = providerOf(r);
  const isExternal = !!r.externalUrl;

  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -5 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="h-full"
    >
      <a
        href={href || "#"}
        target={href ? "_blank" : undefined}
        rel={href ? "noreferrer" : undefined}
        className="group block h-full"
        data-testid={`resource-card-${r.id}`}
      >
        <div
          className={`card-base card-hover group h-full flex flex-col p-6 ${
            r.featured ? "border-primary/30" : ""
          }`}
        >
          {/* Head — provider medallion + type chip + featured marker. */}
          <div className="flex items-start gap-3.5 mb-4">
            {r.coverUrl ? (
              <span className="shrink-0 w-12 h-12 rounded-2xl overflow-hidden ring-1 ring-border-strong bg-surface-3">
                <img
                  src={r.coverUrl}
                  alt={provider || r.title}
                  loading={priority ? "eager" : "lazy"}
                  className="w-full h-full object-cover saturate-[1.03]"
                />
              </span>
            ) : (
              <span
                className="shrink-0 grid place-items-center w-12 h-12 rounded-2xl text-white font-display font-black text-[19px] ring-2 ring-white/15 shadow-soft select-none transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                style={{ background: "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--primary-pressed)) 100%)" }}
                aria-hidden
              >
                {initialOf(provider || r.title)}
              </span>
            )}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] tracking-[0.12em] uppercase font-bold chip-sand">
                {categoryLabel(r.category, lang)}
              </span>
              {r.featured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-primary/12 text-primary border border-primary/30">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  {t({ ar: "مميّز", en: "Featured" })}
                </span>
              )}
            </div>
          </div>

          {/* Title + provider line */}
          <h3 className="font-display font-bold text-foreground text-[16px] leading-snug group-hover:text-primary transition-colors">
            {r.title}
          </h3>
          {provider && (
            <div className="text-[12px] font-semibold text-sand mt-1 truncate">
              {provider}
            </div>
          )}

          {/* Value line */}
          {r.summary && (
            <p className="t-body text-[13px] leading-[1.8] mt-3 line-clamp-3 flex-1">
              {r.summary}
            </p>
          )}

          {/* Footer — access marker + open affordance */}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-[12px] font-semibold">
            {r.visibility === "members" ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-primary">
                <Lock className="w-3 h-3" />
                {t({ ar: "للمنتسبين", en: "Members" })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-sand">
                <Sparkles className="w-3 h-3" />
                {t({ ar: "للجميع", en: "Everyone" })}
              </span>
            )}
            {href && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
                {isExternal ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                {isExternal
                  ? t({ ar: "فتح", en: "Open" })
                  : t({ ar: "تنزيل", en: "Download" })}
              </span>
            )}
          </div>
        </div>
      </a>
    </motion.div>
  );
}

/**
 * ResourcesEmpty — educational, never a dead end. Tells the true story: the
 * library is hand-curated and grows with every cohort, explains how a member
 * unlocks it, and routes to the real next steps (apply / book / log in). Holds
 * the dark editorial register with a numbered "what's coming" ledger.
 */
function ResourcesEmpty({ gated }: { gated: boolean }) {
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
    <section
      data-testid="resources-empty"
      className="card-base relative overflow-hidden p-7 sm:p-10"
    >
      <div aria-hidden className="ambient-grid absolute inset-0 -z-10" />
      <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,4rem)] gap-y-9 items-start">
        <div className="lg:col-span-6">
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="eyebrow">{t({ ar: "المكتبة قيد البناء", en: "The library is being built" })}</span>
          </div>
          <h2
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.6rem)", lineHeight: 1.07, letterSpacing: "-0.026em" }}
          >
            {t({ ar: "مكتبةٌ ", en: "A library we " })}
            <span className="text-primary">{t({ ar: "ننتقيها بأيدينا.", en: "curate by hand." })}</span>
          </h2>
          <p className="t-body-lg mt-5 max-w-xl">
            {t({
              ar: gated
                ? "أوّل دفعة من الموارد للمنتسبين تُجهَّز الآن. سجّل دخولك لتفتح ما هو متاح، أو قدّم للانضمام لمساحتنا والوصول إلى كلّ ما نبنيه."
                : "لا نملأ هذه الصفحة بروابط عامّة — نختار كلّ مورد بعناية ليخدم صانعًا حقيقيًّا. أوّل دفعة في الطريق، وتنمو المكتبة مع كلّ برنامج ودفعة.",
              en: gated
                ? "The first batch of member resources is being prepared. Log in to unlock what's available, or apply to join the space and reach everything we build."
                : "We don't pad this page with generic links — every resource is chosen to serve a real maker. The first batch is on the way, and the library grows with every program and cohort.",
            })}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 mt-7">
            {gated ? (
              <Link
                href="/login"
                data-testid="resources-empty-login"
                className="group inline-flex items-center gap-2 h-11 px-6 rounded-full cta-fill text-[13.5px] font-bold"
              >
                {t({ ar: "تسجيل الدخول", en: "Log in" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                href="/apply"
                data-testid="resources-empty-apply"
                className="group inline-flex items-center gap-2 h-11 px-6 rounded-full cta-fill text-[13.5px] font-bold"
              >
                {t({ ar: "قدّم على الانتساب", en: "Apply to join" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
            )}
            <Link
              href="/book"
              data-testid="resources-empty-book"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-surface-2 border border-border-strong text-fg-secondary text-[13.5px] font-semibold hover:border-primary/40 hover:text-foreground transition-colors"
            >
              {t({ ar: "احجز مقعدًا", en: "Book a seat" })}
            </Link>
          </div>
        </div>

        {/* What's coming — numbered ledger, hairline-divided, no icon tiles. */}
        <div className="lg:col-span-6 lg:ps-6">
          <div className="text-[10.5px] tracking-[0.2em] uppercase text-muted-foreground font-semibold mb-1">
            {t({ ar: "ما الذي يُجهَّز", en: "What's coming" })}
          </div>
          {coming.map((c, i) => (
            <div
              key={c.title}
              className="grid grid-cols-[auto_1fr] gap-x-5 items-baseline border-t border-border-strong py-5"
            >
              <span className="font-display text-[20px] font-bold tnum text-fg-faint leading-none">
                {t({ ar: ["٠١", "٠٢", "٠٣"][i], en: String(i + 1).padStart(2, "0") })}
              </span>
              <div>
                <div className="font-display font-bold text-foreground text-[15px]">{c.title}</div>
                <p className="t-caption text-muted-foreground mt-1">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
