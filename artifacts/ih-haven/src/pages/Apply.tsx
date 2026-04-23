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
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { HavenMark } from "@/components/landing/HavenMark";

type CategoryId = "freelancer" | "graduate" | "student" | "other";

const CATEGORIES: Array<{
  id: CategoryId;
  label: string;
  sub: string;
  Icon: typeof Briefcase;
}> = [
  {
    id: "freelancer",
    label: "مستقلّ",
    sub: "Freelancer",
    Icon: Briefcase,
  },
  {
    id: "graduate",
    label: "خرّيج جامعي",
    sub: "Graduate",
    Icon: GraduationCap,
  },
  {
    id: "student",
    label: "طالب جامعي",
    sub: "Student",
    Icon: BookOpen,
  },
  {
    id: "other",
    label: "غير ذلك",
    sub: "Other",
    Icon: Sparkle,
  },
];

export default function Apply() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    category: "freelancer" as CategoryId,
    bio: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const errorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = "انضمّ إلى آيلاند هيفن";
  }, []);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const canSubmit =
    form.fullName.trim().length >= 2 &&
    form.email.trim().length > 3 &&
    form.phone.trim().length >= 6 &&
    form.bio.trim().length >= 10 &&
    !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setIssues({});
    try {
      const resp = await api<{ ok: boolean; id: number }>("/applications", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setDone({ id: resp.id });
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data === "object") {
        const d = e.data as {
          error?: string;
          issues?: Array<{ path: string; message: string }>;
        };
        setError(d.error || "تعذّر إرسال الطلب");
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
        setError("تعذّر الاتّصال بالخادم. حاول مجدّدًا بعد قليل.");
      }
      // Move focus to the error region
      setTimeout(() => errorRef.current?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return <SuccessScreen id={done.id} firstName={form.fullName.trim().split(" ")[0]} />;

  return (
    <div
      dir="rtl"
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
            العودة
          </Link>
          <div className="flex items-center gap-2.5">
            <HavenMark size={32} strokeColor="hsl(354 80% 60%)" />
            <div className="leading-tight text-right">
              <div className="text-[13px] font-bold tracking-tight">Island Haven</div>
              <div className="text-[10px] text-white/45 tracking-[0.16em] uppercase">آيلاند هيفن</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 px-5 sm:px-8 lg:px-14 pt-10 sm:pt-14 pb-20">
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
                طلب انتساب · مجّاناً
              </span>
            </div>
            <h1
              className="font-bold text-white leading-[1.05]"
              style={{
                fontSize: "clamp(2rem, 6.4vw, 3.75rem)",
                letterSpacing: "-0.03em",
              }}
            >
              انضمّ إلى{" "}
              <span className="text-accent-gradient">آيلاند هيفن</span>
            </h1>
            <p className="text-white/55 text-[14px] sm:text-[15.5px] leading-[1.85] mt-5 max-w-lg mx-auto">
              مساحة عمل مجّانيّة تتّسع لأحلامك في غزّة. املأ الطلب وسنتواصل
              معك على واتساب خلال أيّام.
            </p>
          </motion.div>

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
                <SectionHeader index="01" title="مَن أنت" sub="Identity" />

                <Field
                  id="fullName"
                  label="الاسم الكامل"
                  hint="Full name"
                  icon={UserIcon}
                  value={form.fullName}
                  onChange={(v) => update("fullName", v)}
                  error={issues.fullName}
                  placeholder="مثال: ياسمين الغزّاوي"
                  autoComplete="name"
                />

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field
                    id="email"
                    label="البريد الإلكتروني"
                    hint="Email"
                    icon={Mail}
                    value={form.email}
                    onChange={(v) => update("email", v)}
                    error={issues.email}
                    placeholder="name@example.com"
                    type="email"
                    ltr
                    autoComplete="email"
                  />
                  <Field
                    id="phone"
                    label="رقم الواتساب"
                    hint="WhatsApp"
                    icon={Phone}
                    value={form.phone}
                    onChange={(v) => update("phone", v)}
                    error={issues.phone}
                    placeholder="+970 …"
                    type="tel"
                    ltr
                    autoComplete="tel"
                  />
                </div>

                {/* Section: category */}
                <div className="pt-2">
                  <SectionHeader index="02" title="ما تصنيفك" sub="Category" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1">
                    {CATEGORIES.map((c) => {
                      const active = form.category === c.id;
                      const Icon = c.Icon;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => update("category", c.id)}
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
                            {c.label}
                          </div>
                          <div className="text-[9.5px] tracking-[0.14em] uppercase text-white/35 mt-0.5">
                            {c.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section: bio */}
                <div className="pt-2">
                  <SectionHeader index="03" title="حدّثنا عنك" sub="About you" />
                  <FieldWrap
                    id="bio"
                    label="نبذة ومجال عملك"
                    hint="Bio"
                    icon={PenLine}
                    error={issues.bio}
                  >
                    <textarea
                      id="bio"
                      value={form.bio}
                      onChange={(e) => update("bio", e.target.value)}
                      rows={5}
                      maxLength={2000}
                      placeholder="ماذا تعمل أو تدرس؟ ما الذي تنوي تحقيقه في آيلاند هيفن؟"
                      className="block w-full bg-transparent text-white placeholder-white/30 text-[14.5px] leading-[1.85] outline-none resize-none px-1 py-0.5"
                      data-testid="input-bio"
                    />
                    <div className="text-[10.5px] text-white/30 mt-1.5 tracking-wide">
                      {form.bio.length}/2000
                    </div>
                  </FieldWrap>
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
                    className="group relative w-full overflow-hidden rounded-2xl h-14 bg-primary text-white font-bold text-[15px] tracking-wide transition-all duration-300 enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px disabled:opacity-45 disabled:cursor-not-allowed"
                    data-testid="button-submit"
                  >
                    <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
                      {submitting ? (
                        <>
                          <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          جارٍ الإرسال…
                        </>
                      ) : (
                        <>
                          أرسل طلب الانتساب
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
                  <p className="text-[11.5px] text-center text-white/35 mt-3.5 leading-relaxed">
                    بإرسالك الطلب، توافق على أن نتواصل معك بشأنه فقط.
                  </p>
                </div>
              </div>
            </div>
          </motion.form>

          {/* Footer trust line */}
          <div className="mt-10 text-center text-[11px] text-white/35 tracking-[0.16em] uppercase">
            بدعمٍ من <span className="text-white/65 font-semibold">من الناس إلى الناس</span>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable atoms
// ─────────────────────────────────────────────────────────────────────────────

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
        {title} <span className="text-white/30">· {sub}</span>
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
        <span className="inline-flex items-center gap-1.5 text-white/35">
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
        className="block w-full bg-transparent text-white placeholder-white/30 text-[14.5px] outline-none px-1 py-0.5"
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

function SuccessScreen({ id, firstName }: { id: number; firstName: string }) {
  const ref = String(id).padStart(5, "0");
  return (
    <div
      dir="rtl"
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
              وصل طلبك
            </div>
            <h1 className="text-[28px] lg:text-[34px] font-bold leading-tight mb-3">
              شكرًا لك يا{" "}
              <span className="text-accent-gradient">{firstName || "صديقنا"}</span>
            </h1>
            <p className="text-white/65 text-[14px] leading-[1.85] mb-7">
              استلمنا طلبك بأمان. سنراجعه ونتواصل معك على واتساب خلال أيّام.
              <br />
              مرحبًا بك في عائلة آيلاند هيفن.
            </p>
            <div className="inline-block rounded-xl px-4 py-2 bg-white/5 border border-white/10 text-[11px] tracking-[0.2em] uppercase text-white/55 font-semibold mb-7">
              رقم الطلب · #{ref}
            </div>
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#0A0E1A] font-bold text-[13.5px] hover:bg-white/90 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                العودة للرئيسيّة
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
