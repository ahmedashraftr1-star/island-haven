import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

/**
 * NarrativeThread — ONE restrained signature: a hairline-thin gold thread that
 * draws itself down the page as you scroll, stitching the five narrative acts
 * into a single spine. It sits centered-behind the (centered) ActMarker chapter
 * breaks, so it reads as the seam connecting the chapters without ever crossing
 * card content.
 *
 * WHISPER-QUIET by design: a single 1px vertical line at very low gold opacity,
 * with a slightly brighter gold "head" that travels to the current draw point.
 * The drawn length tracks page-scroll progress (0→1) via a GPU-only `scaleY`
 * transform; the head rides the same progress via a `y` translate. No layout,
 * no paint churn.
 *
 * Purely decorative (no data): aria-hidden + pointer-events-none. Hidden below
 * `lg` so it never competes with the mobile layout or risks overflow at 390px.
 *
 * Reduced-motion (double-gated via useReducedMotion + the global CSS rule):
 * renders a faint STATIC full-length hairline — no scroll-driven animation,
 * no travelling head.
 */
export function NarrativeThread() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Progress of THIS element through the viewport: 0 when its top aligns with
  // the viewport top, 1 when its bottom does. Tracks the whole narrative column
  // so the thread fills across all five acts as you scroll.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Buttery follow — matches the site's spring register (ScrollProgress).
  const drawn = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  // The head rides the current draw point: `top` as a percentage of the
  // thread's FULL height (0%→100%), so it actually travels the whole column
  // (the previous `y`-percentage sat on a zero-height wrapper → never moved).
  const headTop = useTransform(drawn, [0, 1], ["0%", "100%"]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
    >
      {/* The thread lives centered on the column, behind the centered
          ActMarkers. Constrained to a 1px width and centered so it can never
          cause horizontal overflow. A gentle top/bottom mask lets the ends
          dissolve into the canvas rather than reading as hard stubs. */}
      <div
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, #000 4%, #000 96%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0, #000 4%, #000 96%, transparent 100%)",
        }}
      >
        {/* Faint gold rail — the un-drawn track (barely there). */}
        <div
          className="absolute inset-0 w-px"
          style={{ backgroundColor: "hsl(var(--gold) / 0.10)" }}
        />

        {reduce ? (
          // Reduced-motion: a single faint static hairline, no animation.
          <div
            className="absolute inset-0 w-px"
            style={{ backgroundColor: "hsl(var(--gold) / 0.22)" }}
          />
        ) : (
          <>
            {/* The drawn thread — fills top→bottom with scroll. GPU scaleY. */}
            <motion.div
              className="absolute inset-0 w-px origin-top"
              style={{
                scaleY: drawn,
                backgroundImage:
                  "linear-gradient(to bottom, hsl(var(--gold) / 0.30), hsl(var(--sand-bright) / 0.38))",
              }}
            />
            {/* The travelling "head" — a slightly brighter gold glow riding the
                current draw point. `top` is a % of the full thread height so it
                travels the whole column; the -50/-50 translate keeps the dot
                perfectly round + centred on the point. */}
            <motion.span
              className="absolute left-1/2 block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                top: headTop,
                backgroundColor: "hsl(var(--sand-bright) / 0.9)",
                boxShadow: "0 0 10px 1px hsl(var(--gold) / 0.5)",
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
