import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { CalendarDays, Sparkles, ArrowLeft, Layers } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import {
  COHORT_STATUS_LABELS,
  formatArabicDate,
  type CohortStatus,
} from "@/lib/labels";

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

export default function Cohorts() {
  const [rows, setRows] = useState<CohortRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "دفعات الحاضنة — Island Haven";
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ cohorts: CohortRow[] }>("/cohorts")
      .then((r) => !cancelled && setRows(r.cohorts))
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
      eyebrow="دَفعات الاحتضان · Cohorts"
      title="دَفعات"
      highlight="آيلاند"
      subtitle="كلّ دفعة تَجمع مجموعة من المشاريع الناشئة لرحلة محدّدة بزمن، تَنتهي بيوم العرض (Demo Day). تَصَفّح الدّفعات الجارية والسّابقة وشاهد ما صنعَتْه."
    >
      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-64 bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title="لم تَنطلق أوّل دفعة بعد"
          hint="نُجهّز أوّل cohort للحاضنة — تابعنا للإعلان."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows?.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <CohortCard c={c} />
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function CohortCard({ c }: { c: CohortRow }) {
  const isLive = c.status === "in_progress" || c.status === "demo_day";
  return (
    <Link
      href={`/cohorts/${c.slug}`}
      className="group block h-full"
      data-testid={`cohort-card-${c.id}`}
    >
      <GlassCard className="h-full flex flex-col hover:border-primary/40 transition-colors">
        {c.coverUrl ? (
          <div className="aspect-[16/9] overflow-hidden bg-black/30">
            <img
              src={c.coverUrl}
              alt={c.name}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-primary/25 via-primary/5 to-transparent flex items-center justify-center">
            <Layers className="w-12 h-12 text-primary/60" />
          </div>
        )}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-semibold border ${
                isLive
                  ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/30"
                  : c.status === "completed"
                    ? "bg-white/[0.05] text-white/50 border-white/10"
                    : "bg-primary/15 text-primary border-primary/30"
              }`}
            >
              {COHORT_STATUS_LABELS[c.status]}
            </span>
            <span className="text-[10.5px] tracking-[0.14em] uppercase text-white/45 font-semibold">
              · {c.programTitle}
            </span>
          </div>
          <h3 className="text-white font-bold text-[19px] leading-snug mb-2">
            {c.name}
          </h3>
          {c.summary && (
            <p className="text-white/55 text-[13.5px] leading-[1.85] line-clamp-3 mb-4">
              {c.summary}
            </p>
          )}
          <div className="mt-auto space-y-1.5 text-[12.5px] text-white/55 pt-3 border-t border-white/[0.06]">
            {c.startsAt && (
              <div className="flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-primary/80" />
                {formatArabicDate(c.startsAt)}
                {c.endsAt && <> — {formatArabicDate(c.endsAt)}</>}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary/80" />
              {c.ventureCount} {c.ventureCount === 1 ? "مشروع" : "مشاريع"}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[12.5px] text-white/65 group-hover:text-primary transition-colors font-semibold">
            <span>تفاصيل الدّفعة</span>
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
