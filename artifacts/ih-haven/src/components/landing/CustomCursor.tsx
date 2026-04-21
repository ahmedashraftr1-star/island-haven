import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { damping: 30, stiffness: 500, mass: 0.4 });
  const sy = useSpring(y, { damping: 30, stiffness: 500, mass: 0.4 });
  const ringX = useSpring(x, { damping: 22, stiffness: 180, mass: 0.6 });
  const ringY = useSpring(y, { damping: 22, stiffness: 180, mass: 0.6 });
  const [hover, setHover] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const can =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!can) return;
    setEnabled(true);
    document.documentElement.classList.add("cursor-none-root");

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const isInteractive =
        t.closest(
          "a,button,[role=button],input,textarea,select,label,[data-magnetic],[data-cursor=hover]"
        ) !== null;
      setHover(isInteractive);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      document.documentElement.classList.remove("cursor-none-root");
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="fixed top-0 left-0 z-[120] pointer-events-none rounded-full bg-background mix-blend-difference"
        style={{
          x: sx,
          y: sy,
          translateX: "-50%",
          translateY: "-50%",
          width: hover ? 14 : 8,
          height: hover ? 14 : 8,
          transition: "width .25s ease, height .25s ease",
        }}
      />
      <motion.div
        aria-hidden
        className="fixed top-0 left-0 z-[120] pointer-events-none rounded-full border mix-blend-difference"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          width: hover ? 64 : 36,
          height: hover ? 64 : 36,
          borderColor: "rgba(255,255,255,0.85)",
          borderWidth: 1,
          transition: "width .35s ease, height .35s ease",
        }}
      />
    </>
  );
}
