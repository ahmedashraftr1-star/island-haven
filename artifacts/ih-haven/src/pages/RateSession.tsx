import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, CheckCircle2 } from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Rating {
  id: number;
  sessionId: number;
  menteeId: number;
  expertId: number;
  rating: number;
  feedback: string;
  createdAt: string;
}

const RATING_HINTS = [
  "",
  "ضعيفة",
  "مقبولة",
  "جيّدة",
  "ممتازة",
  "استثنائيّة",
] as const;

export default function RateSession() {
  const [, params] = useRoute("/sessions/:id/rate");
  const [, navigate] = useLocation();
  const id = params?.id;
  const { user, loading } = useAuth();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "تقييم جلسة — Island Haven";
  }, []);

  // Prefill any rating the mentee already left for this session.
  useEffect(() => {
    if (!id || loading || !user) return;
    let cancelled = false;
    api<{ rating: Rating | null }>(`/me/sessions/${id}/rating`)
      .then((r) => {
        if (cancelled) return;
        if (r.rating) {
          setRating(r.rating.rating);
          setFeedback(r.rating.feedback);
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, user, loading]);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!user) {
      navigate(`/login?next=/sessions/${id}/rate`);
      return;
    }
    if (busy) return;
    if (rating < 1) {
      setError("اختر عدد النجوم أوّلًا.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api(`/me/sessions/${id}/rating`, {
        method: "POST",
        body: JSON.stringify({ rating, feedback: feedback.trim() }),
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر إرسال التقييم");
    } finally {
      setBusy(false);
    }
  }

  const shown = hover || rating;

  return (
    <PageShell
      active="experts"
      eyebrow="رأيك يصنع الفرق"
      title="قيّم"
      highlight="جلستك"
      subtitle="ساعِد المرشدين على التحسّن وغيرك على الاختيار — تقييمك سرّيّ ويُحتسب ضمن متوسّط الخبير."
      maxWidth="max-w-2xl"
    >
      <BackLink href="/profile" label="عودة لملفّي" />

      <GlassCard className="p-6 sm:p-9">
        <AnimatePresence mode="wait">
          {!loading && !user ? (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <p className="text-white/65 text-[14px] leading-[1.85] mb-5">
                سجّل دخولك لتقييم جلسة الإرشاد الخاصّة بك.
              </p>
              <Link
                href={`/login?next=/sessions/${id}/rate`}
                className="inline-block px-7 py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] hover:-translate-y-px transition-all"
              >
                تسجيل الدخول
              </Link>
            </motion.div>
          ) : done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <CheckCircle2 className="w-14 h-14 text-emerald-300 mx-auto mb-4" />
              <div className="text-white font-bold text-[17px] mb-1.5">
                شكرًا لك على تقييمك
              </div>
              <p className="text-white/55 text-[13.5px] leading-[1.85] max-w-md mx-auto">
                وصلنا رأيك بنجاح. ملاحظاتك تساعد المرشدين على التحسّن وتساعد بقيّة
                المنتسبين على اختيار الخبير الأنسب.
              </p>
              <Link
                href="/profile"
                className="inline-block mt-5 text-[13px] text-primary font-semibold hover:underline"
              >
                عرض جلساتي
              </Link>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={submit}
              className="space-y-7"
            >
              {/* Star widget */}
              <div className="text-center">
                <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
                  كيف كانت الجلسة؟
                </div>
                <div
                  className="flex items-center justify-center gap-2"
                  dir="ltr"
                  role="radiogroup"
                  aria-label="تقييم الجلسة بالنجوم"
                >
                  {[1, 2, 3, 4, 5].map((n) => {
                    const filled = n <= shown;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        aria-label={`${n} من ٥`}
                        aria-checked={rating === n}
                        role="radio"
                        data-testid={`star-${n}`}
                        className="p-1 rounded-xl transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      >
                        <Star
                          className={`w-9 h-9 transition-colors ${
                            filled
                              ? "fill-amber-400 text-amber-400"
                              : "text-white/20"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="h-5 mt-3 text-[13px] font-semibold text-amber-200/90">
                  {RATING_HINTS[shown] || ""}
                </div>
              </div>

              {/* Feedback */}
              <label className="block">
                <span className="block text-[11.5px] text-white/50 font-medium mb-1.5">
                  ملاحظات (اختياريّ)
                </span>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder="ما الذي أعجبك؟ وما الذي يمكن تحسينه؟"
                  className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-[13.5px] text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none resize-none leading-[1.85]"
                  data-testid="input-feedback"
                />
                <div className="text-[11px] text-white/35 mt-1 text-left tabular-nums">
                  {feedback.length}/2000
                </div>
              </label>

              {error && (
                <div className="text-[12.5px] text-red-300 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy || (!loaded && !!user)}
                className="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-[14.5px] enabled:hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] enabled:hover:-translate-y-px transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                data-testid="button-submit-rating"
              >
                <Sparkles className="w-4 h-4" />
                {busy ? "…" : "إرسال التقييم"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </GlassCard>
    </PageShell>
  );
}
