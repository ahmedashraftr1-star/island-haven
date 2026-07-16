import { useEffect, useRef, type CSSProperties } from "react";
import "./SpecularButton.css";

// A brand-built, CSS-only equivalent of React Bits' SpecularButton (the source uses
// ogl/WebGL — too heavy for the low-end devices this site targets). A soft specular
// glint tracks the pointer across a button, written via CSS vars (no React re-render,
// no dependency). Drop <SpecularSheen/> as a direct child of any button/link and it
// wires itself to its parent; `screen` blend keeps the label fully legible.

interface SpecularSheenProps {
  /** Peak glint strength (0–1). Solid buttons need a touch more than dark glass. */
  intensity?: number;
  /** Glint radius in px. */
  radius?: number;
}

export function SpecularSheen({ intensity = 0.5, radius = 150 }: SpecularSheenProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const onEnter = () => parent.style.setProperty("--sheen-on", "1");
    const onLeave = () => parent.style.setProperty("--sheen-on", "0");
    const onMove = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      parent.style.setProperty("--sheen-x", `${((e.clientX - r.left) / r.width) * 100}%`);
      parent.style.setProperty("--sheen-y", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    parent.addEventListener("pointerenter", onEnter);
    parent.addEventListener("pointerleave", onLeave);
    // Reduced motion: the glint still appears on hover but stays put (centred) — the
    // MOTION (tracking the pointer) is what we suppress.
    if (!prefersReduced) parent.addEventListener("pointermove", onMove);
    return () => {
      parent.removeEventListener("pointerenter", onEnter);
      parent.removeEventListener("pointerleave", onLeave);
      parent.removeEventListener("pointermove", onMove);
    };
  }, []);
  return (
    <span
      ref={ref}
      aria-hidden
      className="ih-sheen"
      style={{ "--sheen-intensity": intensity, "--sheen-radius": `${radius}px` } as CSSProperties}
    />
  );
}

export default SpecularSheen;
