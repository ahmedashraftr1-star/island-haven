import { useEffect, useRef } from "react";

/**
 * ParticleField — a "constellation of Gaza's talent."
 *
 * An ambient, premium canvas layer for the hero: ~70 glowing points that drift
 * slowly, wrap at the edges, and knit themselves into a faint living network
 * (lines between near neighbours, opacity ∝ closeness). The cursor gently
 * pushes nearby points away and brightens the strands reaching toward it —
 * subtle, never gimmicky. Warm-white with a few terracotta and gold accents,
 * low overall alpha, soft glow. It sits above the photo/scrim and below the
 * headline; it must enhance, never compete.
 *
 * Performance & safety:
 *  - Single requestAnimationFrame loop; cancelled on unmount.
 *  - ResizeObserver for canvas sizing; devicePixelRatio honoured (capped at 2).
 *  - IntersectionObserver + document `visibilitychange` PAUSE the loop when the
 *    hero is offscreen or the tab is hidden — zero work when unseen.
 *  - Pointer is sampled by an event listener but only *consumed* inside the rAF
 *    loop (never per-event work).
 *  - prefers-reduced-motion → ONE static frame, no loop, no listeners.
 *  - aria-hidden, pointer-events-none; pure local math — no eval / innerHTML /
 *    network / secrets. Every listener, observer and frame is cleaned up.
 */

type Rgb = readonly [number, number, number];

// Warm-white dominates; terracotta (#C74326) and gold (#BFA06A) are rare accents.
const WARM_WHITE: Rgb = [245, 240, 233];
const TERRACOTTA: Rgb = [199, 67, 38];
const GOLD: Rgb = [191, 160, 106];

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Base radius in CSS pixels. */
  r: number;
  /** Per-point base alpha (points twinkle around this). */
  a: number;
  /** Phase offset so twinkle is desynchronised. */
  phase: number;
  color: Rgb;
}

interface Pointer {
  /** In CSS pixels relative to the canvas; -1 means "no pointer". */
  x: number;
  y: number;
  active: boolean;
}

const rand = (min: number, max: number): number => min + Math.random() * (max - min);

/** Pick a point count scaled to viewport + DPR so small / weak devices do less. */
function targetCount(cssWidth: number, dpr: number): number {
  let n = 70;
  if (cssWidth < 640) n = 34;
  else if (cssWidth < 1024) n = 52;
  if (dpr < 1.5) n = Math.round(n * 0.82); // low-DPR screens are often weaker
  return n;
}

/** Weighted colour pick: mostly warm white, a few terracotta, fewer gold. */
function pickColor(): Rgb {
  const t = Math.random();
  if (t > 0.9) return GOLD; // ~10%
  if (t > 0.74) return TERRACOTTA; // ~16%
  return WARM_WHITE; // ~74%
}

function makePoints(count: number, w: number, h: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < count; i++) {
    const color = pickColor();
    const accent = color !== WARM_WHITE;
    pts.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: rand(-0.14, 0.14),
      vy: rand(-0.14, 0.14),
      r: accent ? rand(1.4, 2.4) : rand(0.9, 2.0),
      a: accent ? rand(0.4, 0.62) : rand(0.28, 0.5),
      phase: Math.random() * Math.PI * 2,
      color,
    });
  }
  return pts;
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Overall multiplier keeping the whole layer whisper-quiet over the photo.
    const GLOBAL_ALPHA = 0.62;
    const LINK_DIST = 132; // px within which two points draw a strand
    const POINTER_RADIUS = 150; // px influence radius of the cursor
    const POINTER_PUSH = 26; // max px of gentle displacement near the cursor

    let width = 0; // CSS px
    let height = 0; // CSS px
    let dpr = 1;
    let points: Point[] = [];

    const pointer: Pointer = { x: -1, y: -1, active: false };

    /** (Re)size backing store to CSS size × dpr and rebuild the point field. */
    const resize = (): void => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      // Draw in CSS-pixel space; the transform maps to the hi-dpi backing store.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = targetCount(width, dpr);
      // Preserve existing points on grow/shrink so a resize doesn't "flash".
      if (points.length === 0) {
        points = makePoints(count, width, height);
      } else if (count > points.length) {
        points = points.concat(makePoints(count - points.length, width, height));
      } else if (count < points.length) {
        points = points.slice(0, count);
      }
    };

    /** One frame of physics + paint. `t` is ms for the gentle twinkle. */
    const draw = (t: number): void => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter"; // additive → soft luminous glow

      // ── advance + pointer repulsion ──────────────────────────────────────
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;

        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          const r2 = POINTER_RADIUS * POINTER_RADIUS;
          if (d2 < r2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const force = (1 - d / POINTER_RADIUS) * POINTER_PUSH;
            p.x += (dx / d) * force;
            p.y += (dy / d) * force;
          }
        }

        // Wrap softly at the edges (toroidal field, no clumping at borders).
        if (p.x < -4) p.x = width + 4;
        else if (p.x > width + 4) p.x = -4;
        if (p.y < -4) p.y = height + 4;
        else if (p.y > height + 4) p.y = -4;
      }

      // ── connecting strands (the "network of talent") ─────────────────────
      // O(n²) but n ≤ 70 → ≤ ~2.4k cheap checks per frame.
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK_DIST * LINK_DIST) continue;
          const d = Math.sqrt(d2);
          const closeness = 1 - d / LINK_DIST; // 0..1
          const alpha = closeness * 0.14 * GLOBAL_ALPHA;
          if (alpha < 0.004) continue;
          // Blend the two endpoints' colours for a warm strand.
          const cr = (a.color[0] + b.color[0]) * 0.5;
          const cg = (a.color[1] + b.color[1]) * 0.5;
          const cb = (a.color[2] + b.color[2]) * 0.5;
          ctx.strokeStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // ── strands reaching toward the cursor brighten (elegant, not showy) ──
      if (pointer.active) {
        for (const p of points) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          const r2 = POINTER_RADIUS * POINTER_RADIUS;
          if (d2 > r2) continue;
          const d = Math.sqrt(d2);
          const closeness = 1 - d / POINTER_RADIUS;
          const alpha = closeness * closeness * 0.22 * GLOBAL_ALPHA;
          if (alpha < 0.004) continue;
          ctx.strokeStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }

      // ── the points themselves (soft glowing dots) ────────────────────────
      for (const p of points) {
        // Gentle twinkle (skip trig cost entirely on the static frame).
        const twinkle = reduce ? 1 : 0.82 + 0.18 * Math.sin(t * 0.001 + p.phase);
        const alpha = p.a * twinkle * GLOBAL_ALPHA;
        const [r, g, bl] = p.color;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${g},${bl},${alpha.toFixed(3)})`;
        ctx.shadowColor = `rgba(${r},${g},${bl},${(alpha * 0.9).toFixed(3)})`;
        ctx.shadowBlur = p.r * 4;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Reset shadow so nothing else inherits it.
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
    };

    // ── reduced motion: one static frame, no loop, no listeners ────────────
    if (reduce) {
      resize();
      draw(0);
      return () => {
        /* nothing allocated to clean up */
      };
    }

    // ── animated path ──────────────────────────────────────────────────────
    let rafId = 0;
    let running = false;
    let visibleInView = true; // IntersectionObserver
    let pageVisible = !document.hidden; // visibilitychange

    const frame = (t: number): void => {
      draw(t);
      rafId = window.requestAnimationFrame(frame);
    };

    const start = (): void => {
      if (running) return;
      running = true;
      rafId = window.requestAnimationFrame(frame);
    };
    const stop = (): void => {
      if (!running) return;
      running = false;
      window.cancelAnimationFrame(rafId);
    };
    /** Run only when both on-screen and the tab is visible. */
    const sync = (): void => {
      if (visibleInView && pageVisible) start();
      else stop();
    };

    resize();

    const ro = new ResizeObserver(() => {
      resize();
      // Repaint immediately so a resize while paused isn't left blank.
      if (!running) draw(performance.now());
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visibleInView = e.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = (): void => {
      pageVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Pointer is only *recorded* here — consumed inside the rAF loop.
    const onPointerMove = (e: PointerEvent): void => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = (): void => {
      pointer.active = false;
    };
    // Listen on the enclosing <section> (the hero) so we catch moves even though
    // the canvas and its wrapper are pointer-events-none. Fall back to window.
    const host: HTMLElement | Window = canvas.closest("section") ?? window;
    host.addEventListener("pointermove", onPointerMove as EventListener, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave as EventListener, { passive: true });

    sync();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointermove", onPointerMove as EventListener);
      host.removeEventListener("pointerleave", onPointerLeave as EventListener);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 block h-full w-full"
    />
  );
}

export default ParticleField;
