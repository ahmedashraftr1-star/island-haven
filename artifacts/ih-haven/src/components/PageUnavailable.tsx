import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Clock } from "lucide-react";
import { useEffect } from "react";
import { HavenMark } from "@/components/landing/HavenMark";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Shown when the owner has hidden a whole page from the panel. Deliberately NOT a
 * 404 — a backer/investor should read "temporarily unavailable", not "broken
 * site". Calm, on-brand, with a clear way back. Bilingual + RTL.
 */
export default function PageUnavailable() {
  const { dir, t } = useLanguage();

  useEffect(() => {
    document.title = t({
      ar: "غير متاح حاليًّا — آيلاند هيفن",
      en: "Not available right now — Island Haven",
    });
  }, [t]);

  return (
    <div
      dir={dir}
      className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          background:
            "radial-gradient(55% 45% at 82% 0%, rgba(221,189,126,0.20) 0%, transparent 60%), radial-gradient(45% 40% at 0% 100%, rgba(199,67,38,0.14) 0%, transparent 60%)",
        }}
      />

      <header className="relative z-20 px-5 pt-6 sm:px-8 sm:pt-8 lg:px-14">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-2.5">
          <HavenMark size={32} strokeColor="hsl(354 80% 60%)" />
          <div className="text-right leading-tight">
            <div className="text-[13px] font-bold tracking-tight">Island Haven</div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">آيلاند هيفن</div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#DDBD7E]/30 bg-[#DDBD7E]/10 px-3 py-1.5 backdrop-blur-md">
            <Clock className="h-3 w-3 text-[#DDBD7E]" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-[#DDBD7E]">
              {t({ ar: "غير متاح حاليًّا", en: "Not available right now" })}
            </span>
          </div>

          <h1
            className="mb-4 font-bold leading-[1.06] text-white"
            style={{ fontSize: "clamp(2rem, 6vw, 3.4rem)", letterSpacing: "-0.03em" }}
          >
            {t({
              ar: "هذا المحتوى غير متاح مؤقّتًا.",
              en: "This content isn't available right now.",
            })}
          </h1>
          <p className="mx-auto mb-9 max-w-md text-[14px] leading-[1.85] text-white/60 sm:text-[15px]">
            {t({
              ar: "أخفينا هذا القسم مؤقّتًا لتحديثه. تصفّح بقيّة الموقع، وسيعود قريبًا.",
              en: "We've temporarily tucked this section away while we update it. Explore the rest of the site — it'll be back soon.",
            })}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[13.5px] font-bold text-white transition-all hover:-translate-y-px hover:shadow-[0_18px_40px_-12px_rgba(199,67,38,0.55)]"
            >
              <ArrowLeft className="h-4 w-4 transition-transform rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              {t({ ar: "العودة للرئيسيّة", en: "Back to home" })}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
