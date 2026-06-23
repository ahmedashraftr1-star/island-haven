import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6" dir={dir}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-primary/80 mb-2 tracking-wide">
              {t({ ar: "وصل طلبك", en: "Your application arrived" })}
            </p>
            <h1 className="text-[28px] font-bold text-foreground leading-tight mb-3">
              {t({ ar: "شكرًا لك يا ", en: "Thank you, " })}
              <span className="text-primary">{firstName}</span>
            </h1>
            <p className="text-[15px] text-foreground/65 leading-[1.85]">
              {t({
                ar: "استلمنا طلبك بأمان وسيراجعه فريقنا قريبًا. ستصلك رسالة تأكيد على بريدك الإلكترونيّ، وسنتواصل معك بمجرّد البتّ في الطلب.",
                en: "We've safely received your application and our team will review it soon. A confirmation email is on its way, and we'll reach out as soon as a decision is made.",
              })}
            </p>
          </div>
          <Link
            href="/experts"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold text-[14px] hover:shadow-soft-hover transition-shadow"
          >
            {t({ ar: "تصفّح الخبراء", en: "Browse experts" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-5 py-3 flex items-center justify-between">
        <Link
          href="/experts"
          className="flex items-center gap-1.5 text-[13px] text-foreground/55 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
          {t({ ar: "العودة", en: "Back" })}
        </Link>
        <HavenMark className="h-7 w-auto" />
        <span className="text-[13px] text-foreground/40 select-none tabular-nums">
          {num(step + 1, lang)} / {num(STEPS.length, lang)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-border">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={false}
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>

      <div className="max-w-lg mx-auto px-5 pt-10 pb-20">
        {/* Step tabs */}
        <div className="flex gap-1 mb-8">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => i < step && setStep(i)}
              className={`flex-1 py-1.5 rounded-full text-[11.5px] font-semibold transition-colors ${
                i === step
                  ? "bg-primary text-white"
                  : i < step
                  ? "bg-primary/15 text-primary cursor-pointer"
                  : "bg-muted text-foreground/35 cursor-default"
              }`}
            >
              {t(s.label)}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-[26px] font-bold text-foreground mb-1">
                  {t({ ar: "كُن مرشدًا في ", en: "Become a mentor at " })}
                  <span className="text-primary">
                    {t({ ar: "آيلاند هيفن", en: "Island Haven" })}
                  </span>
                </h1>
                <p className="text-[14px] text-foreground/55 leading-[1.8]">
                  {t({
                    ar: "شارك خبرتك مع رواد الأعمال الشباب في غزّة. طلبك سيُراجَع ونتواصل معك قريبًا.",
                    en: "Share your expertise with young founders in Gaza. We'll review your application and reach out soon.",
                  })}
                </p>
              </div>

              <FormField
                label={t({ ar: "الاسم الكامل", en: "Full name" })}
                icon={<UserIcon className="w-4 h-4" />}
                error={fieldErrors.fullName}
              >
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder={t({ ar: "مثال: أحمد الفرّا", en: "e.g. Ahmad Al-Farra" })}
                  maxLength={120}
                  className="w-full bg-transparent outline-none text-[14px] placeholder:text-foreground/30"
                  autoFocus
                />
              </FormField>

              <FormField
                label={t({ ar: "البريد الإلكترونيّ", en: "Email address" })}
                icon={<Mail className="w-4 h-4" />}
                error={fieldErrors.email}
              >
                <input
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="name@example.com"
                  maxLength={160}
                  className="w-full bg-transparent outline-none text-[14px] placeholder:text-foreground/30"
                />
              </FormField>

              <button
                type="button"
                onClick={nextStep}
                className="w-full h-12 rounded-full bg-primary text-white font-semibold text-[14px] hover:shadow-soft-hover transition-shadow"
              >
                {t({ ar: "التالي ←", en: "Next →" })}
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-[26px] font-bold text-foreground mb-1">
                  {t({ ar: "ما هي ", en: "What are your " })}
                  <span className="text-primary">
                    {t({ ar: "تخصّصاتك؟", en: "specialties?" })}
                  </span>
                </h1>
                <p className="text-[14px] text-foreground/55 leading-[1.8]">
                  {t({
                    ar: "أخبرنا بمجالات خبرتك حتى نضعك في المكان الصحيح.",
                    en: "Tell us your areas of expertise so we can place you in the right team.",
                  })}
                </p>
              </div>

              <FormField
                label={t({
                  ar: "مجالات الخبرة (مفصولة بفاصلة)",
                  en: "Areas of expertise (comma-separated)",
                })}
                icon={<Briefcase className="w-4 h-4" />}
                error={fieldErrors.expertise}
              >
                <input
                  type="text"
                  value={form.expertise}
                  onChange={(e) => set("expertise", e.target.value)}
                  placeholder={t({
                    ar: "مثال: ريادة أعمال، تسويق رقميّ، تصميم",
                    en: "e.g. Entrepreneurship, digital marketing, design",
                  })}
                  maxLength={400}
                  className="w-full bg-transparent outline-none text-[14px] placeholder:text-foreground/30"
                  autoFocus
                />
              </FormField>

              <FormField
                label={t({ ar: "سنوات الخبرة", en: "Years of experience" })}
                icon={<Star className="w-4 h-4" />}
                error={fieldErrors.yearsExperience}
              >
                <input
                  type="number"
                  min={0}
                  max={80}
                  value={form.yearsExperience}
                  onChange={(e) =>
                    set("yearsExperience", Number(e.target.value) || 0)
                  }
                  className="w-full bg-transparent outline-none text-[14px] tabular-nums"
                />
              </FormField>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="h-12 px-6 rounded-full bg-muted text-foreground/65 font-semibold text-[14px] hover:bg-muted/70 transition-colors"
                >
                  {t({ ar: "→ السابق", en: "← Back" })}
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 h-12 rounded-full bg-primary text-white font-semibold text-[14px] hover:shadow-soft-hover transition-shadow"
                >
                  {t({ ar: "التالي ←", en: "Next →" })}
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
            >
              <form onSubmit={onSubmit} noValidate className="space-y-6">
                <div>
                  <h1 className="text-[26px] font-bold text-foreground mb-1">
                    {t({ ar: "أخبرنا ", en: "Tell us " })}
                    <span className="text-primary">
                      {t({ ar: "عن نفسك", en: "about yourself" })}
                    </span>
                  </h1>
                  <p className="text-[14px] text-foreground/55 leading-[1.8]">
                    {t({
                      ar: "نبذة عن تجربتك وما يمكنك تقديمه للمنتسبين.",
                      en: "A short note on your experience and what you can offer members.",
                    })}
                  </p>
                </div>

                <FormField
                  label={t({ ar: "نبذة تعريفيّة", en: "About you" })}
                  icon={<BookOpen className="w-4 h-4" />}
                  error={fieldErrors.bio}
                >
                  <textarea
                    rows={5}
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    placeholder={t({
                      ar: "ماذا تعمل؟ ما الذي يمكنك مساعدة الرياديّين به؟ ما الذي جعلك خبيرًا في مجالك؟",
                      en: "What do you do? How can you help founders? What makes you an expert in your field?",
                    })}
                    maxLength={4000}
                    className="w-full bg-transparent outline-none text-[14px] resize-none leading-[1.85] placeholder:text-foreground/30"
                    autoFocus
                  />
                </FormField>

                <FormField
                  label={t({ ar: "رابط LinkedIn (اختياريّ)", en: "LinkedIn URL (optional)" })}
                  icon={<Linkedin className="w-4 h-4" />}
                  error={fieldErrors.linkedinUrl}
                >
                  <input
                    type="url"
                    dir="ltr"
                    value={form.linkedinUrl}
                    onChange={(e) => set("linkedinUrl", e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    maxLength={400}
                    className="w-full bg-transparent outline-none text-[13.5px] placeholder:text-foreground/30"
                  />
                </FormField>

                {error && (
                  <div className="rounded-xl px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-12 px-6 rounded-full bg-muted text-foreground/65 font-semibold text-[14px] hover:bg-muted/70 transition-colors"
                  >
                    {t({ ar: "→ السابق", en: "← Back" })}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-12 rounded-full bg-primary text-white font-semibold text-[14px] enabled:hover:shadow-soft-hover transition-shadow disabled:opacity-50"
                  >
                    {submitting
                      ? t({ ar: "جارِ الإرسال…", en: "Sending…" })
                      : t({ ar: "أرسل الطلب", en: "Submit application" })}
                  </button>
                </div>

                <p className="text-[11.5px] text-foreground/40 text-center leading-[1.8]">
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
  );
}

function FormField({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground/55 mb-1.5">
        {icon && <span className="text-foreground/40">{icon}</span>}
        {label}
      </label>
      <div
        className={`flex items-start gap-2 rounded-xl border px-4 py-3 bg-muted/30 transition-colors focus-within:border-primary/50 focus-within:bg-card ${
          error ? "border-rose-400 bg-rose-50/40" : "border-border"
        }`}
      >
        {children}
      </div>
      {error && (
        <p className="text-[11.5px] text-rose-600 px-1">{error}</p>
      )}
    </div>
  );
}
