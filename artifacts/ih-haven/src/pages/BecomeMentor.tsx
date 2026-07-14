import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Linkedin,
  Briefcase,
  User as UserIcon,
  Mail,
  BookOpen,
  Star,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { HavenMark } from "@/components/landing/HavenMark";
import { EASE_OUT_EXPO } from "@/lib/motion";

const STEPS = [
  { id: "identity", label: { ar: "هويّتك", en: "Identity" } },
  { id: "expertise", label: { ar: "خبرتك", en: "Expertise" } },
  { id: "about", label: { ar: "نبذة عنك", en: "About you" } },
];

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}

// Per-step editorial header: an eyebrow (Arabic label · Latin), a monumental
// display title with exactly one crimson word, and a muted lead. Mirrors the
// Apply page's header choreography so the two application flows feel of a piece.
const STEP_HEADERS: Array<{
  eyebrow: { ar: string; en: string };
  titleLead: { ar: string; en: string };
  titleAccent: { ar: string; en: string };
  subtitle: { ar: string; en: string };
}> = [
  {
    eyebrow: { ar: "طلب إرشاد · هويّتك", en: "Mentor application · Identity" },
    titleLead: { ar: "كُن مرشدًا في ", en: "Become a mentor at " },
    titleAccent: { ar: "آيلاند هيفن", en: "Island Haven" },
    subtitle: {
      ar: "شارك خبرتك مع روّاد الأعمال الشباب في غزّة. طلبك سيُراجَع ونتواصل معك قريبًا.",
      en: "Share your expertise with young founders in Gaza. We'll review your application and reach out soon.",
    },
  },
  {
    eyebrow: { ar: "طلب إرشاد · خبرتك", en: "Mentor application · Expertise" },
    titleLead: { ar: "ما هي ", en: "What are your " },
    titleAccent: { ar: "تخصّصاتك؟", en: "specialties?" },
    subtitle: {
      ar: "أخبرنا بمجالات خبرتك حتّى نضعك في المكان الصحيح.",
      en: "Tell us your areas of expertise so we can place you with the right team.",
    },
  },
  {
    eyebrow: { ar: "طلب إرشاد · نبذة عنك", en: "Mentor application · About you" },
    titleLead: { ar: "أخبرنا ", en: "Tell us " },
    titleAccent: { ar: "عن نفسك", en: "about yourself" },
    subtitle: {
      ar: "نبذة عن تجربتك وما يمكنك تقديمه للمنتسبين.",
      en: "A short note on your experience and what you can offer members.",
    },
  },
];

interface FormState {
  fullName: string;
  email: string;
  expertise: string;
  yearsExperience: number;
  bio: string;
  linkedinUrl: string;
}

const EMPTY: FormState = {
  fullName: "",
  email: "",
  expertise: "",
  yearsExperience: 0,
  bio: "",
  linkedinUrl: "",
};

export default function BecomeMentor() {
  const { lang, dir, t } = useLanguage();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [referral, setReferral] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      setReferral(ref);
      console.log("[analytics] become-mentor page visit", { ref });
    }
  }, []);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
    setFieldErrors((e) => {
      const n = { ...e };
      delete n[k];
      return n;
    });
  }

  function validateStep(s: number): Record<string, string> {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!form.fullName.trim() || form.fullName.trim().length < 2)
        errs.fullName = t({ ar: "أدخل الاسم الكامل", en: "Enter your full name" });
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = t({
          ar: "أدخل بريدًا إلكترونيًّا صحيحًا",
          en: "Enter a valid email address",
        });
    }
    if (s === 1) {
      if (!form.expertise.trim() || form.expertise.trim().length < 2)
        errs.expertise = t({
          ar: "أدخل مجالات خبرتك",
          en: "Enter your areas of expertise",
        });
    }
    if (s === 2) {
      if (!form.bio.trim() || form.bio.trim().length < 20)
        errs.bio = t({
          ar: "النبذة قصيرة جدًّا (20 حرفًا فأكثر)",
          en: "Your bio is too short (20 characters or more)",
        });
      if (
        form.linkedinUrl.trim() &&
        !/^https?:\/\//i.test(form.linkedinUrl.trim())
      )
        errs.linkedinUrl = t({
          ar: "الرابط يجب أن يبدأ بـ https://",
          en: "The link must start with https://",
        });
    }
    return errs;
  }

  function nextStep() {
    const errs = validateStep(step);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setStep((s) => s + 1);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateStep(2);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api("/experts/apply", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          expertise: form.expertise.trim(),
          yearsExperience: Number(form.yearsExperience) || 0,
          bio: form.bio.trim(),
          linkedinUrl: form.linkedinUrl.trim(),
          ...(referral ? { ref: referral } : {}),
        }),
      });
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data === "object") {
        const d = e.data as {
          error?: string;
          details?: Array<{ field: string; message: string }>;
        };
        setError(
          d.error || t({ ar: "تعذّر إرسال الطلب", en: "Couldn't send your request" }),
        );
        if (Array.isArray(d.details)) {
          const m: Record<string, string> = {};
          for (const i of d.details) m[i.field] = i.message;
          setFieldErrors(m);
          // Go back to the step that has the error
          if (m.fullName || m.email) setStep(0);
          else if (m.expertise || m.yearsExperience) setStep(1);
        }
      } else {
        setError(
          t({
            ar: "تعذّر الاتّصال بالخادم. حاول مجدّدًا بعد قليل.",
            en: "Couldn't reach the server. Please try again in a moment.",
          }),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const firstName = form.fullName.split(" ")[0];
    return (
      <div
        dir={dir}
        className="relative min-h-screen overflow-hidden bg-background text-foreground flex items-center justify-center p-6"
        style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] brand-aura opacity-60" />
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.96, y: 16 }}
          animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-md w-full"
        >
          <div className="relative rounded-[28px] p-9 bg-card border border-border-strong shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)] text-center">
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={reduce ? undefined : { opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5, ease: EASE_OUT_EXPO }}
              className="mb-7 inline-flex items-center justify-center text-primary"
            >
              <CheckCircle2 className="w-9 h-9" strokeWidth={2} />
            </motion.div>
            <p className="eyebrow text-primary mb-3">
              {t({ ar: "وصل طلبك", en: "Your application arrived" })}
            </p>
            <h1
              className="font-display text-foreground text-[28px] lg:text-[32px] leading-tight mb-3"
              style={{ fontWeight: 700, letterSpacing: "-0.03em" }}
            >
              {t({ ar: "شكرًا لك يا ", en: "Thank you, " })}
              <span className="text-primary">{firstName}</span>
            </h1>
            <p className="text-fg-secondary text-[14px] leading-[1.85] mb-8">
              {t({
                ar: "استلمنا طلبك بأمان وسيراجعه فريقنا قريبًا. ستصلك رسالة تأكيد على بريدك الإلكترونيّ، وسنتواصل معك بمجرّد البتّ في الطلب.",
                en: "We've safely received your application and our team will review it soon. A confirmation email is on its way, and we'll reach out as soon as a decision is made.",
              })}
            </p>
            <Link
              href="/experts"
              className="cta-fill group inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[13.5px] transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t({ ar: "تصفّح الخبراء", en: "Browse experts" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const header = STEP_HEADERS[step];

  return (
    <div
      dir={dir}
      className="relative min-h-screen bg-background text-foreground"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[45vh] brand-aura opacity-50" />

      {/* Top bar */}
      <header className="relative z-20 px-5 sm:px-8 lg:px-14 pt-6 sm:pt-8">
        <div className="mx-auto max-w-2xl flex items-center justify-between gap-4">
          <Link
            href="/experts"
            className="group inline-flex items-center gap-2 text-[12px] tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors font-semibold rtl:tracking-normal"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
            {t({ ar: "العودة", en: "Back" })}
          </Link>
          <div className="flex items-center gap-2.5">
            <HavenMark className="h-7 w-auto" />
            <span className="text-[12px] text-muted-foreground select-none tabular-nums tracking-[0.16em] uppercase">
              {num(step + 1, lang)} / {num(STEPS.length, lang)}
            </span>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="relative z-10 mx-auto max-w-2xl px-5 sm:px-8 lg:px-14 mt-6">
        <div className="h-[3px] rounded-full bg-surface-3 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={false}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
          />
        </div>
      </div>

      {/* Main */}
      <div className="relative z-10 px-5 sm:px-8 lg:px-14 pb-24">
        <div className="mx-auto max-w-2xl pt-[clamp(2.5rem,6vw,4.5rem)]">
          {/* Step tabs — calm pill row on the dark canvas. */}
          <div className="flex gap-2 mb-[clamp(2.5rem,6vw,4rem)]">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i >= step}
                aria-current={i === step ? "step" : undefined}
                className={`flex-1 py-2 rounded-full text-[11.5px] font-semibold border transition-colors ${
                  i === step
                    ? "bg-primary/[0.10] border-primary/50 text-primary"
                    : i < step
                    ? "bg-surface-2 border-border-strong text-fg-secondary cursor-pointer hover:border-primary/35 hover:text-foreground"
                    : "bg-surface-2 border-border-strong/60 text-fg-faint cursor-default"
                }`}
              >
                {t(s.label)}
              </button>
            ))}
          </div>

          {/* ── Monumental step header — an eyebrow with a crimson hairline leads,
              a display title with exactly one crimson word follows, a muted lead
              closes, and a hairline rule opens the form's editorial baseline. ── */}
          <div className="mb-[clamp(2.5rem,6vw,4rem)]">
            <motion.div
              key={`eyebrow-${step}`}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
              className="flex items-center gap-3 mb-[clamp(1.25rem,2.5vw,1.75rem)]"
            >
              <span aria-hidden className="h-px w-9 bg-primary/70" />
              <span className="eyebrow text-primary">{t(header.eyebrow)}</span>
            </motion.div>
            <motion.h1
              key={`title-${step}`}
              initial={reduce ? false : { opacity: 0, y: 22 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: EASE_OUT_EXPO }}
              className="font-display text-foreground"
              style={{
                fontSize: "clamp(2.2rem, 6.5vw, 3.75rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.04em",
                fontWeight: 700,
              }}
            >
              {t(header.titleLead)}
              <span className="text-primary">{t(header.titleAccent)}</span>
            </motion.h1>
            <motion.p
              key={`sub-${step}`}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT_EXPO }}
              className="mt-[clamp(1.25rem,2.5vw,1.75rem)] max-w-xl text-fg-secondary"
              style={{ fontSize: "clamp(1rem, 1.6vw, 1.2rem)", lineHeight: 1.65 }}
            >
              {t(header.subtitle)}
            </motion.p>
            <motion.div
              aria-hidden
              initial={reduce ? false : { opacity: 0, scaleX: 0 }}
              animate={reduce ? undefined : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 1, delay: 0.32, ease: EASE_OUT_EXPO }}
              className="hairline mt-[clamp(2rem,4vw,3rem)] origin-left rtl:origin-right"
            />
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={reduce ? false : { opacity: 0, x: 24 }}
                animate={reduce ? undefined : { opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -24 }}
                transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                className="space-y-8"
              >
                <Field
                  id="fullName"
                  label={t({ ar: "الاسم الكامل", en: "Full name" })}
                  hint="Name"
                  icon={UserIcon}
                  value={form.fullName}
                  onChange={(v) => set("fullName", v)}
                  error={fieldErrors.fullName}
                  placeholder={t({ ar: "مثال: أحمد الفرّا", en: "e.g. Ahmad Al-Farra" })}
                  maxLength={120}
                  autoComplete="name"
                  autoFocus
                />

                <Field
                  id="email"
                  label={t({ ar: "البريد الإلكترونيّ", en: "Email address" })}
                  hint="Email"
                  icon={Mail}
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  error={fieldErrors.email}
                  placeholder="name@example.com"
                  type="email"
                  ltr
                  maxLength={160}
                  autoComplete="email"
                />

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="cta-fill group relative w-full overflow-hidden rounded-2xl h-14 font-bold text-[15px] tracking-wide transition-all duration-300 hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] hover:-translate-y-px"
                  >
                    <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
                      {t({ ar: "التالي", en: "Next" })}
                      <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-1"
                initial={reduce ? false : { opacity: 0, x: 24 }}
                animate={reduce ? undefined : { opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -24 }}
                transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                className="space-y-8"
              >
                <Field
                  id="expertise"
                  label={t({
                    ar: "مجالات الخبرة (مفصولة بفاصلة)",
                    en: "Areas of expertise (comma-separated)",
                  })}
                  hint="Fields"
                  icon={Briefcase}
                  value={form.expertise}
                  onChange={(v) => set("expertise", v)}
                  error={fieldErrors.expertise}
                  placeholder={t({
                    ar: "مثال: ريادة أعمال، تسويق رقميّ، تصميم",
                    en: "e.g. Entrepreneurship, digital marketing, design",
                  })}
                  maxLength={400}
                  autoFocus
                />

                <FieldWrap
                  id="yearsExperience"
                  label={t({ ar: "سنوات الخبرة", en: "Years of experience" })}
                  hint="Experience"
                  icon={Star}
                  error={fieldErrors.yearsExperience}
                >
                  <input
                    id="yearsExperience"
                    name="yearsExperience"
                    type="number"
                    min={0}
                    max={80}
                    value={form.yearsExperience}
                    onChange={(e) =>
                      set("yearsExperience", Number(e.target.value) || 0)
                    }
                    aria-invalid={Boolean(fieldErrors.yearsExperience)}
                    aria-describedby={fieldErrors.yearsExperience ? "yearsExperience-error" : undefined}
                    className="block w-full rounded-sm bg-transparent text-foreground text-[15.5px] outline-none py-2.5 tabular-nums focus-visible:ring-2 focus-visible:ring-primary/50"
                    data-testid="input-yearsExperience"
                  />
                </FieldWrap>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="min-h-14 px-6 rounded-2xl bg-surface-2 border border-border-strong text-fg-secondary font-semibold text-[14px] hover:border-primary/35 hover:text-foreground transition-colors"
                  >
                    {t({ ar: "→ السابق", en: "← Back" })}
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="cta-fill group relative flex-1 overflow-hidden rounded-2xl h-14 font-bold text-[15px] tracking-wide transition-all duration-300 hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] hover:-translate-y-px"
                  >
                    <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
                      {t({ ar: "التالي", en: "Next" })}
                      <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={reduce ? false : { opacity: 0, x: 24 }}
                animate={reduce ? undefined : { opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -24 }}
                transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
              >
                <form onSubmit={onSubmit} noValidate className="space-y-8">
                  <FieldWrap
                    id="bio"
                    label={t({ ar: "نبذة تعريفيّة", en: "About you" })}
                    hint="Bio"
                    icon={BookOpen}
                    error={fieldErrors.bio}
                  >
                    <textarea
                      id="bio"
                      name="bio"
                      rows={5}
                      value={form.bio}
                      onChange={(e) => set("bio", e.target.value)}
                      placeholder={t({
                        ar: "ماذا تعمل؟ ما الذي يمكنك مساعدة الرياديّين به؟ ما الذي جعلك خبيرًا في مجالك؟",
                        en: "What do you do? How can you help founders? What makes you an expert in your field?",
                      })}
                      maxLength={4000}
                      aria-invalid={Boolean(fieldErrors.bio)}
                      aria-describedby={fieldErrors.bio ? "bio-error" : undefined}
                      className="block w-full rounded-sm bg-transparent text-foreground placeholder:text-fg-faint text-[15px] leading-[1.85] outline-none resize-none py-2.5 focus-visible:ring-2 focus-visible:ring-primary/50"
                      data-testid="input-bio"
                      autoFocus
                    />
                  </FieldWrap>

                  <FieldWrap
                    id="linkedinUrl"
                    label={t({ ar: "رابط LinkedIn (اختياريّ)", en: "LinkedIn URL (optional)" })}
                    hint="LinkedIn"
                    icon={Linkedin}
                    error={fieldErrors.linkedinUrl}
                  >
                    <input
                      id="linkedinUrl"
                      name="linkedinUrl"
                      type="url"
                      dir="ltr"
                      value={form.linkedinUrl}
                      onChange={(e) => set("linkedinUrl", e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      maxLength={400}
                      aria-invalid={Boolean(fieldErrors.linkedinUrl)}
                      aria-describedby={fieldErrors.linkedinUrl ? "linkedinUrl-error" : undefined}
                      className="block w-full rounded-sm bg-transparent text-foreground placeholder:text-fg-faint text-[15.5px] outline-none py-2.5 focus-visible:ring-2 focus-visible:ring-primary/50"
                      data-testid="input-linkedinUrl"
                    />
                  </FieldWrap>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        role="alert"
                        aria-live="assertive"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-2xl px-4 py-3 bg-destructive/[0.07] border border-destructive/30 text-destructive text-[13px] leading-relaxed"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="min-h-14 px-6 rounded-2xl bg-surface-2 border border-border-strong text-fg-secondary font-semibold text-[14px] hover:border-primary/35 hover:text-foreground transition-colors"
                    >
                      {t({ ar: "→ السابق", en: "← Back" })}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="cta-fill group relative flex-1 overflow-hidden rounded-2xl h-14 font-bold text-[15px] tracking-wide transition-all duration-300 enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px disabled:opacity-45 disabled:cursor-not-allowed"
                      data-testid="button-submit"
                    >
                      <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
                        {submitting ? (
                          <>
                            <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                            {t({ ar: "جارِ الإرسال…", en: "Sending…" })}
                          </>
                        ) : (
                          <>
                            {t({ ar: "أرسل الطلب", en: "Submit application" })}
                            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                          </>
                        )}
                      </span>
                    </button>
                  </div>

                  <p className="text-[11.5px] text-muted-foreground text-center leading-[1.8]">
                    {t({
                      ar: "بإرسالك الطلب توافق على أن نتواصل معك بشأنه فقط.",
                      en: "By submitting, you agree that we may contact you only about this application.",
                    })}
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// FieldWrap — the Apply-page hairline-underline field: a quiet label with a
// latin hint + icon on the trailing side, a baseline rule that lights crimson on
// focus (destructive on error), and an animated error line. No boxed card.
function FieldWrap({
  id,
  label,
  hint,
  icon: Icon,
  error,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  icon: React.ElementType;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center justify-between mb-2.5 text-[11.5px] tracking-[0.06em]"
      >
        <span className="text-fg-secondary font-semibold">{label}</span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Icon className="w-3 h-3" />
          <span className="text-[10px] tracking-[0.16em] uppercase">{hint}</span>
        </span>
      </label>
      <div
        className={`border-b transition-colors ${
          error
            ? "border-destructive/60 focus-within:border-destructive"
            : "border-border-strong focus-within:border-primary"
        }`}
      >
        {children}
      </div>
      <AnimatePresence>
        {error && (
          <motion.div
            id={`${id}-error`}
            initial={{ opacity: 0, y: -2, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[11.5px] text-destructive mt-1.5"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Field — a single-line input built on FieldWrap, mirroring the Apply page.
function Field({
  id,
  label,
  hint,
  icon,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  ltr = false,
  maxLength,
  autoComplete,
  autoFocus,
}: {
  id: string;
  label: string;
  hint: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  ltr?: boolean;
  maxLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  return (
    <FieldWrap id={id} label={label} hint={hint} icon={icon} error={error}>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={ltr ? "ltr" : "auto"}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        className="block w-full rounded-sm bg-transparent text-foreground placeholder:text-fg-faint text-[15.5px] outline-none py-2.5 focus-visible:ring-2 focus-visible:ring-primary/50"
        data-testid={`input-${id}`}
      />
    </FieldWrap>
  );
}
