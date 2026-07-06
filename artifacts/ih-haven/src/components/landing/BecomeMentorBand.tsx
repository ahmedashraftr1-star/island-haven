import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { imageUrl } from "@/hooks/use-content";

/**
 * BecomeMentorBand — the mentor invitation as a HERO-POWER cinematic moment.
 * No rounded card, no two-module split: one full-bleed Gaza photograph with the
 * invitation living ON it — oversized bold sans, one crimson word, a decisive
 * crimson CTA and a quiet glass secondary. The idea (expert founders & mentors
 * worldwide give 1:1 mentorship because talent is not bound by geography) is
 * carried by SCALE + a dark cinematic frame, not by boxes or icon tiles.
 */
export function BecomeMentorBand() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <CinematicMedia
      as="section"
      id="become-mentor-band"
      src={imageUrl("/photos/IMG_8345.webp")}
      alt={t({
        ar: "مرشدون ومنتسبون في آيلاند هيفن بغزّة",
        en: "Mentors and members at Island Haven in Gaza",
      })}
      scrim="heavy"
      sideScrim
      className="border-t border-white/[0.06]"
      data-testid="become-mentor-band"
      aria-label={t({ ar: "أرشِد موهبةً لا تحدّها الجغرافيا", en: "Mentor a talent no border can hold" })}
    >
      <div className="container-ih section-y min-h-[56vh] flex items-center">
        <div className="max-w-[52rem]">
          {/* ── The confident line — oversized bold sans, one crimson word ── */}
          <motion.h2
            className="font-display text-white"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 0.98,
              letterSpacing: "-0.05em",
            }}
          >
            <motion.span
              className="block will-change-transform"
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            >
              {t({ ar: "أرشِد موهبةً", en: "Mentor a talent" })}
            </motion.span>
            <motion.span
              className="block will-change-transform"
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.85, delay: 0.1, ease: EASE_OUT_EXPO }}
            >
              {t({ ar: "لا تحدّها ", en: "no border " })}
              <span className="text-primary">{t({ ar: "الجغرافيا.", en: "can hold." })}</span>
            </motion.span>
          </motion.h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.32, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(1.75rem,3.5vw,2.5rem)] max-w-2xl text-white/75"
            style={{ fontSize: "clamp(1.0625rem, 1.7vw, 1.35rem)", lineHeight: 1.65 }}
          >
            {t({
              ar: "خبراء ومؤسّسون من حول العالم — جلسة إرشادٍ فرديّة واحدة منك، عن بُعد ",
              en: "Expert founders and mentors worldwide — one 1:1 session from you, remote and ",
            })}
            <span className="text-sand-bright font-semibold">
              {t({ ar: "ومجّانًا", en: "free" })}
            </span>
            {t({
              ar: "، قد تفتح لموهبةٍ غزّيّة بابًا أغلقته الحرب.",
              en: ", can open a door the war had closed for a Gazan talent.",
            })}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.8, delay: 0.46, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-center gap-3.5"
          >
            <Link
              href="/become-mentor?ref=home-banner"
              className="group inline-flex items-center gap-2.5 h-12 px-7 rounded-full cta-fill font-bold text-[14px] shadow-[0_20px_48px_-16px_hsl(354_82%_34%/0.6)] transition-transform duration-200 hover:-translate-y-0.5"
              data-testid="cta-become-mentor"
            >
              {t({ ar: "سجّل كمرشد", en: "Become a mentor" })}
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
            </Link>

            <Link
              href="/experts"
              className="inline-flex items-center gap-2.5 h-12 px-7 rounded-full bg-white/10 border border-white/20 backdrop-blur-md font-bold text-[14px] text-white transition-colors duration-200 hover:bg-white/15"
              data-testid="cta-become-mentor-secondary"
            >
              {t({ ar: "تعرّف على المرشدين", en: "Meet the mentors" })}
            </Link>
          </motion.div>
        </div>
      </div>
    </CinematicMedia>
  );
}
