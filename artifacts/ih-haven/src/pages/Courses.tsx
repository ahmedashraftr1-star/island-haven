import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
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

function Dot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 animate-ping" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
    </span>
  );
}

export default function Courses() {
  const [filter, setFilter] = useState<"" | CourseType>("");
  const [rows, setRows] = useState<CourseRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title = "الكورسات والورشات — آيلاند هيفن";
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    api<{ courses: CourseRow[] }>(`/courses${filter ? `?type=${filter}` : ""}`)
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

  const openCount = (rows ?? []).filter(
    (c) => c.status === "open" && !(c.capacity > 0 && c.enrolled >= c.capacity),
  ).length;
  const sorted = [...(rows ?? [])].sort((a, b) => {
    const oa = a.status === "open" && !(a.capacity > 0 && a.enrolled >= a.capacity);
    const ob = b.status === "open" && !(b.capacity > 0 && b.enrolled >= b.capacity);
    return Number(ob) - Number(oa);
  });

  return (
    <PageShell
      active="courses"
      eyebrow="تَعلّم · شارِك · انْمُ"
      title="الكورسات و"
      highlight="الورشات"
      subtitle="فرص تَدريبيّة متجدّدة في آيلاند هيفن — مَجّانًا، صُمِّمَت لتُمَكِّنَك من تحويل المعرفة إلى دخل وأثَر."
    >
      <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
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
        {openCount > 0 && (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-emerald-200 bg-emerald-500/10 border border-emerald-500/25">
            <Dot />
            {toArabicNum(openCount)} تسجيل مفتوح
          </span>
        )}
      </div>

      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
        <motion.div
          variants={reduce ? undefined : stagger}
          initial={reduce ? undefined : "hidden"}
          animate={reduce ? undefined : "show"}
          key={filter}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {sorted.map((c) => (
            <CourseCard key={c.id} c={c} reduce={!!reduce} />
          ))}
        </motion.div>
      )}
    </PageShell>
  );
}

function CourseCard({ c, reduce }: { c: CourseRow; reduce: boolean }) {
  const isFull = c.capacity > 0 && c.enrolled >= c.capacity;
  const isOpen = c.status === "open" && !isFull;
  const pct = c.capacity > 0 ? Math.min(100, Math.round((c.enrolled / c.capacity) * 100)) : 0;
  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="h-full"
    >
      <Link
        href={`/courses/${c.id}`}
        className="group block h-full"
        data-testid={`course-card-${c.id}`}
      >
        <GlassCard
          className={`group h-full flex flex-col overflow-hidden transition-colors ${
            isOpen ? "border-emerald-500/25 hover:border-emerald-400/50" : "hover:border-primary/40"
          }`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "radial-gradient(130% 80% at 80% 0%, hsl(354 80% 55% / 0.1), transparent 60%)",
            }}
          />
          {c.coverUrl ? (
            <div className="aspect-[16/9] overflow-hidden bg-black/30">
              <img
                src={c.coverUrl}
                alt={c.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
          )}
          <div className="relative p-5 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.18em] uppercase font-bold bg-primary/15 text-primary border border-primary/30">
                {COURSE_TYPE_LABELS[c.type]}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-semibold border ${
                  isOpen
                    ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/30"
                    : "bg-white/[0.05] text-white/55 border-white/10"
                }`}
              >
                {isOpen && <Dot />}
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
                  {toArabicNum(c.enrolled)}
                  {c.capacity > 0 ? ` / ${toArabicNum(c.capacity)}` : ""} مشترك
                  {isOpen && c.capacity > 0 && c.capacity - c.enrolled <= 5 && (
                    <span className="text-emerald-300/90">
                      {" "}· {toArabicNum(c.capacity - c.enrolled)} مقعد متبقٍّ
                    </span>
                  )}
                </span>
              </div>
              {c.capacity > 0 && (
                <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden mt-1">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: isFull ? "rgba(255,255,255,0.25)" : isOpen ? "#34d399" : "hsl(354 80% 58%)" }}
                    initial={reduce ? false : { width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="relative px-5 pb-5">
            <div className="flex items-center justify-between text-[12.5px] text-white/65 group-hover:text-primary transition-colors font-semibold">
              <span>{isOpen ? "سجّل الآن" : "عرض التفاصيل"}</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
