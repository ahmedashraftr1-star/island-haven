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
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  COURSE_TYPE_LABELS,
  COURSE_STATUS_LABELS,
  formatArabicDateTime,
  type CourseType,
  type CourseStatus,
} from "@/lib/labels";

const COURSE_TYPE_LABELS_EN: Record<CourseType, string> = {
  course: "Course",
  workshop: "Workshop",
};

const COURSE_STATUS_LABELS_EN: Record<CourseStatus, string> = {
  draft: "Draft",
  open: "Registration open",
  closed: "Fully booked",
  done: "Ended",
};

// Localised date-time: Arabic-Indic in AR, Western in EN.
function fmtDateTime(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return "";
  return lang === "ar"
    ? formatArabicDateTime(iso)
    : new Date(iso).toLocaleString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}

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
  const { lang, t } = useLanguage();
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
      setError(
        e instanceof ApiError
          ? e.message
          : t({ ar: "تعذّر التحميل", en: "Couldn't load" }),
      );
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (data?.course?.title) {
      document.title = `${data.course.title} — ${
        lang === "ar" ? "آيلاند هيفن" : "Island Haven"
      }`;
    }
  }, [data?.course?.title, lang]);

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
      setFlash(
        t({
          ar: "تمّ تسجيلك. سنتواصل معك لتأكيد المقعد.",
          en: "You're enrolled. We'll be in touch to confirm your seat.",
        }),
      );
      await refresh();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : t({ ar: "تعذّر التسجيل", en: "Couldn't enroll" }),
      );
    } finally {
      setBusy(false);
      setTimeout(() => setFlash(null), 3500);
    }
  }

  async function onCancel() {
    if (busy) return;
    if (
      !window.confirm(
        t({
          ar: "هل تريد إلغاء تسجيلك؟",
          en: "Cancel your enrollment?",
        }),
      )
    )
      return;
    setBusy(true);
    try {
      await api(`/courses/${id}/enroll`, { method: "DELETE" });
      setFlash(t({ ar: "تمّ إلغاء التسجيل.", en: "Enrollment cancelled." }));
      await refresh();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : t({ ar: "تعذّر الإلغاء", en: "Couldn't cancel" }),
      );
    } finally {
      setBusy(false);
      setTimeout(() => setFlash(null), 3500);
    }
  }

  if (error && !data) {
    return (
      <PageShell active="courses">
        <BackLink
          href="/courses"
          label={t({ ar: "عودة للقائمة", en: "Back to list" })}
        />
        <GlassCard className="p-8 text-center text-destructive">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell active="courses">
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-border-strong animate-pulse" />
      </PageShell>
    );
  }

  const c = data.course;
  const isFull = c.capacity > 0 && c.enrolled >= c.capacity;

  return (
    <PageShell active="courses">
      <BackLink
        href="/courses"
        label={t({ ar: "كلّ الكورسات والورشات", en: "All courses & workshops" })}
      />

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
                {t({
                  ar: COURSE_TYPE_LABELS[c.type],
                  en: COURSE_TYPE_LABELS_EN[c.type],
                })}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] tracking-[0.14em] uppercase font-semibold bg-surface-2 text-muted-foreground border border-border-strong">
                {t({
                  ar: COURSE_STATUS_LABELS[c.status],
                  en: COURSE_STATUS_LABELS_EN[c.status],
                })}
              </span>
            </div>
            <h1
              className="font-bold text-foreground leading-tight mb-3"
              style={{ fontSize: "clamp(1.7rem, 4vw, 2.4rem)" }}
              data-testid="text-course-title"
            >
              {c.title}
            </h1>
            {c.summary && (
              <p className="text-fg-secondary text-[15.5px] leading-[1.85] mb-6">
                {c.summary}
              </p>
            )}
            {c.description && (
              <div className="text-fg-secondary text-[14.5px] leading-[1.95] whitespace-pre-wrap">
                {c.description}
              </div>
            )}
          </div>
        </GlassCard>

        <div className="space-y-5">
          <GlassCard className="p-6">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
              {t({ ar: "التفاصيل", en: "Details" })}
            </div>
            <ul className="space-y-3 text-[13.5px] text-fg-secondary">
              {c.instructor && (
                <li className="flex items-start gap-3">
                  <UserIcon className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <div className="text-fg-faint text-[11px] tracking-wide">
                      {t({ ar: "المُدرِّب", en: "Instructor" })}
                    </div>
                    <div className="text-foreground font-semibold">{c.instructor}</div>
                  </div>
                </li>
              )}
              {c.startsAt && (
                <li className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <div className="text-fg-faint text-[11px] tracking-wide">
                      {t({ ar: "يبدأ", en: "Starts" })}
                    </div>
                    <div className="text-foreground font-semibold">
                      {fmtDateTime(c.startsAt, lang)}
                    </div>
                    {c.endsAt && (
                      <div className="text-muted-foreground text-[12px] mt-0.5">
                        {t({ ar: "ينتهي:", en: "Ends:" })}{" "}
                        {fmtDateTime(c.endsAt, lang)}
                      </div>
                    )}
                  </div>
                </li>
              )}
              {c.location && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <div className="text-fg-faint text-[11px] tracking-wide">
                      {t({ ar: "المكان", en: "Location" })}
                    </div>
                    <div className="text-foreground font-semibold">{c.location}</div>
                  </div>
                </li>
              )}
              <li className="flex items-start gap-3">
                <Users className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <div className="text-fg-faint text-[11px] tracking-wide">
                    {t({ ar: "المُسجَّلون", en: "Enrolled" })}
                  </div>
                  <div className="text-foreground font-semibold">
                    {num(c.enrolled, lang)}
                    {c.capacity > 0
                      ? ` ${t({ ar: "من أصل", en: "of" })} ${num(c.capacity, lang)}`
                      : ""}
                  </div>
                </div>
              </li>
            </ul>
          </GlassCard>

          <GlassCard className="p-6">
            {!user ? (
              <>
                <div className="text-fg-secondary text-[13.5px] leading-[1.85] mb-4">
                  {t({
                    ar: "سجّل دخولك لحجز مقعدك في هذه الفعاليّة.",
                    en: "Sign in to reserve your seat at this event.",
                  })}
                </div>
                <Link
                  href={`/login?next=/courses/${id}`}
                  className="block text-center w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] hover:-translate-y-px transition-all"
                  data-testid="button-login-to-enroll"
                >
                  {t({ ar: "تسجيل الدخول للحجز", en: "Sign in to reserve" })}
                </Link>
                <Link
                  href={`/register?next=/courses/${id}`}
                  className="block text-center mt-2 text-[12.5px] text-muted-foreground hover:text-primary transition-colors"
                >
                  {t({
                    ar: "ليس لديك حساب؟ أنشئ واحدًا",
                    en: "No account? Create one",
                  })}
                </Link>
              </>
            ) : data.isEnrolled ? (
              <>
                <div className="flex items-center gap-2 text-emerald-300 text-[13.5px] mb-4 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  {t({ ar: "أنت مسجَّل", en: "You're enrolled" })}
                  {data.myEnrollmentStatus === "confirmed"
                    ? t({ ar: " (مؤكَّد)", en: " (confirmed)" })
                    : t({ ar: " (بانتظار التأكيد)", en: " (awaiting confirmation)" })}
                </div>
                <button
                  onClick={onCancel}
                  disabled={busy}
                  className="w-full py-3 rounded-2xl bg-surface-2 border border-border-strong text-fg-secondary font-semibold text-[13.5px] hover:bg-red-500/10 hover:text-destructive hover:border-red-500/30 transition-colors disabled:opacity-50"
                  data-testid="button-cancel-enrollment"
                >
                  <XCircle className="w-4 h-4 inline ml-1.5" />
                  {t({ ar: "إلغاء الحجز", en: "Cancel reservation" })}
                </button>
              </>
            ) : c.status === "done" ? (
              <div className="text-muted-foreground text-[13.5px] text-center py-2">
                {t({ ar: "هذه الفعاليّة منتهية.", en: "This event has ended." })}
              </div>
            ) : isFull || c.status === "closed" ? (
              <div className="text-muted-foreground text-[13.5px] text-center py-2">
                {t({
                  ar: "اكتمل العدد. ترقّب الدفعة القادمة.",
                  en: "Fully booked. Watch for the next round.",
                })}
              </div>
            ) : (
              <>
                <div className="text-fg-secondary text-[13.5px] leading-[1.85] mb-4">
                  {t({
                    ar: "مَجّاني تمامًا — احجز مقعدك الآن.",
                    en: "Completely free — reserve your seat now.",
                  })}
                </div>
                <button
                  onClick={onEnroll}
                  disabled={busy}
                  className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px transition-all disabled:opacity-50"
                  data-testid="button-enroll"
                >
                  {busy ? "…" : t({ ar: "احجز مقعدي", en: "Reserve my seat" })}
                </button>
              </>
            )}
            {error && (
              <div className="mt-3 text-[12.5px] text-destructive">{error}</div>
            )}
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}
