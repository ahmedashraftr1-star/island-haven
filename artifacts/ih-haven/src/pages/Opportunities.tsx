import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, MapPin, Briefcase, Star, Clock } from "lucide-react";
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

export default function Opportunities() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<Opportunity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | OpportunityType>("all");
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

  const sorted = [...(rows ?? [])].sort((a, b) => Number(b.featured) - Number(a.featured));
  const total = rows?.length ?? 0;
  const featuredCount = (rows ?? []).filter((o) => o.featured).length;

  // Filter chip labels — Arabic from the shared label map, English inline.
  function filterLabel(key: "all" | OpportunityType): string {
    if (key === "all") return t({ ar: "الكلّ", en: "All" });
    return t({ ar: OPPORTUNITY_TYPE_LABELS[key], en: OPPORTUNITY_TYPE_LABELS_EN[key] });
  }

  return (
    <PageShell
      active="opportunities"
      eyebrow={t({
        ar: "جسرك لسوق العمل · Opportunities",
        en: "Your bridge to the job market · Opportunities",
      })}
      title={t({ ar: "الفرص", en: "Opportunities" })}
      highlight={t({ ar: "والوظائف", en: "& Jobs" })}
      subtitle={t({
        ar: "وظائف، تدريب، وأعمال حرّة من شركائنا والمشاريع الناشئة — مختارة لتقرّبك خطوة من سوق العمل، محليًّا وعالميًّا.",
        en: "Jobs, internships, and freelance work from our partners and startups — curated to bring you one step closer to the job market, locally and globally.",
      })}
    >
      <div className="flex items-center justify-between gap-3 mb-7 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key ? "true" : "false"}
              className={`px-4 h-9 rounded-full text-[13px] font-semibold transition-colors border ${
                filter === key
                  ? "bg-primary text-white border-primary"
                  : "bg-white/[0.04] text-white/65 border-white/10 hover:border-white/25"
              }`}
            >
              {filterLabel(key)}
            </button>
          ))}
        </div>
        {!!total && (
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-white/70 bg-white/[0.04] border border-white/10">
            {num(total, lang)} {t({ ar: "فرصة", en: "opportunities" })}
            {featuredCount > 0
              ? ` · ${num(featuredCount, lang)} ${t({ ar: "مميّزة", en: "featured" })}`
              : ""}
          </span>
        )}
      </div>

      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-52 bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title={t({
            ar: "لا فرص ضمن هذا التصنيف حاليًّا",
            en: "No opportunities in this category right now",
          })}
          hint={t({
            ar: "نضيف فرصًا جديدة باستمرار — تابعنا أو جرّب تصنيفًا آخر.",
            en: "We add new opportunities all the time — stay tuned or try another category.",
          })}
        />
      ) : (
        <motion.div
          key={filter}
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
            o.featured ? "border-amber-400/25 hover:border-amber-300/45" : "hover:border-primary/40"
          }`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: "radial-gradient(130% 80% at 80% 0%, hsl(354 80% 55% / 0.09), transparent 60%)" }}
          />
          <div className="relative flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-primary/15 text-primary border border-primary/30">
                  <Briefcase className="w-3 h-3" />
                  {t({
                    ar: OPPORTUNITY_TYPE_LABELS[o.type],
                    en: OPPORTUNITY_TYPE_LABELS_EN[o.type],
                  })}
                </span>
                {o.featured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-200 border border-amber-400/30">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />{" "}
                    {t({ ar: "مميّزة", en: "Featured" })}
                  </span>
                )}
              </div>
              <h3 className="text-white font-bold text-[16.5px] leading-snug mt-2 line-clamp-2">
                {o.title}
              </h3>
              {o.organization && (
                <p className="text-primary/85 text-[12.5px] font-medium mt-0.5">
                  {o.organization}
                </p>
              )}
            </div>
          </div>

          {o.description && (
            <p className="relative text-white/45 text-[12.5px] leading-[1.7] line-clamp-2 mb-3">
              {o.description}
            </p>
          )}

          {tags.length > 0 && (
            <div className="relative flex flex-wrap gap-1.5 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[11px] bg-white/[0.05] text-white/60 border border-white/[0.08]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="relative mt-auto flex items-center justify-between text-[12px] text-white/55 pt-3 border-t border-white/[0.06]">
            <span className="inline-flex items-center gap-3 min-w-0">
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-primary/80 shrink-0" />
                {t({
                  ar: OPPORTUNITY_LOCATION_LABELS[o.locationType],
                  en: OPPORTUNITY_LOCATION_LABELS_EN[o.locationType],
                })}
                {o.city ? ` · ${o.city}` : ""}
              </span>
              {o.deadline && (
                <span className="inline-flex items-center gap-1 text-amber-200/80 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(o.deadline, lang)}
                </span>
              )}
            </span>
            <span className="inline-flex items-center gap-1 text-white/65 group-hover:text-primary transition-colors font-semibold shrink-0">
              {t({ ar: "التفاصيل", en: "Details" })}
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            </span>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
