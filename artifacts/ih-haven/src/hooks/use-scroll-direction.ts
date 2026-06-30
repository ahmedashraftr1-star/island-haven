import { useEffect, useRef, useState } from "react";

export type ScrollDirection = "up" | "down" | "idle";

/**
 * Reports the current vertical scroll direction. Stays "idle" near the top of
 * the page (< 80px) so a fixed header always shows there. rAF-throttled and
 * ignores sub-`threshold` jitter so the header doesn't flicker.
 */
export function useScrollDirection(threshold = 8): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>("idle");
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const diff = y - lastY.current;
        if (Math.abs(diff) < threshold) {
          ticking.current = false;
          return;
        }
        if (y < 80) setDirection("idle");
        else setDirection(diff > 0 ? "down" : "up");
        lastY.current = y;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return direction;
}
