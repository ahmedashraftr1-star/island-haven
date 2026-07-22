import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import "./LineSidebar.css";

// Adapted from React Bits' LineSidebar (JS+CSS) to TypeScript for this project.
// Only additions: typed props + an optional CONTROLLED `activeIndex` so a parent
// (e.g. a scroll-spy) can drive the highlight. The proximity rAF/CSS math is
// unchanged from the source.

type Falloff = "linear" | "smooth" | "sharp";

const FALLOFF_CURVES: Record<Falloff, (p: number) => number> = {
  linear: (p) => p,
  smooth: (p) => p * p * (3 - 2 * p),
  sharp: (p) => p * p * p,
};

export interface LineSidebarProps {
  items?: string[];
  accentColor?: string;
  textColor?: string;
  markerColor?: string;
  showIndex?: boolean;
  showMarker?: boolean;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: Falloff;
  markerLength?: number;
  markerGap?: number;
  tickScale?: number;
  scaleTick?: boolean;
  itemGap?: number;
  fontSize?: number;
  smoothing?: number;
  defaultActive?: number | null;
  /** Controlled active index — when provided, overrides the internal click state. */
  activeIndex?: number | null;
  /** Formats the leading numeral. Default = 1-based, zero-padded, Latin ("01").
   *  Pass a locale-aware formatter (e.g. Arabic-Indic "٠١") for bilingual rails. */
  formatIndex?: (index: number) => string;
  /** Optional in-page anchor per item (e.g. "#act-1"). When given, each chapter
   *  renders as a real <a href> (native link semantics + keyboard) instead of a
   *  role=button; the click is still intercepted for the smooth-scroll handler. */
  hrefs?: (string | undefined)[];
  onItemClick?: (index: number, label: string) => void;
  /** Accessible name for the <nav> landmark (the rail is real in-page navigation). */
  ariaLabel?: string;
  className?: string;
}

const LineSidebar = ({
  items = [],
  accentColor = "#A855F7",
  textColor = "#c4c4c4",
  markerColor = "#6c6c6c",
  showIndex = true,
  showMarker = true,
  proximityRadius = 100,
  maxShift = 30,
  falloff = "smooth",
  markerLength = 60,
  markerGap = 0,
  tickScale = 0.5,
  scaleTick = true,
  itemGap = 20,
  fontSize = 1.1,
  smoothing = 100,
  defaultActive = null,
  activeIndex: controlledActive,
  formatIndex = (i) => String(i + 1).padStart(2, "0"),
  hrefs,
  onItemClick,
  ariaLabel,
  className = "",
}: LineSidebarProps) => {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const targetsRef = useRef<number[]>([]);
  const currentRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const activeRef = useRef<number | null>(defaultActive);
  const smoothingRef = useRef(smoothing);
  const reduceRef = useRef(false);
  const [internalActive, setInternalActive] = useState<number | null>(defaultActive);

  const activeIndex = controlledActive !== undefined ? controlledActive : internalActive;
  activeRef.current = activeIndex;
  smoothingRef.current = smoothing;

  const runFrame = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const tau = Math.max(smoothingRef.current, 1) / 1000;
    // Reduced motion: snap straight to each target (no proximity easing).
    const k = reduceRef.current ? 1 : 1 - Math.exp(-dt / tau);

    let moving = false;
    const els = itemRefs.current;
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (!el) continue;
      const target = Math.max(targetsRef.current[i] || 0, activeRef.current === i ? 1 : 0);
      const cur = currentRef.current[i] || 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.0015;
      const value = settled ? target : next;
      currentRef.current[i] = value;
      el.style.setProperty("--effect", value.toFixed(4));
      if (!settled) moving = true;
    }

    rafRef.current = moving ? requestAnimationFrame(runFrame) : null;
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) return;
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLUListElement>) => {
      const list = listRef.current;
      if (!list) return;
      const rect = list.getBoundingClientRect();
      const pointerY = e.clientY - rect.top;
      const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.linear;
      const els = itemRefs.current;
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (!el) continue;
        const center = el.offsetTop + el.offsetHeight / 2;
        const distance = Math.abs(pointerY - center);
        targetsRef.current[i] = ease(Math.max(0, 1 - distance / proximityRadius));
      }
      startLoop();
    },
    [falloff, proximityRadius, startLoop],
  );

  const handlePointerLeave = useCallback(() => {
    targetsRef.current = targetsRef.current.map(() => 0);
    startLoop();
  }, [startLoop]);

  const handleClick = useCallback(
    (index: number, label: string) => {
      if (controlledActive === undefined) setInternalActive(index);
      onItemClick?.(index, label);
    },
    [onItemClick, controlledActive],
  );

  // Each chapter renders as a real <a href> / <button>, so keyboard activation
  // (Enter, and Space on the button) is native — no bespoke key handler needed.

  // Honour prefers-reduced-motion — the rAF lerp above then snaps instead of easing.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceRef.current = mq.matches;
    const onChange = () => {
      reduceRef.current = mq.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    startLoop();
  }, [activeIndex, startLoop]);

  useEffect(() => {
    // Nudge the active item's stored value to 1 up front so it never flashes
    // to 0 on the frame the new labels commit, then let the loop settle the rest.
    if (activeRef.current != null) currentRef.current[activeRef.current] = 1;
    startLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return (
    <nav
      aria-label={ariaLabel}
      className={`line-sidebar${showMarker ? " line-sidebar--markers" : ""}${
        scaleTick ? " line-sidebar--scale-tick" : ""
      }${className ? ` ${className}` : ""}`}
      style={
        {
          "--accent-color": accentColor,
          "--text-color": textColor,
          "--marker-color": markerColor,
          "--marker-length": `${markerLength}px`,
          "--marker-gap": `${markerGap}px`,
          "--tick-scale": tickScale,
          "--max-shift": `${maxShift}px`,
          "--item-gap": `${itemGap}px`,
          "--font-size": `${fontSize}rem`,
          "--smoothing": `${smoothing}ms`,
        } as CSSProperties
      }
    >
      <ul
        ref={listRef}
        className="line-sidebar__list"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {items.map((label, index) => {
          const href = hrefs?.[index];
          const isActive = activeIndex === index;
          return (
            <li
              // Key by POSITION, not label — the acts are a fixed, ordered set and
              // only their text changes (e.g. a live language switch). Keying by
              // label would remount every <li> on a switch, dropping the inline
              // --effect (active item loses its accent, proximity stalls until a
              // pointer move / reload). Keying by index reuses the same elements,
              // so --effect and itemRefs survive the re-render.
              key={index}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="line-sidebar__item"
              aria-current={isActive ? "true" : undefined}
            >
              {showMarker && <span className="line-sidebar__marker" aria-hidden="true" />}
              <span className="line-sidebar__label" aria-hidden="true">
                {showIndex && (
                  <span className="line-sidebar__index">{formatIndex(index)}</span>
                )}
                <span className="line-sidebar__text">{label}</span>
              </span>
              {/* A real, keyboard-operable control stretched over the whole row: an
                  <a href="#section"> when an anchor is supplied (native link + focus),
                  else a <button>. Its aria-label carries the chapter name (the visual
                  text is aria-hidden to avoid a double read). The smooth-scroll is
                  intercepted so the scroll-spy lock still governs the jump. */}
              {href ? (
                <a
                  href={href}
                  className="line-sidebar__hit"
                  aria-label={label}
                  aria-current={isActive ? "true" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleClick(index, label);
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="line-sidebar__hit"
                  aria-label={label}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => handleClick(index, label)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default LineSidebar;
