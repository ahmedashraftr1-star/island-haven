import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import {
  COURSE_TYPE_LABELS,
  COURSE_STATUS_LABELS,
  formatArabicDateTime,
  type CourseType,
  type CourseStatus,
} from "@/lib/labels";

interface CourseRow {
  id: number;
  type: CourseType;
  title: string;
  summary: string;
  instructor: string;
  coverUrl: string | null;
  location: string;
  startsAt: string | null;
  endsAt: string | null;
  capacity: number;
  status: CourseStatus;
  enrolled: number;
}

const FILTERS: Array<{ key: "" | CourseType; label: string }> = [
  { key: "", label: "الكلّ" },
  { key: "course", label: "الكورسات" },
  { key: "workshop", label: "الورشات" },
];

export default function Courses() {
  const [filter, setFilter] = useState<"" | CourseType>("");
  const [rows, setRows] = useState<CourseRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "الكورسات والورشات — آيلاند هيفن";
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    api<{ courses: CourseRow[] }>(
      `/courses${filter ? `?type=${filter}` : ""}`,
    )
      .then((r) => {
        if (!cancelled) setRows(r.courses);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "تعذّر تحميل القائمة");
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <PageShell
      active="courses"
      eyebrow="تَعلّم · شارِك · انْمُ"
      title="الكورسات و"
      highlight="الورشات"
      subtitle="فرص تَدريبيّة متجدّدة في آيلاند هيفن — مَجّانًا، صُمِّمَت لتُمَكِّنَك من تحويل المعرفة إلى دخل وأثَر."
    >
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors border ${
                isActive
                  ? "bg-primary/20 text-white border-primary/40"
                  : "bg-white/[0.04] text-white/65 border-white/10 hover:text-white hover:bg-white/[0.08]"
              }`}
              data-testid={`filter-${f.key || "all"}`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-72 bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title="لا توجد فعاليّات منشورة بعد"
          hint="ترقّب الإعلان عن أوّل دفعة قريبًا."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows?.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
            >
              <CourseCard c={c} />
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function CourseCard({ c }: { c: CourseRow }) {
  const isFull = c.capacity > 0 && c.enrolled >= c.capacity;
  const isOpen = c.status === "open" && !isFull;
  return (
    <Link
      href={`/courses/${c.id}`}
      className="group block h-full"
      data-testid={`course-card-${c.id}`}
    >
      <GlassCard className="h-full flex flex-col hover:border-primary/40 transition-colors">
        {c.coverUrl ? (
          <div className="aspect-[16/9] overflow-hidden bg-black/30">
            <img
              src={c.coverUrl}
              alt={c.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        )}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.18em] uppercase font-bold bg-primary/15 text-primary border border-primary/30">
              {COURSE_TYPE_LABELS[c.type]}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-semibold border ${
                isOpen
                  ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/30"
                  : "bg-white/[0.05] text-white/55 border-white/10"
              }`}
            >
              {isFull ? "مكتمل العدد" : COURSE_STATUS_LABELS[c.status]}
            </span>
          </div>
          <h3 className="text-white font-bold text-[17px] leading-snug mb-1.5 line-clamp-2">
            {c.title}
          </h3>
          {c.summary && (
            <p className="text-white/55 text-[13px] leading-[1.7] line-clamp-2 mb-4">
              {c.summary}
            </p>
          )}
          <div className="mt-auto space-y-1.5 text-[12px] text-white/55">
            {c.startsAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-primary/80" />
                <span>{formatArabicDateTime(c.startsAt)}</span>
              </div>
            )}
            {c.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary/80" />
                <span className="truncate">{c.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-primary/80" />
              <span>
                {c.enrolled}
                {c.capacity > 0 ? ` / ${c.capacity}` : ""} مشترك
              </span>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between text-[12.5px] text-white/65 group-hover:text-primary transition-colors font-semibold">
            <span>عرض التفاصيل</span>
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
