import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";

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
};

export function Reveal({
  children,
  delay = 0,
  distance = 28,
  duration = DURATION.md,
  once = true,
  amount = 0.2,
  as = "div",
  className,
  id,
}: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      id={id}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: distance }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </Tag>
  );
}
