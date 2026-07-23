import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle2,
  Check,
  ArrowLeft,
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
  Info,
  X,
  ExternalLink,
  Globe,
  Linkedin,
  Sunrise,
  Sun,
  Sunset,
  Sparkles,
  Armchair,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { HavenMark } from "@/components/landing/HavenMark";
import { SeatMap } from "@/components/booking/SeatMap";
import { Reveal } from "@/components/landing/Reveal";
import { useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { Btn } from "@/components/ui/Btn";
import { EASE_OUT_EXPO } from "@/lib/motion";

type Step = 0 | 1 | 2 | 3;

interface ExpertOption {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  bio: string | null;
  expertise: string | null;
  yearsExperience: number | null;
  languages: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  acceptingSessions: boolean;
  sessionMinutes: number | null;
  availabilityNote: string | null;
}

const TIME_SLOTS = [
  { id: "morning", labelKey: "slot0Label", labelEnKey: "slot0LabelEn", timeKey: "slot0Time", timeEnKey: "slot0TimeEn", Icon: Sunrise },
  { id: "midday", labelKey: "slot1Label", labelEnKey: "slot1LabelEn", timeKey: "slot1Time", timeEnKey: "slot1TimeEn", Icon: Sun },
  { id: "afternoon", labelKey: "slot2Label", labelEnKey: "slot2LabelEn", timeKey: "slot2Time", timeEnKey: "slot2TimeEn", Icon: Sunset },
  { id: "fullday", labelKey: "slot3Label", labelEnKey: "slot3LabelEn", timeKey: "slot3Time", timeEnKey: "slot3TimeEn", Icon: Sparkles },
] as const;

const PURPOSES = [
  { id: "work", labelKey: "purpose0Label", labelEnKey: "purpose0LabelEn", Icon: Briefcase },
  { id: "study", labelKey: "purpose1Label", labelEnKey: "purpose1LabelEn", Icon: GraduationCap },
  { id: "meeting", labelKey: "purpose2Label", labelEnKey: "purpose2LabelEn", Icon: Users },
  { id: "event", labelKey: "purpose3Label", labelEnKey: "purpose3LabelEn", Icon: PartyPopper },
  { id: "tour", labelKey: "purpose4Label", labelEnKey: "purpose4LabelEn", Icon: Eye },
  { id: "other", labelKey: "purpose5Label", labelEnKey: "purpose5LabelEn", Icon: MoreHorizontal },
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

const WEEKDAY_KEYS = ["weekday0","weekday1","weekday2","weekday3","weekday4","weekday5","weekday6"] as const;

const PAGE_BOOK_FALLBACK = {
  bk0: "فشل الإرسال",
  bk0En: "Submission failed",
  bk1: "فشل الإرسال، حاول مجدّدًا",
  bk1En: "Submission failed, please try again",
  bk2: "اختر مقعدك",
  bk2En: "Choose your seat",
  bk3: "(اختياريّ)",
  bk3En: "(optional)",
  bk4: "اختر التاريخ والفترة أوّلًا لعرض المقاعد المتاحة على خريطة القاعة.",
  bk4En: "Pick a date and slot first to see live seat availability on the hall map.",
  bk5: "العودة",
  bk5En: "Back",
  bk6: "احجز مقعدك · مجّانًا",
  bk6En: "Book a seat · Free",
  bk7: "اختَر يومًا وفترة، وخبيرًا تودّ لقاءه إن شئت. لا تسجيل دخول، ولا رسوم، ولا تعقيد — أربع خطوات فقط، ومجّانًا تمامًا.",
  bk7En: "Pick a day, a time slot, and — if you like — an expert to meet. No login, no fees, no hassle. Just four steps, completely free.",
  bk8: "السابق",
  bk8En: "Back",
  bk9: "التالي",
  bk9En: "Next",
  bk10: "تخطّ",
  bk10En: "Skip",
  bk11: "جارٍ الإرسال...",
  bk11En: "Sending...",
  bk12: "أكِّد الحجز",
  bk12En: "Confirm booking",
  bk13: "اختر يومك وفترتك",
  bk13En: "Pick your day & time slot",
  bk14: "مفتوحون السبت – الخميس · مغلقون يوم الجمعة · توقيت غزّة",
  bk14En: "Open Sat–Thu · Closed Friday · Gaza time",
  bk15: "مختار",
  bk15En: "Selected",
  bk16: "غير متاح",
  bk16En: "Unavailable",
  bk17: "اختر الفترة",
  bk17En: "Pick a time slot",
  bk18: "ما الهدف من زيارتك؟",
  bk18En: "What's the purpose of your visit?",
  bk19: "اختياراتك تساعدنا نُجهّز لك المساحة الأنسب",
  bk19En: "Your choice helps us prepare the best space for you",
  bk20: "عدد الأشخاص",
  bk20En: "Number of people",
  bk21: "ملاحظات إضافيّة",
  bk21En: "Additional notes",
  bk22: "اللغات: ",
  bk22En: "Languages: ",
  bk23: "الموقع",
  bk23En: "Website",
  bk24: "لا يستقبل جلسات حاليًا",
  bk24En: "Not accepting sessions right now",
  bk25: "إلغاء اختيار الخبير",
  bk25En: "Deselect expert",
  bk26: "اختَر هذا الخبير",
  bk26En: "Pick this expert",
  bk27: "هل تودّ لقاء خبير؟",
  bk27En: "Meet an expert?",
  bk28: "اختياريّ — اختَر خبيرًا تودّ التواصل معه خلال زيارتك",
  bk28En: "Optional — pick an expert you'd like to connect with during your visit",
  bk29: "لا يوجد خبراء متاحون الآن. يمكنك تخطّي هذه الخطوة.",
  bk29En: "No experts available right now. You can skip this step.",
  bk30: "الملف",
  bk30En: "profile",
  bk31: "لا موعد هذا اليوم",
  bk31En: "No slot this day",
  bk32: "المواعيد المتاحة لهذا اليوم",
  bk32En: "Available slots for this day",
  bk33: "— اختياريّ",
  bk33En: "— optional",
  bk34: "لا توجد مواعيد محدّدة لهذا اليوم — يمكنك الحجز دون تحديد موعد.",
  bk34En: "No specific slots listed for this date — you can still book without a slot.",
  bk35: "عن بُعد",
  bk35En: "Online",
  bk36: "حضوريّ",
  bk36En: "On-site",
  bk37: "بياناتك",
  bk37En: "Your info",
  bk38: "نتواصل معك على واتساب لتأكيد الحجز",
  bk38En: "We'll reach you on WhatsApp to confirm your booking",
  bk39: "الاسم الكامل",
  bk39En: "Full name",
  bk40: "رقم الواتساب",
  bk40En: "WhatsApp number",
  bk41: "البريد الإلكترونيّ",
  bk41En: "Email address",
  bk42: "بإرسال الحجز فأنت توافق على أن نتواصل معك على القناة المُختارة لأغراض تأكيد الزيارة فقط. لن نشارك بياناتك مع أيّ طرف ثالث.",
  bk42En: "By submitting you agree that we may contact you on the selected channel solely for booking confirmation. We will never share your data with third parties.",
  bk43: "الملخّص",
  bk43En: "Summary",
  bk44: "ملخّص حجزك",
  bk44En: "Your booking",
  bk45: "التاريخ",
  bk45En: "Date",
  bk46: "الفترة",
  bk46En: "Time slot",
  bk47: "المقعد",
  bk47En: "Seat",
  bk48: "أيّ مقعد متاح",
  bk48En: "Any available",
  bk49: "الهدف",
  bk49En: "Purpose",
  bk50: "الأشخاص",
  bk50En: "Attendees",
  bk51: "الخبير",
  bk51En: "Expert",
  bk52: "لم يُختَر",
  bk52En: "None selected",
  bk53: "وقت الجلسة",
  bk53En: "Session time",
  bk54: "باسم",
  bk54En: "Name",
  bk55: "قهوة وشاي وإنترنت سريع · على حسابنا دائمًا.",
  bk55En: "Coffee, tea & fast Wi-Fi · always on us.",
  bk56: "تمّ الحجز بنجاح",
  bk56En: "Booking confirmed",
  bk57: "مرشدك",
  bk57En: "Your mentor",
  bk58: "رقم الحجز",
  bk58En: "Booking ref.",
  bk59: "العودة للرئيسيّة",
  bk59En: "Back to home",
  bk60: "حجز آخر",
  bk60En: "New booking",
  bk61: "مثلًا: أحتاج مقعدًا قرب النافذة، أو سأحتاج إلى منفذ شاشة...",
  bk61En: "E.g. I need a seat near the window, or I'll need a display port...",
  bk62: "مثلًا: لانا الشريف",
  bk62En: "E.g. Lana Al-Sharif",
  slot0Label: "صباحًا",
  slot0LabelEn: "Morning",
  slot0Time: "٩ – ١٢",
  slot0TimeEn: "9 – 12",
  slot1Label: "ظهرًا",
  slot1LabelEn: "Midday",
  slot1Time: "١٢ – ٣",
  slot1TimeEn: "12 – 3",
  slot2Label: "بعد الظهر",
  slot2LabelEn: "Afternoon",
  slot2Time: "٣ – ٥",
  slot2TimeEn: "3 – 5",
  slot3Label: "اليوم الكامل",
  slot3LabelEn: "Full Day",
  slot3Time: "٩ – ٥",
  slot3TimeEn: "9 – 5",
  purpose0Label: "عمل مستقلّ",
  purpose0LabelEn: "Freelance work",
  purpose1Label: "دراسة",
  purpose1LabelEn: "Study",
  purpose2Label: "اجتماع",
  purpose2LabelEn: "Meeting",
  purpose3Label: "فعّاليّة",
  purpose3LabelEn: "Event",
  purpose4Label: "زيارة استكشافيّة",
  purpose4LabelEn: "Exploratory visit",
  purpose5Label: "غير ذلك",
  purpose5LabelEn: "Other",
  weekday0: "أحد",
  weekday0En: "Sun",
  weekday1: "اثن",
  weekday1En: "Mon",
  weekday2: "ثلا",
  weekday2En: "Tue",
  weekday3: "أرب",
  weekday3En: "Wed",
  weekday4: "خمي",
  weekday4En: "Thu",
  weekday5: "جمع",
  weekday5En: "Fri",
  weekday6: "سبت",
  weekday6En: "Sat",
  headlineLine1: "تعالَ إلى",
  headlineLine1En: "Come to",
  headlineLine2: "آيلاند هيفن —",
  headlineLine2En: "Island Haven —",
  headlineAccent: "مقعدك ينتظرك.",
  headlineAccentEn: "your seat awaits.",
};

export default function Book() {
  const { lang, t } = useLanguage();
  const c = useContentSection("pageBook", PAGE_BOOK_FALLBACK);
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>(0);
  // Track navigation direction so step transitions read as a deliberate
  // forward / back motion (+1 next, -1 back) instead of a flat fade.
  const [navDir, setNavDir] = useState<1 | -1>(1);
  const goStep = (next: Step) =>
    setStep((s) => {
      setNavDir(next >= s ? 1 : -1);
      return next;
    });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [monthCursor, setMonthCursor] = useState<Date>(startOfMonth(new Date()));
  const [experts, setExperts] = useState<ExpertOption[] | null>(null);
  const [selectedSlotMeta, setSelectedSlotMeta] = useState<AvailableSlot | null>(null);

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
    seat: null as number | null,
    expertId: null as number | null,
    slotId: null as number | null,
    fullName: "",
    phone: "",
    email: "",
  });
  // REAL per-seat reservations from the availability endpoint. The seat map shows
  // genuinely taken seats (not a count estimate); the DB enforces uniqueness.
  const [takenSeats, setTakenSeats] = useState<
    Array<{ visitDate: string; timeSlot: string; seat: number }>
  >([]);
  // Admin-blocked seats (disabled / maintenance / reserved) — never bookable, on
  // every date. Rendered distinct + non-selectable on the map (same source the
  // homepage preview reads, so both surfaces agree).
  const [blockedSeats, setBlockedSeats] = useState<number[]>([]);
  useEffect(() => {
    let alive = true;
    api<{ takenSeats: Array<{ visitDate: string; timeSlot: string; seat: number }>; blockedSeats?: Array<{ seat: number }> }>(
      "/bookings/availability",
    )
      .then((r) => {
        if (!alive) return;
        setTakenSeats(r.takenSeats ?? []);
        setBlockedSeats((r.blockedSeats ?? []).map((b) => b.seat));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const takenSeatsForSlot = useMemo(() => {
    if (!form.visitDate || !form.timeSlot) return [];
    return takenSeats
      .filter((s) => s.visitDate === form.visitDate && s.timeSlot === form.timeSlot)
      .map((s) => s.seat);
  }, [takenSeats, form.visitDate, form.timeSlot]);


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
      // `seat` is now a real, DB-enforced column — send it as a field. A taken
      // seat comes back as 409 «المقعد محجوز» (shown via the error path below).
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
        setError(e.message || t({ ar: c.bk0, en: c.bk0En }));
        const m: Record<string, string> = {};
        for (const i of d.issues || []) m[i.path] = i.message;
        setIssues(m);
      } else {
        setError(t({ ar: c.bk1, en: c.bk1En }));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const selectedExpert = experts?.find((e) => e.id === form.expertId) ?? null;
  if (done) return <SuccessScreen id={done.id} form={form} expert={selectedExpert} />;

  const headlineLines =
    lang === "en"
      ? [c.headlineLine1En, c.headlineLine2En, <span key="a" className="text-primary">{c.headlineAccentEn}</span>]
      : [c.headlineLine1, c.headlineLine2, <span key="a" className="text-primary">{c.headlineAccent}</span>];

  return (
    <div
      dir={lang === "en" ? "ltr" : "rtl"}
      className="relative min-h-screen bg-background text-foreground"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      {/* Signature dark brand aura — the same lit-canvas atmosphere the homepage
          and Apply wear, so Book never reads as a flat dark-on-dark form. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] brand-aura opacity-70" />

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
            <div className="text-[10.5px] text-muted-foreground font-medium">
              آيلاند هيفن · غزّة
            </div>
          </div>
        </Link>
        <Link
          href="/"
          className="text-[12.5px] text-fg-secondary hover:text-foreground inline-flex items-center gap-1.5 transition"
        >
          {lang === "en" ? c.bk5En : c.bk5} <ArrowLeft className={`w-3.5 h-3.5 ${lang === "en" ? "" : "rotate-180"}`} />
        </Link>
      </header>

      <div className="relative z-10 px-6 lg:px-10 pb-24 max-w-[1280px] mx-auto">
        {/* ── Monumental header — one quiet thesis on acres of space, one crimson line ── */}
        <header className="max-w-4xl pt-[clamp(3rem,8vh,6rem)] pb-[clamp(3.5rem,8vh,6rem)]">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="flex items-center gap-3 mb-[clamp(1.25rem,2.5vw,2rem)]"
          >
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="eyebrow text-primary">
              {lang === "en" ? c.bk6En : c.bk6}
            </span>
          </motion.div>
          <h1
            className="font-display text-foreground"
            style={{
              fontSize: "clamp(2.6rem, 7.2vw, 5.5rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.04em",
              fontWeight: 700,
            }}
          >
            {headlineLines.map((ln, i) => (
              <motion.span
                key={i}
                className="block will-change-transform"
                initial={reduce ? false : { opacity: 0, y: 30 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.08 + i * 0.09, ease: EASE_OUT_EXPO }}
              >
                {ln}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.5, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(1.75rem,3.5vw,2.5rem)] max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {lang === "en" ? c.bk7En : c.bk7}
          </motion.p>
          <motion.div
            aria-hidden
            initial={reduce ? false : { opacity: 0 }}
            animate={reduce ? undefined : { opacity: 1 }}
            transition={{ duration: 0.85, delay: 0.6, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(2.25rem,4.5vw,3.25rem)] h-px w-full bg-gradient-to-r from-border-strong via-border-strong/40 to-transparent rtl:bg-gradient-to-l"
          />
        </header>

        <Stepper step={step} />

        <Reveal as="div" delay={0.12} className="grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-9 mt-10">
          {/* Form panel */}
          <div className="relative">
            <Panel>
              <AnimatePresence mode="wait" custom={navDir}>
                {step === 0 && (
                  <StepOne
                    key="s0"
                    navDir={navDir}
                    form={form}
                    update={update}
                    monthCursor={monthCursor}
                    setMonthCursor={setMonthCursor}
                    monthGrid={monthGrid}
                    takenSeats={takenSeatsForSlot}
                    blockedSeats={blockedSeats}
                  />
                )}
                {step === 1 && (
                  <StepTwo key="s1" navDir={navDir} form={form} update={update} />
                )}
                {step === 2 && (
                  <StepExpert key="s2" navDir={navDir} form={form} update={update} experts={experts} visitDate={form.visitDate} onSlotMetaChange={setSelectedSlotMeta} />
                )}
                {step === 3 && (
                  <StepThree
                    key="s3"
                    navDir={navDir}
                    form={form}
                    update={update}
                    issues={issues}
                  />
                )}
              </AnimatePresence>

              {error && (
                <div role="alert" aria-live="assertive" className="mt-6 px-4 py-3 rounded-xl bg-destructive/[0.12] border border-destructive/40 text-destructive text-[13px]">
                  {error}
                </div>
              )}

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  onClick={() => goStep(Math.max(0, step - 1) as Step)}
                  disabled={step === 0}
                  className="h-11 px-5 rounded-full text-[13px] font-medium text-fg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-2"
                  data-testid="button-back"
                >
                  <ChevronRight className={`w-4 h-4 ${lang === "en" ? "rotate-180" : ""}`} />
                  {lang === "en" ? c.bk8En : c.bk8}
                </button>
                {step < 3 ? (
                  <Btn
                    variant="primary"
                    size="md"
                    onClick={() => goStep(Math.min(3, step + 1) as Step)}
                    disabled={
                      (step === 0 && !canStep1) ||
                      (step === 1 && !canStep2) ||
                      (step === 2 && !canStep3)
                    }
                    className="disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid="button-next"
                  >
                    {step === 2
                      ? form.expertId
                        ? lang === "en" ? c.bk9En : c.bk9
                        : lang === "en" ? c.bk10En : c.bk10
                      : lang === "en" ? c.bk9En : c.bk9}
                    <ChevronLeft className={`w-4 h-4 ${lang === "en" ? "rotate-180" : ""}`} />
                  </Btn>
                ) : (
                  <Btn
                    variant="primary"
                    size="md"
                    onClick={submit}
                    disabled={!canSubmit || submitting}
                    className="disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid="button-submit"
                  >
                    {submitting ? (lang === "en" ? c.bk11En : c.bk11) : (lang === "en" ? c.bk12En : c.bk12)}
                    <CheckCircle2 className="w-4 h-4" />
                  </Btn>
                )}
              </div>
            </Panel>
          </div>

          {/* Summary panel */}
          <SummaryCard
            form={form}
            expertName={experts?.find((e) => e.id === form.expertId)?.fullName}
            selectedSlot={selectedSlotMeta}
          />
        </Reveal>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

// The primary booking surface — a frosted glass panel floating on the dark
// canvas (the site-wide "Vision Pro" material). Legibility first: the panel
// darkens the aura behind it so white form text stays razor-sharp.
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-panel-lg relative p-7 lg:p-11 overflow-hidden">
      {children}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const { lang } = useLanguage();
  const items = lang === "en"
    ? [{ n: 1, label: "Date" }, { n: 2, label: "Purpose" }, { n: 3, label: "Expert" }, { n: 4, label: "Your info" }]
    : [{ n: 1, label: "الموعد" }, { n: 2, label: "الهدف" }, { n: 3, label: "الخبير" }, { n: 4, label: "بياناتك" }];
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 lg:gap-4">
      {items.map((it, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={it.n} className="flex items-center gap-1.5 sm:gap-2 lg:gap-4">
            <div
              className={`flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 h-10 rounded-full border transition ${
                active
                  ? "cta-fill border-transparent"
                  : done
                    ? "bg-primary/[0.10] border-primary/40 text-foreground"
                    : "bg-white/[0.04] border-white/10 text-fg-faint"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  active
                    ? "bg-white/25 text-primary-foreground"
                    : done
                      ? "bg-primary/20 text-primary"
                      : "bg-white/[0.06]"
                }`}
              >
                {done ? <Check className="w-3 h-3" strokeWidth={3} /> : it.n}
              </span>
              {/* On mobile only the ACTIVE step keeps its label — inactive labels
                  hide so the 4-step rail fits a 390px viewport without overflow. */}
              <span
                className={`text-[12.5px] font-semibold whitespace-nowrap rtl:tracking-normal ${
                  active ? "" : "hidden sm:inline"
                }`}
              >
                {it.label}
              </span>
            </div>
            {i < items.length - 1 && (
              <div className="w-3 sm:w-6 lg:w-10 h-[1px] bg-white/12 shrink-0" />
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
  navDir = 1,
  children,
}: {
  title: string;
  hint: string;
  navDir?: 1 | -1;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  // Direction-aware slide: forward steps enter from the leading edge, back steps
  // from the trailing edge. RTL-agnostic — we shift along x by a small amount and
  // let AnimatePresence's `custom` carry the sign.
  const enterX = navDir === 1 ? 26 : -26;
  return (
    <motion.div
      custom={navDir}
      initial={reduce ? false : { opacity: 0, x: enterX }}
      animate={reduce ? undefined : { opacity: 1, x: 0 }}
      exit={reduce ? undefined : { opacity: 0, x: -enterX }}
      transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
    >
      <div className="mb-8">
        <h2
          className="font-display font-bold text-foreground"
          style={{ fontSize: "clamp(1.55rem, 3vw, 2.1rem)", letterSpacing: "-0.032em", lineHeight: 1.08 }}
        >
          {title}
        </h2>
        <p className="text-fg-secondary text-[13.5px] mt-3 leading-relaxed max-w-xl">{hint}</p>
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
  navDir,
  takenSeats,
  blockedSeats,
}: {
  form: ReturnType<typeof useState<any>>[0] & {
    visitDate: string;
    timeSlot: string;
    seat: number | null;
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
  navDir?: 1 | -1;
  takenSeats: number[];
  blockedSeats: number[];
}) {
  const { lang, t } = useLanguage();
  const c = useContentSection("pageBook", PAGE_BOOK_FALLBACK);
  return (
    <StepShell
      navDir={navDir}
      title={lang === "en" ? c.bk13En : c.bk13}
      hint={lang === "en" ? c.bk14En : c.bk14}
    >
      <div className="grid md:grid-cols-2 gap-7">
        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMonthCursor(addMonths(monthCursor, -1))}
              className="w-9 h-9 max-sm:w-11 max-sm:h-11 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 text-foreground flex items-center justify-center transition"
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
              className="w-9 h-9 max-sm:w-11 max-sm:h-11 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 text-foreground flex items-center justify-center transition"
              aria-label={lang === "en" ? "Next month" : "الشهر التالي"}
              data-testid="button-next-month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-[10px] text-muted-foreground font-semibold mb-2">
            {WEEKDAY_KEYS.map((wk) => { const w = lang === "en" ? c[`${wk}En`] : c[wk]; return (
              <div key={wk} className="text-center">
                {w}
              </div>
            ); })}
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
                  className={`aspect-square max-sm:aspect-auto max-sm:min-h-[44px] rounded-xl text-[13px] font-medium transition relative ${
                    form.visitDate === c.iso
                      ? "bg-primary-cta text-primary-foreground shadow-[0_8px_22px_-6px_hsl(12_70%_52%/0.55)]"
                      : c.disabled
                        ? "text-fg-faint/45 cursor-not-allowed"
                        : "bg-white/[0.05] border border-white/[0.08] text-foreground hover:bg-white/[0.1] hover:border-white/20"
                  }`}
                >
                  {c.label}
                </button>
              ),
            )}
          </div>
          <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" /> {lang === "en" ? c.bk15En : c.bk15}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-border-strong" /> {lang === "en" ? c.bk16En : c.bk16}
            </span>
          </div>
        </div>

        {/* Time slots */}
        <div>
          <div className="flex items-center gap-2 mb-4 text-[12.5px] text-fg-secondary">
            <Clock className="w-3.5 h-3.5" />
            <span>{lang === "en" ? c.bk17En : c.bk17}</span>
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
                      ? "bg-primary/[0.10] border border-primary/45 shadow-[0_12px_30px_-14px_hsl(12_70%_52%/0.4)]"
                      : "bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-primary/30"
                  }`}
                >
                  <s.Icon className={`w-[18px] h-[18px] mb-1.5 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={2} />
                  <div className="text-[13.5px] font-semibold text-foreground">{lang === "en" ? c[s.labelEnKey] : c[s.labelKey]}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                    {lang === "en" ? c[s.timeEnKey] : c[s.timeKey]}
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

      {/* ── Seat map — pick a preferred seat once a day + slot are chosen, so the
          occupancy shown is the REAL taken count for that date + slot. ── */}
      <div className="mt-8 border-t border-white/10 pt-7">
        <div className="mb-3 flex items-center gap-2 text-[13.5px] font-semibold text-foreground">
          <span>{t({ ar: c.bk2, en: c.bk2En })}</span>
          <span className="text-[12px] font-normal text-fg-faint">{t({ ar: c.bk3, en: c.bk3En })}</span>
        </div>
        {!form.visitDate || !form.timeSlot ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-[12.5px] text-fg-secondary">
            {t({ ar: c.bk4, en: c.bk4En })}
          </p>
        ) : (
          <SeatMap
            takenSeats={takenSeats}
            blockedSeats={blockedSeats}
            selected={form.seat}
            onSelect={(n) => update("seat", n === form.seat ? null : n)}
          />
        )}
      </div>
    </StepShell>
  );
}

function StepTwo({
  form,
  update,
  navDir,
}: {
  form: { purpose: string; attendees: number; notes: string };
  update: (k: any, v: any) => void;
  navDir?: 1 | -1;
}) {
  const { lang } = useLanguage();
  const c = useContentSection("pageBook", PAGE_BOOK_FALLBACK);
  return (
    <StepShell
      navDir={navDir}
      title={lang === "en" ? c.bk18En : c.bk18}
      hint={lang === "en" ? c.bk19En : c.bk19}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PURPOSES.map(({ id, labelKey, labelEnKey, Icon }) => {
          const active = form.purpose === id;
          return (
            <button
              key={id}
              onClick={() => update("purpose", id)}
              data-testid={`purpose-${id}`}
              className={`relative p-4 rounded-2xl ${lang === "en" ? "text-left" : "text-right"} transition ${
                active
                  ? "bg-primary/[0.10] border border-primary/45"
                  : "bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-primary/30"
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-2.5 ${active ? "text-primary" : "text-muted-foreground"}`}
                strokeWidth={2}
              />
              <div className="text-[13px] font-semibold text-foreground">{lang === "en" ? c[labelEnKey] : c[labelKey]}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3 text-[12.5px] text-fg-secondary">
          <Users className="w-3.5 h-3.5" />
          <span>{lang === "en" ? c.bk20En : c.bk20}</span>
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
                    ? "bg-primary-cta text-primary-foreground shadow-[0_8px_22px_-6px_hsl(12_70%_52%/0.55)]"
                    : "bg-white/[0.05] border border-white/10 text-fg-secondary hover:bg-white/[0.1] hover:border-white/20"
                }`}
              >
                {lang === "en" ? n : n.toLocaleString("ar-EG-u-nu-arab")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <label
          htmlFor="notes"
          className="block text-[12.5px] text-fg-secondary mb-2 flex items-center gap-2"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {lang === "en" ? c.bk21En : c.bk21} <span className="text-muted-foreground">{lang === "en" ? c.bk3En : c.bk3}</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder={lang === "en" ? c.bk61En : c.bk61}
          maxLength={1000}
          data-testid="textarea-notes"
          className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-foreground text-[13.5px] placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-primary/50 transition resize-none"
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

function splitExpertiseTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

function ExpertProfileModal({
  expert,
  isSelected,
  onPick,
  onClose,
  lang,
}: {
  expert: ExpertOption;
  isSelected: boolean;
  onPick: () => void;
  onClose: () => void;
  lang: string;
}) {
  const reduce = useReducedMotion();
  const c = useContentSection("pageBook", PAGE_BOOK_FALLBACK);
  const initials = expert.fullName.trim().charAt(0) || "؟";
  const tags = splitExpertiseTags(expert.expertise);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expert-modal-title"
    >
      <motion.div
        key="expert-modal-backdrop"
        initial={reduce ? false : { opacity: 0 }}
        animate={reduce ? undefined : { opacity: 1 }}
        exit={reduce ? undefined : { opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        key="expert-modal-panel"
        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.97 }}
        animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? undefined : { opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.26, ease: [0.19, 1, 0.22, 1] }}
        className="glass-panel-lg relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-[32px] overflow-hidden"
        dir={lang === "en" ? "ltr" : "rtl"}
      >
        <button
          onClick={onClose}
          aria-label={lang === "en" ? "Close" : "إغلاق"}
          className="absolute top-3.5 end-3.5 w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] flex items-center justify-center transition text-muted-foreground hover:text-foreground z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 pb-2">
          <div className="flex items-start gap-4">
            {expert.avatarUrl ? (
              <img loading="lazy" decoding="async"
                src={expert.avatarUrl}
                alt={expert.fullName}
                className="w-16 h-16 rounded-2xl object-cover border border-white/12 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0 pt-0.5">
              <h2 id="expert-modal-title" className="text-[16px] font-bold leading-snug text-foreground">
                {expert.fullName}
              </h2>
              {expert.headline && (
                <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">
                  {expert.headline}
                </p>
              )}
              {expert.yearsExperience != null && expert.yearsExperience > 0 && (
                <p className="text-[11.5px] text-fg-secondary mt-1">
                  {lang === "en"
                    ? `${expert.yearsExperience} yrs experience`
                    : `${expert.yearsExperience.toLocaleString("ar-EG-u-nu-arab")} سنوات خبرة`}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4 max-h-[55vh] overflow-y-auto overscroll-contain">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full bg-primary-soft border border-primary/20 text-primary text-[11px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {expert.bio && (
            <p className="text-[13px] text-fg-secondary leading-relaxed whitespace-pre-line">
              {expert.bio}
            </p>
          )}

          {(expert.sessionMinutes != null && expert.sessionMinutes > 0) && (
            <div className="flex items-center gap-2 text-[12px] text-fg-secondary">
              <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <span>
                {lang === "en"
                  ? `${expert.sessionMinutes}-minute session`
                  : `جلسة مدّتها ${expert.sessionMinutes.toLocaleString("ar-EG-u-nu-arab")} دقيقة`}
              </span>
            </div>
          )}

          {expert.languages && (
            <div className="flex items-center gap-2 text-[12px] text-fg-secondary">
              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <span>
                {lang === "en" ? c.bk22En : c.bk22}
                <span className="text-foreground">{expert.languages}</span>
              </span>
            </div>
          )}

          {expert.availabilityNote && (
            <div className="flex items-start gap-2 text-[12px] text-fg-secondary">
              <Info className="w-3.5 h-3.5 shrink-0 text-muted-foreground mt-0.5" />
              <span className="leading-relaxed">{expert.availabilityNote}</span>
            </div>
          )}

          {(expert.linkedinUrl || expert.websiteUrl) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {expert.linkedinUrl && (
                <a
                  href={expert.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] hover:border-primary/30 text-fg-secondary hover:text-foreground text-[12px] transition"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  LinkedIn
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              )}
              {expert.websiteUrl && (
                <a
                  href={expert.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] hover:border-primary/30 text-fg-secondary hover:text-foreground text-[12px] transition"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {lang === "en" ? c.bk23En : c.bk23}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-1 border-t border-white/10">
          {!expert.acceptingSessions ? (
            <p className="text-center text-[12.5px] text-muted-foreground py-2">
              {lang === "en" ? c.bk24En : c.bk24}
            </p>
          ) : isSelected ? (
            <button
              onClick={() => { onPick(); onClose(); }}
              className="w-full py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 text-fg-secondary hover:bg-white/[0.1] hover:border-primary/30 text-[13.5px] font-medium transition"
            >
              {lang === "en" ? c.bk25En : c.bk25}
            </button>
          ) : (
            <Btn
              variant="primary"
              size="md"
              onClick={() => { onPick(); onClose(); }}
              className="w-full shadow-[0_6px_18px_-6px_hsl(12_70%_52%/0.45)]"
            >
              {lang === "en" ? c.bk26En : c.bk26}
            </Btn>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StepExpert({
  form,
  update,
  experts,
  visitDate,
  onSlotMetaChange,
  navDir,
}: {
  form: { expertId: number | null; slotId: number | null };
  update: (k: any, v: any) => void;
  experts: ExpertOption[] | null;
  visitDate: string;
  onSlotMetaChange: (slot: AvailableSlot | null) => void;
  navDir?: 1 | -1;
}) {
  const { lang } = useLanguage();
  const c = useContentSection("pageBook", PAGE_BOOK_FALLBACK);
  const reduce = useReducedMotion();
  const [availableIds, setAvailableIds] = useState<Map<number, number> | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [daySlots, setDaySlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [previewExpert, setPreviewExpert] = useState<ExpertOption | null>(null);

  useEffect(() => {
    if (!visitDate) {
      setAvailableIds(null);
      setAvailabilityLoading(false);
      return;
    }
    let cancelled = false;
    setAvailabilityLoading(true);
    api<{ available: Array<{ expertId: number; slotCount: number }> }>(`/experts/available-on?date=${visitDate}`)
      .then((r) => {
        if (!cancelled) {
          setAvailableIds(new Map(r.available.map((x) => [x.expertId, x.slotCount])));
          setAvailabilityLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableIds(null);
          setAvailabilityLoading(false);
        }
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
      onSlotMetaChange(null);
    } else {
      if (form.expertId !== id) {
        update("slotId", null);
        onSlotMetaChange(null);
      }
      update("expertId", id);
    }
  }

  return (
    <>
    <StepShell
      navDir={navDir}
      title={lang === "en" ? c.bk27En : c.bk27}
      hint={lang === "en" ? c.bk28En : c.bk28}
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
            className="text-muted-foreground text-[13px]"
          >
            {lang === "en" ? c.bk29En : c.bk29}
          </motion.p>
        ) : (
          <>
          <motion.div
            key="expert-grid"
            layout
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            initial={reduce ? false : "hidden"}
            animate={reduce ? undefined : "show"}
            variants={{ show: { transition: { staggerChildren: 0.055 } } }}
          >
            {[...experts].sort((a, b) => {
              const rank = (e: ExpertOption) => {
                if (!e.acceptingSessions) return 2;
                if (availableIds !== null && (availableIds.get(e.id) ?? 0) > 0) return 0;
                return 1;
              };
              return rank(a) - rank(b);
            }).map((e) => {
              const selected = form.expertId === e.id;
              const initials = e.fullName.trim().charAt(0) || "؟";
              const slotCount = availableIds !== null && !availabilityLoading ? (availableIds.get(e.id) ?? 0) : null;
              const hasSlot = slotCount !== null ? slotCount > 0 : null;
              const unavailable = !e.acceptingSessions || hasSlot === false;
              return (
                <motion.div
                  key={e.id}
                  layout
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
                  role="button"
                  tabIndex={0}
                  aria-label={lang === "en" ? `View ${e.fullName}'s profile` : `عرض ملف ${e.fullName}`}
                  onClick={() => setPreviewExpert(e)}
                  onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setPreviewExpert(e); } }}
                  data-testid={`expert-pick-${e.id}`}
                  className={`relative p-4 rounded-2xl ${lang === "en" ? "text-left" : "text-right"} transition cursor-pointer ${
                    unavailable && !selected ? "opacity-45" : ""
                  } ${
                    selected
                      ? "bg-primary/[0.10] border border-primary/45 shadow-[0_10px_26px_-12px_hsl(12_70%_52%/0.4)]"
                      : hasSlot === true
                      ? "bg-sand-soft border border-sand-deep/50 hover:border-sand-deep/70"
                      : "bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-primary/30"
                  }`}
                >
                  {selected && (
                    <CheckCircle2 className="absolute top-2.5 start-2.5 w-4 h-4 text-primary" />
                  )}
                  {!selected && availabilityLoading && e.acceptingSessions && (
                    <span className="absolute top-2 start-2 h-4 w-10 rounded-full skeleton-shimmer" />
                  )}
                  {!selected && hasSlot === true && slotCount !== null && (
                    <span className="absolute top-2 start-2 h-4 px-1.5 rounded-full bg-sand-soft border border-sand-deep/50 text-sand-bright text-[9px] font-semibold leading-4 tnum">
                      {lang === "en"
                        ? `${slotCount} slot${slotCount === 1 ? "" : "s"}`
                        : `${slotCount.toLocaleString("ar-EG-u-nu-arab")} موعد`}
                    </span>
                  )}
                  <span className="absolute bottom-2 end-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-muted-foreground text-[9.5px] font-medium leading-none pointer-events-none">
                    <Info className="w-2.5 h-2.5 shrink-0" />
                    {lang === "en" ? c.bk30En : c.bk30}
                  </span>
                  <div className="flex items-center gap-3">
                    {e.avatarUrl ? (
                      <img
                        src={e.avatarUrl}
                        alt={e.fullName}
                        className="w-12 h-12 rounded-2xl object-cover border border-white/12 shrink-0"
                        loading="lazy" decoding="async"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold leading-snug line-clamp-1 text-foreground">
                        {e.fullName}
                      </div>
                      {e.headline && (
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {e.headline}
                        </div>
                      )}
                      {!e.acceptingSessions ? (
                        <div className="text-[10.5px] text-muted-foreground mt-0.5">
                          {lang === "en" ? c.bk16En : c.bk16}
                        </div>
                      ) : !availabilityLoading && hasSlot === false ? (
                        <div className="text-[10.5px] text-muted-foreground mt-0.5">
                          {lang === "en" ? c.bk31En : c.bk31}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {form.expertId !== null && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-[12px] text-fg-secondary font-medium">
                  {lang === "en" ? c.bk32En : c.bk32}
                  <span className="text-muted-foreground ms-1">
                    {lang === "en" ? c.bk33En : c.bk33}
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
                <p className="text-[12px] text-muted-foreground italic">
                  {lang === "en" ? c.bk34En : c.bk34}
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
                        ? lang === "en" ? c.bk35En : c.bk35
                        : lang === "en" ? c.bk36En : c.bk36;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => {
                          update("slotId", picked ? null : slot.id);
                          onSlotMetaChange(picked ? null : slot);
                        }}
                        data-testid={`slot-pick-${slot.id}`}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition border ${
                          picked
                            ? "bg-primary/[0.10] border-primary/45 text-primary"
                            : "bg-white/[0.04] border-white/10 text-fg-secondary hover:bg-white/[0.07] hover:border-primary/30"
                        }`}
                      >
                        {picked && <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />}
                        <span dir="ltr" className="tnum">{start} – {end}</span>
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

    <AnimatePresence>
      {previewExpert && (
        <ExpertProfileModal
          expert={previewExpert}
          isSelected={form.expertId === previewExpert.id}
          onPick={() => handlePickExpert(previewExpert.id, form.expertId === previewExpert.id)}
          onClose={() => setPreviewExpert(null)}
          lang={lang}
        />
      )}
    </AnimatePresence>
    </>
  );
}

function StepThree({
  form,
  update,
  issues,
  navDir,
}: {
  form: { fullName: string; phone: string; email: string };
  update: (k: any, v: any) => void;
  issues: Record<string, string>;
  navDir?: 1 | -1;
}) {
  const { lang } = useLanguage();
  const c = useContentSection("pageBook", PAGE_BOOK_FALLBACK);
  return (
    <StepShell
      navDir={navDir}
      title={lang === "en" ? c.bk37En : c.bk37}
      hint={lang === "en" ? c.bk38En : c.bk38}
    >
      <div className="space-y-5">
        <Field
          id="fullName"
          label={lang === "en" ? c.bk39En : c.bk39}
          icon={UserIcon}
          value={form.fullName}
          onChange={(v) => update("fullName", v)}
          error={issues.fullName}
          placeholder={lang === "en" ? c.bk62En : c.bk62}
          autoFocus
        />
        <div className="grid md:grid-cols-2 gap-5">
          <Field
            id="phone"
            label={lang === "en" ? c.bk40En : c.bk40}
            icon={Phone}
            value={form.phone}
            onChange={(v) => update("phone", v)}
            error={issues.phone}
            placeholder="+970 ..."
            ltr
          />
          <Field
            id="email"
            label={lang === "en" ? c.bk41En : c.bk41}
            optional
            icon={Mail}
            value={form.email}
            onChange={(v) => update("email", v)}
            error={issues.email}
            placeholder="you@example.com"
            ltr
          />
        </div>
        <div className="text-[11.5px] text-muted-foreground leading-[1.85]">
          {lang === "en" ? c.bk42En : c.bk42}
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
  const { t } = useLanguage();
  const c = useContentSection("pageBook", PAGE_BOOK_FALLBACK);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[12.5px] text-fg-secondary mb-2 flex items-center gap-2"
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
        {optional && <span className="text-muted-foreground">{t({ ar: c.bk3, en: c.bk3En })}</span>}
      </label>
      <input
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={ltr ? "ltr" : "rtl"}
        data-testid={`input-${id}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full h-12 px-4 rounded-2xl bg-white/[0.04] border text-foreground ${
          error ? "border-destructive/60" : "border-white/10"
        } text-[14px] placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-primary/50 transition`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[11.5px] text-destructive">{error}</p>
      )}
    </div>
  );
}

function SummaryCard({
  form,
  expertName,
  selectedSlot,
}: {
  form: {
    visitDate: string;
    timeSlot: string;
    purpose: string;
    attendees: number;
    fullName: string;
    seat: number | null;
    expertId: number | null;
  };
  expertName?: string;
  selectedSlot?: AvailableSlot | null;
}) {
  const { lang } = useLanguage();
  const c = useContentSection("pageBook", PAGE_BOOK_FALLBACK);
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

  const expertSlotDisplay = selectedSlot
    ? (() => {
        const start = formatSlotTime(selectedSlot.startAt, lang);
        const end = formatSlotTime(selectedSlot.endAt, lang);
        const modeLabel =
          selectedSlot.mode === "online"
            ? lang === "en" ? c.bk35En : c.bk35
            : lang === "en" ? c.bk36En : c.bk36;
        return `${start} – ${end} · ${modeLabel}`;
      })()
    : null;

  return (
    <aside className="lg:sticky lg:top-8 self-start">
      <div className="glass-panel relative p-6">
        <div>
          <div className="pb-4 mb-2 border-b border-white/10">
            <div className="eyebrow eyebrow-sand mb-2">
              {lang === "en" ? c.bk43En : c.bk43}
            </div>
            <div className="font-display font-bold text-foreground" style={{ fontSize: "clamp(1.1rem, 2vw, 1.3rem)", letterSpacing: "-0.02em" }}>
              {lang === "en" ? c.bk44En : c.bk44}
            </div>
          </div>

          <SummaryRow
            icon={CalendarIcon}
            label={lang === "en" ? c.bk45En : c.bk45}
            value={dateDisplay}
            placeholder={!dateObj}
          />
          <SummaryRow
            icon={Clock}
            label={lang === "en" ? c.bk46En : c.bk46}
            value={
              slotLabel
                ? lang === "en"
                  ? `${c[slotLabel.labelEnKey]} · ${c[slotLabel.timeEnKey]}`
                  : `${c[slotLabel.labelKey]} · ${c[slotLabel.timeKey]}`
                : "—"
            }
            placeholder={!slotLabel}
          />
          <SummaryRow
            icon={Armchair}
            label={lang === "en" ? c.bk47En : c.bk47}
            value={
              form.seat
                ? lang === "en"
                  ? `#${form.seat}`
                  : `رقم ${form.seat.toLocaleString("ar-EG-u-nu-arab")}`
                : lang === "en" ? c.bk48En : c.bk48
            }
            placeholder={!form.seat}
          />
          <SummaryRow
            icon={Briefcase}
            label={lang === "en" ? c.bk49En : c.bk49}
            value={(purposeLabel ? (lang === "en" ? c[purposeLabel.labelEnKey] : c[purposeLabel.labelKey]) : undefined) || "—"}
            placeholder={!purposeLabel}
          />
          <SummaryRow
            icon={Users}
            label={lang === "en" ? c.bk50En : c.bk50}
            value={lang === "en" ? String(form.attendees) : form.attendees.toLocaleString("ar-EG-u-nu-arab")}
          />
          <SummaryRow
            icon={UserIcon}
            label={lang === "en" ? c.bk51En : c.bk51}
            value={expertName || (lang === "en" ? c.bk52En : c.bk52)}
            placeholder={!form.expertId}
          />
          {expertSlotDisplay && (
            <SummaryRow
              icon={Clock}
              label={lang === "en" ? c.bk53En : c.bk53}
              value={expertSlotDisplay}
            />
          )}
          <SummaryRow
            icon={UserIcon}
            label={lang === "en" ? c.bk54En : c.bk54}
            value={form.fullName || "—"}
            placeholder={!form.fullName}
          />

          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex items-center gap-2.5 text-[12px] text-fg-secondary leading-[1.7]">
              <Coffee className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span>{lang === "en" ? c.bk55En : c.bk55}</span>
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
    <div className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3 border-b border-white/[0.07] last:border-0">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] text-muted-foreground mb-0.5">{label}</div>
        <div
          className={`text-[13px] font-semibold truncate ${placeholder ? "text-fg-faint" : "text-foreground"}`}
        >
          {value}
        </div>
      </div>
    </div>
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
  const c = useContentSection("pageBook", PAGE_BOOK_FALLBACK);
  const reduce = useReducedMotion();
  const slotLabel = TIME_SLOTS.find((s) => s.id === form.timeSlot);
  const dateObj = new Date(form.visitDate + "T00:00:00");
  const ref = String(id).padStart(5, "0");
  const dateDisplay = lang === "en"
    ? dateObj.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : arabicDay(dateObj);
  return (
    <div
      dir={lang === "en" ? "ltr" : "rtl"}
      className="relative min-h-screen overflow-hidden bg-background text-foreground flex items-center justify-center px-6 py-16"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[80vh] brand-aura opacity-80" />
      {!reduce && <Confetti />}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.95, y: 20 }}
        animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-lg w-full"
      >
        <div className="glass-panel-lg relative p-9 lg:p-11 text-center">
          <div className="relative">
            <motion.div
              initial={reduce ? false : { scale: 0 }}
              animate={reduce ? undefined : { scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 14 }}
              className="w-20 h-20 mx-auto rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-primary" strokeWidth={2.2} />
            </motion.div>
            <div className="text-[12px] text-fg-secondary font-medium mb-4">
              {lang === "en" ? c.bk56En : c.bk56}
            </div>
            <h1
              className="font-display font-bold text-foreground mb-4"
              style={{ fontSize: "clamp(1.85rem, 5vw, 2.6rem)", letterSpacing: "-0.035em", lineHeight: 1.05 }}
            >
              {lang === "en" ? (
                <>Your seat is booked,{" "}<span className="text-primary">{form.fullName.split(" ")[0]}</span>.</>
              ) : (
                <>مقعدك محجوز،{" "}<span className="text-primary">{form.fullName.split(" ")[0]}</span>.</>
              )}
            </h1>
            <p className="text-fg-secondary text-[14px] leading-[1.85] mb-6">
              {lang === "en" ? (
                <>
                  See you on{" "}
                  <span className="text-foreground font-semibold">{dateDisplay}</span>
                  {slotLabel && (
                    <> · <span className="text-foreground font-semibold">{c[slotLabel.labelEnKey]}</span></>
                  )}
                  .<br />
                  We'll send you a WhatsApp confirmation shortly.
                </>
              ) : (
                <>
                  نراك يوم{" "}
                  <span className="text-foreground font-semibold">{dateDisplay}</span>
                  {slotLabel && (
                    <> · <span className="text-foreground font-semibold">{c[slotLabel.labelKey]}</span></>
                  )}
                  .<br />
                  سنرسل لك رسالة تأكيد على واتساب قريبًا.
                </>
              )}
            </p>
            {expert && (
              <div className="mb-6 py-4 px-5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center gap-4">
                <div className="relative shrink-0">
                  {expert.avatarUrl ? (
                    <img loading="lazy" decoding="async"
                      src={expert.avatarUrl}
                      alt={expert.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/40"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-soft border-2 border-primary/40 flex items-center justify-center text-primary text-lg font-bold">
                      {expert.fullName.trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -end-0.5 w-4 h-4 rounded-full bg-sand border-2 border-[#0b0a09]" />
                </div>
                <div className={`flex-1 min-w-0 ${lang === "en" ? "text-left" : "text-right"}`}>
                  <p className="text-[10.5px] text-muted-foreground mb-0.5">
                    {lang === "en" ? c.bk57En : c.bk57}
                  </p>
                  <p className="text-[14px] font-semibold text-foreground truncate">
                    {expert.fullName}
                  </p>
                  {expert.headline && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {expert.headline}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-white/[0.05] border border-white/10 text-[12px] text-fg-secondary mb-7">
              <span className="text-muted-foreground">{lang === "en" ? c.bk58En : c.bk58}</span>
              <span className="font-mono font-bold text-sand-bright tracking-wider tnum">
                #{ref}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="cta-fill h-11 px-6 rounded-full text-[13px] font-semibold hover:brightness-110 transition flex items-center gap-2"
                data-testid="link-home-success"
              >
                {lang === "en" ? c.bk59En : c.bk59}
                <ArrowLeft className={`w-4 h-4 ${lang === "en" ? "" : "rotate-180"}`} />
              </Link>
              <Link
                href="/book"
                className="h-11 px-6 rounded-full bg-white/[0.05] border border-white/10 text-foreground text-[13px] font-semibold hover:bg-white/[0.1] hover:border-white/20 transition"
                data-testid="link-new-booking"
                onClick={() => window.location.reload()}
              >
                {lang === "en" ? c.bk60En : c.bk60}
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
        hue: Math.random() > 0.5 ? "hsl(354 78% 50%)" : "hsl(213 84% 42%)",
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
