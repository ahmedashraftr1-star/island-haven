import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Lock,
  User as UserIcon,
  Briefcase,
  GraduationCap,
  BookOpen,
  Sparkle,
} from "lucide-react";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";
import { useAuth, type UserRole } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

const ROLES: Array<{ id: UserRole; label: string; en: string; sub: string; Icon: typeof Briefcase }> = [
  { id: "freelancer", label: "مستقلّ", en: "Freelancer", sub: "Freelancer", Icon: Briefcase },
  { id: "graduate", label: "خرّيج", en: "Graduate", sub: "Graduate", Icon: GraduationCap },
  { id: "student", label: "طالب", en: "Student", sub: "Student", Icon: BookOpen },
  { id: "other", label: "غير ذلك", en: "Other", sub: "Other", Icon: Sparkle },
];

export default function Register() {
  const { lang } = useLanguage();
  const { register, user } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "freelancer" as UserRole,
  });
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = lang === "en"
      ? "Create account — Island Haven"
      : "إنشاء حساب — آيلاند هيفن";
  }, [lang]);

  useEffect(() => {
    if (user) navigate("/profile");
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setIssues({});
    setSubmitting(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      navigate("/onboarding");
    } catch (e) {
      if (e instanceof ApiError && e.data && typeof e.data === "object") {
        const d = e.data as {
          error?: string;
          issues?: Array<{ path: string; message: string }>;
        };
        setError(d.error || (lang === "en" ? "Could not create account" : "تعذّر إنشاء الحساب"));
        if (Array.isArray(d.issues)) {
          const m: Record<string, string> = {};
          for (const i of d.issues) m[i.path] = i.message;
          setIssues(m);
          const first = d.issues[0]?.path;
          if (first) document.getElementById(first)?.focus();
        }
      } else {
        setError(lang === "en" ? "Could not connect to server" : "تعذّر الاتّصال بالخادم");
      }
      setTimeout(() => errRef.current?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    form.fullName.trim().length >= 2 &&
    form.email.trim().length > 3 &&
    form.password.length >= 8 &&
    !submitting;

  return (
    <AuthShell
      eyebrow={lang === "en" ? "New account · Free" : "حساب جديد · مجّاني"}
      title={lang === "en" ? "Join the" : "انضمّ إلى عائلة"}
      highlight="آيلاند هيفن"
      subtitle={
        lang === "en"
          ? "Create your account in one minute and get your island profile."
          : "أنشئ حسابك خلال دقيقة واحصل على ملفّك الشخصيّ في الجزيرة."
      }
      footer={
        lang === "en" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            لديك حساب؟{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              سجّل الدخول
            </Link>
          </>
        )
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <AuthField
          id="fullName"
          label={lang === "en" ? "Full name" : "الاسم الكامل"}
          hint="Full name"
          icon={UserIcon}
          value={form.fullName}
          onChange={(v) => setForm((s) => ({ ...s, fullName: v }))}
          placeholder={lang === "en" ? "E.g. Yasmin Al-Ghazzawi" : "مثال: ياسمين الغزّاوي"}
          error={issues.fullName}
          autoComplete="name"
        />
        <AuthField
          id="email"
          label={lang === "en" ? "Email address" : "البريد الإلكتروني"}
          hint="Email"
          icon={Mail}
          type="email"
          ltr
          value={form.email}
          onChange={(v) => setForm((s) => ({ ...s, email: v }))}
          placeholder="name@example.com"
          error={issues.email}
          autoComplete="email"
        />
        <AuthField
          id="password"
          label={lang === "en" ? "Password" : "كلمة السرّ"}
          hint={lang === "en" ? "Password · 8+ chars" : "Password · 8+"}
          icon={Lock}
          type="password"
          ltr
          value={form.password}
          onChange={(v) => setForm((s) => ({ ...s, password: v }))}
          placeholder={lang === "en" ? "8 characters or more" : "8 أحرف فأكثر"}
          error={issues.password}
          autoComplete="new-password"
        />

        <div>
          <div className="flex items-center justify-between mb-2 text-[11.5px] tracking-[0.06em]">
            <span className="text-white/75 font-semibold">
              {lang === "en" ? "Your category" : "ما تصنيفك"}
            </span>
            <span className="text-white/35 text-[10px] tracking-[0.16em] uppercase">
              Role
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {ROLES.map((r) => {
              const active = form.role === r.id;
              const Icon = r.Icon;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, role: r.id }))}
                  aria-pressed={active}
                  className={`group relative rounded-2xl p-3 text-center transition-all duration-200 border backdrop-blur-md ${
                    active
                      ? "bg-primary/15 border-primary/45 shadow-[0_0_0_1px_rgba(220,38,55,0.3),0_10px_30px_-12px_rgba(220,38,55,0.45)]"
                      : "bg-white/[0.04] border-white/10 hover:bg-white/[0.07] hover:border-white/20"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mx-auto mb-1.5 transition-colors ${
                      active ? "text-primary" : "text-white/55 group-hover:text-white/85"
                    }`}
                    strokeWidth={1.8}
                  />
                  <div
                    className={`text-[12.5px] font-semibold transition-colors ${
                      active ? "text-white" : "text-white/80"
                    }`}
                  >
                    {lang === "en" ? r.en : r.label}
                  </div>
                  <div className="text-[9.5px] tracking-[0.14em] uppercase text-white/35 mt-0.5">
                    {lang === "en" ? r.label : r.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              ref={errRef}
              tabIndex={-1}
              role="alert"
              aria-live="assertive"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-200 text-[13px]"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={!canSubmit}
          className="group relative w-full overflow-hidden rounded-2xl py-3.5 bg-primary text-white font-bold text-[15px] tracking-wide transition-all duration-300 enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px disabled:opacity-45 disabled:cursor-not-allowed"
          data-testid="button-register"
        >
          <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
            {submitting ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                {lang === "en" ? "Creating account…" : "جارٍ الإنشاء…"}
              </>
            ) : (
              <>
                {lang === "en" ? "Create my account" : "أنشئ حسابي"}
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </>
            )}
          </span>
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
            style={{
              background:
                "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
            }}
          />
        </button>
      </form>
    </AuthShell>
  );
}
