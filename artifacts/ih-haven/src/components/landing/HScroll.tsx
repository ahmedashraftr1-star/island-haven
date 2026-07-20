import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

/**
 * HScroll — an accessible horizontal carousel (a "film strip"). Keeps 100% of the
 * items but lays them in one low, fixed-height row that scrolls sideways instead
 * of stacking tall. Native `overflow-x` gives touch/drag on mobile; the region is
 * keyboard-scrollable (←/→) and labelled for screen readers; prev/next buttons are
 * a desktop affordance. Because the row is clipped to its own container, the PAGE
 * never scrolls horizontally. Direction-aware: in RTL the strip advances right→left.
 */
export function HScroll({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const amount = () => Math.max((ref.current?.clientWidth ?? 600) * 0.8, 300);

  // Physical scroll (keyboard ←/→ match the arrow's physical direction).
  const scrollPhysical = (px: number) => ref.current?.scrollBy({ left: px, behavior: "smooth" });
  // Logical advance (prev/next buttons): "next" always moves toward later items,
  // which is leftward in RTL, so flip the sign there.
  const advance = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * amount(), behavior: "smooth" });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollPhysical(amount());
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollPhysical(-amount());
    }
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={`hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden scroll-smooth pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-4 focus-visible:ring-offset-[#060608] ${className}`}
      >
        {children}
      </div>
      {/* Prev / next — desktop affordance; touch users swipe. Logical (RTL-aware). */}
      <div className="mt-5 hidden items-center gap-2.5 sm:flex">
        <button
          type="button"
          onClick={() => advance(-1)}
          aria-label="العناصر السابقة"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => advance(1)}
          aria-label="العناصر التالية"
          className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <ArrowLeft className="h-4 w-4 rotate-180 rtl:rotate-0" aria-hidden />
        </button>
      </div>
    </div>
  );
}
