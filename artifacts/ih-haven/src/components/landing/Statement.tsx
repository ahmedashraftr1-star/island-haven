import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

// A representative slice of the community's stack — universal tokens (identical
// in ar/en) that make "talent knows no borders" concrete instead of abstract.
const SKILLS = ["React", "TypeScript", "Go", "Python", "Node.js", "Flutter", "UI/UX", "Figma", "AWS", "Next.js"];

/**
 * Statement — the "big idea" that opens the body: one monumental line that the
 * talent knows no borders, paired on the opposite column with the borderless
 * skillset itself so the headline reads as fact, not slogan. A two-column split
 * (headline start / skills end) fills what used to be a tall black void — in RTL
 * the max-w heading sat pinned right with a dead left half; now both halves work.
 * Slow scroll parallax underneath the headline; masked line-by-line reveal.
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
      className="relative bg-[#0a0a0a] overflow-hidden border-t border-white/[0.06]"
      style={{ paddingBlock: "clamp(2.75rem, 5.5vh, 4.75rem)" }}
      data-testid="statement-band"
    >
      <div className="container-ih relative">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] items-center gap-y-12 lg:gap-x-20">
          {/* Monumental statement — start column (right in RTL), slow parallax. */}
          <motion.div style={{ y }} className="will-change-transform">
            <h2
              className="font-display text-white"
              style={{
                fontSize: "clamp(1.9rem, 3.6vw, 3.1rem)",
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

          {/* Opposite column (left in RTL) — the borderless skillset fills what used
              to be dead space and turns the headline into evidence. */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.35, ease: EASE_OUT_EXPO }}
            className="flex flex-col gap-5"
          >
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-sand">
              {t({ ar: "مهاراتٌ عابرة للحدود", en: "Borderless skills" })}
            </p>
            <ul className="flex flex-wrap gap-2">
              {SKILLS.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-border-strong bg-white/[0.03] px-3.5 py-1.5 font-mono text-[12.5px] tracking-wide text-fg-secondary"
                >
                  {s}
                </li>
              ))}
            </ul>
            <p className="t-body text-[14px] text-fg-secondary max-w-sm">
              {t({
                ar: "من غزّة إلى فرق العالم — الكفاءة نفسها، بلا حدود.",
                en: "From Gaza to teams worldwide — the same skill, no borders.",
              })}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
