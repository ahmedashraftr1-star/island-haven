import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";
import { api, ApiError } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = "نسيت كلمة السرّ — آيلاند هيفن";
  }, []);

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
      setError(e instanceof ApiError ? e.message : "تعذّر الإرسال، حاول مجدّدًا");
      setTimeout(() => errRef.current?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="استعادة الوصول"
      title="نسيت كلمة"
      highlight="السرّ؟"
      subtitle="أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين."
      footer={
        <p className="text-[13px] text-white/45 text-center mt-4">
          تذكّرت؟{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            سجّل الدخول
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
              <p className="text-white font-semibold text-[15px]">تم الإرسال</p>
              <p className="text-white/55 text-[13px] mt-1 leading-relaxed">
                إذا كان هذا البريد مسجّلاً لدينا، ستصلك تعليمات إعادة التعيين قريبًا.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[13px] text-primary hover:underline font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              العودة لتسجيل الدخول
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
              label="البريد الإلكتروني"
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
              {submitting ? "جارٍ الإرسال…" : "إرسال رابط الاستعادة"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
