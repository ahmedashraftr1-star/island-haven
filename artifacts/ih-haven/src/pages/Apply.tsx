import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
  User as UserIcon,
  Briefcase,
  GraduationCap,
  BookOpen,
  Sparkle,
  PenLine,
  Link2,
  Github,
  Clock,
  Tag,
  Heart,
  FileUp,
  Loader2,
  FolderOpen,
  BriefcaseBusiness,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { HavenMark } from "@/components/landing/HavenMark";
import { useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

type CategoryId = "freelancer" | "graduate" | "student" | "other";

const FALLBACK = {
  backLabel: "العودة",
  brandLatin: "Island Haven",
  brandArabic: "آيلاند هيفن",
  titleLead: "انضمّ إلى",
  titleAccent: "آيلاند هيفن",
  subtitle:
    "حاضنة تقنيّة استثنائيّة في قلب غزّة، مفتوحة لمن يرفض أن تحدّه الظروف. أثبت أنّك مستعدّ — وسنتواصل معك خلال أيّام.",
  sec1Title: "هويّتك",
  sec1Sub: "Identity",
  fullNameLabel: "الاسم الكامل",
  fullNameHint: "Full name",
  fullNamePlaceholder: "مثال: ياسمين الغزّاوي",
  emailLabel: "البريد الإلكتروني",
  emailHint: "Email",
  emailPlaceholder: "name@example.com",
  phoneLabel: "رقم الواتساب",
  phoneHint: "WhatsApp",
  phonePlaceholder: "+970 …",
  sec2Title: "مسارك",
  sec2Sub: "Your Track",
  cat1Label: "مستقلّ",
  cat1Sub: "Freelancer",
  cat2Label: "خرّيج جامعي",
  cat2Sub: "Graduate",
  cat3Label: "طالب جامعي",
  cat3Sub: "Student",
  cat4Label: "غير ذلك",
  cat4Sub: "Other",
  sec3Title: "قصّتك",
  sec3Sub: "Your Story",
  bioLabel: "نبذة عنك ومجال عملك",
  bioHint: "Bio",
  bioPlaceholder: "ماذا تعمل أو تدرس؟ ما الذي تريد تحقيقه، وما الذي يجعلك مختلفًا؟",
  motivationLabel: "لماذا آيلاند هيفن؟",
  motivationHint: "Motivation",
  motivationPlaceholder: "أقنعنا — لماذا أنت بالتحديد تنتمي لمجتمع آيلاند؟ ما الذي ستُضيفه وما الذي تطمح لتحقيقه؟",
  sec4Title: "كفاءتك",
  sec4Sub: "Expertise",
  skillsLabel: "مهاراتك التقنيّة",
  skillsHint: "Skills",
  skillsPlaceholder: "مثال: React، Node.js، Figma، Python — كلّ ما تتقنه …",
  specializationLabel: "التخصّص الأكاديمي / الجامعة",
  specializationHint: "Academic",
  specializationPlaceholder: "مثال: هندسة الحاسوب — الجامعة الإسلامية",
  yearsLabel: "سنوات الخبرة",
  sec5Title: "حضورك الرقميّ",
  sec5Sub: "Digital Presence",
  linkedinLabel: "رابط LinkedIn",
  linkedinHint: "LinkedIn",
  linkedinPlaceholder: "https://linkedin.com/in/username",
  portfolioLabel: "GitHub / Portfolio / موقعك الشخصي",
  portfolioHint: "Portfolio",
  portfolioPlaceholder: "https://github.com/username",
  sec6Title: "إنجازاتك",
  sec6Sub: "Achievements",
  previousWorkLabel: "مشاريع أو أعمال تفخر بها",
  previousWorkHint: "Projects",
  previousWorkPlaceholder: "أخبرنا عن مشروع أنجزته أو عمل تفخر به — أو ضع رابطًا لأعمالك. هذا مكانك لتُثبت نفسك …",
  sec7Title: "التزامك",
  sec7Sub: "Commitment",
  weeklyHoursLabel: "ساعات متاحة في الأسبوع",
  employedLabel: "وضعك الوظيفي الحالي",
  employedYes: "أعمل حاليًا",
  employedNo: "أبحث عن فرصة",
  sec8Title: "ملفّك الكامل",
  sec8Sub: "CV / Résumé",
  cvUploadLabel: "سيرتك الذاتية (PDF، حتّى 10 ميغا)",
  cvUploadHint: "اختياري لكنّه يُقوّي طلبك",
  cvUploadBtn: "ارفع ملف PDF",
  cvUploadLoading: "جارٍ الرفع…",
  cvUploadDone: "تمّ الرفع بنجاح",
  cvUploadRemove: "إزالة",
  submitLabel: "أرسل طلبي للمراجعة",
  submitLoading: "جارٍ الإرسال…",
  consentLine: "بإرسالك الطلب، توافق على أن نتواصل معك بشأنه فقط.",
  trustLabel: "بدعمٍ من",
  trustBrand: "من الناس إلى الناس",
  errFallback: "تعذّر إرسال الطلب، حاول مجدّدًا.",
  errNetwork: "تعذّر الاتّصال بالخادم. تحقّق من اتّصالك وحاول مجدّدًا.",
  successThanksLead: "شكرًا لك يا",
  successFallbackName: "صديقنا",
  successBody:
    "استلمنا طلبك وسيراجعه الفريق بعناية. سنتواصل معك على واتساب خلال أيّام.\nأهلًا بك في عائلة آيلاند هيفن — المستقبل يبدأ من هنا.",
  successRefLabel: "رقم الطلب",
  successCta: "العودة للرئيسيّة",
  docTitle: "انضمّ إلى آيلاند هيفن",
};
type ApplyContent = typeof FALLBACK;

// English counterpart — keyed identically to FALLBACK. The Arabic strings live in
// FALLBACK (and are CMS-overridable); English UI chrome is resolved from here.
const FALLBACK_EN: ApplyContent = {
  backLabel: "Back",
  brandLatin: "Island Haven",
  brandArabic: "Island Haven",
  titleLead: "Join",
  titleAccent: "Island Haven",
  subtitle:
    "An exceptional tech incubator in the heart of Gaza, open to those who refuse to be defined by circumstance. Show us you're ready — and we'll be in touch within days.",
  sec1Title: "Identity",
  sec1Sub: "Identity",
  fullNameLabel: "Full name",
  fullNameHint: "Full name",
  fullNamePlaceholder: "e.g. Yasmine Al-Ghazzawi",
  emailLabel: "Email address",
  emailHint: "Email",
  emailPlaceholder: "name@example.com",
  phoneLabel: "WhatsApp number",
  phoneHint: "WhatsApp",
  phonePlaceholder: "+970 …",
  sec2Title: "Your track",
  sec2Sub: "Your Track",
  cat1Label: "Freelancer",
  cat1Sub: "Freelancer",
  cat2Label: "Graduate",
  cat2Sub: "Graduate",
  cat3Label: "Student",
  cat3Sub: "Student",
  cat4Label: "Other",
  cat4Sub: "Other",
  sec3Title: "Your story",
  sec3Sub: "Your Story",
  bioLabel: "About you and your field",
  bioHint: "Bio",
  bioPlaceholder: "What do you do or study? What do you want to achieve, and what sets you apart?",
  motivationLabel: "Why Island Haven?",
  motivationHint: "Motivation",
  motivationPlaceholder: "Make the case — why do you, specifically, belong in the Island community? What will you bring, and what do you hope to achieve?",
  sec4Title: "Your expertise",
  sec4Sub: "Expertise",
  skillsLabel: "Your technical skills",
  skillsHint: "Skills",
  skillsPlaceholder: "e.g. React, Node.js, Figma, Python — everything you're great at …",
  specializationLabel: "Academic major / university",
  specializationHint: "Academic",
  specializationPlaceholder: "e.g. Computer Engineering — Islamic University",
  yearsLabel: "Years of experience",
  sec5Title: "Your digital presence",
  sec5Sub: "Digital Presence",
  linkedinLabel: "LinkedIn URL",
  linkedinHint: "LinkedIn",
  linkedinPlaceholder: "https://linkedin.com/in/username",
  portfolioLabel: "GitHub / Portfolio / personal site",
  portfolioHint: "Portfolio",
  portfolioPlaceholder: "https://github.com/username",
  sec6Title: "Your achievements",
  sec6Sub: "Achievements",
  previousWorkLabel: "Projects or work you're proud of",
  previousWorkHint: "Projects",
  previousWorkPlaceholder: "Tell us about a project you shipped or work you're proud of — or drop a link to your portfolio. This is your space to prove yourself …",
  sec7Title: "Your commitment",
  sec7Sub: "Commitment",
  weeklyHoursLabel: "Hours available per week",
  employedLabel: "Your current employment status",
  employedYes: "Currently working",
  employedNo: "Looking for an opportunity",
  sec8Title: "Your full profile",
  sec8Sub: "CV / Résumé",
  cvUploadLabel: "Your CV (PDF, up to 10 MB)",
  cvUploadHint: "Optional, but it strengthens your application",
  cvUploadBtn: "Upload a PDF",
  cvUploadLoading: "Uploading…",
  cvUploadDone: "Uploaded successfully",
  cvUploadRemove: "Remove",
  submitLabel: "Submit my application",
  submitLoading: "Submitting…",
  consentLine: "By submitting, you agree that we may contact you about your application only.",
  trustLabel: "Powered by",
  trustBrand: "People to People",
  errFallback: "We couldn't submit your application. Please try again.",
  errNetwork: "We couldn't reach the server. Check your connection and try again.",
  successThanksLead: "Thank you,",
  successFallbackName: "friend",
  successBody:
    "We've received your application and the team will review it carefully. We'll reach out on WhatsApp within days.\nWelcome to the Island Haven family — the future starts here.",
  successRefLabel: "Application no.",
  successCta: "Back to home",
  docTitle: "Join Island Haven",
};

export default function Apply() {
  const { lang, dir, t } = useLanguage();
  const reduce = useReducedMotion();
  // Arabic content (CMS-overridable); English UI chrome from FALLBACK_EN.
  const arContent = useContentSection("applyForm", FALLBACK);
  const c: ApplyContent = lang === "en" ? FALLBACK_EN : arContent;
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    category: "freelancer" as CategoryId,
    bio: "",
    motivation: "",
    previousWork: "",
    skills: "",
    specialization: "",
    linkedinUrl: "",
    portfolioUrl: "",
  });
  const [yearsExperience, setYearsExperience] = useState<number | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<number | null>(null);
  const [isEmployed, setIsEmployed] = useState<boolean | null>(null);
  const [cvUrl, setCvUrl] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [cvUploading, setCvUploading] = useState(false);
  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const errorRef = useRef<HTMLDivElement | null>(null);

  async function uploadCv(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setError(t({ ar: "حجم الملف أكبر من ١٠ ميغا", en: "File is larger than 10 MB" }));
      return;
    }
    setCvUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch("/api/uploads/cv", { method: "POST", body: fd });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || t({ ar: "فشل رفع الملف", en: "File upload failed" }));
      setCvUrl(json.url);
      setCvFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : t({ ar: "تعذّر رفع السيرة الذاتية", en: "We couldn't upload your CV" }));
    } finally {
      setCvUploading(false);
    }
  }

  const CATEGORIES: Array<{
    id: CategoryId;
    label: string;
    sub: string;
    Icon: typeof Briefcase;
  }> = [
    { id: "freelancer", label: c.cat1Label, sub: c.cat1Sub, Icon: Briefcase },
    { id: "graduate", label: c.cat2Label, sub: c.cat2Sub, Icon: GraduationCap },
    { id: "student", label: c.cat3Label, sub: c.cat3Sub, Icon: BookOpen },
    { id: "other", label: c.cat4Label, sub: c.cat4Sub, Icon: Sparkle },
  ];

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  // Locale-aware numerals — Arabic-Indic in AR, Western in EN (matches NumbersBand).
  const fmtNum = (n: number) => n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");

  const canSubmit =
    form.fullName.trim().length >= 2 &&
    form.email.trim().length > 3 &&
    form.phone.trim().length >= 6 &&
    form.bio.trim().length >= 10 &&
    form.motivation.trim().length >= 10 &&
    !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setIssues({});
    try {
      const payload = {
        ...form,
        ...(yearsExperience !== null ? { yearsExperience } : {}),
        ...(weeklyHours !== null ? { weeklyHours } : {}),
        ...(isEmployed !== null ? { isEmployed } : {}),
        ...(cvUrl ? { cvUrl } : {}),
      };
      const resp = await api<{ ok: boolean; id: number }>("/applications", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setDone({ id: resp.id });
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data === "object") {
        const d = e.data as {
          error?: string;
          issues?: Array<{ path: string; message: string }>;
        };
        setError(d.error || c.errFallback);
        if (Array.isArray(d.issues)) {
          const m: Record<string, string> = {};
          for (const i of d.issues) m[i.path] = i.message;
          setIssues(m);
          // Focus first invalid field for accessibility
          const first = d.issues[0]?.path;
          if (first) {
            const el = document.getElementById(first);
            if (el) (el as HTMLElement).focus();
          }
        }
      } else {
        setError(c.errNetwork);
      }
      // Move focus to the error region
      setTimeout(() => errorRef.current?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return <SuccessScreen id={done.id} firstName={form.fullName.trim().split(" ")[0]} c={c} />;

  return (
    <div
      dir={dir}
      className="relative min-h-screen bg-background text-foreground"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      {/* Top bar */}
      <header className="relative z-20 px-5 sm:px-8 lg:px-14 pt-6 sm:pt-8">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[12px] tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
            {c.backLabel}
          </Link>
          <div className="flex items-center gap-2.5">
            <HavenMark size={32} strokeColor="hsl(354 78% 47%)" />
            <div className="leading-tight text-right">
              <div className="text-[13px] font-bold tracking-tight">{c.brandLatin}</div>
              <div className="text-[10px] text-muted-foreground tracking-[0.16em] uppercase">{c.brandArabic}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="relative z-10 px-5 sm:px-8 lg:px-14 pb-24">
        <div className="mx-auto max-w-2xl">
          {/* ── Monumental header — one calm line, one crimson word, acres of space.
              An eyebrow leads, a lead follows, and a hairline rule closes the
              header so the form begins on a clean editorial baseline. ── */}
          <header
            className="mb-[clamp(3.5rem,8vw,6rem)]"
            style={{ paddingBlock: "clamp(3rem, 9vh, 6rem) 0" }}
          >
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
              className="flex items-center gap-3 mb-[clamp(1.25rem,2.5vw,1.75rem)]"
            >
              <span aria-hidden className="h-px w-9 bg-primary/50" />
              <span className="eyebrow text-primary">
                {t({ ar: "طلب الانضمام · الدفعة الأولى", en: "Application · First cohort" })}
              </span>
            </motion.div>
            <h1
              className="font-display text-foreground"
              style={{
                fontSize: "clamp(2.6rem, 8.4vw, 5rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.04em",
                fontWeight: 700,
              }}
            >
              {[
                c.titleLead,
                <span key="accent" className="text-primary">{c.titleAccent}</span>,
              ].map((ln, i) => (
                <motion.span
                  key={i}
                  className="block will-change-transform"
                  initial={reduce ? false : { opacity: 0, y: 30 }}
                  animate={reduce ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.1 + i * 0.09, ease: EASE_OUT_EXPO }}
                >
                  {ln}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.32, ease: EASE_OUT_EXPO }}
              className="mt-[clamp(1.75rem,3.5vw,2.5rem)] max-w-xl text-fg-secondary"
              style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.3rem)", lineHeight: 1.65 }}
            >
              {c.subtitle}
            </motion.p>
            <motion.div
              aria-hidden
              initial={reduce ? false : { opacity: 0, scaleX: 0 }}
              animate={reduce ? undefined : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 1, delay: 0.45, ease: EASE_OUT_EXPO }}
              className="hairline mt-[clamp(2.5rem,5vw,4rem)] origin-left rtl:origin-right"
            />
          </header>

          {/* Who should apply & what we look for — a concise eligibility block so
              applicants self-qualify (and feel reassured) before the form. Copy
              reused from the homepage FAQ for one consistent voice. */}
          <EligibilityBlock />

          {/* What happens after you apply — a short, honest timeline so applicants
              know the journey before they invest in the form below. */}
          <ProcessStrip />

          <motion.form
            onSubmit={onSubmit}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.2, ease: EASE_OUT_EXPO }}
            className="relative"
            noValidate
          >
            <div className="relative">
              <div className="relative space-y-12 sm:space-y-14">
                {/* Section: identity */}
                <SectionHeader title={c.sec1Title} sub={c.sec1Sub} step={1} />

                <Field
                  id="fullName"
                  label={c.fullNameLabel}
                  hint={c.fullNameHint}
                  icon={UserIcon}
                  value={form.fullName}
                  onChange={(v) => update("fullName", v)}
                  error={issues.fullName}
                  placeholder={c.fullNamePlaceholder}
                  autoComplete="name"
                />

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field
                    id="email"
                    label={c.emailLabel}
                    hint={c.emailHint}
                    icon={Mail}
                    value={form.email}
                    onChange={(v) => update("email", v)}
                    error={issues.email}
                    placeholder={c.emailPlaceholder}
                    type="email"
                    ltr
                    autoComplete="email"
                  />
                  <Field
                    id="phone"
                    label={c.phoneLabel}
                    hint={c.phoneHint}
                    icon={Phone}
                    value={form.phone}
                    onChange={(v) => update("phone", v)}
                    error={issues.phone}
                    placeholder={c.phonePlaceholder}
                    type="tel"
                    ltr
                    autoComplete="tel"
                  />
                </div>

                {/* Section: category */}
                <div className="pt-2">
                  <SectionHeader title={c.sec2Title} sub={c.sec2Sub} step={2} />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1">
                    {CATEGORIES.map((cat) => {
                      const active = form.category === cat.id;
                      const Icon = cat.Icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => update("category", cat.id)}
                          aria-pressed={active}
                          className={`group relative overflow-hidden rounded-2xl p-3.5 text-center transition-[background-color,border-color,transform] duration-200 border ${
                            active
                              ? "bg-primary/[0.08] border-primary/45"
                              : "bg-surface-2 border-border-strong hover:bg-surface-3 hover:border-primary/30 hover:-translate-y-0.5"
                          }`}
                        >
                          {/* A quiet crimson baseline rule marks the chosen track — depth, not glow. */}
                          {active && (
                            <motion.span
                              aria-hidden
                              layoutId="apply-category-rule"
                              className="absolute inset-x-0 bottom-0 h-[2px] bg-primary/70"
                              transition={{ duration: reduce ? 0 : 0.32, ease: EASE_OUT_EXPO }}
                            />
                          )}
                          <Icon
                            className={`w-5 h-5 mx-auto mb-2 transition-colors ${
                              active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            }`}
                            strokeWidth={1.8}
                          />
                          <div
                            className={`text-[12.5px] font-semibold transition-colors ${
                              active ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {cat.label}
                          </div>
                          <div className="text-[9.5px] tracking-[0.14em] uppercase text-muted-foreground mt-0.5">
                            {cat.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section: bio + motivation */}
                <div className="pt-2">
                  <SectionHeader title={c.sec3Title} sub={c.sec3Sub} step={3} />
                  <div className="space-y-5">
                    <FieldWrap
                      id="bio"
                      label={c.bioLabel}
                      hint={c.bioHint}
                      icon={PenLine}
                      error={issues.bio}
                    >
                      <textarea
                        id="bio"
                        value={form.bio}
                        onChange={(e) => update("bio", e.target.value)}
                        rows={4}
                        maxLength={2000}
                        placeholder={c.bioPlaceholder}
                        className="block w-full bg-transparent text-foreground placeholder:text-fg-faint text-[15px] leading-[1.85] outline-none resize-none py-2.5"
                        data-testid="input-bio"
                      />
                      <div className="text-[10.5px] text-fg-faint mt-1.5 tracking-wide">{fmtNum(form.bio.length)}/{fmtNum(2000)}</div>
                    </FieldWrap>
                    <FieldWrap
                      id="motivation"
                      label={c.motivationLabel}
                      hint={c.motivationHint}
                      icon={Heart}
                      error={issues.motivation}
                    >
                      <textarea
                        id="motivation"
                        value={form.motivation}
                        onChange={(e) => update("motivation", e.target.value)}
                        rows={4}
                        maxLength={2000}
                        placeholder={c.motivationPlaceholder}
                        className="block w-full bg-transparent text-foreground placeholder:text-fg-faint text-[15px] leading-[1.85] outline-none resize-none py-2.5"
                        data-testid="input-motivation"
                      />
                      <div className="text-[10.5px] text-fg-faint mt-1.5 tracking-wide">{fmtNum(form.motivation.length)}/{fmtNum(2000)}</div>
                    </FieldWrap>
                  </div>
                </div>

                {/* Section 04: Professional */}
                <div className="pt-2">
                  <SectionHeader title={c.sec4Title} sub={c.sec4Sub} step={4} />
                  <div className="space-y-5">
                    <Field
                      id="skills"
                      label={c.skillsLabel}
                      hint={c.skillsHint}
                      icon={Tag}
                      value={form.skills}
                      onChange={(v) => update("skills", v)}
                      error={issues.skills}
                      placeholder={c.skillsPlaceholder}
                    />
                    <Field
                      id="specialization"
                      label={c.specializationLabel}
                      hint={c.specializationHint}
                      icon={GraduationCap}
                      value={form.specialization}
                      onChange={(v) => update("specialization", v)}
                      error={issues.specialization}
                      placeholder={c.specializationPlaceholder}
                    />
                    {/* Years of experience chips */}
                    <div>
                      <div className="flex items-center justify-between mb-3 text-[11.5px] tracking-[0.06em]">
                        <span className="text-fg-secondary font-semibold">{c.yearsLabel}</span>
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] tracking-[0.16em] uppercase">Experience</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2" dir={dir}>
                        {([0, 1, 2, 3, 5, 7, 10, 15] as const).map((yr) => {
                          const active = yearsExperience === yr;
                          return (
                            <button
                              key={yr}
                              type="button"
                              onClick={() => setYearsExperience(active ? null : yr)}
                              className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border transition-all ${
                                active
                                  ? "bg-primary/[0.08] border-primary/50 text-primary"
                                  : "bg-surface-2 border-border-strong text-fg-secondary hover:border-primary/35 hover:text-foreground"
                              }`}
                            >
                              {yr === 0
                                ? t({ ar: "أقل من سنة", en: "< 1 year" })
                                : yr === 15
                                  ? t({ ar: `${fmtNum(15)}+ سنة`, en: "15+ years" })
                                  : `${fmtNum(yr)}+`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 05: Links */}
                <div className="pt-2">
                  <SectionHeader title={c.sec5Title} sub={c.sec5Sub} step={5} />
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field
                      id="linkedinUrl"
                      label={c.linkedinLabel}
                      hint={c.linkedinHint}
                      icon={Link2}
                      value={form.linkedinUrl}
                      onChange={(v) => update("linkedinUrl", v)}
                      error={issues.linkedinUrl}
                      placeholder={c.linkedinPlaceholder}
                      ltr
                    />
                    <Field
                      id="portfolioUrl"
                      label={c.portfolioLabel}
                      hint={c.portfolioHint}
                      icon={Github}
                      value={form.portfolioUrl}
                      onChange={(v) => update("portfolioUrl", v)}
                      error={issues.portfolioUrl}
                      placeholder={c.portfolioPlaceholder}
                      ltr
                    />
                  </div>
                </div>

                {/* Section 06: Previous work */}
                <div className="pt-2">
                  <SectionHeader title={c.sec6Title} sub={c.sec6Sub} step={6} />
                  <FieldWrap
                    id="previousWork"
                    label={c.previousWorkLabel}
                    hint={c.previousWorkHint}
                    icon={FolderOpen}
                    error={issues.previousWork}
                  >
                    <textarea
                      id="previousWork"
                      value={form.previousWork}
                      onChange={(e) => update("previousWork", e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder={c.previousWorkPlaceholder}
                      className="block w-full bg-transparent text-foreground placeholder:text-fg-faint text-[15px] leading-[1.85] outline-none resize-none py-2.5"
                      data-testid="input-previousWork"
                    />
                    <div className="text-[10.5px] text-fg-faint mt-1.5 tracking-wide">{fmtNum(form.previousWork.length)}/{fmtNum(1000)}</div>
                  </FieldWrap>
                </div>

                {/* Section 07: Availability */}
                <div className="pt-2">
                  <SectionHeader title={c.sec7Title} sub={c.sec7Sub} step={7} />
                  <div className="space-y-5">
                    {/* Weekly hours chips */}
                    <div>
                      <div className="flex items-center justify-between mb-3 text-[11.5px] tracking-[0.06em]">
                        <span className="text-fg-secondary font-semibold">{c.weeklyHoursLabel}</span>
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] tracking-[0.16em] uppercase">hrs/week</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2" dir={dir}>
                        {([5, 10, 15, 20, 30, 40] as const).map((h) => {
                          const active = weeklyHours === h;
                          return (
                            <button
                              key={h}
                              type="button"
                              onClick={() => setWeeklyHours(active ? null : h)}
                              className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border transition-all ${
                                active
                                  ? "bg-primary/[0.08] border-primary/50 text-primary"
                                  : "bg-surface-2 border-border-strong text-fg-secondary hover:border-primary/35 hover:text-foreground"
                              }`}
                            >
                              {fmtNum(h)}+ {t({ ar: "س/أسبوع", en: "hrs/wk" })}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Employed toggle */}
                    <div>
                      <div className="flex items-center justify-between mb-3 text-[11.5px] tracking-[0.06em]">
                        <span className="text-fg-secondary font-semibold">{c.employedLabel}</span>
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <BriefcaseBusiness className="w-3 h-3" />
                          <span className="text-[10px] tracking-[0.16em] uppercase">Employment</span>
                        </span>
                      </div>
                      <div className="flex gap-3" dir={dir}>
                        {([{ v: true, l: c.employedYes }, { v: false, l: c.employedNo }] as const).map((opt) => {
                          const active = isEmployed === opt.v;
                          return (
                            <button
                              key={String(opt.v)}
                              type="button"
                              onClick={() => setIsEmployed(active ? null : opt.v)}
                              className={`flex-1 min-h-11 py-2.5 rounded-2xl text-[13px] font-semibold border transition-all ${
                                active
                                  ? "bg-primary/[0.08] border-primary/50 text-primary"
                                  : "bg-surface-2 border-border-strong text-fg-secondary hover:border-primary/35 hover:text-foreground"
                              }`}
                            >
                              {opt.l}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 08: CV Upload */}
                <div className="pt-2">
                  <SectionHeader title={c.sec8Title} sub={c.sec8Sub} step={8} />
                  <input
                    ref={cvInputRef}
                    id="cv-upload-input"
                    type="file"
                    accept="application/pdf"
                    aria-label={t({ ar: "ارفع سيرتك الذاتية (PDF)", en: "Upload your CV (PDF)" })}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadCv(file);
                    }}
                  />
                  <label
                    htmlFor="cv-upload-input"
                    className={`block rounded-2xl border-2 border-dashed transition-colors ${
                      cvUrl
                        ? "border-primary/40 bg-primary/[0.05]"
                        : "border-border-strong bg-surface-2 hover:border-primary/30"
                    } p-5 text-center cursor-pointer`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) uploadCv(file);
                    }}
                  >
                    {cvUploading ? (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-[13.5px]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {c.cvUploadLoading}
                      </div>
                    ) : cvUrl ? (
                      <div className="flex items-center justify-center gap-2.5">
                        <FileUp className="w-4 h-4 text-primary" />
                        <span className="text-[13.5px] text-foreground font-medium">{cvFileName}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCvUrl(""); setCvFileName(""); }}
                          className="text-[11px] text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2 mr-1"
                        >
                          {c.cvUploadRemove}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <FileUp className="w-6 h-6 text-muted-foreground mx-auto" />
                        <div className="text-[13.5px] text-fg-secondary">{c.cvUploadLabel}</div>
                        <div className="text-[11px] text-muted-foreground">{c.cvUploadHint} · {t({ ar: "اسحب الملف هنا أو", en: "drag a file here or" })}</div>
                        <div className="inline-block mt-1 px-4 py-1.5 rounded-full bg-surface-3 border border-border-strong text-[12px] text-fg-secondary hover:text-foreground transition-colors">
                          {c.cvUploadBtn}
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                {/* Error region */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      ref={errorRef}
                      tabIndex={-1}
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

                {/* Submit */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="cta-fill group relative w-full overflow-hidden rounded-2xl h-14 font-bold text-[15px] tracking-wide transition-all duration-300 enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px disabled:opacity-45 disabled:cursor-not-allowed"
                    data-testid="button-submit"
                  >
                    <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
                      {submitting ? (
                        <>
                          <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          {c.submitLoading}
                        </>
                      ) : (
                        <>
                          {c.submitLabel}
                          <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                        </>
                      )}
                    </span>
                    {/* Shimmer */}
                    <span
                      aria-hidden
                      className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
                      style={{
                        background:
                          "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
                      }}
                    />
                  </button>
                  <p className="text-[11.5px] text-center text-muted-foreground mt-3.5 leading-relaxed">
                    {c.consentLine}
                  </p>
                </div>
              </div>
            </div>
          </motion.form>

          {/* Footer trust line */}
          <div className="mt-10 text-center text-[11px] text-muted-foreground tracking-[0.16em] uppercase">
            {c.trustLabel} <span className="text-fg-secondary font-semibold">{c.trustBrand}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable atoms
// ─────────────────────────────────────────────────────────────────────────────

// EligibilityBlock — "Who should apply & what we look for". Shown above the
// form so applicants self-qualify and feel reassured before investing time.
// Three honest beats, now as calm editorial hairline rows (no card, no bullet
// dots, no pill chips): WHO can apply, WHAT we look for, and the reassurance.
// Copy reused from the homepage FAQ so the whole site speaks with one voice.
// Bilingual, RTL-safe, transform/opacity only.
function EligibilityBlock() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  // WHO — eligibility, reused from the FAQ "who can apply" answer.
  const eligibility = [
    t({ ar: "أيّ موهبة رقميّة في غزّة", en: "Any digital talent in Gaza" }),
    t({ ar: "أيّ مرحلة — من فكرة إلى مشروع", en: "Any stage — idea to venture" }),
    t({ ar: "لا يلزم شهادة ولا خبرة سابقة", en: "No degree or résumé required" }),
  ];

  // WHAT we look for — the real selection criteria.
  const criteria = [
    { label: t({ ar: "الجدّيّة", en: "Seriousness" }) },
    { label: t({ ar: "الرغبة في البناء", en: "Desire to build" }) },
    { label: t({ ar: "قابليّة الإرشاد", en: "Coachability" }) },
    { label: t({ ar: "الأثر", en: "Impact" }) },
  ];

  // Reassurance — lowers the bar to pressing "apply".
  const reassure = [
    { label: t({ ar: "مجّاني تمامًا", en: "Entirely free" }) },
    { label: t({ ar: "~٢٠ دقيقة", en: "~20 minutes" }) },
    { label: t({ ar: "ردّ خلال أيّام", en: "Reply within days" }) },
  ];

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay: 0.08, ease: EASE_OUT_EXPO }}
      aria-label={t({ ar: "لِمَن التقديم وماذا نبحث عنه", en: "Who should apply and what we look for" })}
      className="mb-[clamp(3.5rem,8vw,5.5rem)]"
    >
      {/* WHO — eligibility, as a calm editorial row: a quiet label, the criteria
          set as plain prose separated by middots. No card, no bullet dots. */}
      <div className="grid sm:grid-cols-[minmax(0,11rem)_1fr] items-baseline gap-x-8 gap-y-2.5 py-[clamp(1.25rem,2.5vw,2rem)] border-t border-border-strong">
        <span className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">
          {t({ ar: "لِمَن آيلاند", en: "Who it's for" })}
        </span>
        <p className="text-fg-secondary" style={{ fontSize: "clamp(0.95rem,1.5vw,1.1rem)", lineHeight: 1.6 }}>
          {eligibility.join(t({ ar: " · ", en: " · " }))}
        </p>
      </div>

      {/* WHAT we look for — the real selection signals, again as quiet prose. */}
      <div className="grid sm:grid-cols-[minmax(0,11rem)_1fr] items-baseline gap-x-8 gap-y-2.5 py-[clamp(1.25rem,2.5vw,2rem)] border-t border-border-strong">
        <span className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">
          {t({ ar: "ما نبحث عنه", en: "What we look for" })}
        </span>
        <p className="text-foreground" style={{ fontSize: "clamp(0.95rem,1.5vw,1.1rem)", lineHeight: 1.6 }}>
          {criteria.map(({ label }, i) => (
            <span key={i}>
              {i > 0 && <span className="text-fg-faint">{t({ ar: " · ", en: " · " })}</span>}
              {label}
            </span>
          ))}
        </p>
      </div>

      {/* Reassurance — the bar-lowering facts, on one last hairline row. */}
      <div className="grid sm:grid-cols-[minmax(0,11rem)_1fr] items-baseline gap-x-8 gap-y-2.5 py-[clamp(1.25rem,2.5vw,2rem)] border-y border-border-strong">
        <span className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground font-semibold">
          {t({ ar: "بلا شروط", en: "No catch" })}
        </span>
        <p className="text-fg-secondary" style={{ fontSize: "clamp(0.95rem,1.5vw,1.1rem)", lineHeight: 1.6 }}>
          {reassure.map(({ label }, i) => (
            <span key={i}>
              {i > 0 && <span className="text-fg-faint">{t({ ar: " · ", en: " · " })}</span>}
              {label}
            </span>
          ))}
        </p>
      </div>
    </motion.section>
  );
}

// ProcessStrip — a compact "what happens next" timeline shown above the form.
// Mirrors the four landing steps (Apply → Review → Onboard → Demo Day) so an
// applicant sees the full journey before committing to the form.
function ProcessStrip() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const steps = [
    { label: t({ ar: "تقدّم", en: "Apply" }), meta: t({ ar: "أنت هنا", en: "You're here" }) },
    { label: t({ ar: "مراجعة ومقابلة", en: "Review & interview" }), meta: t({ ar: "خلال أيّام", en: "Within days" }) },
    { label: t({ ar: "انضمام إلى دفعة", en: "Onboard into a cohort" }), meta: t({ ar: "٣–٦ أشهر", en: "3–6 months" }) },
    { label: t({ ar: "يوم العرض", en: "Demo Day" }), meta: t({ ar: "أمام الشبكة", en: "To the network" }) },
  ];
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay: 0.1, ease: EASE_OUT_EXPO }}
      aria-label={t({ ar: "ماذا يحدث بعد التقديم", en: "What happens after you apply" })}
      className="mb-[clamp(3.5rem,8vw,5.5rem)]"
    >
      <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-border-strong">
        <h2
          className="font-display font-bold text-foreground"
          style={{ fontSize: "clamp(1.15rem,2.2vw,1.5rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
        >
          {t({ ar: "ماذا بعد التقديم", en: "What happens next" })}
        </h2>
        <Link
          href="/process"
          className="text-[10.5px] tracking-[0.12em] uppercase text-muted-foreground hover:text-primary transition-colors font-semibold whitespace-nowrap"
        >
          {t({ ar: "التفاصيل الكاملة", en: "Full process" })} <span className="rtl:hidden">→</span><span className="hidden rtl:inline">←</span>
        </Link>
      </div>
      {/* The journey, as calm editorial rows — no number ledger, no icon tiles.
          The step you're on carries the single crimson accent; a hairline divides. */}
      <ol>
        {steps.map(({ label, meta }, i) => {
          const here = i === 0;
          return (
            <li
              key={i}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-8 gap-y-1 py-[clamp(0.85rem,1.8vw,1.25rem)] border-b border-border-strong/60"
            >
              <span
                className={`font-semibold ${here ? "text-primary" : "text-foreground"}`}
                style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)", letterSpacing: "-0.01em" }}
              >
                {label}
              </span>
              <span className={`text-[11.5px] tracking-wide whitespace-nowrap ${here ? "text-primary" : "text-muted-foreground"}`}>
                {meta}
              </span>
            </li>
          );
        })}
      </ol>
    </motion.section>
  );
}

// SectionHeader — a calm editorial step heading. A single cerulean tabular
// numeral leads (the house bar's hard-data tone), the section name sits quietly
// large beside it, the latin counterpart trails, and one full hairline closes.
function SectionHeader({
  title,
  sub,
  step,
}: {
  title: string;
  sub: string;
  step?: number;
}) {
  const { lang } = useLanguage();
  const reduce = useReducedMotion();
  const num =
    step != null
      ? (lang === "ar"
          ? step.toLocaleString("ar-EG")
          : String(step)
        ).padStart(2, lang === "ar" ? "٠" : "0")
      : null;
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
      className="flex items-baseline gap-x-[clamp(0.85rem,2.5vw,1.4rem)] mb-6 pb-3 border-b border-border-strong"
    >
      {num && (
        <span
          aria-hidden
          className="font-display font-bold text-sand tnum leading-none shrink-0"
          style={{ fontSize: "clamp(0.95rem,1.7vw,1.2rem)", letterSpacing: "-0.01em" }}
        >
          {num}
        </span>
      )}
      <h2
        className="font-display font-bold text-foreground flex-1"
        style={{ fontSize: "clamp(1.15rem,2.2vw,1.5rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
      >
        {title}
      </h2>
      <span className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground font-semibold whitespace-nowrap">
        {sub}
      </span>
    </motion.div>
  );
}

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
      {/* Clean hairline-underline field — no boxed card, no fill. The baseline rule
          lights crimson on focus, destructive on error. */}
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
  autoComplete,
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
  autoComplete?: string;
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
        autoComplete={autoComplete}
        className="block w-full bg-transparent text-foreground placeholder:text-fg-faint text-[15.5px] outline-none py-2.5"
        data-testid={`input-${id}`}
      />
    </FieldWrap>
  );
}

function BackgroundAura() {
  // The signature dark brand aura — cerulean bloom + faint crimson top kiss on the
  // dark canvas, anchored to the top behind the success card.
  return (
    <div aria-hidden className="absolute inset-x-0 top-0 h-[70vh] brand-aura pointer-events-none" />
  );
}

function SuccessScreen({ id, firstName, c }: { id: number; firstName: string; c: ApplyContent }) {
  const { lang, dir, t } = useLanguage();
  const reduce = useReducedMotion();
  const fmtNum = (n: number) => n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
  const ref = String(id).padStart(5, "0");
  const refDisplay = lang === "ar" ? fmtNum(id).padStart(5, "٠") : ref;
  const bodyLines = c.successBody.split("\n");

  // The honest, three-beat journey from here — same voice as the ProcessStrip
  // above the form, so the promise reads consistently after submitting.
  const nextSteps = [
    { label: t({ ar: "مراجعة الطلب", en: "Review" }), meta: t({ ar: "خلال أيّام", en: "Within days" }) },
    { label: t({ ar: "مقابلة قصيرة", en: "Short interview" }), meta: t({ ar: "عبر واتساب", en: "Over WhatsApp" }) },
    { label: t({ ar: "انضمام إلى دفعة", en: "Onboard" }), meta: t({ ar: "إلى المجتمع", en: "Into the cohort" }) },
  ];
  return (
    <div
      dir={dir}
      className="relative min-h-screen overflow-hidden bg-background text-foreground flex items-center justify-center px-6 py-16"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      <BackgroundAura />
      {!reduce && <Confetti />}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-lg w-full"
      >
        <div className="relative rounded-[28px] p-9 bg-card border border-border-strong shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)] text-center">
          <div className="relative">
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={reduce ? undefined : { opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5, ease: EASE_OUT_EXPO }}
              className="mb-7 inline-flex items-center justify-center text-primary"
            >
              <CheckCircle2 className="w-9 h-9" strokeWidth={2} />
            </motion.div>
            <h1
              className="font-display text-foreground text-[28px] lg:text-[34px] leading-tight mb-3"
              style={{ fontWeight: 700, letterSpacing: "-0.03em" }}
            >
              {c.successThanksLead}{" "}
              <span className="text-primary">{firstName || c.successFallbackName}</span>
            </h1>
            <p className="text-fg-secondary text-[14px] leading-[1.85] mb-7">
              {bodyLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < bodyLines.length - 1 && <br />}
                </span>
              ))}
            </p>

            {/* What happens from here — the honest journey, as quiet hairline rows. */}
            <ul className="mb-7 border-t border-border-strong/60 text-start">
              {nextSteps.map((s, i) => (
                <li key={i}>
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={reduce ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.35 + i * 0.08, ease: EASE_OUT_EXPO }}
                    className="flex items-baseline justify-between gap-4 py-3 border-b border-border-strong/60"
                  >
                    <span className="text-foreground text-[13.5px] font-semibold">
                      <span className="text-sand tnum me-2.5">{lang === "ar" ? fmtNum(i + 1) : i + 1}</span>
                      {s.label}
                    </span>
                    <span className="text-muted-foreground text-[11.5px] tracking-wide whitespace-nowrap">{s.meta}</span>
                  </motion.div>
                </li>
              ))}
            </ul>

            <div className="inline-flex items-center gap-2.5 rounded-xl px-4 py-2 bg-surface-2 border border-border-strong mb-7">
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">
                {c.successRefLabel}
              </span>
              <span className="text-sand tnum text-[13px] font-bold">#{refDisplay}</span>
            </div>
            <div>
              <Link
                href="/"
                className="cta-fill group inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[13.5px] transition-transform duration-200 hover:-translate-y-0.5"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                {c.successCta}
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
        hue: Math.random() > 0.5 ? "hsl(354 78% 47%)" : "hsl(205 75% 45%)",
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
