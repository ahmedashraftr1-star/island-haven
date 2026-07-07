import { useEffect, useRef, useState } from "react";
import { VIEWPORT } from "@/lib/motion";

/**
 * useReveal — the imperative twin of `<Reveal>`. Returns a `ref` to attach and a
 * `shown` flag that flips true ONCE the element scrolls into view, for things
 * that aren't framer-motion components: triggering count-ups, CSS-driven
 * reveals, or coordinating a grouped stagger.
 *
 * SAFETY (matches Reveal):
 *  - prefers-reduced-motion → `shown` is true immediately (no gating).
 *  - a failsafe timer flips `shown` true even if the observer never fires
 *    (already-in-view on mount, tall viewports), so nothing stalls hidden.
 *  - fires once, then disconnects.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  opts: { amount?: number; margin?: string } = {},
) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            fired = true;
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: opts.amount ?? VIEWPORT.amount, rootMargin: opts.margin ?? VIEWPORT.margin },
    );
    io.observe(el);

    // Never stall hidden if the observer misses.
    const t = window.setTimeout(() => {
      if (!fired) setShown(true);
    }, 1400);

    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [opts.amount, opts.margin]);

  return { ref, shown } as const;
}
