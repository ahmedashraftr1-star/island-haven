import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import "./SpotlightCard.css";

// A brand-built equivalent of React Bits' SpotlightCard: a pointer-tracked radial
// glow that follows the cursor across a card. Pure CSS + a CSS-var writer (no React
// re-render on move, no dependencies). The default glow is the terracotta identity.

interface SpotlightProps {
  /** Glow colour — a low-alpha terracotta by default so it reads as light, not paint. */
  color?: string;
  /** Glow radius in px. */
  radius?: number;
}

/**
 * SpotlightOverlay — ENHANCES an existing card without adding a second glass layer.
 * Drop it as a direct child of any `position: relative` `.group` card (e.g. the
 * already-glass venture/expert cards); it wires a pointermove listener on its parent
 * and lights up on hover/focus. `mix-blend-mode: screen` means it only ADDS light —
 * it brightens the dark glass toward the cursor and leaves white text untouched.
 */
export function SpotlightOverlay({ color = "rgba(230, 90, 50, 0.18)", radius = 260 }: SpotlightProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const onMove = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      parent.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
      parent.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
    };
    parent.addEventListener("pointermove", onMove);
    return () => parent.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <span
      ref={ref}
      aria-hidden
      className="ih-spotlight"
      style={{ "--spot-color": color, "--spot-radius": `${radius}px` } as CSSProperties}
    />
  );
}

interface SpotlightCardProps extends SpotlightProps {
  children?: ReactNode;
  className?: string;
}

/** Self-contained spotlight card (a `div` wrapper) for plain containers. */
export function SpotlightCard({ children, className = "", color, radius }: SpotlightCardProps) {
  return (
    <div className={`group relative ${className}`}>
      <SpotlightOverlay color={color} radius={radius} />
      {children}
    </div>
  );
}

export default SpotlightCard;
