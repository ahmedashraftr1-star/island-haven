import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Briefcase,
  GraduationCap,
  Coffee,
  PartyPopper,
  Eye,
  MoreHorizontal,
  Phone,
  Mail,
  User as UserIcon,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { HavenMark } from "@/components/landing/HavenMark";
import { useLanguage } from "@/contexts/LanguageContext";

type Step = 0 | 1 | 2 | 3;

interface ExpertOption {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  bio: string | null;
  acceptingSessions: boolean;
}

const TIME_SLOTS = [
  { id: "morning", label: "صباحًا", labelEn: "Morning", time: "٩ – ١٢", timeEn: "9 – 12", icon: "☕" },
  { id: "midday", label: "ظهرًا", labelEn: "Midday", time: "١٢ – ٣", timeEn: "12 – 3", icon: "☀️" },
  { id: "afternoon", label: "بعد الظهر", labelEn: "Afternoon", time: "٣ – ٥", timeEn: "3 – 5", icon: "🌅" },
  { id: "fullday", label: "اليوم الكامل", labelEn: "Full Day", time: "٩ – ٥", timeEn: "9 – 5", icon: "✨" },
] as const;

const PURPOSES = [
  { id: "work", label: "عمل مستقلّ", labelEn: "Freelance work", Icon: Briefcase },
  { id: "study", label: "دراسة", labelEn: "Study", Icon: GraduationCap },
  { id: "meeting", label: "اجتماع", labelEn: "Meeting", Icon: Users },
  { id: "event", label: "فعّاليّة", labelEn: "Event", Icon: PartyPopper },
  { id: "tour", label: "زيارة استكشافيّة", labelEn: "Exploratory visit", Icon: Eye },
  { id: "other", label: "غير ذلك", labelEn: "Other", Icon: MoreHorizontal },
] as const;

// Asia/Gaza working week: Saturday(6) - Thursday(4); Friday(5) closed.
const FRIDAY = 5;

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function arabicDay(d: Date) {
  return d.toLocaleDateString("ar-EG-u-nu-arab", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function arabicMonth(d: Date) {
  return d.toLocaleDateString("ar-EG", {
    month: "long",
    year: "numeric",
  });
}

const WEEKDAY_LABELS = ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
const WEEKDAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Book() {
  const { lang } = useLanguage();
  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [monthCursor, setMonthCursor] = useState<Date>(startOfMonth(new Date()));
  const [experts, setExperts] = useState<ExpertOption[] | null>(null);

  useEffect(() => {
    api<{ experts: ExpertOption[] }>("/experts")
      .then((r) => setExperts(r.experts))
      .catch(() => setExperts([]));
  }, []);

  const [form, setForm] = useState({
    visitDate: "",
    timeSlot: "" as "" | (typeof TIME_SLOTS)[number]["id"],
    purpose: "" as "" | (typeof PURPOSES)[number]["id"],
    attendees: 1,
    notes: "",
    expertId: null as number | null,
    slotId: null as number | null,
    fullName: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    document.title = lang === "en" ? "Book a seat — Island Haven" : "احجز مقعدك — آيلاند هيفن";
  }, [lang]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const monthGrid = useMemo(() => {
    const first = startOfMonth(monthCursor);
    const startWeekday = first.getDay(); // 0 = Sunday
    const daysInMonth = new Date(
      monthCursor.getFullYear(),
      monthCursor.getMonth() + 1,
      0,
    ).getDate();
    const cells: Array<{
      date: Date | null;
      iso: string;
      disabled: boolean;
      label: string;
    }> = [];
    for (let i = 0; i < startWeekday; i++)
      cells.push({ date: null, iso: "", disabled: true, label: "" });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(
        monthCursor.getFullYear(),
        monthCursor.getMonth(),
        d,
      );
      const isPast = date < today;
      const isFriday = date.getDay() === FRIDAY;
      cells.push({
        date,
        iso: ymd(date),
        disabled: isPast || isFriday,
        label: String(d).replace(/\d/g, (x) =>
          "٠١٢٣٤٥٦٧٨٩"[Number(x)],
        ),
      });
    }
    return cells;
  }, [monthCursor]);

  const canStep1 = form.visitDate && form.timeSlot;
  const canStep2 = form.purpose && form.attendees >= 1;
  const canStep3 = true;
  const canSubmit = canStep1 && canStep2 && form.fullName && form.phone;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setIssues({});
    try {
      const r = await api<{ ok: true; id: number }>("/bookings", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setDone({ id: r.id });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data === "object") {
        const d = e.data as {
          error?: string;
          issues?: Array<{ path: string; message: string }>;
        };
        setError(d.error || "فشل الإرسال");
        const m: Record<string, string> = {};
        for (const i of d.issues || []) m[i.path] = i.message;
        setIssues(m);
      } else {
        setError("فشل الإرسال، حاول مجدّدًا");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const selectedExpert = experts?.find((e) => e.id === form.expertId) ?? null;
  if (done) return <SuccessScreen id={done.id} form={form} expert={selectedExpert} />;

  return (
    <div
      dir={lang === "en" ? "ltr" : "rtl"}
      className="relative min-h-screen overflow-hidden bg-[#0A0E1A] text-white"
    >
      <BackgroundAura />

      {/* Top bar */}
      <header className="relative z-20 px-6 lg:px-10 pt-7 lg:pt-9 pb-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          data-testid="link-home"
        >
          <HavenMark size={36} className="text-primary" delay={0} />
          <div className="leading-tight">
            <div className="text-[14px] font-bold tracking-tight">
              Island Haven
            </div>
            <div className="text-[10.5px] text-white/55 font-medium">
              آيلاند هيفن · غزّة
            </div>
          </div>
        </Link>
        <Link
          href="/"
          className="text-[12.5px] text-white/65 hover:text-white inline-flex items-center gap-1.5 transition"
        >
          {lang === "en" ? "Back" : "العودة"} <ArrowLeft className={`w-3.5 h-3.5 ${lang === "en" ? "" : "rotate-180"}`} />
        </Link>
      </header>

      <div className="relative z-10 px-6 lg:px-10 pb-24 max-w-[1280px] mx-auto">
        <div className="text-center max-w-2xl mx-auto pt-8 lg:pt-12 pb-10 lg:pb-14">
          <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full bg-primary/15 text-primary text-[11px] tracking-[0.2em] font-semibold uppercase mb-5">
            <Sparkles className="w-3 h-3" />
            {lang === "en" ? "Book a seat · Completely free" : "احجز مقعدك · مجّاني تمامًا"}
          </div>
          <h1
            className="font-bold leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(2rem, 5.5vw, 3.5rem)" }}
          >
            {lang === "en" ? (
              <>Come to{" "}<span className="text-accent-gradient">Island Haven</span><br />your seat awaits.</>
            ) : (
              <>تعالَ إلى{" "}<span className="text-accent-gradient">آيلاند هيفن</span><br />مقعدك ينتظرك.</>
            )}
          </h1>
          <p className="mt-5 text-white/65 text-[15px] leading-[1.85] max-w-xl mx-auto">
            {lang === "en"
              ? "Pick a day, time slot, and optionally an expert to meet. No login, no fees, no hassle — just four steps."
              : "اختَر يومًا وفترة، وخبيرًا تودّ لقاءه اختياريًّا. لا حاجة لتسجيل دخول، ولا رسوم، ولا تعقيدات — فقط أربع خطوات."}
          </p>
        </div>

        <Stepper step={step} />

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-9 mt-10">
          {/* Form panel */}
          <div className="relative">
            <GlassPanel>
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <StepOne
                    key="s0"
                    form={form}
                    update={update}
                    monthCursor={monthCursor}
                    setMonthCursor={setMonthCursor}
                    monthGrid={monthGrid}
                  />
                )}
                {step === 1 && (
                  <StepTwo key="s1" form={form} update={update} />
                )}
                {step === 2 && (
                  <StepExpert key="s2" form={form} update={update} experts={experts} visitDate={form.visitDate} />
                )}
                {step === 3 && (
                  <StepThree
                    key="s3"
                    form={form}
                    update={update}
                    issues={issues}
                  />
                )}
              </AnimatePresence>

              {error && (
                <div className="mt-6 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-[13px]">
                  {error}
                </div>
              )}

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
                  disabled={step === 0}
                  className="h-11 px-5 rounded-full text-[13px] font-medium text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-2"
                  data-testid="button-back"
                >
                  <ChevronRight className={`w-4 h-4 ${lang === "en" ? "rotate-180" : ""}`} />
                  {lang === "en" ? "Back" : "السابق"}
                </button>
                {step < 3 ? (
                  <button
                    onClick={() =>
                      setStep((s) => Math.min(3, s + 1) as Step)
                    }
                    disabled={
                      (step === 0 && !canStep1) ||
                      (step === 1 && !canStep2) ||
                      (step === 2 && !canStep3)
                    }
                    className="h-12 px-7 rounded-full bg-primary text-primary-foreground text-[13.5px] font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[0_8px_28px_-8px_rgba(220,38,55,0.55)] flex items-center gap-2"
                    data-testid="button-next"
                  >
                    {step === 2
                      ? form.expertId
                        ? lang === "en" ? "Next" : "التالي"
                        : lang === "en" ? "Skip" : "تخطّ"
                      : lang === "en" ? "Next" : "التالي"}
                    <ChevronLeft className={`w-4 h-4 ${lang === "en" ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={!canSubmit || submitting}
                    className="h-12 px-7 rounded-full bg-primary text-primary-foreground text-[13.5px] font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[0_8px_28px_-8px_rgba(220,38,55,0.55)] flex items-center gap-2"
                    data-testid="button-submit"
                  >
                    {submitting ? (lang === "en" ? "Sending..." : "جارٍ الإرسال...") : (lang === "en" ? "Confirm booking" : "أكِّد الحجز")}
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </GlassPanel>
          </div>

          {/* Summary panel */}
          <SummaryCard
            form={form}
            expertName={experts?.find((e) => e.id === form.expertId)?.fullName}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function GlassPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-[28px] p-7 lg:p-10 bg-white/[0.04] border border-white/10 backdrop-blur-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(120% 80% at 100% 0%, rgba(220,38,55,0.18) 0%, transparent 55%), radial-gradient(120% 80% at 0% 100%, rgba(255,255,255,0.05) 0%, transparent 55%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const { lang } = useLanguage();
  const items = lang === "en"
    ? [{ n: 1, label: "Date" }, { n: 2, label: "Purpose" }, { n: 3, label: "Expert" }, { n: 4, label: "Your info" }]
    : [{ n: 1, label: "الموعد" }, { n: 2, label: "الهدف" }, { n: 3, label: "الخبير" }, { n: 4, label: "بياناتك" }];
  return (
    <div className="flex items-center justify-center gap-2 lg:gap-4">
      {items.map((it, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={it.n} className="flex items-center gap-2 lg:gap-4">
            <div
              className={`flex items-center gap-2.5 px-4 h-10 rounded-full transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_rgba(220,38,55,0.5)]"
                  : done
                    ? "bg-white/10 text-white/85"
                    : "bg-white/[0.04] text-white/45"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  active
                    ? "bg-white/20"
                    : done
                      ? "bg-emerald-400/20 text-emerald-300"
                      : "bg-white/10"
                }`}
              >
                {done ? "✓" : it.n}
              </span>
              <span className="text-[12.5px] font-semibold whitespace-nowrap">
                {it.label}
              </span>
            </div>
            {i < items.length - 1 && (
              <div className="w-6 lg:w-10 h-[1px] bg-white/15" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepShell({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-7">
        <h2 className="text-[22px] lg:text-[26px] font-bold leading-tight">
          {title}
        </h2>
        <p className="text-white/55 text-[13px] mt-1.5">{hint}</p>
      </div>
      {children}
    </motion.div>
  );
}

function StepOne({
  form,
  update,
  monthCursor,
  setMonthCursor,
  monthGrid,
}: {
  form: ReturnType<typeof useState<any>>[0] & {
    visitDate: string;
    timeSlot: string;
  };
  update: (k: any, v: any) => void;
  monthCursor: Date;
  setMonthCursor: (d: Date) => void;
  monthGrid: Array<{
    date: Date | null;
    iso: string;
    disabled: boolean;
    label: string;
  }>;
}) {
  const { lang } = useLanguage();
  return (
    <StepShell
      title={lang === "en" ? "Pick your day & time slot" : "اختر يومك وفترتك"}
      hint={lang === "en" ? "Open Sat–Thu · Closed Friday · Gaza time" : "مفتوحون السبت – الخميس · مغلقون يوم الجمعة · توقيت غزّة"}
    >
      <div className="grid md:grid-cols-2 gap-7">
        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMonthCursor(addMonths(monthCursor, -1))}
              className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition"
              aria-label={lang === "en" ? "Previous month" : "الشهر السابق"}
              data-testid="button-prev-month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="text-[13.5px] font-semibold tracking-tight">
              {lang === "en"
                ? monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                : arabicMonth(monthCursor)}
            </div>
            <button
              onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
              className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition"
              aria-label={lang === "en" ? "Next month" : "الشهر التالي"}
              data-testid="button-next-month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-[10px] text-white/40 font-semibold mb-2">
            {(lang === "en" ? WEEKDAY_LABELS_EN : WEEKDAY_LABELS).map((w) => (
              <div key={w} className="text-center">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {monthGrid.map((c, i) =>
              !c.date ? (
                <div key={i} />
              ) : (
                <button
                  key={c.iso}
                  onClick={() => !c.disabled && update("visitDate", c.iso)}
                  disabled={c.disabled}
                  data-testid={`day-${c.iso}`}
                  className={`aspect-square rounded-xl text-[13px] font-medium transition relative ${
                    form.visitDate === c.iso
                      ? "bg-primary text-primary-foreground shadow-[0_6px_18px_-6px_rgba(220,38,55,0.6)]"
                      : c.disabled
                        ? "text-white/15 cursor-not-allowed"
                        : "bg-white/[0.04] text-white/85 hover:bg-white/[0.10]"
                  }`}
                >
                  {c.label}
                </button>
              ),
            )}
          </div>
          <div className="mt-4 flex items-center gap-3 text-[11px] text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" /> {lang === "en" ? "Selected" : "مختار"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/15" /> {lang === "en" ? "Unavailable" : "غير متاح"}
            </span>
          </div>
        </div>

        {/* Time slots */}
        <div>
          <div className="flex items-center gap-2 mb-4 text-[12.5px] text-white/65">
            <Clock className="w-3.5 h-3.5" />
            <span>{lang === "en" ? "Pick a time slot" : "اختر الفترة"}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {TIME_SLOTS.map((s) => {
              const active = form.timeSlot === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => update("timeSlot", s.id)}
                  data-testid={`slot-${s.id}`}
                  className={`relative p-4 rounded-2xl ${lang === "en" ? "text-left" : "text-right"} transition group ${
                    active
                      ? "bg-primary/15 border border-primary/40 shadow-[0_10px_28px_-12px_rgba(220,38,55,0.4)]"
                      : "bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-white/20"
                  }`}
                >
                  <div className="text-[18px] mb-1.5">{s.icon}</div>
                  <div className="text-[13.5px] font-semibold">{lang === "en" ? s.labelEn : s.label}</div>
                  <div className="text-[11px] text-white/50 mt-0.5 font-mono">
                    {lang === "en" ? s.timeEn : s.time}
                  </div>
                  {active && (
                    <CheckCircle2 className="absolute top-3 left-3 w-4 h-4 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </StepShell>
  );
}

function StepTwo({
  form,
  update,
}: {
  form: { purpose: string; attendees: number; notes: string };
  update: (k: any, v: any) => void;
}) {
  const { lang } = useLanguage();
  return (
    <StepShell
      title={lang === "en" ? "What's the purpose of your visit?" : "ما الهدف من زيارتك؟"}
      hint={lang === "en" ? "Your choice helps us prepare the best space for you" : "اختياراتك تساعدنا نُجهّز لك المساحة الأنسب"}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PURPOSES.map(({ id, label, labelEn, Icon }) => {
          const active = form.purpose === id;
          return (
            <button
              key={id}
              onClick={() => update("purpose", id)}
              data-testid={`purpose-${id}`}
              className={`relative p-4 rounded-2xl text-right transition ${
                active
                  ? "bg-primary/15 border border-primary/40"
                  : "bg-white/[0.04] border border-white/10 hover:bg-white/[0.07]"
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-2.5 ${active ? "text-primary" : "text-white/55"}`}
                strokeWidth={2}
              />
              <div className="text-[13px] font-semibold">{lang === "en" ? labelEn : label}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3 text-[12.5px] text-white/65">
          <Users className="w-3.5 h-3.5" />
          <span>{lang === "en" ? "Number of people" : "عدد الأشخاص"}</span>
        </div>
        <div className="flex items-center gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
            const active = form.attendees === n;
            return (
              <button
                key={n}
                onClick={() => update("attendees", n)}
                data-testid={`att-${n}`}
                className={`w-11 h-11 rounded-full text-[13.5px] font-semibold transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_6px_18px_-6px_rgba(220,38,55,0.55)]"
                    : "bg-white/[0.05] text-white/70 hover:bg-white/[0.10]"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <label
          htmlFor="notes"
          className="block text-[12.5px] text-white/65 mb-2 flex items-center gap-2"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {lang === "en" ? "Additional notes" : "ملاحظات إضافيّة"} <span className="text-white/35">{lang === "en" ? "(optional)" : "(اختياريّ)"}</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder={lang === "en" ? "E.g. I need a seat near the window, or I'll need a display port..." : "مثلًا: أحتاج مقعدًا قرب النافذة، أو سأحتاج إلى منفذ شاشة..."}
          maxLength={1000}
          data-testid="textarea-notes"
          className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-[13.5px] placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/[0.07] transition resize-none"
        />
      </div>
    </StepShell>
  );
}

function ExpertSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl bg-white/[0.04] border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl skeleton-shimmer shrink-0" />
            <div className="min-w-0 flex flex-col gap-1.5 flex-1">
              <div className="h-3 rounded-md skeleton-shimmer w-4/5" />
              <div className="h-2.5 rounded-md skeleton-shimmer w-3/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface AvailableSlot {
  id: number;
  startAt: string;
  endAt: string;
  mode: "online" | "onsite";
}

function formatSlotTime(iso: string, lang: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(lang === "en" ? "en-US" : "ar-EG-u-nu-arab", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function StepExpert({
  form,
  update,
  experts,
  visitDate,
}: {
  form: { expertId: number | null; slotId: number | null };
  update: (k: any, v: any) => void;
  experts: ExpertOption[] | null;
  visitDate: string;
}) {
  const { lang } = useLanguage();
  const [availableIds, setAvailableIds] = useState<Set<number> | null>(null);
  const [daySlots, setDaySlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!visitDate) {
      setAvailableIds(null);
      return;
    }
    let cancelled = false;
    api<{ available: number[] }>(`/experts/available-on?date=${visitDate}`)
      .then((r) => {
        if (!cancelled) setAvailableIds(new Set(r.available));
      })
      .catch(() => {
        if (!cancelled) setAvailableIds(null);
      });
    return () => { cancelled = true; };
  }, [visitDate]);

  useEffect(() => {
    if (!form.expertId || !visitDate) {
      setDaySlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    api<{ slots: AvailableSlot[] }>(`/experts/${form.expertId}/slots`)
      .then((r) => {
        if (cancelled) return;
        const filtered = r.slots.filter((s) => {
          const slotDate = new Date(s.startAt);
          const y = slotDate.getFullYear();
          const m = String(slotDate.getMonth() + 1).padStart(2, "0");
          const d = String(slotDate.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}` === visitDate;
        });
        setDaySlots(filtered);
      })
      .catch(() => {
        if (!cancelled) setDaySlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => { cancelled = true; };
  }, [form.expertId, visitDate]);

  function handlePickExpert(id: number, currentlySelected: boolean) {
    if (currentlySelected) {
      update("expertId", null);
      update("slotId", null);
    } else {
      if (form.expertId !== id) update("slotId", null);
      update("expertId", id);
    }
  }

  return (
    <StepShell
      title={lang === "en" ? "Meet an expert?" : "هل تودّ لقاء خبير؟"}
      hint={lang === "en" ? "Optional — pick an expert you'd like to connect with during your visit" : "اختياريّ — اختَر خبيرًا تودّ التواصل معه خلال زيارتك"}
    >
      <AnimatePresence mode="wait">
        {experts === null ? (
          <motion.div
            key="expert-skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ExpertSkeleton />
          </motion.div>
        ) : experts.length === 0 ? (
          <motion.p
            key="expert-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-white/45 text-[13px]"
          >
            {lang === "en" ? "No experts available right now. You can skip this step." : "لا يوجد خبراء متاحون الآن. يمكنك تخطّي هذه الخطوة."}
          </motion.p>
        ) : (
          <>
          <motion.div
            key="expert-grid"
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.055 } } }}
          >
            {[...experts].sort((a, b) => {
              const rank = (e: ExpertOption) => {
                if (!e.acceptingSessions) return 2;
                if (availableIds !== null && availableIds.has(e.id)) return 0;
                return 1;
              };
              return rank(a) - rank(b);
            }).map((e) => {
              const selected = form.expertId === e.id;
              const initials = e.fullName.trim().charAt(0) || "؟";
              const hasSlot = availableIds !== null ? availableIds.has(e.id) : null;
              const unavailable = !e.acceptingSessions || hasSlot === false;
              return (
                <motion.button
                  key={e.id}
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                  onClick={() => handlePickExpert(e.id, selected)}
                  data-testid={`expert-pick-${e.id}`}
                  className={`relative p-4 rounded-2xl text-right transition group ${
                    unavailable && !selected ? "opacity-40" : ""
                  } ${
                    selected
                      ? "bg-primary/15 border border-primary/40 shadow-[0_8px_24px_-10px_rgba(220,38,55,0.4)]"
                      : hasSlot === true
                      ? "bg-emerald-500/[0.07] border border-emerald-500/25 hover:bg-emerald-500/[0.12] hover:border-emerald-500/40"
                      : "bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-white/20"
                  }`}
                >
                  {selected && (
                    <CheckCircle2 className="absolute top-2.5 left-2.5 w-4 h-4 text-primary" />
                  )}
                  {!selected && hasSlot === true && (
                    <span className="absolute top-2 left-2 h-4 px-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[9px] font-semibold leading-4">
                      {lang === "en" ? "Free" : "متاح"}
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    {e.avatarUrl ? (
                      <img
                        src={e.avatarUrl}
                        alt={e.fullName}
                        className="w-12 h-12 rounded-2xl object-cover border border-white/10 shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 border border-white/10 flex items-center justify-center text-lg font-bold text-white/80 shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold leading-snug line-clamp-1">
                        {e.fullName}
                      </div>
                      {e.headline && (
                        <div className="text-[11px] text-white/50 line-clamp-1 mt-0.5">
                          {e.headline}
                        </div>
                      )}
                      {!e.acceptingSessions ? (
                        <div className="text-[10.5px] text-white/35 mt-0.5">
                          {lang === "en" ? "Unavailable" : "غير متاح"}
                        </div>
                      ) : hasSlot === false ? (
                        <div className="text-[10.5px] text-white/35 mt-0.5">
                          {lang === "en" ? "No slot this day" : "لا موعد هذا اليوم"}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {form.expertId !== null && (
            <div className="mt-5 pt-5 border-t border-white/[0.07]">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <span className="text-[12px] text-white/50 font-medium">
                  {lang === "en" ? "Available slots for this day" : "المواعيد المتاحة لهذا اليوم"}
                  <span className="text-white/30 ms-1">
                    {lang === "en" ? "— optional" : "— اختياريّ"}
                  </span>
                </span>
              </div>

              {slotsLoading && (
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 w-24 rounded-xl skeleton-shimmer" />
                  ))}
                </div>
              )}

              {!slotsLoading && daySlots.length === 0 && (
                <p className="text-[12px] text-white/30 italic">
                  {lang === "en"
                    ? "No specific slots listed for this date — you can still book without a slot."
                    : "لا توجد مواعيد محدّدة لهذا اليوم — يمكنك الحجز دون تحديد موعد."}
                </p>
              )}

              {!slotsLoading && daySlots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((slot) => {
                    const picked = form.slotId === slot.id;
                    const start = formatSlotTime(slot.startAt, lang);
                    const end = formatSlotTime(slot.endAt, lang);
                    const modeLabel =
                      slot.mode === "online"
                        ? lang === "en" ? "Online" : "عن بُعد"
                        : lang === "en" ? "On-site" : "حضوريّ";
                    return (
                      <button
                        key={slot.id}
                        onClick={() => update("slotId", picked ? null : slot.id)}
                        data-testid={`slot-pick-${slot.id}`}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition border ${
                          picked
                            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-[0_4px_12px_-4px_rgba(52,211,153,0.3)]"
                            : "bg-white/[0.05] border-white/10 text-white/70 hover:bg-white/[0.09] hover:border-white/20"
                        }`}
                      >
                        {picked && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                        <span dir="ltr">{start} – {end}</span>
                        <span className="text-[10px] opacity-60">· {modeLabel}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
      </AnimatePresence>
    </StepShell>
  );
}

function StepThree({
  form,
  update,
  issues,
}: {
  form: { fullName: string; phone: string; email: string };
  update: (k: any, v: any) => void;
  issues: Record<string, string>;
}) {
  const { lang } = useLanguage();
  return (
    <StepShell
      title={lang === "en" ? "Your info" : "بياناتك"}
      hint={lang === "en" ? "We'll reach you on WhatsApp to confirm your booking" : "نتواصل معك على واتساب لتأكيد الحجز"}
    >
      <div className="space-y-5">
        <Field
          id="fullName"
          label={lang === "en" ? "Full name" : "الاسم الكامل"}
          icon={UserIcon}
          value={form.fullName}
          onChange={(v) => update("fullName", v)}
          error={issues.fullName}
          placeholder={lang === "en" ? "E.g. Lana Al-Sharif" : "مثلًا: لانا الشريف"}
          autoFocus
        />
        <div className="grid md:grid-cols-2 gap-5">
          <Field
            id="phone"
            label={lang === "en" ? "WhatsApp number" : "رقم الواتساب"}
            icon={Phone}
            value={form.phone}
            onChange={(v) => update("phone", v)}
            error={issues.phone}
            placeholder="+970 ..."
            ltr
          />
          <Field
            id="email"
            label={lang === "en" ? "Email address" : "البريد الإلكترونيّ"}
            optional
            icon={Mail}
            value={form.email}
            onChange={(v) => update("email", v)}
            error={issues.email}
            placeholder="you@example.com"
            ltr
          />
        </div>
        <div className="text-[11.5px] text-white/45 leading-[1.85]">
          {lang === "en"
            ? "By submitting you agree that we may contact you on the selected channel solely for booking confirmation. We will never share your data with third parties."
            : "بإرسال الحجز فأنت توافق على أن نتواصل معك على القناة المُختارة لأغراض تأكيد الزيارة فقط. لن نشارك بياناتك مع أيّ طرف ثالث."}
        </div>
      </div>
    </StepShell>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  error,
  placeholder,
  optional,
  ltr,
  autoFocus,
}: {
  id: string;
  label: string;
  icon: typeof UserIcon;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  optional?: boolean;
  ltr?: boolean;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[12.5px] text-white/65 mb-2 flex items-center gap-2"
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
        {optional && <span className="text-white/35">(اختياريّ)</span>}
      </label>
      <input
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={ltr ? "ltr" : "rtl"}
        data-testid={`input-${id}`}
        className={`w-full h-12 px-4 rounded-2xl bg-white/[0.05] border ${
          error ? "border-rose-400/50" : "border-white/10"
        } text-[14px] placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/[0.07] transition`}
      />
      {error && (
        <p className="mt-1.5 text-[11.5px] text-rose-300">{error}</p>
      )}
    </div>
  );
}

function SummaryCard({
  form,
  expertName,
}: {
  form: {
    visitDate: string;
    timeSlot: string;
    purpose: string;
    attendees: number;
    fullName: string;
    expertId: number | null;
  };
  expertName?: string;
}) {
  const { lang } = useLanguage();
  const slotLabel = TIME_SLOTS.find((s) => s.id === form.timeSlot);
  const purposeLabel = PURPOSES.find((p) => p.id === form.purpose);
  const dateObj = form.visitDate
    ? new Date(form.visitDate + "T00:00:00")
    : null;
  const dateDisplay = dateObj
    ? lang === "en"
      ? dateObj.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : arabicDay(dateObj)
    : "—";
  return (
    <aside className="lg:sticky lg:top-8 self-start">
      <div className="relative rounded-[24px] p-6 bg-white/[0.04] border border-white/10 backdrop-blur-2xl overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background:
              "radial-gradient(100% 80% at 50% 0%, rgba(220,38,55,0.16) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold">
              {lang === "en" ? "Booking summary" : "ملخّص حجزك"}
            </div>
          </div>

          <SummaryRow
            icon={CalendarIcon}
            label={lang === "en" ? "Date" : "التاريخ"}
            value={dateDisplay}
            placeholder={!dateObj}
          />
          <SummaryRow
            icon={Clock}
            label={lang === "en" ? "Time slot" : "الفترة"}
            value={
              slotLabel
                ? lang === "en"
                  ? `${slotLabel.labelEn} · ${slotLabel.timeEn}`
                  : `${slotLabel.label} · ${slotLabel.time}`
                : "—"
            }
            placeholder={!slotLabel}
          />
          <SummaryRow
            icon={Briefcase}
            label={lang === "en" ? "Purpose" : "الهدف"}
            value={(lang === "en" ? purposeLabel?.labelEn : purposeLabel?.label) || "—"}
            placeholder={!purposeLabel}
          />
          <SummaryRow
            icon={Users}
            label={lang === "en" ? "Attendees" : "الأشخاص"}
            value={String(form.attendees)}
          />
          <SummaryRow
            icon={UserIcon}
            label={lang === "en" ? "Expert" : "الخبير"}
            value={expertName || (lang === "en" ? "None selected" : "لم يُختَر")}
            placeholder={!form.expertId}
          />
          <SummaryRow
            icon={UserIcon}
            label={lang === "en" ? "Name" : "باسم"}
            value={form.fullName || "—"}
            placeholder={!form.fullName}
          />

          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex items-center gap-2.5 text-[12px] text-white/55 leading-[1.7]">
              <Coffee className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span>{lang === "en" ? "Coffee, tea & fast Wi-Fi · always on us." : "قهوة وشاي وإنترنت سريع · على حسابنا دائمًا."}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  placeholder,
}: {
  icon: typeof CalendarIcon;
  label: string;
  value: string;
  placeholder?: boolean;
}) {
  return (
    <div className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3 border-b border-white/5 last:border-0">
      <Icon className="w-4 h-4 text-white/40 mt-0.5 shrink-0" strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] text-white/45 mb-0.5">{label}</div>
        <div
          className={`text-[13px] font-semibold truncate ${placeholder ? "text-white/35" : "text-white"}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function BackgroundAura() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.45] pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 0%, rgba(220,38,55,0.35) 0%, transparent 60%), radial-gradient(50% 40% at 0% 100%, rgba(220,38,55,0.18) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  );
}

function SuccessScreen({
  id,
  form,
  expert,
}: {
  id: number;
  form: {
    visitDate: string;
    timeSlot: string;
    fullName: string;
  };
  expert: ExpertOption | null;
}) {
  const { lang } = useLanguage();
  const slotLabel = TIME_SLOTS.find((s) => s.id === form.timeSlot);
  const dateObj = new Date(form.visitDate + "T00:00:00");
  const ref = String(id).padStart(5, "0");
  const dateDisplay = lang === "en"
    ? dateObj.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : arabicDay(dateObj);
  return (
    <div
      dir={lang === "en" ? "ltr" : "rtl"}
      className="relative min-h-screen overflow-hidden bg-[#0A0E1A] text-white flex items-center justify-center px-6 py-16"
    >
      <BackgroundAura />
      <Confetti />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-lg w-full"
      >
        <div className="relative rounded-[28px] p-9 bg-white/[0.06] border border-white/10 backdrop-blur-2xl text-center overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-70"
            style={{
              background:
                "radial-gradient(80% 60% at 50% 0%, rgba(220,38,55,0.25) 0%, transparent 60%)",
            }}
          />
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 14 }}
              className="w-20 h-20 mx-auto rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-primary" strokeWidth={2.2} />
            </motion.div>
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-3">
              {lang === "en" ? "Booking confirmed" : "تمّ بنجاح"}
            </div>
            <h1 className="text-[28px] lg:text-[34px] font-bold leading-tight mb-3">
              {lang === "en" ? (
                <>Your seat is booked,{" "}<span className="text-accent-gradient">{form.fullName.split(" ")[0]}</span>!</>
              ) : (
                <>مقعدك محجوز يا{" "}<span className="text-accent-gradient">{form.fullName.split(" ")[0]}</span></>
              )}
            </h1>
            <p className="text-white/65 text-[14px] leading-[1.85] mb-6">
              {lang === "en" ? (
                <>
                  See you on{" "}
                  <span className="text-white font-semibold">{dateDisplay}</span>
                  {slotLabel && (
                    <> · <span className="text-white font-semibold">{slotLabel.labelEn}</span></>
                  )}
                  .<br />
                  We'll send you a WhatsApp confirmation shortly.
                </>
              ) : (
                <>
                  نراك يوم{" "}
                  <span className="text-white font-semibold">{dateDisplay}</span>
                  {slotLabel && (
                    <> · <span className="text-white font-semibold">{slotLabel.label}</span></>
                  )}
                  .<br />
                  سنرسل لك رسالة تأكيد على واتساب قريبًا.
                </>
              )}
            </p>
            {expert && (
              <div className="mb-6 py-4 px-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-4">
                <div className="relative shrink-0">
                  {expert.avatarUrl ? (
                    <img
                      src={expert.avatarUrl}
                      alt={expert.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/40"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary text-lg font-bold">
                      {expert.fullName.trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -end-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-[#0A0E1A]" />
                </div>
                <div className={`flex-1 min-w-0 text-${lang === "en" ? "left" : "right"}`}>
                  <p className="text-[10.5px] text-white/45 mb-0.5">
                    {lang === "en" ? "Your mentor" : "مرشدك"}
                  </p>
                  <p className="text-[14px] font-semibold text-white truncate">
                    {expert.fullName}
                  </p>
                  {expert.headline && (
                    <p className="text-[11px] text-white/50 truncate mt-0.5">
                      {expert.headline}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-white/[0.06] border border-white/10 text-[12px] text-white/65 mb-7">
              <span className="text-white/45">{lang === "en" ? "Booking ref." : "رقم الحجز"}</span>
              <span className="font-mono font-bold text-white tracking-wider">
                #{ref}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="h-11 px-6 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:brightness-110 transition flex items-center gap-2"
                data-testid="link-home-success"
              >
                {lang === "en" ? "Back to home" : "العودة للرئيسيّة"}
                <ArrowLeft className={`w-4 h-4 ${lang === "en" ? "" : "rotate-180"}`} />
              </Link>
              <Link
                href="/book"
                className="h-11 px-6 rounded-full bg-white/[0.06] border border-white/10 text-[13px] font-semibold hover:bg-white/[0.10] transition"
                data-testid="link-new-booking"
                onClick={() => window.location.reload()}
              >
                {lang === "en" ? "New booking" : "حجز آخر"}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        d: 2.5 + Math.random() * 2,
        delay: Math.random() * 0.6,
        rot: Math.random() * 360,
        size: 6 + Math.random() * 8,
        hue: Math.random() > 0.5 ? "hsl(354 80% 58%)" : "hsl(0 0% 95%)",
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{
            y: typeof window !== "undefined" ? window.innerHeight + 40 : 800,
            opacity: [0, 1, 1, 0],
            rotate: p.rot,
          }}
          transition={{ duration: p.d, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.45,
            background: p.hue,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
