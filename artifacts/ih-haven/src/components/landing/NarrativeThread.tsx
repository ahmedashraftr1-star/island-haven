import { useEffect, useRef, useState } from "react";
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

  // The head rides the current draw point. This USED to animate `top` from 0% to
  // 100% — and `top` is a layout property, so every scroll frame relaid out and
  // repainted a wrapper spanning the entire 15,000px narrative column. The file's
  // own comment above promised "no layout, no paint churn"; the head was quietly
  // breaking that promise, and it was the single biggest cost of scrolling the
  // homepage (Commit dominated the trace; /ventures, which has no thread, scrolls
  // for free).
  //
  // Same motion, on the compositor instead: measure the column once and translate
  // the head in PIXELS via `y`, which is a transform and never touches layout.
  // (A percentage `y` would resolve against the head's own 8px height, not the
  // column — which is why the original reached for `top` in the first place.)
  const [columnH, setColumnH] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setColumnH(e.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const headY = useTransform(drawn, [0, 1], [0, columnH]);

  return (
    // This wrapper used to be `inset-0` — the full 1440px width of the column —
    // even though everything inside it is a 1px hairline. Because its children
    // animate, the compositor promoted it, and it handed Chrome a 1440 × 15,017px
    // layer (86MB) to commit on every scroll frame. That one wrapper was ~60% of
    // the homepage's entire scroll cost. It only ever needed to be as wide as the
    // thread it holds: 1px, centred. Same pixels on screen, 1440× less layer.
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 z-20 hidden lg:block"
    >
      {/* The thread lives centered on the column, behind the centered
          ActMarkers. A gentle top/bottom mask lets the ends dissolve into the
          canvas rather than reading as hard stubs. */}
      <div
        className="absolute inset-0"
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
          style={{ backgroundColor: "hsl(var(--gold) / 0.14)" }}
        />

        {reduce ? (
          // Reduced-motion: a single faint static hairline, no animation.
          <div
            className="absolute inset-0 w-px"
            style={{ backgroundColor: "hsl(var(--gold) / 0.30)" }}
          />
        ) : (
          <>
            {/* The drawn thread — fills top→bottom with scroll. GPU scaleY.
                A touch more presence than a pure whisper so it genuinely reads
                as the spine, still calm gold. */}
            <motion.div
              className="absolute inset-0 w-px origin-top"
              style={{
                scaleY: drawn,
                backgroundImage:
                  "linear-gradient(to bottom, hsl(var(--gold) / 0.48), hsl(var(--sand-bright) / 0.62))",
              }}
            />
            {/* The travelling "head" — a slightly brighter gold glow riding the
                current draw point, moved by a GPU transform (`y`, in px) rather
                than `top`. It is pinned at the column's origin and translated
                down; the centering offsets are folded into the same transform so
                Tailwind's `-translate-*` utilities can't overwrite `y`. */}
            <motion.span
              className="absolute left-1/2 top-0 block h-2 w-2 rounded-full"
              style={{
                // `y` is the ONLY transform here — the dot is centred on its point
                // with negative margins instead of translate offsets, so nothing
                // competes with the animated value.
                y: headY,
                marginLeft: -4,
                marginTop: -4,
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
