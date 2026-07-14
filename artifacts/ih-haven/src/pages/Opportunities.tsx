import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowLeft, Globe2, CalendarClock } from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { EASE_OUT_EXPO } from "@/lib/motion";
import {
  OPPORTUNITY_TYPE_LABELS,
  OPPORTUNITY_LOCATION_LABELS,
  type OpportunityType,
  type OpportunityLocation,
  formatDate,
  splitTags,
} from "@/lib/labels";

interface Opportunity {
  id: number;
  title: string;
  organization: string;
  type: OpportunityType;
  locationType: OpportunityLocation;
  city: string;
  description: string;
  skills: string;
  compensation: string;
  deadline: string | null;
  featured: boolean;
}

// English variants of the Arabic-only label maps in @/lib/labels.
const OPPORTUNITY_TYPE_LABELS_EN: Record<OpportunityType, string> = {
  job: "Job",
  internship: "Internship",
  freelance: "Freelance",
  gig: "Short gig",
  volunteer: "Volunteer",
};
const OPPORTUNITY_LOCATION_LABELS_EN: Record<OpportunityLocation, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

const TYPE_FILTERS: ("all" | OpportunityType)[] = [
  "all",
  "job",
  "internship",
  "freelance",
  "gig",
  "volunteer",
];

// A second, client-side dimension — talent in Gaza unlocks the world the
// moment work goes remote, so "remote-friendly" deserves its own filter.
type PlaceFilter = "any" | "remote" | "onsite";

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}

// A deadline reads very differently if it's days away vs. months — surface that
// urgency in the row without ever inventing a date.
function deadlineUrgency(iso: string | null): "soon" | "open" | null {
  if (!iso) return null;
  const days = (new Date(iso).getTime() - Date.now()) / 86_400_000;
  if (Number.isNaN(days)) return null;
  if (days < 0) return null; // already past — never flag an expired listing as "Closing soon"
  return days <= 10 ? "soon" : "open";
}

export default function Opportunities() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<Opportunity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | OpportunityType>("all");
  const [place, setPlace] = useState<PlaceFilter>("any");
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title =
      lang === "ar"
        ? "الفرص والوظائف — Island Haven"
        : "Opportunities — Island Haven";
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    const q = filter === "all" ? "/opportunities" : `/opportunities?type=${filter}`;
    api<{ opportunities: Opportunity[] }>(q)
      .then((r) => !cancelled && setRows(r.opportunities))
      .catch(
        (e) =>
          !cancelled &&
          setError(
            e instanceof ApiError
              ? e.message
              : t({ ar: "تعذّر التحميل", en: "Couldn't load opportunities" }),
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [filter]);

  // Place is a client-side refinement layered on top of the server `type` fetch,
  // so the existing /opportunities + ?type= contract is untouched.
  const placeFiltered = useMemo(
    () =>
      (rows ?? []).filter((o) => {
        if (place === "any") return true;
        if (place === "remote") return o.locationType !== "onsite";
        return o.locationType !== "remote";
      }),
    [rows, place],
  );

  const sorted = [...placeFiltered].sort(
    (a, b) => Number(b.featured) - Number(a.featured),
  );
  const total = placeFiltered.length;
  const featuredCount = placeFiltered.filter((o) => o.featured).length;
  const remoteCount = (rows ?? []).filter((o) => o.locationType !== "onsite").length;

  // Filter chip labels — Arabic from the shared label map, English inline.
  function filterLabel(key: "all" | OpportunityType): string {
    if (key === "all") return t({ ar: "الكلّ", en: "All" });
    return t({ ar: OPPORTUNITY_TYPE_LABELS[key], en: OPPORTUNITY_TYPE_LABELS_EN[key] });
  }

  const placeChips: { key: PlaceFilter; label: string }[] = [
    { key: "any", label: t({ ar: "أينما كان", en: "Anywhere" }) },
    { key: "remote", label: t({ ar: "عن بُعد", en: "Remote-friendly" }) },
    { key: "onsite", label: t({ ar: "حضوريّ", en: "On-site" }) },
  ];

  return (
    <PageShell
      active="opportunities"
      eyebrow={t({
        ar: "الموهبة لا حدود لها · Opportunities",
        en: "Talent isn't bound by geography · Opportunities",
      })}
      title={t({ ar: "لوحة", en: "An opportunities" })}
      highlight={t({ ar: "الفرص", en: "board" })}
      subtitle={t({
        ar: "عملٌ مدفوع حقيقيّ، تدريب، منح، ومهامّ قصيرة — مُختارة لمواهب غزّة من شركائنا ومن السوق العالميّ. من غزّة، تُسلَّم العَمل إلى العالم.",
        en: "Real paid work, internships, grants and short gigs — curated for Gaza's talent from our partners and the global market. From Gaza, delivered to the world.",
      })}
    >
      {/* ── Filter rail — type (server) + place (client) on one quiet bar.
           A live count sits opposite, told in cerulean as real DATA. ── */}
      <div className="mb-[clamp(2.5rem,5vw,4rem)] space-y-4">
        <div className="flex items-end justify-between gap-x-8 gap-y-3 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={filter === key ? "true" : "false"}
                className={`px-4 h-9 rounded-full text-[13px] font-semibold transition-colors border ${
                  filter === key
                    ? "cta-fill text-foreground border-transparent"
                    : "bg-surface-2 text-fg-secondary border-border-strong hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {filterLabel(key)}
              </button>
            ))}
          </div>
          {!!total && (
            <p className="inline-flex items-baseline gap-2 text-fg-secondary whitespace-nowrap">
              <span
                className="font-display font-black text-sand-bright tnum leading-none"
                style={{ fontSize: "clamp(1.4rem,2.6vw,2rem)", letterSpacing: "-0.04em" }}
              >
                {num(total, lang)}
              </span>
              <span className="t-caption text-fg-secondary">
                {t({ ar: "فرصة مفتوحة", en: "open now" })}
                {featuredCount > 0
                  ? ` · ${num(featuredCount, lang)} ${t({ ar: "مميّزة", en: "featured" })}`
                  : ""}
              </span>
            </p>
          )}
        </div>

        {/* Place dimension — only worth showing once any data exists */}
        {rows && rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="t-caption text-fg-secondary me-1">
              {t({ ar: "أينَ", en: "Where" })}
            </span>
            {placeChips.map((c) => {
              const on = place === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setPlace(c.key)}
                  aria-pressed={on ? "true" : "false"}
                  data-testid={`place-filter-${c.key}`}
                  className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-semibold transition-colors border ${
                    on
                      ? "bg-sand-soft text-sand-bright border-sand/40"
                      : "bg-surface-2 text-fg-secondary border-border-strong hover:border-sand/40 hover:text-foreground"
                  }`}
                >
                  {c.key === "remote" && <Globe2 className="w-3.5 h-3.5" />}
                  {c.label}
                  {c.key === "remote" && remoteCount > 0 && (
                    <span className="tnum opacity-70">· {num(remoteCount, lang)}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <GlassCard className="p-5 text-primary text-center font-medium">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        // Skeleton — hairline rows, not a card deck, so the load state matches
        // the editorial register the listings now wear.
        <ul className="border-t border-border-strong/60">
          {[0, 1, 2, 3, 4].map((i) => (
            <li
              key={i}
              className="border-b border-border-strong/60 py-[clamp(1.5rem,3vw,2.5rem)]"
            >
              <div className="flex items-center gap-5">
                <div className="h-7 w-2/3 max-w-md rounded bg-surface-3 animate-pulse" />
                <div className="hidden md:block h-5 w-24 rounded bg-surface-3 animate-pulse ms-auto" />
              </div>
            </li>
          ))}
        </ul>
      ) : rows && total === 0 ? (
        <OpportunitiesEmpty narrowed={rows.length > 0 || filter !== "all" || place !== "any"} />
      ) : (
        <OpportunityList rows={sorted} filterKey={`${filter}-${place}`} reduce={!!reduce} />
      )}
    </PageShell>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   OpportunityList — the board, told the Apple way: calm editorial HAIRLINE
   ROWS, never a card deck. Each role is one line: title / org · place · pay /
   type · deadline / apply, separated by hairlines that warm to crimson on
   hover. Featured roles wear a quiet crimson tick — no chip clutter. The list
   closes on one full-bleed photograph with a parallax line — the place the
   work comes home to.
   ────────────────────────────────────────────────────────────────────────── */
function OpportunityList({
  rows,
  filterKey,
  reduce,
}: {
  rows: Opportunity[];
  filterKey: string;
  reduce: boolean;
}) {
  return (
    <>
      <ul key={filterKey} className="border-t border-border-strong/60">
        {rows.map((o, i) => (
          <OpportunityRow key={o.id} o={o} i={i} reduce={reduce} />
        ))}
      </ul>

      {/* The work comes home to Gaza — one full-bleed photograph, a calm line
          overlaid with a slow parallax. Full grandeur, no card. */}
      <BoardCloser reduce={reduce} />
    </>
  );
}

function OpportunityRow({ o, i, reduce }: { o: Opportunity; i: number; reduce: boolean }) {
  const { lang, t } = useLanguage();
  const remote = o.locationType !== "onsite";
  const urgency = deadlineUrgency(o.deadline);
  const tag = splitTags(o.skills)[0];

  // Logical-end meta line — place · pay, kept quiet under the title.
  const placeLabel = t({
    ar: OPPORTUNITY_LOCATION_LABELS[o.locationType],
    en: OPPORTUNITY_LOCATION_LABELS_EN[o.locationType],
  });

  return (
    <li>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 22 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, delay: Math.min(i, 6) * 0.06, ease: EASE_OUT_EXPO }}
        className="will-change-transform"
      >
        <Link
          href={`/opportunities/${o.id}`}
          data-testid={`opportunity-card-${o.id}`}
          className="group grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-[clamp(1.25rem,3vw,3rem)] gap-y-2 py-[clamp(1.5rem,3vw,2.5rem)] border-b border-border-strong/60 transition-colors hover:border-border-strong"
        >
          {/* Title + organisation/place/pay — the heart of the row */}
          <div className="min-w-0 col-span-2 md:col-span-1">
            <h3
              className="font-display font-bold text-foreground group-hover:text-primary transition-colors flex items-baseline gap-2.5"
              style={{ fontSize: "clamp(1.3rem,2.6vw,2.05rem)", letterSpacing: "-0.025em", lineHeight: 1.12 }}
            >
              {o.featured && (
                <span
                  aria-hidden
                  title={t({ ar: "مميّزة", en: "Featured" })}
                  className="mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-primary"
                />
              )}
              <span className="line-clamp-2">{o.title}</span>
            </h3>

            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 t-caption text-fg-secondary">
              {o.organization && (
                <span className="text-sand font-semibold">{o.organization}</span>
              )}
              {o.organization && (
                <span aria-hidden className="text-fg-faint">·</span>
              )}
              <span className="inline-flex items-center gap-1">
                {remote && <Globe2 className="w-3.5 h-3.5" />}
                {placeLabel}
                {o.city ? ` · ${o.city}` : ""}
              </span>
              {o.compensation && (
                <>
                  <span aria-hidden className="text-fg-faint">·</span>
                  <span className="text-sand-bright font-semibold">{o.compensation}</span>
                </>
              )}
              {tag && (
                <>
                  <span aria-hidden className="hidden sm:inline text-fg-faint">·</span>
                  <span className="hidden sm:inline">{tag}</span>
                </>
              )}
            </p>
          </div>

          {/* Type — the honest category, quiet on the logical end */}
          <span className="hidden md:inline-block t-caption text-fg-secondary whitespace-nowrap group-hover:text-foreground transition-colors justify-self-end">
            {t({
              ar: OPPORTUNITY_TYPE_LABELS[o.type],
              en: OPPORTUNITY_TYPE_LABELS_EN[o.type],
            })}
          </span>

          {/* Deadline urgency + the apply affordance */}
          <span className="inline-flex items-center gap-3 whitespace-nowrap justify-self-end">
            {o.deadline && (
              <span
                className={`inline-flex items-center gap-1.5 t-caption font-semibold ${
                  urgency === "soon" ? "text-primary" : "text-fg-secondary"
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                {urgency === "soon"
                  ? t({ ar: "يُغلق قريبًا", en: "Closing soon" })
                  : formatDate(o.deadline, lang)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 t-caption font-semibold text-fg-secondary group-hover:text-primary transition-colors">
              <span className="hidden sm:inline">{t({ ar: "قدّم", en: "Apply" })}</span>
              <ArrowLeft className="w-4 h-4 text-fg-faint ltr:rotate-180 transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:text-primary rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
            </span>
          </span>
        </Link>
      </motion.div>
    </li>
  );
}

/* The board's full-bleed photographic closer — the place the work comes home
   to, a calm line overlaid with a slow scroll parallax. No card, no aura. */
function BoardCloser({ reduce }: { reduce: boolean }) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);

  return (
    <motion.div
      ref={ref}
      className="relative mt-[clamp(4rem,9vh,7rem)] w-full overflow-hidden rounded-[24px] ring-1 ring-white/10"
      initial={reduce ? false : { opacity: 0 }}
      whileInView={reduce ? undefined : { opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1, ease: EASE_OUT_EXPO }}
    >
      <div className="relative h-[clamp(18rem,46vh,30rem)]">
        <motion.img
          src="/photos/IMG_8347.webp"
          alt={t({ ar: "منتسبون يعملون داخل آيلاند هيفن بغزّة", en: "Members working inside Island Haven in Gaza" })}
          loading="lazy"
          style={{ y }}
          className="absolute inset-0 h-[116%] -top-[8%] w-full object-cover object-center saturate-[1.04] will-change-transform"
        />
        {/* Direction-aware scrim: always darkens the inline-START edge so the
            inline-start headline below sits over the dark side in both LTR & RTL. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_right,hsl(225_44%_5%/0.92)_0%,hsl(225_44%_5%/0.5)_45%,transparent_80%)] rtl:bg-[linear-gradient(to_left,hsl(225_44%_5%/0.92)_0%,hsl(225_44%_5%/0.5)_45%,transparent_80%)]"
        />
        <div className="absolute inset-0 flex items-end">
          <div className="w-full p-[clamp(1.75rem,5vw,3.5rem)]">
            <motion.p
              className="max-w-[22ch] text-start text-white"
              style={{ fontSize: "clamp(1.4rem, 3.2vw, 2.4rem)", lineHeight: 1.18, letterSpacing: "-0.02em", fontWeight: 600 }}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            >
              {t({ ar: "من غزّة، يُسلَّم العمل إلى العالم.", en: "From Gaza, the work is delivered to the world." })}
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Educational empty state — opportunities are curated in waves, not always-on,
 * so an empty board is the norm between drops. Instead of a dead end, we hold
 * the monumental register and teach the reader HOW the board works and the two
 * reliable ways to never miss the next one: join the community (get notified)
 * or build a profile worth matching. No eyebrow kicker, no aura, no card deck —
 * a calm headline and three editorial hairline lines.
 */
function OpportunitiesEmpty({ narrowed }: { narrowed: boolean }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  // Four lines with asymmetric weighting — the lead reads fuller, the rest stay
  // quiet — to break the templated tri-fold cadence without leaving the hairline.
  const steps = [
    {
      lead: true,
      title: t({ ar: "نختار بعناية", en: "We curate carefully" }),
      body: t({
        ar: "كلّ فرصة هنا مراجَعة يدويًّا من شركائنا والسوق — لا حشو، فقط عملٌ حقيقيّ يليق بموهبتك.",
        en: "Every listing is hand-vetted from our partners and the market — no filler, only real work worth your talent.",
      }),
    },
    {
      lead: false,
      title: t({ ar: "تُنشر على دفعات", en: "They land in waves" }),
      body: t({
        ar: "نضيف فرصًا جديدة باستمرار، لكن لوحةً فارغةً بين الدّفعات أمرٌ طبيعيّ — تابعنا لتصل أوّلًا.",
        en: "New roles arrive regularly; an empty board between waves is normal — follow along to be first in line.",
      }),
    },
    {
      lead: false,
      title: t({ ar: "نطابقك مع المناسب", en: "We match you to the right one" }),
      body: t({
        ar: "منتسبٌ بملفّ كامل ومهارات واضحة يُطابَق بفرصٍ مخصّصة قبل أن تظهر للعامّة.",
        en: "Members with a complete profile get matched to tailored roles before they go public.",
      }),
    },
    {
      lead: false,
      title: t({ ar: "تبقى الأولويّة لك", en: "You keep the head start" }),
      body: t({
        ar: "بمجرّد أن تكون من منتسبينا، تصلك الدّفعة التّالية قبل غيرك — لا حاجة لمتابعة اللوحة كلّ يوم.",
        en: "Once you're in, the next wave reaches you before anyone else — no need to refresh the board every day.",
      }),
    },
  ];

  const head = narrowed
    ? [
        t({ ar: "لا فرص ضمن", en: "No matches in" }),
        t({ ar: "هذا الفلتر", en: "this filter" }),
        <span key="accent" className="text-primary">{t({ ar: "— بعد.", en: "— yet." })}</span>,
      ]
    : [
        t({ ar: "اللوحة هادئة", en: "The board is quiet" }),
        <span key="accent" className="text-primary">{t({ ar: "الآن — لا للأبد.", en: "now — not forever." })}</span>,
      ];

  return (
    <section className="relative">
      <header className="max-w-4xl">
        <motion.h2
          className="font-display text-foreground"
          style={{ fontSize: "clamp(2.4rem, 7vw, 5rem)", lineHeight: "var(--lh-display)", letterSpacing: "-0.04em", fontWeight: 700 }}
        >
          {head.map((ln, i) => (
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
          transition={{ duration: 0.85, delay: 0.42, ease: EASE_OUT_EXPO }}
          className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
          style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
        >
          {narrowed
            ? t({
                ar: "جرّب توسيع الفلتر — أو اطمئنّ، فنحن نضيف فرصًا جديدة على دفعات. إليك كيف تضمن ألّا تفوتك القادمة:",
                en: "Try widening the filter — or sit tight: we add new roles in waves. Here's how to make sure you never miss the next one:",
              })
            : t({
                ar: "نُدير الفرص كحاضنة، لا كموقع توظيف عامّ. إليك كيف تعمل اللوحة، وكيف تضمن ألّا تفوتك الدّفعة القادمة:",
                en: "We run opportunities like an incubator, not a generic job board. Here's how it works — and how to never miss the next wave:",
              })}
        </motion.p>
      </header>

      {/* How the board works — calm editorial hairline lines, not a numbered card deck */}
      <ul className="mt-[clamp(3rem,6vw,5rem)] border-t border-border-strong/60">
        {steps.map((s, i) => (
          <li key={i}>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: EASE_OUT_EXPO }}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,18rem)_1fr] items-baseline gap-x-[clamp(1.5rem,3vw,3rem)] gap-y-2 py-[clamp(1.5rem,3vw,2.25rem)] border-b border-border-strong/60"
            >
              <h3
                className="font-display font-bold text-foreground"
                style={{
                  fontSize: s.lead ? "clamp(1.45rem,3vw,2.15rem)" : "clamp(1.2rem,2.2vw,1.6rem)",
                  letterSpacing: "-0.028em",
                  lineHeight: 1.12,
                }}
              >
                {s.title}
              </h3>
              <p className="t-body text-[15px] md:text-[16px] max-w-xl">{s.body}</p>
            </motion.div>
          </li>
        ))}
      </ul>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT_EXPO }}
        className="mt-[clamp(2.5rem,5vw,4rem)] flex flex-wrap items-center gap-x-7 gap-y-4"
      >
        <Link
          href="/apply?ref=opportunities-empty"
          data-testid="opportunities-empty-apply"
          className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
        >
          {t({ ar: "انتسب وكن أوّل من يُطابَق", en: "Join & get matched first" })}
          <ArrowLeft className="w-4 h-4 ltr:rotate-180 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
        </Link>
        <Link
          href="/become-mentor?ref=opportunities-empty"
          className="group inline-flex items-center gap-2 text-[14px] font-semibold text-foreground/85 hover:text-foreground transition-colors"
        >
          {t({ ar: "لديك فرصة لتشاركها؟", en: "Have a role to share?" })}
          <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </section>
  );
}
