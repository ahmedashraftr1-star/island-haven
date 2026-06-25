import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

/**
 * NewsletterBand — the closing invitation, told in the canonical homepage
 * language: a brand-aura glow on the navy canvas, an oversized SOLID display
 * headline with a single cerulean accent word, and the form lifted onto ONE
 * real card-base panel (surface-2 + border-strong + shadow-soft) with crisp
 * inputs and a confident crimson cta-fill. No glass, no scheme-flip, no
 * off-palette success state — system tokens carry it. Success/error preserved.
 */
export function NewsletterBand() {
  const { t } = useLanguage();
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

  return (
    <section className="relative bg-background section-y overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[70%] brand-aura opacity-60" />

      <div className="container-ih relative">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-center">
          {/* Lead — start-aligned, oversized solid display with a cerulean accent */}
          <Reveal as="div" className="lg:col-span-6">
            <div className="eyebrow eyebrow-sand mb-5">
              {t({ ar: "النشرة الإخبارية", en: "Newsletter" })}
            </div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(2rem, 4.4vw, 3.6rem)", lineHeight: 1.04, letterSpacing: "-0.028em" }}
            >
              {t({ ar: "ابقَ على ", en: "Stay in " })}
              <span className="text-sand-bright">{t({ ar: "اطّلاع دائم.", en: "the loop." })}</span>
            </h2>
            <p className="t-body-lg mt-5 max-w-md">
              {t({
                ar: "أخبار الحاضنة، فرص التقديم، فعاليّات مجتمعيّة، وقصص ملهمة — مرّة في الشهر إلى بريدك مباشرة.",
                en: "Incubator news, application openings, community events, and inspiring stories — once a month, straight to your inbox.",
              })}
            </p>
            <p className="t-caption mt-6">
              {t({
                ar: "لا رسائل مزعجة. بإمكانك إلغاء الاشتراك في أيّ وقت.",
                en: "No spam. Unsubscribe anytime.",
              })}
            </p>
          </Reveal>

          {/* Form — lifted onto ONE real card panel (no glass, no scheme-flip) */}
          <Reveal as="div" delay={0.08} className="lg:col-span-6">
            <div className="card-base p-[clamp(1.5rem,3vw,2rem)]">
              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3.5 py-6"
                  data-testid="newsletter-success"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "hsl(var(--sand-soft))" }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-sand-bright" />
                  </span>
                  <div className="text-start">
                    <div className="font-display font-bold text-foreground text-[17px] leading-snug">
                      {t({ ar: "تمّ الاشتراك بنجاح", en: "You're subscribed" })}
                    </div>
                    <p className="t-body mt-1.5">
                      {t({
                        ar: "أهلاً بك في مجتمع آيلاند هيفن — نراك في النشرة القادمة.",
                        en: "Welcome to the Island Haven community — see you in the next issue.",
                      })}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5" data-testid="newsletter-form">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-label={t({ ar: "اسمك (اختياري)", en: "Your name (optional)" })}
                    placeholder={t({ ar: "اسمك (اختياري)", en: "Your name (optional)" })}
                    data-testid="input-newsletter-name"
                    className="w-full h-12 px-5 rounded-[14px] bg-surface-3 border border-border-strong text-foreground placeholder:text-muted-foreground text-[14px] focus:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors text-start"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label={t({ ar: "بريدك الإلكتروني", en: "Your email address" })}
                    placeholder={t({ ar: "بريدك الإلكتروني", en: "Your email address" })}
                    data-testid="input-newsletter-email"
                    className="w-full h-12 px-5 rounded-[14px] bg-surface-3 border border-border-strong text-foreground placeholder:text-muted-foreground text-[14px] focus:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors text-start"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading" || !email.trim()}
                    data-testid="button-newsletter-subscribe"
                    className="cta-fill group w-full h-12 px-5 rounded-[14px] font-semibold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-14px_hsl(354_82%_30%_/_0.55)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
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
                    <p className="text-[13px] font-medium text-primary text-start" data-testid="newsletter-error">
                      {errorMsg}
                    </p>
                  )}
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
