import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Globe2,
  Star,
  CalendarClock,
  Banknote,
  Wifi,
} from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
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

// A deadline reads very differently if it's days away vs. months — surface that
// urgency in the card without ever inventing a date.
function deadlineUrgency(iso: string | null): "soon" | "open" | null {
  if (!iso) return null;
  const days = (new Date(iso).getTime() - Date.now()) / 86_400_000;
  if (Number.isNaN(days)) return null;
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
      {/* ── Filter rail — type (server) + place (client) on one quiet bar ── */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
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
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-fg-secondary bg-surface-2 border border-border-strong">
              <span className="tnum font-bold text-sand">{num(total, lang)}</span>
              {t({ ar: "فرصة", en: "open" })}
              {featuredCount > 0
                ? ` · ${num(featuredCount, lang)} ${t({ ar: "مميّزة", en: "featured" })}`
                : ""}
            </span>
          )}
        </div>

        {/* Place dimension — only worth showing once any data exists */}
        {rows && rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] tracking-[0.16em] uppercase text-muted-foreground font-semibold rtl:tracking-normal me-1">
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
                  {c.key === "remote" && <Wifi className="w-3.5 h-3.5" />}
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
        <div className="grid sm:grid-cols-2 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-52 bg-surface-2 border border-border-strong shadow-soft animate-pulse"
            />
          ))}
        </div>
      ) : rows && total === 0 ? (
        <OpportunitiesEmpty narrowed={rows.length > 0 || filter !== "all" || place !== "any"} />
      ) : (
        <motion.div
          key={`${filter}-${place}`}
          variants={reduce ? undefined : stagger}
          initial={reduce ? undefined : "hidden"}
          animate={reduce ? undefined : "show"}
          className="grid sm:grid-cols-2 gap-5"
        >
          {sorted.map((o) => (
            <OpportunityCard key={o.id} o={o} reduce={!!reduce} />
          ))}
        </motion.div>
      )}
    </PageShell>
  );
}

function OpportunityCard({ o, reduce }: { o: Opportunity; reduce: boolean }) {
  const { lang, t } = useLanguage();
  const tags = splitTags(o.skills).slice(0, 4);
  const remote = o.locationType !== "onsite";
  const urgency = deadlineUrgency(o.deadline);
  const PlaceIcon = remote ? Globe2 : MapPin;
  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -5 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="h-full"
    >
      <Link
        href={`/opportunities/${o.id}`}
        className="group block h-full"
        data-testid={`opportunity-card-${o.id}`}
      >
        <GlassCard
          className={`group h-full flex flex-col p-5 transition-colors ${
            o.featured ? "border-primary/30 hover:border-primary/50" : "hover:border-primary/40"
          }`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: "radial-gradient(130% 80% at 80% 0%, hsl(354 80% 55% / 0.09), transparent 60%)" }}
          />

          {/* Top row — type (data → cerulean) + featured + remote signal */}
          <div className="relative flex items-center gap-1.5 flex-wrap mb-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold chip-sand">
              {t({
                ar: OPPORTUNITY_TYPE_LABELS[o.type],
                en: OPPORTUNITY_TYPE_LABELS_EN[o.type],
              })}
            </span>
            {remote && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-surface-3 text-fg-secondary border border-border">
                <Globe2 className="w-3 h-3" />
                {t({ ar: "عن بُعد", en: "Remote" })}
              </span>
            )}
            {o.featured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/12 text-primary border border-primary/30 ms-auto">
                <Star className="w-3 h-3 fill-primary text-primary" />
                {t({ ar: "مميّزة", en: "Featured" })}
              </span>
            )}
          </div>

          <h3 className="relative text-foreground font-display font-bold text-[16.5px] leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {o.title}
          </h3>
          {o.organization && (
            <p className="relative text-sand text-[12.5px] font-semibold mt-1">
              {o.organization}
            </p>
          )}

          {o.description && (
            <p className="relative text-fg-secondary text-[12.5px] leading-[1.7] line-clamp-2 mt-2.5 mb-3">
              {o.description}
            </p>
          )}

          {tags.length > 0 && (
            <div className="relative flex flex-wrap gap-1.5 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[11px] bg-surface-3 text-fg-secondary border border-border"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Compensation — the crisp signal that this is real, paid work */}
          {o.compensation && (
            <div className="relative inline-flex items-center gap-1.5 text-[12px] font-semibold text-sand-bright mb-3">
              <Banknote className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{o.compensation}</span>
            </div>
          )}

          {/* Footer meta + apply affordance */}
          <div className="relative mt-auto flex items-center justify-between gap-3 text-[12px] text-muted-foreground pt-3 border-t border-border">
            <span className="inline-flex items-center gap-3 min-w-0">
              <span className="inline-flex items-center gap-1 truncate">
                <PlaceIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                {t({
                  ar: OPPORTUNITY_LOCATION_LABELS[o.locationType],
                  en: OPPORTUNITY_LOCATION_LABELS_EN[o.locationType],
                })}
                {o.city ? ` · ${o.city}` : ""}
              </span>
              {o.deadline && (
                <span
                  className={`inline-flex items-center gap-1 font-semibold shrink-0 ${
                    urgency === "soon" ? "text-primary" : "text-sand"
                  }`}
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  {urgency === "soon"
                    ? t({ ar: "يُغلق قريبًا", en: "Closing soon" })
                    : formatDate(o.deadline, lang)}
                </span>
              )}
            </span>
            <span className="inline-flex items-center gap-1 text-fg-secondary group-hover:text-primary transition-colors font-semibold shrink-0">
              {t({ ar: "قدّم الآن", en: "Apply" })}
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </span>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

/**
 * Educational empty state — opportunities are curated in waves, not always-on,
 * so an empty board is the norm between drops. Instead of a dead end, teach the
 * reader HOW the board works and the two reliable ways to never miss the next
 * one: join the community (get notified) or build a profile worth matching.
 */
function OpportunitiesEmpty({ narrowed }: { narrowed: boolean }) {
  const { t } = useLanguage();

  const steps = [
    {
      n: 1,
      title: t({ ar: "نختار بعناية", en: "We curate carefully" }),
      body: t({
        ar: "كلّ فرصة هنا مراجَعة يدويًّا من شركائنا والسوق — لا حشو، فقط عملٌ حقيقيّ يليق بموهبتك.",
        en: "Every listing is hand-vetted from our partners and the market — no filler, only real work worth your talent.",
      }),
    },
    {
      n: 2,
      title: t({ ar: "تُنشر على دفعات", en: "They land in waves" }),
      body: t({
        ar: "نضيف فرصًا جديدة باستمرار، لكن لوحةً فارغةً بين الدّفعات أمرٌ طبيعيّ — تابعنا لتصل أوّلًا.",
        en: "New roles arrive regularly; an empty board between waves is normal — follow along to be first in line.",
      }),
    },
    {
      n: 3,
      title: t({ ar: "نطابقك مع المناسب", en: "We match you to the right one" }),
      body: t({
        ar: "منتسبٌ بملفّ كامل ومهارات واضحة يُطابَق بفرصٍ مخصّصة قبل أن تظهر للعامّة.",
        en: "Members with a complete profile get matched to tailored roles before they go public.",
      }),
    },
  ];

  return (
    <GlassCard className="relative overflow-hidden p-7 sm:p-10">
      <div className="ambient-grid absolute inset-0 -z-10" aria-hidden />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 brand-aura opacity-60" />

      <div className="relative max-w-2xl">
        <div className="flex items-center gap-3 mb-5">
          <span aria-hidden className="h-px w-9 bg-primary/50" />
          <span className="eyebrow">{t({ ar: "كيف تعمل اللوحة", en: "How the board works" })}</span>
        </div>
        <h2
          className="font-display font-extrabold text-foreground"
          style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.4rem)", lineHeight: 1.08, letterSpacing: "-0.025em" }}
        >
          {narrowed
            ? t({ ar: "لا فرص ضمن هذا ", en: "No matches in this " })
            : t({ ar: "اللوحة هادئة ", en: "The board is quiet " })}
          <span className="text-primary">
            {narrowed
              ? t({ ar: "الفلتر — بعد.", en: "filter — yet." })
              : t({ ar: "الآن — لا للأبد.", en: "now — not forever." })}
          </span>
        </h2>
        <p className="t-body mt-4">
          {narrowed
            ? t({
                ar: "جرّب توسيع الفلتر — أو اطمئنّ، فنحن نضيف فرصًا جديدة على دفعات. إليك كيف تضمن ألّا تفوتك القادمة:",
                en: "Try widening the filter — or sit tight: we add new roles in waves. Here's how to make sure you never miss the next one:",
              })
            : t({
                ar: "نُدير الفرص كحاضنة، لا كموقع توظيف عامّ. إليك كيف تعمل اللوحة، وكيف تضمن ألّا تفوتك الدّفعة القادمة:",
                en: "We run opportunities like an incubator, not a generic job board. Here's how it works — and how to never miss the next wave:",
              })}
        </p>

        <ol className="mt-7 space-y-0">
          {steps.map((s) => (
            <li
              key={s.n}
              className="grid grid-cols-[auto_1fr] gap-x-5 items-baseline border-t border-border-strong py-5 first:border-t-0 first:pt-0"
            >
              <span className="font-display text-[clamp(1.2rem,2vw,1.6rem)] font-bold tabular-nums text-sand leading-none">
                {String(s.n).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display font-bold text-foreground text-[15.5px] leading-snug">
                  {s.title}
                </h3>
                <p className="t-body mt-1.5 text-[13.5px]">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/apply?ref=opportunities-empty"
            data-testid="opportunities-empty-apply"
            className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
          >
            {t({ ar: "انتسب وكن أوّل من يُطابَق", en: "Join & get matched first" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
          <Link
            href="/become-mentor?ref=opportunities-empty"
            className="group inline-flex items-center gap-2 h-12 px-5 rounded-full border border-border-strong bg-surface-2 text-fg-secondary text-[13px] font-semibold hover:border-primary/40 hover:text-foreground transition-colors"
          >
            {t({ ar: "لديك فرصة لتشاركها؟", en: "Have a role to share?" })}
            <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
