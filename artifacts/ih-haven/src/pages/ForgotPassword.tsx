import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";

export default function ForgotPassword() {
  const { lang, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title =
      lang === "ar"
        ? "نسيت كلمة السرّ — آيلاند هيفن"
        : "Forgot Password — Island Haven";
  }, [lang]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setDone(true);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : t({
              ar: "تعذّر الإرسال، حاول مجدّدًا",
              en: "Couldn't send, please try again",
            }),
      );
      setTimeout(() => errRef.current?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow={t({ ar: "استعادة الوصول", en: "Recover access" })}
      title={t({ ar: "نسيت كلمة", en: "Forgot your" })}
      highlight={t({ ar: "السرّ؟", en: "password?" })}
      subtitle={t({
        ar: "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.",
        en: "Enter your email and we'll send you a reset link.",
      })}
      footer={
        <p className="text-[13px] text-white/45 text-center mt-4">
          {t({ ar: "تذكّرت؟", en: "Remembered it?" })}{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            {t({ ar: "سجّل الدخول", en: "Log in" })}
          </Link>
        </p>
      }
    >
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 py-4"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-[15px]">
                {t({ ar: "تم الإرسال", en: "Sent" })}
              </p>
              <p className="text-white/55 text-[13px] mt-1 leading-relaxed">
                {t({
                  ar: "إذا كان هذا البريد مسجّلاً لدينا، ستصلك تعليمات إعادة التعيين قريبًا.",
                  en: "If this email is registered with us, you'll receive reset instructions shortly.",
                })}
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[13px] text-primary hover:underline font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5 ltr:rotate-180" />
              {t({ ar: "العودة لتسجيل الدخول", en: "Back to login" })}
            </Link>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={onSubmit}
            className="space-y-4"
          >
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  ref={errRef}
                  tabIndex={-1}
                  role="alert"
                  className="rounded-xl px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[13px] outline-none"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AuthField
              id="email"
              label={t({ ar: "البريد الإلكتروني", en: "Email address" })}
              hint="Email"
              icon={Mail}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(v) => setEmail(v)}
              placeholder="name@example.com"
            />

            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className="w-full h-12 rounded-xl bg-primary text-white font-bold text-[14px] tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {submitting
                ? t({ ar: "جارٍ الإرسال…", en: "Sending…" })
                : t({ ar: "إرسال رابط الاستعادة", en: "Send recovery link" })}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
