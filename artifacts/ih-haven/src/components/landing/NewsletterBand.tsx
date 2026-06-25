import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

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
      <div className="relative container-ih max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.42 }}
          className="card-base p-8 sm:p-10 text-center"
        >
          {/* Icon */}
          <div className="icon-tile mx-auto mb-5">
            <Mail className="w-5 h-5 text-primary" strokeWidth={2} />
          </div>

          <div className="eyebrow mb-2">
            {t({ ar: "النشرة الإخبارية", en: "Newsletter" })}
          </div>

          <h2 className="t-h3 text-[1.4rem] sm:text-[1.6rem] mb-3">
            {t({ ar: "ابقَ على اطّلاع دائم", en: "Stay in the loop" })}
          </h2>
          <p className="t-body text-[14px] mb-8 max-w-md mx-auto">
            {t({
              ar: "أخبار الحاضنة، فرص التقديم، فعاليّات مجتمعيّة، وقصص ملهمة — مرّة في الشهر إلى بريدك مباشرة.",
              en: "Incubator news, application openings, community events, and inspiring stories — once a month, straight to your inbox.",
            })}
          </p>

          {status === "success" ? (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-[15px] font-semibold text-emerald-300">
                {t({ ar: "تمّ الاشتراك! أهلاً في مجتمع آيلاند.", en: "You're subscribed! Welcome to the Island community." })}
              </span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 max-w-md mx-auto">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label={t({ ar: "اسمك (اختياري)", en: "Your name (optional)" })}
                placeholder={t({ ar: "اسمك (اختياري)", en: "Your name (optional)" })}
                className="w-full h-12 px-5 rounded-2xl bg-surface-3 border border-border-strong text-foreground placeholder:text-muted-foreground text-[14px] focus:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors text-start"
              />
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label={t({ ar: "بريدك الإلكتروني", en: "Your email address" })}
                  placeholder={t({ ar: "بريدك الإلكتروني", en: "Your email address" })}
                  className="flex-1 h-12 px-5 rounded-2xl bg-surface-3 border border-border-strong text-foreground placeholder:text-muted-foreground text-[14px] focus:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors text-start"
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
              <p className="text-caption text-fg-faint text-center">
                {t({
                  ar: "لا رسائل مزعجة. بإمكانك إلغاء الاشتراك في أي وقت.",
                  en: "No spam. Unsubscribe anytime.",
                })}
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
