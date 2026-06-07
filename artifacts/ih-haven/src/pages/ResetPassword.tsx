import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { AuthShell, AuthField } from "@/components/auth/AuthShell";
import { api, ApiError } from "@/lib/api";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = "إعادة تعيين كلمة السرّ — آيلاند هيفن";
  }, []);

  // If no token in URL, invalid link
  if (!token) {
    return (
      <AuthShell
        eyebrow="رابط غير صالح"
        title="الرابط"
        highlight="منتهٍ"
        subtitle="هذا الرابط غير صالح أو انتهت صلاحيته."
        footer={null}
      >
        <div className="text-center space-y-4 py-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 mx-auto">
            <AlertCircle className="w-7 h-7 text-rose-400" />
          </div>
          <p className="text-white/55 text-[13px]">
            اطلب رابطًا جديدًا من صفحة نسيان كلمة السرّ.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 text-[13px] text-primary hover:underline font-semibold"
          >
            طلب رابط جديد
          </Link>
        </div>
      </AuthShell>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (newPassword !== confirm) {
      setError("كلمتا السرّ غير متطابقتين");
      return;
    }
    if (newPassword.length < 8) {
      setError("كلمة السرّ يجب أن تكون 8 أحرف فأكثر");
      return;
    }

    setSubmitting(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر إعادة التعيين");
      setTimeout(() => errRef.current?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="تعيين كلمة سرّ جديدة"
      title="كلمة سرّ"
      highlight="جديدة"
      subtitle="اختر كلمة سرّ قوية لا تقلّ عن 8 أحرف."
      footer={null}
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
              <p className="text-white font-semibold text-[15px]">تمّ بنجاح</p>
              <p className="text-white/55 text-[13px] mt-1">
                ستنتقل إلى صفحة تسجيل الدخول خلال ثوانٍ…
              </p>
            </div>
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
              id="newPassword"
              label="كلمة السرّ الجديدة"
              hint="New password"
              icon={Lock}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(v) => setNewPassword(v)}
              placeholder="٨ أحرف فأكثر"
            />

            <AuthField
              id="confirm"
              label="تأكيد كلمة السرّ"
              hint="Confirm password"
              icon={Lock}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(v) => setConfirm(v)}
              placeholder="أعد كتابة كلمة السرّ"
            />

            <button
              type="submit"
              disabled={submitting || !newPassword || !confirm}
              className="w-full h-12 rounded-xl bg-primary text-white font-bold text-[14px] tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {submitting ? "جارٍ الحفظ…" : "تعيين كلمة السرّ"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
