import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  User as UserIcon,
} from "lucide-react";
import {
  PageShell,
  GlassCard,
  BackLink,
} from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  COURSE_TYPE_LABELS,
  COURSE_STATUS_LABELS,
  formatArabicDateTime,
  type CourseType,
  type CourseStatus,
} from "@/lib/labels";

interface CourseFull {
  id: number;
  type: CourseType;
  title: string;
  summary: string;
  description: string;
  instructor: string;
  coverUrl: string | null;
  location: string;
  startsAt: string | null;
  endsAt: string | null;
  capacity: number;
  status: CourseStatus;
  enrolled: number;
}

interface DetailResp {
  course: CourseFull;
  isEnrolled: boolean;
  myEnrollmentStatus: string | null;
}

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
  const [, navigate] = useLocation();
  const id = params?.id;
  const { user } = useAuth();
  const [data, setData] = useState<DetailResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  async function refresh() {
    if (!id) return;
    try {
      const r = await api<DetailResp>(`/courses/${id}`);
      setData(r);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التحميل");
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (data?.course?.title) {
      document.title = `${data.course.title} — آيلاند هيفن`;
    }
  }, [data?.course?.title]);

  async function onEnroll() {
    if (!user) {
      navigate(`/login?next=/courses/${id}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/courses/${id}/enroll`, { method: "POST" });
      setFlash("تمّ تسجيلك. سنتواصل معك لتأكيد المقعد.");
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر التسجيل");
    } finally {
      setBusy(false);
      setTimeout(() => setFlash(null), 3500);
    }
  }

  async function onCancel() {
    if (busy) return;
    if (!window.confirm("هل تريد إلغاء تسجيلك؟")) return;
    setBusy(true);
    try {
      await api(`/courses/${id}/enroll`, { method: "DELETE" });
      setFlash("تمّ إلغاء التسجيل.");
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر الإلغاء");
    } finally {
      setBusy(false);
      setTimeout(() => setFlash(null), 3500);
    }
  }

  if (error && !data) {
    return (
      <PageShell active="courses">
        <BackLink href="/courses" label="عودة للقائمة" />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell active="courses">
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  const c = data.course;
  const isFull = c.capacity > 0 && c.enrolled >= c.capacity;

  return (
    <PageShell active="courses">
      <BackLink href="/courses" label="كلّ الكورسات والورشات" />

      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-5 rounded-2xl px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-[13px] flex items-center gap-2"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4" /> {flash}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <GlassCard>
          {c.coverUrl ? (
            <div className="aspect-[16/9] overflow-hidden bg-black/30">
              <img
                src={c.coverUrl}
                alt={c.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-primary/30 via-primary/8 to-transparent" />
          )}
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.18em] uppercase font-bold bg-primary/15 text-primary border border-primary/30">
                {COURSE_TYPE_LABELS[c.type]}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-semibold bg-white/[0.05] text-white/60 border border-white/10">
                {COURSE_STATUS_LABELS[c.status]}
              </span>
            </div>
            <h1
              className="font-bold text-white leading-tight mb-3"
              style={{ fontSize: "clamp(1.7rem, 4vw, 2.4rem)" }}
              data-testid="text-course-title"
            >
              {c.title}
            </h1>
            {c.summary && (
              <p className="text-white/65 text-[15.5px] leading-[1.85] mb-6">
                {c.summary}
              </p>
            )}
            {c.description && (
              <div className="text-white/75 text-[14.5px] leading-[1.95] whitespace-pre-wrap">
                {c.description}
              </div>
            )}
          </div>
        </GlassCard>

        <div className="space-y-5">
          <GlassCard className="p-6">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
              التفاصيل
            </div>
            <ul className="space-y-3 text-[13.5px] text-white/75">
              {c.instructor && (
                <li className="flex items-start gap-3">
                  <UserIcon className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <div className="text-white/45 text-[11px] tracking-wide">
                      المُدرِّب
                    </div>
                    <div className="text-white font-semibold">{c.instructor}</div>
                  </div>
                </li>
              )}
              {c.startsAt && (
                <li className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <div className="text-white/45 text-[11px] tracking-wide">
                      يبدأ
                    </div>
                    <div className="text-white font-semibold">
                      {formatArabicDateTime(c.startsAt)}
                    </div>
                    {c.endsAt && (
                      <div className="text-white/55 text-[12px] mt-0.5">
                        ينتهي: {formatArabicDateTime(c.endsAt)}
                      </div>
                    )}
                  </div>
                </li>
              )}
              {c.location && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <div className="text-white/45 text-[11px] tracking-wide">
                      المكان
                    </div>
                    <div className="text-white font-semibold">{c.location}</div>
                  </div>
                </li>
              )}
              <li className="flex items-start gap-3">
                <Users className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <div className="text-white/45 text-[11px] tracking-wide">
                    المُسجَّلون
                  </div>
                  <div className="text-white font-semibold">
                    {c.enrolled}
                    {c.capacity > 0 ? ` من أصل ${c.capacity}` : ""}
                  </div>
                </div>
              </li>
            </ul>
          </GlassCard>

          <GlassCard className="p-6">
            {!user ? (
              <>
                <div className="text-white/65 text-[13.5px] leading-[1.85] mb-4">
                  سجّل دخولك لحجز مقعدك في هذه الفعاليّة.
                </div>
                <Link
                  href={`/login?next=/courses/${id}`}
                  className="block text-center w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] hover:-translate-y-px transition-all"
                  data-testid="button-login-to-enroll"
                >
                  تسجيل الدخول للحجز
                </Link>
                <Link
                  href={`/register?next=/courses/${id}`}
                  className="block text-center mt-2 text-[12.5px] text-white/55 hover:text-primary transition-colors"
                >
                  ليس لديك حساب؟ أنشئ واحدًا
                </Link>
              </>
            ) : data.isEnrolled ? (
              <>
                <div className="flex items-center gap-2 text-emerald-300 text-[13.5px] mb-4 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  أنت مسجَّل
                  {data.myEnrollmentStatus === "confirmed"
                    ? " (مؤكَّد)"
                    : " (بانتظار التأكيد)"}
                </div>
                <button
                  onClick={onCancel}
                  disabled={busy}
                  className="w-full py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white/75 font-semibold text-[13.5px] hover:bg-red-500/10 hover:text-red-200 hover:border-red-500/30 transition-colors disabled:opacity-50"
                  data-testid="button-cancel-enrollment"
                >
                  <XCircle className="w-4 h-4 inline ml-1.5" />
                  إلغاء الحجز
                </button>
              </>
            ) : c.status === "done" ? (
              <div className="text-white/55 text-[13.5px] text-center py-2">
                هذه الفعاليّة منتهية.
              </div>
            ) : isFull || c.status === "closed" ? (
              <div className="text-white/55 text-[13.5px] text-center py-2">
                اكتمل العدد. ترقّب الدفعة القادمة.
              </div>
            ) : (
              <>
                <div className="text-white/65 text-[13.5px] leading-[1.85] mb-4">
                  مَجّاني تمامًا — احجز مقعدك الآن.
                </div>
                <button
                  onClick={onEnroll}
                  disabled={busy}
                  className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px transition-all disabled:opacity-50"
                  data-testid="button-enroll"
                >
                  {busy ? "…" : "احجز مقعدي"}
                </button>
              </>
            )}
            {error && (
              <div className="mt-3 text-[12.5px] text-red-300">{error}</div>
            )}
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}
