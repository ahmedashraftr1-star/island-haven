import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, MapPin, Briefcase, Star, Clock } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import {
  OPPORTUNITY_TYPE_LABELS,
  OPPORTUNITY_LOCATION_LABELS,
  type OpportunityType,
  type OpportunityLocation,
  formatArabicDate,
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

const FILTERS: { key: "all" | OpportunityType; label: string }[] = [
  { key: "all", label: "الكلّ" },
  { key: "job", label: OPPORTUNITY_TYPE_LABELS.job },
  { key: "internship", label: OPPORTUNITY_TYPE_LABELS.internship },
  { key: "freelance", label: OPPORTUNITY_TYPE_LABELS.freelance },
  { key: "gig", label: OPPORTUNITY_TYPE_LABELS.gig },
  { key: "volunteer", label: OPPORTUNITY_TYPE_LABELS.volunteer },
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

export default function Opportunities() {
  const [rows, setRows] = useState<Opportunity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | OpportunityType>("all");
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title = "الفرص والوظائف — Island Haven";
  }, []);

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
          setError(e instanceof ApiError ? e.message : "تعذّر التحميل"),
      );
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const sorted = [...(rows ?? [])].sort((a, b) => Number(b.featured) - Number(a.featured));
  const total = rows?.length ?? 0;
  const featuredCount = (rows ?? []).filter((o) => o.featured).length;

  return (
    <PageShell
      active="opportunities"
      eyebrow="جسرك لسوق العمل · Opportunities"
      title="الفرص"
      highlight="والوظائف"
      subtitle="وظائف، تدريب، وأعمال حرّة من شركائنا والمشاريع الناشئة — مختارة لتقرّبك خطوة من سوق العمل، محليًّا وعالميًّا."
    >
      <div className="flex items-center justify-between gap-3 mb-7 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-4 h-9 rounded-full text-[13px] font-semibold transition-colors border ${
                filter === f.key
                  ? "bg-primary text-white border-primary"
                  : "bg-white/[0.04] text-white/65 border-white/10 hover:border-white/25"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {!!total && (
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-white/70 bg-white/[0.04] border border-white/10">
            {toArabicNum(total)} فرصة{featuredCount > 0 ? ` · ${toArabicNum(featuredCount)} مميّزة` : ""}
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
          title="لا فرص ضمن هذا التصنيف حاليًّا"
          hint="نضيف فرصًا جديدة باستمرار — تابعنا أو جرّب تصنيفًا آخر."
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
                  {OPPORTUNITY_TYPE_LABELS[o.type]}
                </span>
                {o.featured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-200 border border-amber-400/30">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> مميّزة
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
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md text-[11px] bg-white/[0.05] text-white/60 border border-white/[0.08]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="relative mt-auto flex items-center justify-between text-[12px] text-white/55 pt-3 border-t border-white/[0.06]">
            <span className="inline-flex items-center gap-3 min-w-0">
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-primary/80 shrink-0" />
                {OPPORTUNITY_LOCATION_LABELS[o.locationType]}
                {o.city ? ` · ${o.city}` : ""}
              </span>
              {o.deadline && (
                <span className="inline-flex items-center gap-1 text-amber-200/80 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {formatArabicDate(o.deadline)}
                </span>
              )}
            </span>
            <span className="inline-flex items-center gap-1 text-white/65 group-hover:text-primary transition-colors font-semibold shrink-0">
              التفاصيل
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            </span>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
