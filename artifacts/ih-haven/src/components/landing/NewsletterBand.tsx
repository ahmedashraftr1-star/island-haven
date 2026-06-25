import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * NewsletterBand — editorial, start-aligned band in the approved WhatYouGet
 * language. No icon-tile, no centered glass card. Asymmetric: an oversized
 * solid headline + lead on the logical START, the form on the END column,
 * separated by an Apple-quiet hairline frame. Warm sand accent on the eyebrow.
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
    <section className="relative section-y-compact overflow-hidden bg-background">
      <div className="container-ih">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-10 items-center border-t border-border-strong pt-[clamp(2.5rem,5vw,4.5rem)]">
          {/* Lead — start-aligned, oversized solid type */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-6"
          >
            <div className="eyebrow eyebrow-sand mb-5">
              {t({ ar: "النشرة الإخبارية", en: "Newsletter" })}
            </div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(1.9rem, 3.6vw, 3rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
            >
              {t({ ar: "ابقَ على اطّلاع دائم.", en: "Stay in the loop." })}
            </h2>
            <p className="t-body mt-5 max-w-md">
              {t({
                ar: "أخبار الحاضنة، فرص التقديم، فعاليّات مجتمعيّة، وقصص ملهمة — مرّة في الشهر إلى بريدك مباشرة.",
                en: "Incubator news, application openings, community events, and inspiring stories — once a month, straight to your inbox.",
              })}
            </p>
          </motion.div>

          {/* Form — end column, hairline-framed (no glass) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="lg:col-span-6"
          >
            {status === "success" ? (
              <motion.div
                initial={{ scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 py-5 px-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-[15px] font-semibold text-emerald-300 text-start">
                  {t({ ar: "تمّ الاشتراك! أهلاً في مجتمع آيلاند.", en: "You're subscribed! Welcome to the Island community." })}
                </span>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label={t({ ar: "اسمك (اختياري)", en: "Your name (optional)" })}
                  placeholder={t({ ar: "اسمك (اختياري)", en: "Your name (optional)" })}
                  className="w-full h-12 px-5 rounded-2xl bg-surface-2 border border-border-strong text-foreground placeholder:text-muted-foreground text-[14px] focus:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors text-start"
                />
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label={t({ ar: "بريدك الإلكتروني", en: "Your email address" })}
                    placeholder={t({ ar: "بريدك الإلكتروني", en: "Your email address" })}
                    className="flex-1 min-w-0 h-12 px-5 rounded-2xl bg-surface-2 border border-border-strong text-foreground placeholder:text-muted-foreground text-[14px] focus:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors text-start"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading" || !email.trim()}
                    className="cta-fill shrink-0 h-12 px-5 rounded-2xl font-semibold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-14px_hsl(354_82%_30%_/_0.55)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center gap-2"
                  >
                    {status === "loading" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {t({ ar: "اشترك", en: "Subscribe" })}
                        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                      </>
                    )}
                  </button>
                </div>
                {status === "error" && (
                  <p className="text-[13px] text-rose-400 text-start">{errorMsg}</p>
                )}
                <p className="text-caption text-fg-faint text-start">
                  {t({
                    ar: "لا رسائل مزعجة. بإمكانك إلغاء الاشتراك في أي وقت.",
                    en: "No spam. Unsubscribe anytime.",
                  })}
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
