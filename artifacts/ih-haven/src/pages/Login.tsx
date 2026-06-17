import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

// Where to land after login: honor an in-app ?next= path, but only a same-site
// absolute path ("/…", not "//host") so it can't be used as an open redirect.
function postLoginDest(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/profile";
}

export default function Login() {
  const { login, user } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = "تسجيل الدخول — آيلاند هيفن";
  }, []);

  useEffect(() => {
    if (user) navigate(postLoginDest());
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setIssues({});
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(postLoginDest());
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message || "تعذّر تسجيل الدخول");
      } else {
        setError("تعذّر الاتّصال بالخادم");
      }
      setTimeout(() => errRef.current?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    form.email.trim().length > 3 && form.password.length >= 1 && !submitting;

  return (
    <AuthShell
      eyebrow="تسجيل الدخول"
      title="مرحبًا بعودتك إلى"
      highlight="آيلاند هيفن"
      subtitle="ادخل إلى حسابك لمتابعة عملك ومشاريعك في الجزيرة."
      footer={
        <>
          ليس لديك حساب؟{" "}
          <Link href="/register" className="text-primary font-bold hover:underline">
            أنشئ حسابًا الآن
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <AuthField
          id="email"
          label="البريد الإلكتروني"
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
        <div className="space-y-1">
          <AuthField
            id="password"
            label="كلمة السرّ"
            hint="Password"
            icon={Lock}
            type="password"
            ltr
            value={form.password}
            onChange={(v) => setForm((s) => ({ ...s, password: v }))}
            placeholder="••••••••"
            error={issues.password}
            autoComplete="current-password"
          />
          <div className="flex justify-start pt-1">
            <Link href="/forgot-password" className="text-[12px] text-primary/70 hover:text-primary transition-colors">
              نسيت كلمة السرّ؟
            </Link>
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
          className="group relative w-full overflow-hidden rounded-2xl h-13 py-3.5 bg-primary text-white font-bold text-[15px] tracking-wide transition-all duration-300 enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px disabled:opacity-45 disabled:cursor-not-allowed"
          data-testid="button-login"
        >
          <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
            {submitting ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                جارٍ الدخول…
              </>
            ) : (
              <>
                دخول إلى حسابي
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
