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
    <section className="relative py-24 px-5 sm:px-8 overflow-hidden bg-[#0A0E1A] text-white">
      {/* background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[320px] rounded-full bg-primary/[0.14] blur-[90px] pointer-events-none" />

      <div className="relative max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-6 h-6 text-primary" />
          </div>

          <div className="text-[11px] font-bold text-primary/60 tracking-widest uppercase mb-2">
            {t({ ar: "النشرة الإخبارية", en: "Newsletter" })}
          </div>

          <h2 className="text-[26px] sm:text-[30px] font-black text-white leading-tight mb-3">
            {t({ ar: "ابقَ على اطّلاع دائم", en: "Stay in the loop" })}
          </h2>
          <p className="text-[14px] text-white/45 leading-relaxed mb-8 max-w-md mx-auto">
            {t({
              ar: "أخبار الحاضنة، فرص التقديم، فعاليّات مجتمعيّة، وقصص ملهمة — مرّة في الشهر إلى بريدك مباشرة.",
              en: "Incubator news, application openings, community events, and inspiring stories — once a month, straight to your inbox.",
            })}
          </p>

          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
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
                placeholder={t({ ar: "اسمك (اختياري)", en: "Your name (optional)" })}
                className="w-full h-12 px-5 rounded-2xl bg-white/[0.05] border border-white/[0.09] text-white placeholder:text-white/25 text-[14px] focus:outline-none focus:border-primary/40 transition-colors text-right"
              />
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t({ ar: "بريدك الإلكتروني", en: "Your email address" })}
                  className="flex-1 h-12 px-5 rounded-2xl bg-white/[0.05] border border-white/[0.09] text-white placeholder:text-white/25 text-[14px] focus:outline-none focus:border-primary/40 transition-colors text-right"
                />
                <button
                  type="submit"
                  disabled={status === "loading" || !email.trim()}
                  className="shrink-0 h-12 px-5 rounded-2xl bg-primary text-white font-semibold text-[14px] hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/25"
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
                <p className="text-[13px] text-rose-400 text-right">{errorMsg}</p>
              )}
              <p className="text-[11px] text-white/25 text-center">
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
