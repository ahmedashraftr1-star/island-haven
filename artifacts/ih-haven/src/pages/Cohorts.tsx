import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { CalendarDays, Sparkles, ArrowLeft, Layers } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import {
  COHORT_STATUS_LABELS,
  formatArabicDate,
  type CohortStatus,
} from "@/lib/labels";

const COHORT_STATUS_LABELS_EN: Record<CohortStatus, string> = {
  announced: "Announced",
  open: "Applications open",
  in_progress: "In progress",
  demo_day: "Demo Day",
  completed: "Completed",
};

interface CohortRow {
  id: number;
  programId: number;
  programTitle: string;
  name: string;
  slug: string;
  summary: string;
  coverUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  demoDayAt: string | null;
  status: CohortStatus;
  ventureCount: number;
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}
function isLive(s: CohortStatus): boolean {
  return s === "in_progress" || s === "demo_day" || s === "open";
}

function Dot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-sand/60 animate-ping" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-sand" />
    </span>
  );
}

export default function Cohorts() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<CohortRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title =
      lang === "ar"
        ? "دفعات الحاضنة — Island Haven"
        : "Cohorts — Island Haven";
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    api<{ cohorts: CohortRow[] }>("/cohorts")
      .then((r) => !cancelled && setRows(r.cohorts))
      .catch(
        (e) =>
          !cancelled &&
          setError(
            e instanceof ApiError
              ? e.message
              : lang === "ar"
                ? "تعذّر التحميل"
                : "Couldn't load",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const sorted = [...(rows ?? [])].sort((a, b) => Number(isLive(b.status)) - Number(isLive(a.status)));
  const total = rows?.length ?? 0;
  const liveCount = (rows ?? []).filter((c) => isLive(c.status)).length;

  return (
    <PageShell
      eyebrow={t({ ar: "دَفعات الاحتضان · Cohorts", en: "Incubator Cohorts" })}
      title={t({ ar: "دَفعات", en: "Island Haven" })}
      highlight={t({ ar: "آيلاند", en: "Cohorts" })}
      subtitle={t({
        ar: "كلّ دفعة تَجمع مجموعة من المشاريع الناشئة لرحلة محدّدة بزمن، تَنتهي بيوم العرض (Demo Day). تَصَفّح الدّفعات الجارية والسّابقة وشاهد ما صنعَتْه.",
        en: "Each cohort gathers a group of startups for a time-boxed journey that ends with a Demo Day. Browse the live and past cohorts and see what they built.",
      })}
    >
      {error && (
        <GlassCard className="p-5 text-primary text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <SkeletonCohorts />
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title={t({ ar: "لم تَنطلق أوّل دفعة بعد", en: "No cohort has launched yet" })}
          hint={t({
            ar: "نُجهّز أوّل cohort للحاضنة — تابعنا للإعلان.",
            en: "We're preparing the incubator's first cohort — stay tuned for the announcement.",
          })}
        />
      ) : (
        <>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap items-center gap-2.5 mb-12 sm:mb-14"
          >
            <Chip>
              {num(total, lang)} {t({ ar: "دفعات", en: "cohorts" })}
            </Chip>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold chip-sand">
                <Dot />
                {num(liveCount, lang)} {t({ ar: "جارية الآن", en: "live now" })}
              </span>
            )}
          </motion.div>

          <motion.div
            variants={reduce ? undefined : stagger}
            initial={reduce ? undefined : "hidden"}
            whileInView={reduce ? undefined : "show"}
            viewport={{ once: true, margin: "-8% 0px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {sorted.map((c) => (
              <CohortCard key={c.id} c={c} reduce={!!reduce} />
            ))}
          </motion.div>
        </>
      )}
    </PageShell>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-fg-secondary bg-surface-2 border border-border-strong shadow-soft">
      {children}
    </span>
  );
}

function CohortCard({ c, reduce }: { c: CohortRow; reduce: boolean }) {
  const { lang, t } = useLanguage();
  const live = isLive(c.status);
  const done = c.status === "completed";
  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="h-full"
    >
      <Link
        href={`/cohorts/${c.slug}`}
        className="group block h-full"
        data-testid={`cohort-card-${c.id}`}
      >
        <GlassCard
          className={`group h-full flex flex-col overflow-hidden transition-colors ${
            live ? "border-sand/40 hover:border-sand/60" : "hover:border-primary/40"
          }`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: "radial-gradient(130% 80% at 80% 0%, hsl(354 80% 55% / 0.1), transparent 60%)" }}
          />
          {c.coverUrl ? (
            <div className="aspect-[16/9] overflow-hidden bg-surface-3">
              <img
                src={c.coverUrl}
                alt={c.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                loading="lazy"
              />
            </div>
          ) : (
            <div
              className="aspect-[16/9] flex items-center justify-center"
              style={{ background: "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--primary-pressed)) 100%)" }}
            >
              <Layers className="w-12 h-12 text-white/90" />
            </div>
          )}
          <div className="relative p-6 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-semibold ${
                  live
                    ? "chip-sand"
                    : done
                      ? "bg-surface-3 text-muted-foreground border border-border"
                      : "bg-primary/12 text-primary border border-primary/30"
                }`}
              >
                {live && <Dot />}
                {t({
                  ar: COHORT_STATUS_LABELS[c.status],
                  en: COHORT_STATUS_LABELS_EN[c.status],
                })}
              </span>
              <span className="text-[10.5px] tracking-[0.14em] uppercase text-muted-foreground font-semibold">
                · {c.programTitle}
              </span>
            </div>
            <h3 className="text-foreground font-display font-bold text-[19px] leading-snug mb-2">
              {c.name}
            </h3>
            {c.summary && (
              <p className="text-fg-secondary text-[13.5px] leading-[1.85] line-clamp-3 mb-4">
                {c.summary}
              </p>
            )}
            <div className="mt-auto space-y-1.5 text-[12.5px] text-muted-foreground pt-3 border-t border-border">
              {c.startsAt && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-primary/80" />
                  {lang === "ar"
                    ? formatArabicDate(c.startsAt)
                    : new Date(c.startsAt).toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                  {c.endsAt && (
                    <>
                      {" "}
                      —{" "}
                      {lang === "ar"
                        ? formatArabicDate(c.endsAt)
                        : new Date(c.endsAt).toLocaleDateString("en-GB", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary/80" />
                {num(c.ventureCount, lang)}{" "}
                {t({
                  ar: c.ventureCount === 1 ? "مشروع" : "مشاريع",
                  en: c.ventureCount === 1 ? "venture" : "ventures",
                })}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[12.5px] text-primary transition-colors font-semibold">
              <span>{t({ ar: "تفاصيل الدّفعة", en: "Cohort details" })}</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

function SkeletonCohorts() {
  return (
    <div className="space-y-8">
      <div className="flex gap-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="h-8 w-32 rounded-full bg-surface-3 border border-border-strong animate-pulse" />
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[24px] h-72 bg-surface-3 border border-border-strong shadow-soft animate-pulse" />
        ))}
      </div>
    </div>
  );
}
