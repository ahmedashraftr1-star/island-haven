import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * Statement — the Apple-grade "big idea" that opens the body. No eyebrow, no card,
 * no medallion, no aura. One monumental, calm line and acres of space; scale and
 * restraint carry the grandeur. The headline rises line-by-line behind a mask the
 * way a product page reveals its thesis, with a slow scroll parallax underneath.
 */
export function Statement() {
  const reduce = useReducedMotion();
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["6%", "-6%"]);

  const lines = [
    t({ ar: "الموهبة", en: "Talent" }),
    t({ ar: "لا تحدّها", en: "knows no" }),
    t({ ar: "الجغرافيا.", en: "borders." }),
  ];

  return (
    <section
      ref={ref}
      className="relative bg-[#0a0a0a] overflow-hidden"
      style={{ paddingBlock: "clamp(6.5rem, 17vh, 13rem)" }}
      data-testid="statement-band"
    >
      <div className="container-ih relative">
        <motion.div style={{ y }} className="max-w-5xl will-change-transform">
          <h2
            className="font-display text-white"
            style={{
              fontSize: "clamp(2.7rem, 8.4vw, 7.25rem)",
              lineHeight: 0.99,
              letterSpacing: "-0.045em",
              fontWeight: 700,
            }}
          >
            {lines.map((ln, i) => (
              <motion.span
                key={i}
                className="block will-change-transform"
                initial={reduce ? false : { opacity: 0, y: 34 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.85, delay: i * 0.1, ease: EASE_OUT_EXPO }}
              >
                {ln}
              </motion.span>
            ))}
          </h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.5, ease: EASE_OUT_EXPO }}
            className="mt-9 sm:mt-11 max-w-2xl text-white/55"
            style={{ fontSize: "clamp(1.1rem, 1.9vw, 1.5rem)", lineHeight: 1.6 }}
          >
            {t({
              ar: "من قلب غزّة، نُهيّئ المواهب الرقميّة لتقف على خطّ المنافسة العالميّ — بمساحةٍ، وإرشادٍ، وأدواتٍ، وطريقٍ إلى العالم كلّه.",
              en: "From the heart of Gaza, we ready digital talent to compete on the world's stage — with a space, mentorship, tools, and a path outward.",
            })}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
