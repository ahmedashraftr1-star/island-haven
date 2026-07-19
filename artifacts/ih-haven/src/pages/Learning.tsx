import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Minus,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { AuthBackgroundAura } from "@/components/auth/AuthShell";
import {
  COURSE_TYPE_LABELS,
  formatDate,
  type CourseType,
} from "@/lib/labels";

const COURSE_TYPE_LABELS_EN: Record<CourseType, string> = {
  course: "Course",
  workshop: "Workshop",
};

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}

interface ProgressRow {
  id: number;
  courseId: number;
  percent: number;
  completedAt: string | null;
  updatedAt: string;
  courseTitle: string;
  courseType: CourseType;
}

interface MyEnrollment {
  course: {
    id: number;
    type: CourseType;
    title: string;
  };
}

// A learnable item = a course the member is enrolled in, merged with any
// progress they've already recorded. This lets a freshly-enrolled course show
// up at 0% even before its first progress row exists.
interface LearnItem {
  courseId: number;
  courseTitle: string;
  courseType: CourseType;
  percent: number;
  completedAt: string | null;
}

export default function Learning() {
  const { lang, dir, t } = useLanguage();
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title =
      lang === "ar" ? "التعلّم — Island Haven" : "Learning — Island Haven";
  }, [lang]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div
        dir={dir}
        className="relative min-h-screen overflow-hidden bg-surface-1 text-foreground flex items-center justify-center"
      >
        <AuthBackgroundAura />
        <div className="relative z-10 flex items-center gap-3 text-muted-foreground">
          <span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-primary animate-spin" />
          {t({ ar: "جارٍ التحميل…", en: "Loading…" })}
        </div>
      </div>
    );
  }

  return <LearningInner />;
}

function LearningInner() {
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<LearnItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  async function reload() {
    setError(null);
    try {
      const [prog, enr] = await Promise.all([
        api<{ progress: ProgressRow[] }>("/me/course-progress"),
        api<{ enrollments: MyEnrollment[] }>("/courses/me/enrollments"),
      ]);

      // Merge: every enrolled course + any progress-only rows, keyed by courseId.
      const byId = new Map<number, LearnItem>();
      for (const e of enr.enrollments) {
        byId.set(e.course.id, {
          courseId: e.course.id,
          courseTitle: e.course.title,
          courseType: e.course.type,
          percent: 0,
          completedAt: null,
        });
      }
      for (const p of prog.progress) {
        byId.set(p.courseId, {
          courseId: p.courseId,
          courseTitle: p.courseTitle,
          courseType: p.courseType,
          percent: p.percent,
          completedAt: p.completedAt,
        });
      }
      setItems(
        [...byId.values()].sort((a, b) => b.percent - a.percent),
      );
    } catch {
      // Never surface the raw server message ("HTTP 500") on load.
      setError(lang === "ar" ? "تعذّر التحميل" : "Couldn't load your progress");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function save(courseId: number, percent: number) {
    const clamped = Math.max(0, Math.min(100, percent));
    setSavingId(courseId);
    setError(null);
    // Optimistic update so the bar/buttons respond instantly.
    setItems((rows) =>
      rows
        ? rows.map((r) =>
            r.courseId === courseId
              ? {
                  ...r,
                  percent: clamped,
                  completedAt: clamped >= 100 ? r.completedAt ?? "now" : null,
                }
              : r,
          )
        : rows,
    );
    try {
      const r = await api<{ progress: ProgressRow }>("/me/course-progress", {
        method: "PUT",
        body: JSON.stringify({ courseId, percent: clamped }),
      });
      setItems((rows) =>
        rows
          ? rows.map((x) =>
              x.courseId === courseId
                ? { ...x, percent: r.progress.percent, completedAt: r.progress.completedAt }
                : x,
            )
          : rows,
      );
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : lang === "ar"
            ? "تعذّر الحفظ"
            : "Couldn't save",
      );
      void reload();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <PageShell
      active="learning"
      eyebrow={t({ ar: "مسارك التَّعليميّ", en: "Your learning journey" })}
      title={t({ ar: "التعلّم", en: "Learning" })}
      highlight={t({ ar: "وتتبّع التقدّم", en: "& Progress Tracking" })}
      subtitle={t({
        ar: "تابع تقدّمك في الكورسات والورشات التي انضممت إليها، وحدّث نسبة إنجازك خطوةً بخطوة — وعند الإكمال احصل على شهادتك.",
        en: "Track your progress across the courses and workshops you've joined, and update your completion step by step — earn your certificate when you finish.",
      })}
    >
      {error && (
        <GlassCard className="p-5 mb-5 text-destructive text-center">{error}</GlassCard>
      )}

      {items === null && !error ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-40 bg-white/[0.035] border border-border-strong animate-pulse"
            />
          ))}
        </div>
      ) : items && items.length === 0 ? (
        <EmptyState
          title={t({ ar: "لم تبدأ أيّ مسار بعد", en: "You haven't started any path yet" })}
          hint={t({
            ar: "انضمّ إلى كورس أو ورشة لتبدأ بتتبّع تقدّمك.",
            en: "Join a course or workshop to start tracking your progress.",
          })}
          action={
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-[13.5px] hover:-translate-y-px transition-transform"
            >
              <GraduationCap className="w-4 h-4" />
              {t({ ar: "استعرض البرنامج التَّدريبيّ", en: "Browse the training program" })}
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {items?.map((it, i) => (
            <motion.div
              key={it.courseId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
            >
              <ProgressCard
                item={it}
                saving={savingId === it.courseId}
                onSave={(pct) => save(it.courseId, pct)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function ProgressCard({
  item,
  saving,
  onSave,
}: {
  item: LearnItem;
  saving: boolean;
  onSave: (percent: number) => void;
}) {
  const { lang, t } = useLanguage();
  const done = item.percent >= 100;

  return (
    <GlassCard
      className="p-5 sm:p-6"
      testId={`learn-card-${item.courseId}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-bold bg-primary/15 text-primary border border-primary/30">
              {lang === "ar"
                ? COURSE_TYPE_LABELS[item.courseType]
                : COURSE_TYPE_LABELS_EN[item.courseType]}
            </span>
            {done && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> {t({ ar: "مكتمل", en: "Completed" })}
              </span>
            )}
          </div>
          <Link
            href={`/courses/${item.courseId}`}
            className="text-foreground font-bold text-[16px] leading-snug hover:text-primary transition-colors line-clamp-2"
          >
            {item.courseTitle}
          </Link>
          {done && item.completedAt && item.completedAt !== "now" && (
            <p className="text-muted-foreground text-[12px] mt-1">
              {t({ ar: "أُكمِل في", en: "Completed on" })}{" "}
              {formatDate(item.completedAt, lang)}
            </p>
          )}
        </div>
        <div className="text-left shrink-0">
          <div className="text-[26px] font-bold text-foreground tabular-nums leading-none">
            {num(item.percent, lang)}
            <span className="text-[14px] text-fg-secondary">%</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 rounded-full bg-surface-2 border border-border-strong overflow-hidden mb-4">
        <motion.div
          className={`h-full rounded-full ${done ? "bg-emerald-400" : "bg-primary"}`}
          initial={false}
          animate={{ width: `${item.percent}%` }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
        />
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={item.percent}
        disabled={saving}
        onChange={(e) => onSave(Number(e.target.value))}
        aria-label={t({ ar: "نسبة الإنجاز", en: "Completion percentage" })}
        className="w-full accent-primary cursor-pointer disabled:opacity-50 mb-4"
        data-testid={`learn-slider-${item.courseId}`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onSave(item.percent - 10)}
          disabled={saving || item.percent <= 0}
          className="inline-flex items-center gap-1 px-3 h-9 rounded-full bg-surface-2 border border-border-strong text-fg-secondary text-[12.5px] font-semibold hover:bg-surface-2 disabled:opacity-40 transition-colors"
          data-testid={`learn-dec-${item.courseId}`}
        >
          <Minus className="w-3.5 h-3.5" /> {t({ ar: "10٪", en: "10%" })}
        </button>
        <button
          onClick={() => onSave(item.percent + 10)}
          disabled={saving || item.percent >= 100}
          className="inline-flex items-center gap-1 px-3 h-9 rounded-full bg-surface-2 border border-border-strong text-fg-secondary text-[12.5px] font-semibold hover:bg-surface-2 disabled:opacity-40 transition-colors"
          data-testid={`learn-inc-${item.courseId}`}
        >
          <Plus className="w-3.5 h-3.5" /> {t({ ar: "10٪", en: "10%" })}
        </button>

        {!done ? (
          <button
            onClick={() => onSave(100)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-[12.5px] font-bold hover:bg-emerald-500/25 disabled:opacity-50 transition-colors"
            data-testid={`learn-complete-${item.courseId}`}
          >
            <CheckCircle2 className="w-4 h-4" /> {t({ ar: "تمّ الإكمال", en: "Mark complete" })}
          </button>
        ) : (
          <Link
            href={`/certificate/${item.courseId}`}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-primary text-white text-[12.5px] font-bold hover:-translate-y-px hover:shadow-[0_14px_30px_-12px_rgba(220,38,55,0.55)] transition-all mr-auto"
            data-testid={`learn-certificate-${item.courseId}`}
          >
            <Award className="w-4 h-4" /> {t({ ar: "شهادة الإكمال", en: "Completion certificate" })}
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </GlassCard>
  );
}
