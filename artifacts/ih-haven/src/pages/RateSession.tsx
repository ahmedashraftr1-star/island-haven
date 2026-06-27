import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, CheckCircle2 } from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
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

const RATING_HINTS: { ar: string; en: string }[] = [
  { ar: "", en: "" },
  { ar: "ضعيفة", en: "Poor" },
  { ar: "مقبولة", en: "Fair" },
  { ar: "جيّدة", en: "Good" },
  { ar: "ممتازة", en: "Excellent" },
  { ar: "استثنائيّة", en: "Exceptional" },
];

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}

export default function RateSession() {
  const { lang, t } = useLanguage();
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
    document.title =
      lang === "ar" ? "تقييم جلسة — Island Haven" : "Rate Session — Island Haven";
  }, [lang]);

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
      setError(
        lang === "ar" ? "اختر عدد النجوم أوّلًا." : "Pick a star rating first.",
      );
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
      setError(
        e instanceof ApiError
          ? e.message
          : lang === "ar"
            ? "تعذّر إرسال التقييم"
            : "Couldn't submit your rating",
      );
    } finally {
      setBusy(false);
    }
  }

  const shown = hover || rating;

  return (
    <PageShell
      active="experts"
      eyebrow={t({ ar: "رأيك يصنع الفرق", en: "Your feedback makes a difference" })}
      title={t({ ar: "قيّم", en: "Rate" })}
      highlight={t({ ar: "جلستك", en: "Your Session" })}
      subtitle={t({
        ar: "ساعِد المرشدين على التحسّن وغيرك على الاختيار — تقييمك سرّيّ ويُحتسب ضمن متوسّط الخبير.",
        en: "Help mentors improve and others choose — your rating is confidential and counts toward the expert's average.",
      })}
      maxWidth="max-w-2xl"
    >
      <BackLink href="/profile" label={t({ ar: "عودة لملفّي", en: "Back to my profile" })} />

      <GlassCard className="p-6 sm:p-9">
        <AnimatePresence mode="wait">
          {!loading && !user ? (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <p className="text-fg-secondary text-[14px] leading-[1.85] mb-5">
                {t({
                  ar: "سجّل دخولك لتقييم جلسة الإرشاد الخاصّة بك.",
                  en: "Sign in to rate your mentorship session.",
                })}
              </p>
              <Link
                href={`/login?next=/sessions/${id}/rate`}
                className="inline-block px-7 py-3.5 rounded-2xl bg-primary text-white font-bold text-[14px] hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] hover:-translate-y-px transition-all"
              >
                {t({ ar: "تسجيل الدخول", en: "Sign in" })}
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
              <div className="text-foreground font-bold text-[17px] mb-1.5">
                {t({ ar: "شكرًا لك على تقييمك", en: "Thank you for your feedback" })}
              </div>
              <p className="text-muted-foreground text-[13.5px] leading-[1.85] max-w-md mx-auto">
                {t({
                  ar: "وصلنا رأيك بنجاح. ملاحظاتك تساعد المرشدين على التحسّن وتساعد بقيّة المنتسبين على اختيار الخبير الأنسب.",
                  en: "Your feedback came through. It helps mentors improve and helps fellow members choose the right expert.",
                })}
              </p>
              <Link
                href="/profile"
                className="inline-block mt-5 text-[13px] text-primary font-semibold hover:underline"
              >
                {t({ ar: "عرض جلساتي", en: "View my sessions" })}
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
                  {t({ ar: "كيف كانت الجلسة؟", en: "How was the session?" })}
                </div>
                <div
                  className="flex items-center justify-center gap-2"
                  dir="ltr"
                  role="radiogroup"
                  aria-label={t({
                    ar: "تقييم الجلسة بالنجوم",
                    en: "Rate the session with stars",
                  })}
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
                        aria-label={t({
                          ar: `${num(n, "ar")} من ٥`,
                          en: `${num(n, "en")} out of 5`,
                        })}
                        aria-checked={rating === n}
                        role="radio"
                        data-testid={`star-${n}`}
                        className="p-1 rounded-xl transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      >
                        <Star
                          className={`w-9 h-9 transition-colors ${
                            filled
                              ? "fill-amber-400 text-amber-400"
                              : "text-fg-faint"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="h-5 mt-3 text-[13px] font-semibold text-amber-200/90">
                  {t(RATING_HINTS[shown]) || ""}
                </div>
              </div>

              {/* Feedback */}
              <label className="block">
                <span className="block text-[11.5px] text-muted-foreground font-medium mb-1.5">
                  {t({ ar: "ملاحظات (اختياريّ)", en: "Notes (optional)" })}
                </span>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder={t({
                    ar: "ما الذي أعجبك؟ وما الذي يمكن تحسينه؟",
                    en: "What did you like? What could be improved?",
                  })}
                  className="w-full rounded-2xl bg-surface-2 border border-border-strong px-4 py-3 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none leading-[1.85]"
                  data-testid="input-feedback"
                />
                <div className="text-[11px] text-muted-foreground mt-1 text-left tabular-nums">
                  {num(feedback.length, lang)}/{num(2000, lang)}
                </div>
              </label>

              {error && (
                <div className="text-[12.5px] text-destructive text-center">
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
                {busy ? "…" : t({ ar: "إرسال التقييم", en: "Submit rating" })}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </GlassCard>
    </PageShell>
  );
}
