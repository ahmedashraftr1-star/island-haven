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
      className="relative section-y-compact overflow-hidden bg-surface-1"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="relative container-ih max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="card-base p-8 sm:p-12 text-center"
        >
          <div className="eyebrow mb-4">
            {t(s.eyebrow)}
          </div>

          <h2 className="t-h2 mb-4">
            {t(s.title)}{" "}
            <span className="text-accent-gradient">{t(s.highlight)}</span>
          </h2>

          <p className="t-body max-w-xl mx-auto mb-8">
            {t(s.body)}
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {badges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium bg-primary-soft border border-primary/20 text-primary"
              >
                {b.icon}
                {b.label}
              </span>
            ))}
          </div>

          <Link
            href="/become-mentor?ref=home-banner"
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full cta-fill font-bold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]"
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
