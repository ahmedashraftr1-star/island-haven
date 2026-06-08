import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
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

export default function Programs() {
  const [rows, setRows] = useState<ProgramRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        <div className="grid sm:grid-cols-2 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-64 bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title="لا توجد برامج منشورة بعد"
          hint="ترقّب الإعلان عن أوّل دفعة احتضان قريبًا."
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {rows?.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <ProgramCard p={p} />
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function ProgramCard({ p }: { p: ProgramRow }) {
  const open = p.status === "open";
  return (
    <Link
      href={`/programs/${p.id}`}
      className="group block h-full"
      data-testid={`program-card-${p.id}`}
    >
      <GlassCard className="h-full flex flex-col hover:border-primary/40 transition-colors">
        {p.coverUrl ? (
          <div className="aspect-[16/9] overflow-hidden bg-black/30">
            <img
              src={p.coverUrl}
              alt={p.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-primary/25 via-primary/5 to-transparent" />
        )}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-semibold border ${
                open
                  ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/30"
                  : "bg-white/[0.05] text-white/55 border-white/10"
              }`}
            >
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
                {p.durationWeeks} أسبوع
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary/80" />
              {p.applicants} متقدّم
            </span>
            {p.applyDeadline && (
              <span className="inline-flex items-center gap-1.5 col-span-2">
                <CalendarDays className="w-3.5 h-3.5 text-primary/80" />
                آخر موعد: {formatArabicDate(p.applyDeadline)}
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between text-[12.5px] text-white/65 group-hover:text-primary transition-colors font-semibold">
            <span>التفاصيل والتقديم</span>
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
