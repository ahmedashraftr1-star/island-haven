import { useEffect, useRef, useState } from "react";

/**
 * Count from 0 → `target` with an ease-out cubic, once `active` flips true.
 * Honours prefers-reduced-motion (snaps straight to the final value).
 * rAF-driven; cleans up its frame on unmount / dep change.
 */
export function useCountUp(target: number, duration = 1200, active = false): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number | undefined>(undefined);
  const start = useRef<number | undefined>(undefined);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }

    if (!active) {
      // Safety net: if the activation trigger never arrives (IntersectionObserver
      // miss, off-screen/tall-viewport mount), still show the real figure after a
      // short grace period instead of stalling at 0. The count-up is the
      // enhancement; the number is the point.
      const fallback = window.setTimeout(() => setValue(target), 1400);
      return () => clearTimeout(fallback);
    }

    start.current = undefined;
    const tick = (ts: number) => {
      if (start.current === undefined) start.current = ts;
      const progress = Math.min((ts - start.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [active, target, duration]);

  return value;
}
