import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, Clock, Users, CalendarDays } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import {
  formatArabicDate,
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

export default function Programs() {
  const [rows, setRows] = useState<ProgramRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title = "برامج الاحتضان — Island Haven";
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ programs: ProgramRow[] }>("/programs")
      .then((r) => !cancelled && setRows(r.programs))
      .catch(
        (e) =>
          !cancelled &&
          setError(e instanceof ApiError ? e.message : "تعذّر التحميل"),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  // Open-for-application programs first — they're the actionable ones.
  const sorted = [...(rows ?? [])].sort(
    (a, b) => Number(b.status === "open") - Number(a.status === "open"),
  );
  const total = rows?.length ?? 0;
  const openCount = (rows ?? []).filter((p) => p.status === "open").length;

  return (
    <PageShell
      active="programs"
      eyebrow="احتضان · تسريع · نموّ"
      title="برامج"
      highlight="الاحتضان"
      subtitle="مسارات احتضان وتسريع منظَّمة تأخذ مشروعك من الفكرة إلى الإطلاق — إرشاد، موارد، وشبكة علاقات في قلب غزّة."
    >
      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <SkeletonPrograms />
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title="لا توجد برامج منشورة بعد"
          hint="ترقّب الإعلان عن أوّل دفعة احتضان قريبًا."
        />
      ) : (
        <>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap items-center gap-2.5 mb-12 sm:mb-14"
          >
            <Chip>{toArabicNum(total)} برامج</Chip>
            {openCount > 0 && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-emerald-200 bg-emerald-500/10 border border-emerald-500/25">
                <Dot />
                {toArabicNum(openCount)} مفتوحة للتقديم
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
    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-white/70 bg-white/[0.04] border border-white/10">
      {children}
    </span>
  );
}

function Dot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 animate-ping" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
    </span>
  );
}

function ProgramCard({ p, reduce }: { p: ProgramRow; reduce: boolean }) {
  const open = p.status === "open";
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
            open ? "border-emerald-500/30 hover:border-emerald-400/50" : "hover:border-primary/40"
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
            <div className="aspect-[16/9] overflow-hidden bg-black/30">
              <img
                src={p.coverUrl}
                alt={p.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-primary/25 via-primary/5 to-transparent" />
          )}
          <div className="relative p-6 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-semibold border ${
                  open
                    ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/30"
                    : "bg-white/[0.05] text-white/55 border-white/10"
                }`}
              >
                {open && <Dot />}
                {PROGRAM_STATUS_LABELS[p.status]}
              </span>
            </div>
            <h3 className="text-white font-bold text-[18px] leading-snug mb-2 line-clamp-2">
              {p.title}
            </h3>
            {p.summary && (
              <p className="text-white/55 text-[13px] leading-[1.7] line-clamp-3 mb-4">
                {p.summary}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {splitTags(p.tags)
                .slice(0, 3)
                .map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.05] text-white/70 border border-white/10"
                  >
                    {t}
                  </span>
                ))}
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2 text-[12px] text-white/55 pt-3 border-t border-white/[0.06]">
              {p.durationWeeks > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary/80" />
                  {toArabicNum(p.durationWeeks)} أسبوع
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary/80" />
                {toArabicNum(p.applicants)} متقدّم
              </span>
              {p.applyDeadline && (
                <span className="inline-flex items-center gap-1.5 col-span-2">
                  <CalendarDays className="w-3.5 h-3.5 text-primary/80" />
                  آخر موعد: {formatArabicDate(p.applyDeadline)}
                </span>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-[12.5px] text-white/65 group-hover:text-primary transition-colors font-semibold">
              <span>{open ? "قدّم الآن" : "التفاصيل"}</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
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
          <div key={i} className="h-8 w-32 rounded-full bg-white/[0.04] border border-white/10 animate-pulse" />
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-[24px] h-72 bg-white/[0.035] border border-white/10 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
