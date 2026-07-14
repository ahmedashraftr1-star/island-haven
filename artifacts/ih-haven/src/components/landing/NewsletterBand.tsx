import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * NewsletterBand — the closing invitation as a PREMIUM DARK subscribe moment,
 * sitting between a light FAQ and the final CTA. A near-black canvas lifted off
 * flat with a faint crimson/gold aura; one monumental display line with a single
 * crimson word, then a clean rounded-pill email form built for dark surfaces.
 * All theme tokens are swapped for white-based values. Success/error/validation
 * and every data-testid are preserved exactly; only the surface changes.
 */
export function NewsletterBand() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await api("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : t({ ar: "تعذّر الاشتراك. حاول مجدّداً.", en: "Couldn't subscribe. Please try again." })
      );
    }
  }

  // Premium field on dark — a soft-glass pill that brightens its edge on focus.
  const fieldClass =
    "w-full bg-white/[0.06] border border-white/15 rounded-full h-12 px-5 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/60 focus:bg-white/[0.08] transition-colors text-start";
  const fieldStyle = { fontSize: "clamp(1rem, 1.3vw, 1.0625rem)" } as const;

  return (
    <section
      className="section-y relative overflow-hidden bg-[#060608] text-white border-t border-white/[0.06]"
      data-testid="newsletter-band"
    >
      {/* Faint aura so the black isn't flat — crimson glow + a warm gold whisper. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 90% at 18% 18%, hsl(354 82% 40% / 0.20) 0%, transparent 60%), radial-gradient(55% 80% at 92% 96%, hsl(38 92% 55% / 0.08) 0%, transparent 62%)",
        }}
      />

      <div className="container-ih relative">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2.5rem,7vw,7rem)] gap-y-[clamp(2.5rem,5vh,4rem)] items-center">
          {/* ── The invitation — one monumental line, one crimson word ── */}
          <div className="lg:col-span-6 max-w-[16ch]">
            <h2
              className="font-display text-white"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
                fontWeight: 900,
                lineHeight: "var(--lh-display)",
                letterSpacing: "-0.05em",
              }}
            >
              {[
                t({ ar: "ابقَ على", en: "Stay in" }),
                <span key="accent" className="text-primary">{t({ ar: "اطّلاع.", en: "the loop." })}</span>,
              ].map((ln, i) => (
                <motion.span
                  key={i}
                  className="block will-change-transform"
                  initial={reduce ? false : { opacity: 0, y: 28 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.85, delay: i * 0.09, ease: EASE_OUT_EXPO }}
                >
                  {ln}
                </motion.span>
              ))}
            </h2>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.85, delay: 0.28, ease: EASE_OUT_EXPO }}
              className="mt-[clamp(1.5rem,3vw,2.25rem)] max-w-[34ch] text-white/70"
              style={{ fontSize: "clamp(1.05rem, 1.7vw, 1.3rem)", lineHeight: 1.6 }}
            >
              {t({
                ar: "أخبار الحاضنة، فرص التقديم، وقصص ملهمة — مرّة في الشهر إلى بريدك مباشرة. لا رسائل مزعجة، ويمكنك الإلغاء متى شئت.",
                en: "Incubator news, application openings, and inspiring stories — once a month, straight to your inbox. No spam, unsubscribe anytime.",
              })}
            </motion.p>
          </div>

          {/* ── The form — a premium rounded-pill stack, lifted for dark ── */}
          <motion.div
            className="lg:col-span-6 lg:col-start-8 will-change-transform"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.85, delay: 0.12, ease: EASE_OUT_EXPO }}
          >
            {status === "success" ? (
              <div
                className="flex items-baseline gap-3 py-2"
                data-testid="newsletter-success"
              >
                <Check className="w-6 h-6 shrink-0 text-primary translate-y-1" strokeWidth={2.5} />
                <div className="text-start">
                  <div
                    className="font-display text-white"
                    style={{ fontSize: "clamp(1.4rem,2.6vw,2rem)", letterSpacing: "-0.025em", lineHeight: 1.1, fontWeight: 700 }}
                  >
                    {t({ ar: "تمّ الاشتراك بنجاح.", en: "You're subscribed." })}
                  </div>
                  <p className="mt-3 text-white/70 max-w-[34ch]" style={{ fontSize: "clamp(1rem,1.5vw,1.15rem)", lineHeight: 1.6 }}>
                    {t({
                      ar: "أهلاً بك في مجتمع آيلاند هيفن — نراك في النشرة القادمة.",
                      en: "Welcome to the Island Haven community — see you in the next issue.",
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="newsletter-form">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label={t({ ar: "اسمك (اختياري)", en: "Your name (optional)" })}
                  placeholder={t({ ar: "اسمك (اختياري)", en: "Your name (optional)" })}
                  data-testid="input-newsletter-name"
                  className={fieldClass}
                  style={fieldStyle}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label={t({ ar: "بريدك الإلكتروني", en: "Your email address" })}
                  placeholder={t({ ar: "بريدك الإلكتروني", en: "Your email address" })}
                  data-testid="input-newsletter-email"
                  className={fieldClass}
                  style={fieldStyle}
                />
                <button
                  type="submit"
                  disabled={status === "loading" || !email.trim()}
                  data-testid="button-newsletter-subscribe"
                  className="cta-fill group inline-flex items-center justify-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t({ ar: "اشترك الآن", en: "Subscribe" })}
                      <ArrowLeft className="w-4 h-4 ltr:rotate-180 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
                    </>
                  )}
                </button>
                {status === "error" && (
                  <p className="text-[14px] font-medium text-primary text-start" data-testid="newsletter-error">
                    {errorMsg}
                  </p>
                )}
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
