import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * NewsletterBand — the closing invitation, told the Apple way: a utility band
 * carried by RESTRAINT + SPACE, not decoration. One calm display line with a
 * single crimson word, then the form laid out as clean editorial fields with
 * hairline underlines — no card panel, no eyebrow kicker, no aura blob, no
 * circular success medallion. Success/error/validation and every data-testid
 * are preserved exactly; only the surface is made grand and quiet.
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

  // Calm field — a clean editorial input on a hairline underline, no boxed tile.
  const fieldClass =
    "w-full bg-transparent border-0 border-b border-border-strong/70 pb-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-start";
  const fieldStyle = { fontSize: "clamp(1.0625rem, 1.5vw, 1.25rem)" } as const;

  return (
    <section
      className="relative bg-background overflow-hidden"
      style={{ paddingBlock: "clamp(5.5rem, 13vh, 10rem)" }}
      data-testid="newsletter-band"
    >
      <div className="container-ih relative">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2.5rem,7vw,7rem)] gap-y-[clamp(3rem,6vh,4.5rem)] items-end">
          {/* ── The calm invitation — one monumental line, one crimson word ── */}
          <div className="lg:col-span-6 max-w-[16ch]">
            <h2
              className="font-display text-foreground"
              style={{
                fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.04em",
                fontWeight: 700,
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
              className="mt-[clamp(1.5rem,3vw,2.25rem)] max-w-[34ch] text-fg-secondary"
              style={{ fontSize: "clamp(1.05rem, 1.7vw, 1.3rem)", lineHeight: 1.6 }}
            >
              {t({
                ar: "أخبار الحاضنة، فرص التقديم، وقصص ملهمة — مرّة في الشهر إلى بريدك مباشرة. لا رسائل مزعجة، ويمكنك الإلغاء متى شئت.",
                en: "Incubator news, application openings, and inspiring stories — once a month, straight to your inbox. No spam, unsubscribe anytime.",
              })}
            </motion.p>
          </div>

          {/* ── The form — clean editorial fields, lifted off any card panel ── */}
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
                    className="font-display text-foreground"
                    style={{ fontSize: "clamp(1.4rem,2.6vw,2rem)", letterSpacing: "-0.025em", lineHeight: 1.1, fontWeight: 600 }}
                  >
                    {t({ ar: "تمّ الاشتراك بنجاح.", en: "You're subscribed." })}
                  </div>
                  <p className="mt-3 text-fg-secondary max-w-[34ch]" style={{ fontSize: "clamp(1rem,1.5vw,1.15rem)", lineHeight: 1.6 }}>
                    {t({
                      ar: "أهلاً بك في مجتمع آيلاند هيفن — نراك في النشرة القادمة.",
                      en: "Welcome to the Island Haven community — see you in the next issue.",
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-[clamp(1.75rem,3.5vw,2.5rem)]" data-testid="newsletter-form">
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
                  className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t({ ar: "اشترك الآن", en: "Subscribe" })}
                      <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
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
