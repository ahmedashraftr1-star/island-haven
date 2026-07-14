import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
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

const COURSE_TYPE_LABELS_EN: Record<CourseType, string> = {
  course: "Course",
  workshop: "Workshop",
};

const COURSE_STATUS_LABELS_EN: Record<CourseStatus, string> = {
  draft: "Draft",
  open: "Registration open",
  closed: "Full",
  done: "Ended",
};

const FILTERS: Array<{ key: "" | CourseType; label: { ar: string; en: string } }> = [
  { key: "", label: { ar: "الكلّ", en: "All" } },
  { key: "course", label: { ar: "الكورسات", en: "Courses" } },
  { key: "workshop", label: { ar: "الورشات", en: "Workshops" } },
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
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}
// Localised date-time: Arabic-EG in AR, English-GB in EN.
function formatDateTime(iso: string | null | undefined, lang: Lang): string {
  if (lang === "ar") return formatArabicDateTime(iso);
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
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
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState<"" | CourseType>("");
  const [rows, setRows] = useState<CourseRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title =
      lang === "ar"
        ? "الكورسات والورشات — آيلاند هيفن"
        : "Courses & Workshops — Island Haven";
  }, [lang]);

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
        setError(
          e instanceof ApiError
            ? e.message
            : lang === "ar"
              ? "تعذّر تحميل القائمة"
              : "Couldn't load the list",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [filter, lang]);

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
      eyebrow={t({ ar: "تَعلّم · شارِك · انْمُ", en: "Learn · Share · Grow" })}
      title={t({ ar: "الكورسات و", en: "Courses & " })}
      highlight={t({ ar: "الورشات", en: "Workshops" })}
      subtitle={t({
        ar: "فرص تَدريبيّة متجدّدة في آيلاند هيفن — مَجّانًا، صُمِّمَت لتُمَكِّنَك من تحويل المعرفة إلى دخل وأثَر.",
        en: "Ever-renewing training opportunities at Island Haven — free, designed to help you turn knowledge into income and impact.",
      })}
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
                aria-pressed={isActive ? "true" : "false"}
                className={`px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors border ${
                  isActive
                    ? "bg-primary/20 text-foreground border-primary/40"
                    : "bg-surface-2 text-fg-secondary border-border-strong hover:text-foreground hover:bg-surface-2"
                }`}
                data-testid={`filter-${f.key || "all"}`}
              >
                {t(f.label)}
              </button>
            );
          })}
        </div>
        {openCount > 0 && (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-emerald-200 bg-emerald-500/10 border border-emerald-500/25">
            <Dot />
            {num(openCount, lang)} {t({ ar: "تسجيل مفتوح", en: "open for registration" })}
          </span>
        )}
      </div>

      {error && (
        <GlassCard className="p-5 text-destructive text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-72 bg-white/[0.035] border border-border-strong animate-pulse"
            />
          ))}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title={t({ ar: "لا توجد فعاليّات منشورة بعد", en: "No events published yet" })}
          hint={t({
            ar: "ترقّب الإعلان عن أوّل دفعة قريبًا.",
            en: "Stay tuned — our first batch will be announced soon.",
          })}
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
  const { lang, t } = useLanguage();
  const isFull = c.capacity > 0 && c.enrolled >= c.capacity;
  const isOpen = c.status === "open" && !isFull;
  const pct = c.capacity > 0 ? Math.min(100, Math.round((c.enrolled / c.capacity) * 100)) : 0;
  const typeLabel =
    lang === "ar" ? COURSE_TYPE_LABELS[c.type] : COURSE_TYPE_LABELS_EN[c.type];
  const statusLabel = isFull
    ? t({ ar: "مكتمل العدد", en: "Full" })
    : lang === "ar"
      ? COURSE_STATUS_LABELS[c.status]
      : COURSE_STATUS_LABELS_EN[c.status];
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
                {typeLabel}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-semibold border ${
                  isOpen
                    ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/30"
                    : "bg-surface-2 text-muted-foreground border-border-strong"
                }`}
              >
                {isOpen && <Dot />}
                {statusLabel}
              </span>
            </div>
            <h3 className="text-foreground font-bold text-[17px] leading-snug mb-1.5 line-clamp-2">
              {c.title}
            </h3>
            {c.summary && (
              <p className="text-muted-foreground text-[13px] leading-[1.7] line-clamp-2 mb-4">
                {c.summary}
              </p>
            )}
            <div className="mt-auto space-y-1.5 text-[12px] text-muted-foreground">
              {c.startsAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-primary/80" />
                  <span>{formatDateTime(c.startsAt, lang)}</span>
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
                  {num(c.enrolled, lang)}
                  {c.capacity > 0 ? ` / ${num(c.capacity, lang)}` : ""} {t({ ar: "مشترك", en: "enrolled" })}
                  {isOpen && c.capacity > 0 && c.capacity - c.enrolled <= 5 && (
                    <span className="text-emerald-300/90">
                      {" "}· {num(c.capacity - c.enrolled, lang)} {t({ ar: "مقعد متبقٍّ", en: "seats left" })}
                    </span>
                  )}
                </span>
              </div>
              {c.capacity > 0 && (
                <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mt-1">
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
            <div className="flex items-center justify-between text-[12.5px] text-fg-secondary group-hover:text-primary transition-colors font-semibold">
              <span>{isOpen ? t({ ar: "سجّل الآن", en: "Register now" }) : t({ ar: "عرض التفاصيل", en: "View details" })}</span>
              <ArrowLeft className="w-4 h-4 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1 ltr:rotate-180" />
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
