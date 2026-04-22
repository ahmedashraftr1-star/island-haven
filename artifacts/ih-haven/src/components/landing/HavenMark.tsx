import { motion } from "framer-motion";

/**
 * Animated wordmark — a self-drawing "ih" monogram with a sunrise above the
 * "i" dot, evoking the haven's promise of a new dawn. The strokes draw
 * themselves on mount, like a hand signing a letter. This is the brand's
 * signature gesture — subtle, confident, never seen on a Gaza nonprofit site.
 */
export function HavenMark({
  size = 96,
  className = "",
  strokeColor = "currentColor",
  delay = 0,
}: {
  size?: number;
  className?: string;
  strokeColor?: string;
  delay?: number;
}) {
  const draw = (i: number) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: {
      pathLength: { delay: delay + i * 0.18, duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
      opacity: { delay: delay + i * 0.18, duration: 0.3 },
    },
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Sunrise arc above i — the dawn over the haven */}
      <motion.path
        d="M 22 38 Q 36 22 50 38"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        {...draw(0)}
      />
      {/* Sunrise rays — three short ticks */}
      <motion.path
        d="M 36 18 L 36 12"
        stroke={strokeColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        {...draw(1)}
      />
      <motion.path
        d="M 22 26 L 17 22"
        stroke={strokeColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        {...draw(1)}
      />
      <motion.path
        d="M 50 26 L 55 22"
        stroke={strokeColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        {...draw(1)}
      />
      {/* The "i" stem */}
      <motion.path
        d="M 36 50 L 36 96"
        stroke={strokeColor}
        strokeWidth="6"
        strokeLinecap="round"
        {...draw(2)}
      />
      {/* The "h" — vertical + arched bowl */}
      <motion.path
        d="M 64 30 L 64 96"
        stroke={strokeColor}
        strokeWidth="6"
        strokeLinecap="round"
        {...draw(3)}
      />
      <motion.path
        d="M 64 64 Q 76 52 88 64 L 88 96"
        stroke={strokeColor}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        {...draw(4)}
      />
    </svg>
  );
}
