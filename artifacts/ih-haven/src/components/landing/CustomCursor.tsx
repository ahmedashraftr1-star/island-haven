import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

/**
 * CustomCursor — a small brand-crimson dot that trails the pointer and swells
 * into a ring over interactive elements. It AUGMENTS the native cursor (never
 * hides it, so usability/accessibility are untouched). Desktop + fine-pointer
 * only; renders nothing on touch devices or when reduced-motion is requested.
 */
export function CustomCursor() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false); // over an interactive element
  const [hidden, setHidden] = useState(true); // pointer outside the window
  // Track hidden in a ref too, so the mousemove handler can gate its setState
  // without `hidden` being an effect dependency (which re-subscribed the global
  // listeners on every window enter/leave).
  const hiddenRef = useRef(true);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 520, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 520, damping: 40, mass: 0.4 });

  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);

    const INTERACTIVE = 'a,button,[role="button"],input,textarea,select,label,summary,[data-cursor="grow"]';
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (hiddenRef.current) {
        hiddenRef.current = false;
        setHidden(false);
      }
      const t = e.target as Element | null;
      setActive(!!(t && t.closest && t.closest(INTERACTIVE)));
    };
    const leave = () => {
      hiddenRef.current = true;
      setHidden(true);
    };

    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, [reduce, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden lg:block mix-blend-screen"
      style={{ x: sx, y: sy }}
    >
      <motion.span
        className="block -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ borderStyle: "solid", borderColor: "hsl(var(--primary) / 0.85)" }}
        animate={{
          width: active ? 44 : 9,
          height: active ? 44 : 9,
          backgroundColor: active ? "hsl(var(--primary) / 0.12)" : "hsl(var(--primary))",
          borderWidth: active ? 1.5 : 0,
          opacity: hidden ? 0 : 1,
        }}
        transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.5 }}
      />
    </motion.div>
  );
}
