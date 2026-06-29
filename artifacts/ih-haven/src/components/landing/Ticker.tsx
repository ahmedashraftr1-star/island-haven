import { type ReactNode } from "react";

/**
 * Ticker — a reusable, edge-masked marquee that glides a row of items across the
 * screen (the "network / roster in motion" register). Generalises the inline
 * marquee used in Partners so Experts, partners, and any future strip share one
 * implementation. Driven by the existing `ih-marquee` keyframe (GPU transform).
 *
 * RTL-safe, pause-on-hover, and reduced-motion → static wrap (no animation).
 * The track is duplicated once so the -50% translate loops seamlessly.
 */
export function Ticker({
  items,
  speedSeconds = 44,
  gapClass = "gap-3",
  className = "",
  ariaLabel,
}: {
  items: ReactNode[];
  /** Full loop duration; larger = slower/calmer. */
  speedSeconds?: number;
  gapClass?: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)] ${className}`}
      role={ariaLabel ? "marquee" : undefined}
      aria-label={ariaLabel}
    >
      <div
        className={`flex w-max items-center ${gapClass} hover:[animation-play-state:paused] motion-reduce:![animation:none] motion-reduce:flex-wrap motion-reduce:justify-center`}
        style={{ animation: `ih-marquee ${speedSeconds}s linear infinite` }}
      >
        {[...items, ...items].map((node, i) => (
          <div key={i} className="shrink-0">
            {node}
          </div>
        ))}
      </div>
    </div>
  );
}
