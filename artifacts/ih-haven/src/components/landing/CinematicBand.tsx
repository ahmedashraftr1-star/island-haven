import { useRef } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * CinematicBand — a full-bleed, parallaxed "wow" moment below the fold that
 * echoes the hero's cinematic weight (the brand's loved register), applied to a
 * real Gaza photograph. Big solid headline (the brand belief), a deep-navy scrim
 * for legibility, one confident CTA. No video — photography + scale + motion
 * carry it. Inspired by the cinematic field section on the reference site.
 */
export function CinematicBand() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4, restDelta: 0.001 });
  const photoY = useTransform(smooth, [0, 1], reduce ? ["0%", "0%"] : ["-9%", "9%"]);
  const photoScale = useTransform(smooth, [0, 1], [reduce ? 1 : 1.12, 1]);
  const textY = useTransform(smooth, [0, 1], reduce ? ["0%", "0%"] : ["10%", "-10%"]);

  return (
    <section
      ref={ref}
      className="relative h-[78vh] min-h-[520px] w-full overflow-hidden bg-[#0A0E1A] text-white"
      aria-label={t({ ar: "من قلب غزّة", en: "From the heart of Gaza" })}
    >
      <motion.div
        style={{ y: photoY, scale: photoScale }}
        aria-hidden
        className="absolute inset-0 will-change-transform"
      >
        <img
          src="/photos/IMG_8356.webp"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover saturate-[1.06] contrast-[1.03]"
        />
      </motion.div>

      {/* Deep-navy scrim — vertical wash + focused side scrim for legible text */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,14,26,0.55) 0%, rgba(10,14,26,0.22) 38%, rgba(10,14,26,0.55) 70%, rgba(10,14,26,0.94) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 end-0 w-full lg:w-[72%]"
        style={{
          background:
            "linear-gradient(270deg, rgba(10,14,26,0.62) 0%, rgba(10,14,26,0.2) 46%, transparent 80%)",
        }}
      />

      <motion.div
        style={{ y: textY }}
        className="relative z-10 h-full flex items-center will-change-transform"
      >
        <div className="container-ih w-full">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-10 bg-white/50" />
              <span className="text-[11px] tracking-[0.2em] uppercase text-white/85 font-semibold rtl:tracking-normal">
                {t({ ar: "من قلب غزّة", en: "From the heart of Gaza" })}
              </span>
            </div>

            <motion.h2
              initial={reduce ? false : { y: 26, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-extrabold text-white"
              style={{ fontSize: "clamp(2.6rem, 6.5vw, 5.5rem)", lineHeight: 1.02, letterSpacing: "-0.035em" }}
            >
              {t({ ar: "مساحة تتّسع لأحلامك.", en: "A space wide enough for your dreams." })}
            </motion.h2>

            <motion.p
              initial={reduce ? false : { y: 16, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-6 max-w-xl text-[1.0625rem] lg:text-xl text-white/85 leading-[1.7]"
            >
              {t({
                ar: "بيئة عمل احترافيّة، إرشاد، وأدوات عالميّة — نُهيّئك لتقف على خطّ المنافسة الحقيقيّ مع العالم.",
                en: "A professional workspace, mentorship, and world-class tools — preparing you to compete, for real, with the world.",
              })}
            </motion.p>

            <motion.div
              initial={reduce ? false : { y: 14, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8"
            >
              <Link
                href="/apply"
                data-testid="cinematic-cta"
                className="cta-fill group inline-flex items-center gap-3 h-[52px] px-8 rounded-full font-bold text-[15px] shadow-[0_24px_64px_-16px_hsl(354_82%_40%/0.6)] hover:scale-[1.02] active:scale-[0.99] transition-transform duration-200"
              >
                {t({ ar: "ابدأ رحلتك", en: "Start your journey" })}
                <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
