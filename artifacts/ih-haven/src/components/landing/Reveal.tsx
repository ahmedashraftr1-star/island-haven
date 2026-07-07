import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EASE_OUT_EXPO, REVEAL, VIEWPORT } from "@/lib/motion";

type RevealAs = "div" | "section" | "article" | "header" | "footer" | "li" | "p" | "span";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
  as?: RevealAs;
  className?: string;
  id?: string;
  /** Auto-stagger within a group: adds index × REVEAL.stagger (~80ms) to delay. */
  index?: number;
};

/**
 * Buttery, GPU-only reveal (transform + opacity only).
 *
 * SAFETY: content must NEVER stay blank. Two guards:
 *  1. A failsafe timer forces the element visible shortly after mount even if
 *     the IntersectionObserver never fires (some browsers don't fire for
 *     elements already in view, SSR/hydration edge cases, etc.).
 *  2. Reduced-motion renders the final state immediately (no transform).
 */
export function Reveal({
  children,
  delay = 0,
  distance = REVEAL.distance,
  duration = REVEAL.duration,
  once = true,
  amount = VIEWPORT.amount,
  as = "div",
  className,
  id,
  index = 0,
}: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as] as typeof motion.div;
  const [forced, setForced] = useState(false);
  const fired = useRef(false);
  // Grouped children cascade at ~80ms each (Apple-calm stagger).
  const totalDelay = delay + index * REVEAL.stagger;

  // Failsafe: if the observer hasn't fired within a short window, reveal anyway
  // so the section can never be stuck at opacity 0.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!fired.current) setForced(true);
    }, 1200 + totalDelay * 1000);
    return () => window.clearTimeout(t);
  }, [totalDelay]);

  // Reduced motion → render the final (visible) state immediately, no fade.
  const hidden = reduce ? { opacity: 1 } : { opacity: 0, y: distance };
  const shown = reduce ? { opacity: 1 } : { opacity: 1, y: 0 };

  return (
    <Tag
      id={id}
      initial={hidden}
      animate={forced ? shown : undefined}
      whileInView={forced ? undefined : shown}
      onViewportEnter={() => {
        fired.current = true;
      }}
      viewport={{ once, amount, margin: VIEWPORT.margin }}
      transition={{ duration, delay: totalDelay, ease: EASE_OUT_EXPO }}
      style={{ willChange: "transform, opacity" }}
      className={className}
    >
      {children}
    </Tag>
  );
}
