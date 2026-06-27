import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, Clock, Users, CalendarDays } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import {
  formatDate,
  splitTags,
  PROGRAM_STATUS_LABELS,
  type ProgramStatus,
} from "@/lib/labels";

export interface ProgramRow {
  id: number;
  title: string;
  summary: string;
  coverUrl: string | null;
  durationWeeks: number;
  seats: number;
  tags: string;
  startsAt: string | null;
  applyDeadline: string | null;
  status: ProgramStatus;
  applicants: number;
}

const PROGRAM_STATUS_LABELS_EN: Record<ProgramStatus, string> = {
  draft: "Draft",
  open: "Applications open",
  in_progress: "In progress",
  done: "Completed",
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
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

export default function Programs() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<ProgramRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title =
      lang === "ar"
        ? "برامج الاحتضان — Island Haven"
        : "Incubation Programs — Island Haven";
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    api<{ programs: ProgramRow[] }>("/programs")
      .then((r) => !cancelled && setRows(r.programs))
      .catch(
        (e) =>
          !cancelled &&
          setError(
            e instanceof ApiError
              ? e.message
              : lang === "ar"
                ? "تعذّر التحميل"
                : "Couldn't load programs",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // Open-for-application programs first — they're the actionable ones.
  const sorted = [...(rows ?? [])].sort(
    (a, b) => Number(b.status === "open") - Number(a.status === "open"),
  );
  const total = rows?.length ?? 0;
  const openCount = (rows ?? []).filter((p) => p.status === "open").length;

  return (
    <PageShell
      active="programs"
      eyebrow={t({ ar: "احتضان · تسريع · نموّ", en: "Incubate · Accelerate · Grow" })}
      title={t({ ar: "برامج", en: "Incubation" })}
      highlight={t({ ar: "الاحتضان", en: "Programs" })}
      subtitle={t({
        ar: "مسارات احتضان وتسريع منظَّمة تأخذ مشروعك من الفكرة إلى الإطلاق — إرشاد، موارد، وشبكة علاقات في قلب غزّة.",
        en: "Structured incubation and acceleration tracks that take your venture from idea to launch — mentorship, resources, and a network at the heart of Gaza.",
      })}
    >
      {error && (
        <GlassCard className="p-5 text-primary text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <SkeletonPrograms />
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title={t({ ar: "لا توجد برامج منشورة بعد", en: "No programs published yet" })}
          hint={t({
            ar: "ترقّب الإعلان عن أوّل دفعة احتضان قريبًا.",
            en: "Stay tuned — our first incubation cohort will be announced soon.",
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
              {num(total, lang)} {t({ ar: "برامج", en: "programs" })}
            </Chip>
            {openCount > 0 && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold chip-sand">
                <Dot />
                {num(openCount, lang)} {t({ ar: "مفتوحة للتقديم", en: "open for applications" })}
              </span>
            )}
          </motion.div>

          <motion.div
            variants={reduce ? undefined : stagger}
            initial={reduce ? undefined : "hidden"}
            whileInView={reduce ? undefined : "show"}
            viewport={{ once: true, margin: "-8% 0px" }}
            className="grid sm:grid-cols-2 gap-5"
          >
            {sorted.map((p) => (
              <ProgramCard key={p.id} p={p} reduce={!!reduce} />
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

function Dot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-sand/60 animate-ping" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-sand" />
    </span>
  );
}

function ProgramCard({ p, reduce }: { p: ProgramRow; reduce: boolean }) {
  const { lang, t } = useLanguage();
  const open = p.status === "open";
  const statusLabel =
    lang === "ar" ? PROGRAM_STATUS_LABELS[p.status] : PROGRAM_STATUS_LABELS_EN[p.status];
  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="h-full"
    >
      <Link
        href={`/programs/${p.id}`}
        className="group block h-full"
        data-testid={`program-card-${p.id}`}
      >
        <GlassCard
          className={`group h-full flex flex-col overflow-hidden transition-colors ${
            open ? "border-sand/40 hover:border-sand/60" : "hover:border-primary/40"
          }`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                "radial-gradient(130% 80% at 80% 0%, hsl(354 80% 55% / 0.1), transparent 60%)",
            }}
          />
          {p.coverUrl ? (
            <div className="aspect-[16/9] overflow-hidden bg-surface-3">
              <img
                src={p.coverUrl}
                alt={p.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                loading="lazy"
              />
            </div>
          ) : (
            <div
              className="aspect-[16/9]"
              style={{ background: "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--primary-pressed)) 100%)" }}
            />
          )}
          <div className="relative p-6 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-semibold ${
                  open
                    ? "chip-sand"
                    : "bg-surface-3 text-muted-foreground border border-border"
                }`}
              >
                {open && <Dot />}
                {statusLabel}
              </span>
            </div>
            <h3 className="text-foreground font-display font-bold text-[18px] leading-snug mb-2 line-clamp-2">
              {p.title}
            </h3>
            {p.summary && (
              <p className="text-fg-secondary text-[13px] leading-[1.7] line-clamp-3 mb-4">
                {p.summary}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {splitTags(p.tags)
                .slice(0, 3)
                .map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-3 text-fg-secondary border border-border"
                  >
                    {t}
                  </span>
                ))}
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2 text-[12px] text-muted-foreground pt-3 border-t border-border">
              {p.durationWeeks > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary/80" />
                  {num(p.durationWeeks, lang)} {t({ ar: "أسبوع", en: "weeks" })}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary/80" />
                {num(p.applicants, lang)} {t({ ar: "متقدّم", en: "applicants" })}
              </span>
              {p.applyDeadline && (
                <span className="inline-flex items-center gap-1.5 col-span-2">
                  <CalendarDays className="w-3.5 h-3.5 text-primary/80" />
                  {t({ ar: "آخر موعد:", en: "Deadline:" })} {formatDate(p.applyDeadline, lang)}
                </span>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-[12.5px] text-primary transition-colors font-semibold">
              <span>{open ? t({ ar: "قدّم الآن", en: "Apply now" }) : t({ ar: "التفاصيل", en: "Details" })}</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

function SkeletonPrograms() {
  return (
    <div className="space-y-8">
      <div className="flex gap-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="h-8 w-32 rounded-full bg-surface-3 border border-border-strong animate-pulse" />
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-[24px] h-72 bg-surface-3 border border-border-strong shadow-soft animate-pulse" />
        ))}
      </div>
    </div>
  );
}
