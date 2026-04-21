import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, ReactNode, MouseEvent } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  strength?: number;
  target?: string;
  rel?: string;
};

export function MagneticButton({
  children,
  className = "",
  href,
  onClick,
  strength = 0.35,
  target,
  rel,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { damping: 18, stiffness: 220, mass: 0.4 });
  const sy = useSpring(y, { damping: 18, stiffness: 220, mass: 0.4 });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const isFullWidth = /\bw-full\b/.test(className);
  const stretch = isFullWidth ? "flex w-full" : "inline-flex";

  const inner = (
    <motion.span style={{ x: sx, y: sy }} className={stretch}>
      {children}
    </motion.span>
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      data-magnetic
      className={stretch + " " + className}
    >
      {href ? (
        <a href={href} target={target} rel={rel} onClick={onClick} className={stretch}>
          {inner}
        </a>
      ) : (
        <button onClick={onClick} className={stretch}>
          {inner}
        </button>
      )}
    </motion.div>
  );
}
