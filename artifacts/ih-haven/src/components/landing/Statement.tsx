import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { imageUrl } from "@/hooks/use-content";

// A representative slice of the community's stack — universal tokens (identical
// in ar/en) that make "talent knows no borders" concrete instead of abstract.
const SKILLS = ["React", "TypeScript", "Go", "Python", "Node.js", "Flutter", "UI/UX", "Figma", "AWS", "Next.js"];

/**
 * Statement — the "big idea" that opens the body: one monumental line that talent
 * knows no borders, now anchored on a REAL member at work (photo backdrop + scrim)
 * so the claim reads as evidence, not a slogan floating in a void. The borderless
 * stack sits on the opposite column as glass chips laid over the photograph.
 */
export function Statement() {
  const reduce = useReducedMotion();
  const { t } = useLanguage();

  const lines = [
    t({ ar: "الموهبة", en: "Talent" }),
    t({ ar: "لا تحدّها", en: "knows no" }),
    t({ ar: "الجغرافيا.", en: "borders." }),
  ];

  return (
    <CinematicMedia
      src={imageUrl("/photos/IMG_8304.webp")}
      scrim="heavy"
      className="border-t border-white/[0.06]"
      aria-label={t({ ar: "الموهبة لا تحدّها الجغرافيا", en: "Talent knows no borders" })}
    >
      <div className="container-ih" style={{ paddingBlock: "clamp(3.5rem, 8vh, 6rem)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] items-center gap-y-10 lg:gap-x-16">
          {/* Monumental statement — start column (right in RTL), masked line reveal. */}
          <div>
            <h2
              className="font-display text-white"
              style={{ fontSize: "clamp(2.6rem, 5.8vw, 5.5rem)", lineHeight: 0.95, letterSpacing: "-0.05em", fontWeight: 900 }}
            >
              {lines.map((ln, i) => (
                <span key={i} className="block overflow-hidden pt-[0.14em] pb-[0.05em]">
                  <motion.span
                    className="block will-change-transform"
                    initial={reduce ? false : { y: "112%" }}
                    whileInView={reduce ? undefined : { y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.9, delay: i * 0.08, ease: EASE_OUT_EXPO }}
                  >
                    {ln}
                  </motion.span>
                </span>
              ))}
            </h2>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.85, delay: 0.4, ease: EASE_OUT_EXPO }}
              className="mt-8 sm:mt-10 max-w-2xl text-white/80"
              style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
            >
              {t({
                ar: "من قلب غزّة، نُهيّئ المواهب الرقميّة لتقف على خطّ المنافسة العالميّ — بمساحةٍ، وإرشادٍ، وأدواتٍ، وطريقٍ إلى العالم كلّه.",
                en: "From the heart of Gaza, we ready digital talent to compete on the world's stage — with a space, mentorship, tools, and a path outward.",
              })}
            </motion.p>
          </div>

          {/* The borderless stack — evidence laid over the photograph as glass chips. */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.3, ease: EASE_OUT_EXPO }}
            className="flex flex-col gap-5 lg:ps-8 lg:border-s lg:border-white/10"
          >
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-sand-bright">
              {t({ ar: "مهاراتٌ عابرة للحدود", en: "Borderless skills" })}
            </p>
            <ul className="flex flex-wrap gap-2">
              {SKILLS.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-1.5 font-mono text-[12.5px] tracking-wide text-white/90"
                >
                  {s}
                </li>
              ))}
            </ul>
            <p className="text-[14px] text-white/65 max-w-sm leading-relaxed">
              {t({
                ar: "من غزّة إلى فرق العالم — الكفاءة نفسها، بلا حدود.",
                en: "From Gaza to teams worldwide — the same skill, no borders.",
              })}
            </p>
          </motion.div>
        </div>
      </div>
    </CinematicMedia>
  );
}
