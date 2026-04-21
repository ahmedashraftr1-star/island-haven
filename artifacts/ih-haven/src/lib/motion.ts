import type { Transition, Variants } from "framer-motion";

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  xs: 0.35,
  sm: 0.55,
  md: 0.85,
  lg: 1.1,
  xl: 1.4,
} as const;

export const fadeUp = (delay = 0, distance = 28): Variants => ({
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

export const stagger = (each = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: each, delayChildren } },
});

export const spring: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 22,
  mass: 0.8,
};
