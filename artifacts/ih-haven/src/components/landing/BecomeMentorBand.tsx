import { useRef } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * BecomeMentorBand — a mentor-invitation CTA band in the house grandeur. Here
 * grandeur is RESTRAINT: a calm, spacious band with one confident line and a
 * single decisive CTA, paired with one full-bleed Gaza photograph. The whole
 * idea — expert founders & mentors worldwide give 1:1 mentorship because talent
 * is not bound by geography — is carried by SCALE + SPACE, not elements.
 *
 * AI tells removed: the eyebrow kicker (hairline + uppercase label), the
 * 01/02/03 numbered ledger of cards, the gradient aura blob, and the uppercase
 * tracking-label overlaid on the photo. No medallions, no icon tiles, no glass.
 */
export function BecomeMentorBand() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  const mediaRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: mediaRef,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-7%", "7%"]);

  return (
    <section
      className="relative bg-surface-1 overflow-hidden"
      style={{ paddingBlock: "clamp(6rem, 15vh, 11rem)" }}
      data-testid="become-mentor-band"
    >
      <div className="container-ih relative">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2.5rem,6vw,6rem)] gap-y-[clamp(3rem,7vh,5rem)] items-center">
          {/* ── The confident line — oversized solid type, one crimson word, air ── */}
          <div className="lg:col-span-7 lg:order-1">
            <motion.h2
              className="font-display text-foreground max-w-[16ch]"
              style={{
                fontSize: "clamp(2.4rem, 6.6vw, 4.5rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.04em",
                fontWeight: 700,
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
              className="mt-[clamp(1.75rem,3.5vw,2.5rem)] max-w-xl text-fg-secondary"
              style={{ fontSize: "clamp(1.0625rem, 1.7vw, 1.35rem)", lineHeight: 1.65 }}
            >
              {t({
                ar: "خبراء ومؤسّسون من حول العالم — جلسة إرشادٍ فرديّة واحدة منك، عن بُعد ومجّانًا، قد تفتح لموهبةٍ غزّيّة بابًا أغلقته الحرب.",
                en: "Expert founders and mentors worldwide — one 1:1 session from you, remote and free, can open a door the war had closed for a Gazan talent.",
              })}
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.8, delay: 0.46, ease: EASE_OUT_EXPO }}
              className="mt-[clamp(2rem,4vw,3rem)]"
            >
              <Link
                href="/become-mentor?ref=home-banner"
                className="group inline-flex items-center gap-2.5 h-12 px-7 rounded-full cta-fill font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
                data-testid="cta-become-mentor"
              >
                {t({ ar: "سجّل كمرشد", en: "Become a mentor" })}
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {/* ── One full-bleed photograph — the place and its people, no overlay label ── */}
          <motion.div
            ref={mediaRef}
            className="lg:col-span-5 lg:order-2"
            initial={reduce ? false : { opacity: 0 }}
            whileInView={reduce ? undefined : { opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1, ease: EASE_OUT_EXPO }}
          >
            <div className="relative overflow-hidden rounded-[20px] ring-1 ring-white/10 shadow-soft">
              <motion.img
                src="/photos/IMG_8352.webp"
                alt={t({ ar: "مرشدون ومنتسبون في آيلاند هيفن بغزّة", en: "Mentors and members at Island Haven in Gaza" })}
                loading="lazy"
                style={{ y: imgY }}
                className="w-full h-[clamp(22rem,52vw,34rem)] object-cover object-center will-change-transform"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/55 via-transparent to-transparent"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
