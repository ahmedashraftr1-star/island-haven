import type { Transition, Variants } from "framer-motion";

/* ============================================================
   MOTION FOUNDATION — buttery, GPU-only (transform + opacity),
   one shared easing/duration vocabulary. Section agents: import
   EASE_* + DURATION + the variant factories below; never hand-roll
   cubic-beziers or durations. Reduced-motion is handled in Reveal
   and by the global prefers-reduced-motion rule in index.css.
   ============================================================ */

/* Expo-out — the house curve (matches the card-base 220ms transition). */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;

/* Snappy + subtle — quick reveals that don't tire the eye on scroll
   (Linear/Stripe register). Was 0.8–1.35s/28px which read as heavy. */
export const DURATION = {
  xs: 0.25,
  sm: 0.4,
  md: 0.5,
  lg: 0.65,
  xl: 0.85,
} as const;

/* ── THE canonical Apple-calm entrance — the ONE reveal used site-wide via
   <Reveal> and useReveal(): opacity 0→1 + translateY 16→0, ~600ms, expo-out,
   ~80ms stagger between siblings. Central so tuning happens in one place. ── */
export const REVEAL = {
  duration: 0.6,
  distance: 16,
  stagger: 0.08,
  ease: EASE_OUT_EXPO,
} as const;

export const fadeUp = (delay = 0, distance = 16): Variants => ({
  hidden: { opacity: 0, y: distance },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.md, delay, ease: EASE_OUT_EXPO },
  },
});

export const fadeIn = (delay = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.md, delay, ease: EASE_OUT_SOFT },
  },
});

export const slideMask = (delay = 0): Variants => ({
  hidden: { y: "105%" },
  visible: {
    y: 0,
    transition: { duration: DURATION.md, delay, ease: EASE_OUT_EXPO },
  },
});

export const stagger = (each = 0.05, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: each, delayChildren } },
});

export const spring: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 22,
  mass: 0.8,
};

/* Shared whileInView viewport — reveal a touch early, fire once. Section
   agents should spread this so reveal thresholds stay consistent. */
export const VIEWPORT = { once: true, amount: 0.2, margin: "0px 0px -10% 0px" } as const;

/* Interactive lift transition (cards / buttons) — mirrors .card-base in CSS
   (220ms expo-out). Use on framer `whileHover`/`transition` for parity. */
export const HOVER_LIFT: Transition = { duration: 0.22, ease: EASE_OUT_EXPO };

/* GPU-only scale-in for media / featured tiles. */
export const scaleIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.md, delay, ease: EASE_OUT_EXPO },
  },
});
