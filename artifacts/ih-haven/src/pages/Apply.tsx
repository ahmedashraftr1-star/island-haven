import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
  User as UserIcon,
  Briefcase,
  GraduationCap,
  BookOpen,
  Sparkles,
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
  FileText,
  Search,
  Rocket,
  Trophy,
  Flame,
  Hammer,
  Compass,
  Target,
  MapPin,
  Gift,
  CalendarClock,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { HavenMark } from "@/components/landing/HavenMark";
import { useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";

type CategoryId = "freelancer" | "graduate" | "student" | "other";

const FALLBACK = {
  backLabel: "العودة",
  brandLatin: "Island Haven",
  brandArabic: "آيلاند هيفن",
  eyebrow: "انضمّ إلى نخبة صانعي المستقبل · مجّاناً تمامًا",
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
  successEyebrow: "طلبك في يد الفريق",
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
  eyebrow: "Join a circle of future-makers · entirely free",
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
  successEyebrow: "Your application is with the team",
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
      setError(t({ ar: "حجم الملف أكبر من 10 ميغا", en: "File is larger than 10 MB" }));
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

  useEffect(() => {
    document.title = c.docTitle;
  }, [c.docTitle]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

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
      className="relative min-h-screen overflow-hidden bg-[#0A0E1A] text-white"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      <BackgroundAura />

      {/* Top bar */}
      <header className="relative z-20 px-5 sm:px-8 lg:px-14 pt-6 sm:pt-8">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[12px] tracking-[0.18em] uppercase text-white/55 hover:text-white transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            {c.backLabel}
          </Link>
          <div className="flex items-center gap-2.5">
            <HavenMark size={32} strokeColor="hsl(354 80% 60%)" />
            <div className="leading-tight text-right">
              <div className="text-[13px] font-bold tracking-tight">{c.brandLatin}</div>
              <div className="text-[10px] text-white/45 tracking-[0.16em] uppercase">{c.brandArabic}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="relative z-10 px-5 sm:px-8 lg:px-14 pt-10 sm:pt-14 pb-20">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-9 sm:mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 backdrop-blur-md mb-5">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold">
                {c.eyebrow}
              </span>
            </div>
            <h1
              className="font-bold text-white leading-[1.05]"
              style={{
                fontSize: "clamp(2rem, 6.4vw, 3.75rem)",
                letterSpacing: "-0.03em",
              }}
            >
              {c.titleLead}{" "}
              <span className="text-primary">{c.titleAccent}</span>
            </h1>
            <p className="text-white/55 text-[14px] sm:text-[15.5px] leading-[1.85] mt-5 max-w-lg mx-auto">
              {c.subtitle}
            </p>
          </motion.div>

          {/* Who should apply & what we look for — a concise eligibility block so
              applicants self-qualify (and feel reassured) before the form. Copy
              reused from the homepage FAQ for one consistent voice. */}
          <EligibilityBlock />

          {/* What happens after you apply — a short, honest timeline so applicants
              know the journey before they invest in the form below. */}
          <ProcessStrip />

          <motion.form
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
            noValidate
          >
            <div className="relative rounded-[28px] p-6 sm:p-9 bg-white/[0.045] border border-white/10 backdrop-blur-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] overflow-hidden">
              {/* Subtle interior glow */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{
                  background:
                    "radial-gradient(80% 40% at 50% 0%, rgba(220,38,55,0.18) 0%, transparent 60%)",
                }}
              />
              <div className="relative space-y-6">
                {/* Section: identity */}
                <SectionHeader index="01" title={c.sec1Title} sub={c.sec1Sub} />

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
                  <SectionHeader index="02" title={c.sec2Title} sub={c.sec2Sub} />
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
                          className={`group relative rounded-2xl p-3.5 text-center transition-all duration-200 border backdrop-blur-md ${
                            active
                              ? "bg-primary/15 border-primary/45 shadow-[0_0_0_1px_rgba(220,38,55,0.3),0_10px_30px_-12px_rgba(220,38,55,0.45)]"
                              : "bg-white/[0.04] border-white/10 hover:bg-white/[0.07] hover:border-white/20"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 mx-auto mb-2 transition-colors ${
                              active ? "text-primary" : "text-white/55 group-hover:text-white/85"
                            }`}
                            strokeWidth={1.8}
                          />
                          <div
                            className={`text-[12.5px] font-semibold transition-colors ${
                              active ? "text-white" : "text-white/80"
                            }`}
                          >
                            {cat.label}
                          </div>
                          <div className="text-[9.5px] tracking-[0.14em] uppercase text-white/55 mt-0.5">
                            {cat.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section: bio + motivation */}
                <div className="pt-2">
                  <SectionHeader index="03" title={c.sec3Title} sub={c.sec3Sub} />
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
                        className="block w-full bg-transparent text-white placeholder-white/50 text-[14.5px] leading-[1.85] outline-none resize-none px-1 py-0.5"
                        data-testid="input-bio"
                      />
                      <div className="text-[10.5px] text-white/50 mt-1.5 tracking-wide">{form.bio.length}/2000</div>
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
                        className="block w-full bg-transparent text-white placeholder-white/50 text-[14.5px] leading-[1.85] outline-none resize-none px-1 py-0.5"
                        data-testid="input-motivation"
                      />
                      <div className="text-[10.5px] text-white/50 mt-1.5 tracking-wide">{form.motivation.length}/2000</div>
                    </FieldWrap>
                  </div>
                </div>

                {/* Section 04: Professional */}
                <div className="pt-2">
                  <SectionHeader index="04" title={c.sec4Title} sub={c.sec4Sub} />
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
                        <span className="text-white/75 font-semibold">{c.yearsLabel}</span>
                        <span className="inline-flex items-center gap-1.5 text-white/55">
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
                                  ? "bg-primary/15 border-primary/50 text-white"
                                  : "bg-white/[0.04] border-white/10 text-white/65 hover:border-white/25 hover:text-white/90"
                              }`}
                            >
                              {yr === 0
                                ? t({ ar: "أقل من سنة", en: "< 1 year" })
                                : yr === 15
                                  ? t({ ar: "+15 سنة", en: "15+ years" })
                                  : `${yr}+`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 05: Links */}
                <div className="pt-2">
                  <SectionHeader index="05" title={c.sec5Title} sub={c.sec5Sub} />
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
                  <SectionHeader index="06" title={c.sec6Title} sub={c.sec6Sub} />
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
                      className="block w-full bg-transparent text-white placeholder-white/50 text-[14.5px] leading-[1.85] outline-none resize-none px-1 py-0.5"
                      data-testid="input-previousWork"
                    />
                    <div className="text-[10.5px] text-white/50 mt-1.5 tracking-wide">{form.previousWork.length}/1000</div>
                  </FieldWrap>
                </div>

                {/* Section 07: Availability */}
                <div className="pt-2">
                  <SectionHeader index="07" title={c.sec7Title} sub={c.sec7Sub} />
                  <div className="space-y-5">
                    {/* Weekly hours chips */}
                    <div>
                      <div className="flex items-center justify-between mb-3 text-[11.5px] tracking-[0.06em]">
                        <span className="text-white/75 font-semibold">{c.weeklyHoursLabel}</span>
                        <span className="inline-flex items-center gap-1.5 text-white/55">
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
                                  ? "bg-primary/15 border-primary/50 text-white"
                                  : "bg-white/[0.04] border-white/10 text-white/65 hover:border-white/25 hover:text-white/90"
                              }`}
                            >
                              {h}+ {t({ ar: "س/أسبوع", en: "hrs/wk" })}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Employed toggle */}
                    <div>
                      <div className="flex items-center justify-between mb-3 text-[11.5px] tracking-[0.06em]">
                        <span className="text-white/75 font-semibold">{c.employedLabel}</span>
                        <span className="inline-flex items-center gap-1.5 text-white/55">
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
                                  ? "bg-primary/15 border-primary/50 text-white"
                                  : "bg-white/[0.04] border-white/10 text-white/65 hover:border-white/25"
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
                  <SectionHeader index="08" title={c.sec8Title} sub={c.sec8Sub} />
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
                        ? "border-primary/40 bg-primary/[0.06]"
                        : "border-white/12 bg-white/[0.02] hover:border-white/25"
                    } p-5 text-center cursor-pointer`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) uploadCv(file);
                    }}
                  >
                    {cvUploading ? (
                      <div className="flex items-center justify-center gap-2 text-white/55 text-[13.5px]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {c.cvUploadLoading}
                      </div>
                    ) : cvUrl ? (
                      <div className="flex items-center justify-center gap-2.5">
                        <FileUp className="w-4 h-4 text-primary" />
                        <span className="text-[13.5px] text-white font-medium">{cvFileName}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCvUrl(""); setCvFileName(""); }}
                          className="text-[11px] text-white/60 hover:text-red-300 transition-colors underline underline-offset-2 mr-1"
                        >
                          {c.cvUploadRemove}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <FileUp className="w-6 h-6 text-white/50 mx-auto" />
                        <div className="text-[13.5px] text-white/60">{c.cvUploadLabel}</div>
                        <div className="text-[11px] text-white/60">{c.cvUploadHint} · {t({ ar: "اسحب الملف هنا أو", en: "drag a file here or" })}</div>
                        <div className="inline-block mt-1 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-[12px] text-white/70 hover:text-white transition-colors">
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
                      className="rounded-2xl px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-200 text-[13px] leading-relaxed"
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
                          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
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
                  <p className="text-[11.5px] text-center text-white/60 mt-3.5 leading-relaxed">
                    {c.consentLine}
                  </p>
                </div>
              </div>
            </div>
          </motion.form>

          {/* Footer trust line */}
          <div className="mt-10 text-center text-[11px] text-white/55 tracking-[0.16em] uppercase">
            {c.trustLabel} <span className="text-white/65 font-semibold">{c.trustBrand}</span>
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
// Three honest beats on the dark glass canvas (white text): WHO can apply,
// WHAT we look for, and reassurance. Copy reused from the homepage FAQ so the
// whole site speaks with one voice. Bilingual, RTL-safe, transform/opacity only.
function EligibilityBlock() {
  const { t } = useLanguage();

  // WHO — eligibility, reused from the FAQ "who can apply" answer.
  const eligibility = [
    t({ ar: "أيّ موهبة رقميّة في غزّة", en: "Any digital talent in Gaza" }),
    t({ ar: "أيّ مرحلة — من فكرة إلى مشروع", en: "Any stage — idea to venture" }),
    t({ ar: "لا يلزم شهادة ولا خبرة سابقة", en: "No degree or résumé required" }),
  ];

  // WHAT we look for — the real selection criteria.
  const criteria = [
    { Icon: Flame, label: t({ ar: "الجدّيّة", en: "Seriousness" }) },
    { Icon: Hammer, label: t({ ar: "الرغبة في البناء", en: "Desire to build" }) },
    { Icon: Compass, label: t({ ar: "قابليّة الإرشاد", en: "Coachability" }) },
    { Icon: Target, label: t({ ar: "الأثر", en: "Impact" }) },
  ];

  // Reassurance — lowers the bar to pressing "apply".
  const reassure = [
    { Icon: Gift, label: t({ ar: "مجّاني تمامًا", en: "Entirely free" }) },
    { Icon: CalendarClock, label: t({ ar: "~٢٠ دقيقة", en: "~20 minutes" }) },
    { Icon: Clock, label: t({ ar: "ردّ خلال أيّام", en: "Reply within days" }) },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      aria-label={t({ ar: "لِمَن التقديم وماذا نبحث عنه", en: "Who should apply and what we look for" })}
      className="mb-9 sm:mb-12 rounded-[24px] border border-white/10 bg-white/[0.035] backdrop-blur-md p-6 sm:p-8"
    >
      <div className="flex items-center gap-2 mb-5">
        <span className="h-px w-7 bg-primary/60" />
        <span className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold">
          {t({ ar: "لِمَن؟ وماذا نبحث عنه", en: "Who should apply & what we look for" })}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-9 gap-y-7">
        {/* WHO — eligibility */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
            <span className="text-[12.5px] font-bold text-white tracking-tight">
              {t({ ar: "لِمَن آيلاند؟", en: "Who Island Haven is for" })}
            </span>
          </div>
          <ul className="space-y-2.5">
            {eligibility.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-white/75">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* WHAT we look for — criteria */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
            <span className="text-[12.5px] font-bold text-white tracking-tight">
              {t({ ar: "ما الذي نبحث عنه", en: "What we look for" })}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {criteria.map(({ Icon, label }, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12.5px] font-semibold text-white/85"
              >
                <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Reassurance — hairline-divided footer row */}
      <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-2.5">
        {reassure.map(({ Icon, label }, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-white/70">
            <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
            {label}
          </span>
        ))}
      </div>
    </motion.section>
  );
}

// ProcessStrip — a compact "what happens next" timeline shown above the form.
// Mirrors the four landing steps (Apply → Review → Onboard → Demo Day) so an
// applicant sees the full journey before committing to the form.
function ProcessStrip() {
  const { t } = useLanguage();
  const steps = [
    { no: "01", Icon: FileText, label: t({ ar: "تقدّم", en: "Apply" }), meta: t({ ar: "أنت هنا", en: "You're here" }) },
    { no: "02", Icon: Search, label: t({ ar: "مراجعة ومقابلة", en: "Review & interview" }), meta: t({ ar: "خلال أيّام", en: "Within days" }) },
    { no: "03", Icon: Rocket, label: t({ ar: "انضمام إلى دفعة", en: "Onboard into a cohort" }), meta: t({ ar: "3–6 أشهر", en: "3–6 months" }) },
    { no: "04", Icon: Trophy, label: t({ ar: "يوم العرض", en: "Demo Day" }), meta: t({ ar: "أمام الشبكة", en: "To the network" }) },
  ];
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      aria-label={t({ ar: "ماذا يحدث بعد التقديم", en: "What happens after you apply" })}
      className="mb-9 sm:mb-12"
    >
      <div className="flex items-center justify-between mb-3.5 px-1">
        <span className="text-[10px] tracking-[0.22em] uppercase text-white/60 font-semibold">
          {t({ ar: "ماذا بعد التقديم", en: "What happens next" })}
        </span>
        <Link
          href="/process"
          className="text-[10.5px] tracking-[0.12em] uppercase text-white/60 hover:text-primary transition-colors font-semibold"
        >
          {t({ ar: "التفاصيل الكاملة", en: "Full process" })} →
        </Link>
      </div>
      <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {steps.map(({ no, Icon, label, meta }, i) => (
          <li
            key={no}
            className={`relative rounded-2xl p-3.5 border backdrop-blur-md ${
              i === 0
                ? "bg-primary/[0.10] border-primary/35"
                : "bg-white/[0.035] border-white/10"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className={`w-4 h-4 ${i === 0 ? "text-primary" : "text-white/60"}`} strokeWidth={2} />
              <span dir="ltr" className="text-[10px] tracking-[0.16em] font-bold text-white/55 tabular-nums">
                {no}
              </span>
            </div>
            <div className={`text-[12px] font-semibold leading-snug ${i === 0 ? "text-white" : "text-white/75"}`}>
              {label}
            </div>
            <div className={`text-[10px] mt-1 tracking-wide ${i === 0 ? "text-primary/85" : "text-white/60"}`}>
              {meta}
            </div>
          </li>
        ))}
      </ol>
    </motion.section>
  );
}

function SectionHeader({
  index,
  title,
  sub,
}: {
  index: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <div className="text-[10.5px] tracking-[0.22em] text-primary font-bold">
        {index}
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      <div className="text-[11px] tracking-[0.18em] uppercase text-white/50 font-semibold">
        {title} <span className="text-white/55">· {sub}</span>
      </div>
    </div>
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
        className="flex items-center justify-between mb-2 text-[11.5px] tracking-[0.06em]"
      >
        <span className="text-white/75 font-semibold">{label}</span>
        <span className="inline-flex items-center gap-1.5 text-white/55">
          <Icon className="w-3 h-3" />
          <span className="text-[10px] tracking-[0.16em] uppercase">{hint}</span>
        </span>
      </label>
      <div
        className={`rounded-2xl px-4 py-3 bg-white/[0.04] border backdrop-blur-md transition-colors focus-within:bg-white/[0.06] ${
          error
            ? "border-red-500/45 focus-within:border-red-500/65"
            : "border-white/10 focus-within:border-primary/45"
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
            className="text-[11.5px] text-red-300 mt-1.5 px-1"
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
        className="block w-full bg-transparent text-white placeholder-white/50 text-[14.5px] outline-none px-1 py-0.5"
        data-testid={`input-${id}`}
      />
    </FieldWrap>
  );
}

function BackgroundAura() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.5] pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 0%, rgba(220,38,55,0.32) 0%, transparent 60%), radial-gradient(50% 40% at 0% 100%, rgba(220,38,55,0.16) 0%, transparent 60%)",
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

function SuccessScreen({ id, firstName, c }: { id: number; firstName: string; c: ApplyContent }) {
  const { dir } = useLanguage();
  const ref = String(id).padStart(5, "0");
  const bodyLines = c.successBody.split("\n");
  return (
    <div
      dir={dir}
      className="relative min-h-screen overflow-hidden bg-[#0A0E1A] text-white flex items-center justify-center px-6 py-16"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      <BackgroundAura />
      <Confetti />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-lg w-full"
      >
        <div className="relative rounded-[28px] p-9 bg-white/[0.06] border border-white/10 backdrop-blur-2xl text-center overflow-hidden">
          <div
            aria-hidden
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
              {c.successEyebrow}
            </div>
            <h1 className="text-[28px] lg:text-[34px] font-bold leading-tight mb-3">
              {c.successThanksLead}{" "}
              <span className="text-primary">{firstName || c.successFallbackName}</span>
            </h1>
            <p className="text-white/65 text-[14px] leading-[1.85] mb-7">
              {bodyLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < bodyLines.length - 1 && <br />}
                </span>
              ))}
            </p>
            <div className="inline-block rounded-xl px-4 py-2 bg-white/5 border border-white/10 text-[11px] tracking-[0.2em] uppercase text-white/55 font-semibold mb-7">
              {c.successRefLabel} · #{ref}
            </div>
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#0A0E1A] font-bold text-[13.5px] hover:bg-white/90 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
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
