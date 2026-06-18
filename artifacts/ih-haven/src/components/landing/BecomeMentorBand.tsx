import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Clock, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { I18N } from "@/lib/i18n";

export function BecomeMentorBand() {
  const { lang, t } = useLanguage();
  const s = I18N.landing.becomeMentor;

  const badges = [
    { icon: <Sparkles className="w-3.5 h-3.5" />, label: t(s.badge1) },
    { icon: <Clock className="w-3.5 h-3.5" />,    label: t(s.badge2) },
    { icon: <Heart className="w-3.5 h-3.5" />,    label: t(s.badge3) },
  ];

  return (
    <section
      className="relative py-20 px-5 sm:px-8 overflow-hidden"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.04] to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[320px] rounded-full bg-primary/[0.07] blur-[90px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-primary/20 bg-white/[0.03] backdrop-blur-sm p-8 sm:p-12 text-center"
        >
          <div className="text-[11px] font-bold text-primary/60 tracking-widest uppercase mb-4">
            {t(s.eyebrow)}
          </div>

          <h2 className="text-[26px] sm:text-[34px] font-black text-white leading-snug mb-4">
            {t(s.title)}{" "}
            <span className="text-accent-gradient">{t(s.highlight)}</span>
          </h2>

          <p className="text-[14px] sm:text-[15px] text-white/50 leading-relaxed max-w-xl mx-auto mb-8">
            {t(s.body)}
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {badges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-primary/10 border border-primary/20 text-primary/80"
              >
                {b.icon}
                {b.label}
              </span>
            ))}
          </div>

          <Link
            href="/become-mentor?ref=home-banner"
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-[14px] hover:shadow-soft-hover hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/25"
            data-testid="cta-become-mentor"
            onClick={() => console.log("[analytics] become-mentor cta clicked", { ref: "home-banner" })}
          >
            <Sparkles className="w-4 h-4" />
            {t(s.cta)}
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
