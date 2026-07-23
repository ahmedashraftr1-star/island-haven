import { useRef, type ReactNode, type ElementType } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { photoSrcSet, photoSrcSetAvif } from "@/hooks/use-content";

/**
 * CinematicMedia — the homepage's shared "hero-power" backdrop, factored out of
 * Hero + CinematicBand so every section can hit the same standard: a full-bleed
 * photograph as the anchor, spring-smoothed parallax (Ken-Burns scale + drift),
 * and a calibrated dark scrim that keeps type razor-crisp while the photo breathes.
 *
 * Content is passed as children and rendered above the media at z-10. By default
 * the content holds still (correct for sections with flowing lists/grids); set
 * `contentParallax` for the CinematicBand-style counter-drift on centered blocks.
 *
 * Reduced motion → everything holds perfectly still.
 */

type Scrim = "light" | "medium" | "heavy";

// Vertical wash: dark at the top (mutes the Eid-decorated ceilings in most
// frames) + dark at the bottom (behind stats/CTAs), sharp in the middle.
const VERTICAL: Record<Scrim, string> = {
  light:
    "linear-gradient(180deg, rgba(6,6,10,0.36) 0%, rgba(6,6,10,0.05) 38%, rgba(6,6,10,0.28) 74%, rgba(6,6,10,0.80) 100%)",
  medium:
    "linear-gradient(180deg, rgba(6,6,10,0.5) 0%, rgba(6,6,10,0.13) 38%, rgba(6,6,10,0.40) 72%, rgba(6,6,10,0.88) 100%)",
  heavy:
    "linear-gradient(180deg, rgba(6,6,10,0.66) 0%, rgba(6,6,10,0.28) 32%, rgba(6,6,10,0.52) 68%, rgba(6,6,10,0.92) 100%)",
};

// Directional scrim toward the logical-start edge (right in RTL) where headlines
// sit, so text stays crisp while the far side of the frame stays open.
const SIDE =
  "linear-gradient(270deg, rgba(6,6,10,0.58) 0%, rgba(6,6,10,0.22) 50%, transparent 84%)";

type CinematicMediaProps = {
  /** already-resolved image url (pass through imageUrl() for stored paths) */
  src: string;
  alt?: string;
  /** vertical scrim strength */
  scrim?: Scrim;
  /** directional scrim behind start-aligned text (turn off for full-width grids) */
  sideScrim?: boolean;
  /** extra layer between scrim and content (aura, color field, grain) */
  overlay?: ReactNode;
  /** counter-drift the content like CinematicBand (only for centered blocks) */
  contentParallax?: boolean;
  /** load the image eagerly (above-the-fold sections only) */
  eager?: boolean;
  className?: string;
  imgClassName?: string;
  contentClassName?: string;
  as?: ElementType;
  children: ReactNode;
  id?: string;
  "aria-label"?: string;
  "data-testid"?: string;
  /** Marks the section as a BRIGHT backdrop the homepage rail floats over, so the
   *  rail can raise an adaptive dark panel for contrast (see HomeTOC). Spread onto
   *  the root via ...rest. */
  "data-rail-theme"?: "light";
};

export function CinematicMedia({
  src,
  alt = "",
  scrim = "medium",
  sideScrim = true,
  overlay,
  contentParallax = false,
  eager = false,
  className = "",
  imgClassName = "",
  contentClassName = "",
  as,
  children,
  ...rest
}: CinematicMediaProps) {
  const Tag = (as ?? "section") as ElementType;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4, restDelta: 0.001 });
  const photoY = useTransform(smooth, [0, 1], reduce ? ["0%", "0%"] : ["-9%", "9%"]);
  const photoScale = useTransform(smooth, [0, 1], [reduce ? 1 : 1.12, 1]);
  const textY = useTransform(smooth, [0, 1], reduce ? ["0%", "0%"] : ["7%", "-7%"]);

  return (
    <Tag ref={ref} className={`relative w-full overflow-hidden bg-[#060608] text-white ${className}`} {...rest}>
      <motion.div style={{ y: photoY, scale: photoScale }} aria-hidden className="absolute inset-0 will-change-transform">
        {/* <picture>: AVIF first (≈35% lighter), then the <img>'s WebP srcset,
            then the plain src. Every consumer paints the photo full-bleed, so the
            browser picks the 640/960/1350 variant by viewport × DPR instead of
            always pulling the 1350×1800 original. Non-bundled images (CMS uploads,
            remote URLs) get no srcSet and fall back to the plain `src`. */}
        <picture>
          {photoSrcSetAvif(src) && (
            <source type="image/avif" srcSet={photoSrcSetAvif(src)} sizes="100vw" />
          )}
          <img
            src={src}
            srcSet={photoSrcSet(src)}
            sizes="100vw"
            alt={alt}
            // Intrinsic ratio of the source frames (1350×1800) so the browser
            // reserves the aspect box up front — no layout shift as it decodes.
            width={1350}
            height={1800}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            // Above-the-fold consumers (eager) also get high fetch priority so the
            // backdrop isn't starved behind lazy assets.
            {...(eager ? { fetchPriority: "high" as const } : {})}
            className={`absolute inset-0 w-full h-full object-cover saturate-[1.22] contrast-[1.1] brightness-[1.06] ${imgClassName}`}
          />
        </picture>
      </motion.div>

      <div aria-hidden className="absolute inset-0" style={{ background: VERTICAL[scrim] }} />
      {sideScrim && <div aria-hidden className="absolute inset-y-0 end-0 w-full lg:w-[68%]" style={{ background: SIDE }} />}
      {overlay}

      <motion.div
        style={contentParallax ? { y: textY } : undefined}
        className={`relative z-10 ${contentParallax ? "will-change-transform" : ""} ${contentClassName}`}
      >
        {children}
      </motion.div>
    </Tag>
  );
}
