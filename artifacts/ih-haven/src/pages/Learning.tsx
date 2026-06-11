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
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { AuthBackgroundAura } from "@/components/auth/AuthShell";
import {
  COURSE_TYPE_LABELS,
  formatArabicDate,
  type CourseType,
} from "@/lib/labels";

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
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = "التعلّم — Island Haven";
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div
        dir="rtl"
        className="relative min-h-screen overflow-hidden bg-[#0A0E1A] text-white flex items-center justify-center"
      >
        <AuthBackgroundAura />
        <div className="relative z-10 flex items-center gap-3 text-white/55">
          <span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-primary animate-spin" />
          جارٍ التحميل…
        </div>
      </div>
    );
  }

  return <LearningInner />;
}

function LearningInner() {
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
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
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
      setError(e instanceof ApiError ? e.message : "تعذّر الحفظ");
      void reload();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <PageShell
      active="learning"
      eyebrow="مسارك التَّعليميّ"
      title="التعلّم"
      highlight="وتتبّع التقدّم"
      subtitle="تابع تقدّمك في الكورسات والورشات التي انضممت إليها، وحدّث نسبة إنجازك خطوةً بخطوة — وعند الإكمال احصل على شهادتك."
    >
      {error && (
        <GlassCard className="p-5 mb-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {items === null && !error ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-40 bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : items && items.length === 0 ? (
        <EmptyState
          title="لم تبدأ أيّ مسار بعد"
          hint="انضمّ إلى كورس أو ورشة لتبدأ بتتبّع تقدّمك."
          action={
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-[13.5px] hover:-translate-y-px transition-transform"
            >
              <GraduationCap className="w-4 h-4" />
              استعرض البرنامج التَّدريبيّ
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
              {COURSE_TYPE_LABELS[item.courseType]}
            </span>
            {done && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> مكتمل
              </span>
            )}
          </div>
          <Link
            href={`/courses/${item.courseId}`}
            className="text-white font-bold text-[16px] leading-snug hover:text-primary transition-colors line-clamp-2"
          >
            {item.courseTitle}
          </Link>
          {done && item.completedAt && item.completedAt !== "now" && (
            <p className="text-white/45 text-[12px] mt-1">
              أُكمِل في {formatArabicDate(item.completedAt)}
            </p>
          )}
        </div>
        <div className="text-left shrink-0">
          <div className="text-[26px] font-bold text-white tabular-nums leading-none">
            {item.percent}
            <span className="text-[14px] text-white/45">%</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 rounded-full bg-white/[0.06] border border-white/[0.06] overflow-hidden mb-4">
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
        aria-label="نسبة الإنجاز"
        className="w-full accent-primary cursor-pointer disabled:opacity-50 mb-4"
        data-testid={`learn-slider-${item.courseId}`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onSave(item.percent - 10)}
          disabled={saving || item.percent <= 0}
          className="inline-flex items-center gap-1 px-3 h-9 rounded-full bg-white/[0.05] border border-white/10 text-white/75 text-[12.5px] font-semibold hover:bg-white/[0.08] disabled:opacity-40 transition-colors"
          data-testid={`learn-dec-${item.courseId}`}
        >
          <Minus className="w-3.5 h-3.5" /> 10٪
        </button>
        <button
          onClick={() => onSave(item.percent + 10)}
          disabled={saving || item.percent >= 100}
          className="inline-flex items-center gap-1 px-3 h-9 rounded-full bg-white/[0.05] border border-white/10 text-white/75 text-[12.5px] font-semibold hover:bg-white/[0.08] disabled:opacity-40 transition-colors"
          data-testid={`learn-inc-${item.courseId}`}
        >
          <Plus className="w-3.5 h-3.5" /> 10٪
        </button>

        {!done ? (
          <button
            onClick={() => onSave(100)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-[12.5px] font-bold hover:bg-emerald-500/25 disabled:opacity-50 transition-colors"
            data-testid={`learn-complete-${item.courseId}`}
          >
            <CheckCircle2 className="w-4 h-4" /> تمّ الإكمال
          </button>
        ) : (
          <Link
            href={`/certificate/${item.courseId}`}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-primary text-white text-[12.5px] font-bold hover:-translate-y-px hover:shadow-[0_14px_30px_-12px_rgba(220,38,55,0.55)] transition-all mr-auto"
            data-testid={`learn-certificate-${item.courseId}`}
          >
            <Award className="w-4 h-4" /> شهادة الإكمال
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </GlassCard>
  );
}
