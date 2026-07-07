import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/**
 * ScrollProgress — a 2px reading-progress rail pinned to the top edge.
 * The bar itself reads in the warm primary; a fine cool accent-2 glint
 * sits at the leading edge (the spec's "focus glint" — cool tone reserved
 * for data/progress, never CTAs) so the head of the bar feels alive.
 * RTL-aware: origin follows the document flow direction.
 */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 inset-x-0 z-[60] h-[2px] origin-right rtl:origin-right ltr:origin-left"
      style={{
        scaleX: reduce ? scrollYProgress : scaleX,
        backgroundImage:
          "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary-bright)) 78%, hsl(var(--accent-2)) 100%)",
      }}
    />
  );
}
