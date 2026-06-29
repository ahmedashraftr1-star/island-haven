import { cn } from "@/lib/utils";

/**
 * BrandLogos — a tiny, self-contained registry of the network's brand marks.
 *
 * The four globally-recognised platforms (Google, Replit, Payoneer, Freelancer)
 * render as real single-path vector marks — the exact official glyphs, inlined
 * from the CC0 simple-icons set so we self-host with zero runtime dependency and
 * full control of color. They're drawn with `fill="currentColor"`, so the caller
 * tints them with a `text-*` class (calm monochrome in the marquee, brand
 * cerulean inside cards).
 *
 * AWS (no free, accurate vector exists — Amazon had its mark removed from the
 * open icon sets) and the local organisations (NasToNas, Gaza Sky Geeks, Mercy
 * Corps) render as honest wordmark / monogram tiles instead of an approximated
 * logo. No fake or distorted marks ship. Brand trademarks are shown only in a
 * "tools we use / unlock" context, monochrome and undistorted.
 */

// Exact official paths (viewBox 0 0 24 24), inlined from simple-icons (CC0).
const GOOGLE =
  "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z";
const REPLIT =
  "M2 1.5A1.5 1.5 0 0 1 3.5 0h7A1.5 1.5 0 0 1 12 1.5V8H3.5A1.5 1.5 0 0 1 2 6.5ZM12 8h8.5A1.5 1.5 0 0 1 22 9.5v5a1.5 1.5 0 0 1-1.5 1.5H12ZM2 17.5A1.5 1.5 0 0 1 3.5 16H12v6.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 2 22.5Z";
const PAYONEER =
  "M1.474 3.31c.234 1.802 1.035 5.642 1.398 7.263.095.459.201.853.298 1.013.501.865.907-.287.907-.287C5.644 6.616 3.17 3.597 2.38 2.787c-.139-.15-.384-.332-.608-.396-.32-.095-.374.086-.374.236.01.148.065.565.075.682zm21.835-1.463c.31.224 1.386 1.355 0 1.526-1.984.234-5.76.373-12.022 5.61C8.92 10.968 3.607 16.311.76 22.957a.181.181 0 01-.216.106c-.255-.074-.714-.352-.48-1.418.32-1.44 3.201-8.938 10.817-15.552 2.485-2.155 8.416-7.232 12.426-4.245z";
const FREELANCER =
  "M14.096 3.076l1.634 2.292L24 3.076M5.503 20.924l4.474-4.374-2.692-2.89m6.133-10.584L11.027 5.23l4.022.15M4.124 3.077l.857 1.76 4.734.294m-3.058 7.072l3.497-6.522L0 5.13m7.064 7.485l3.303 3.548 3.643-3.57 1.13-6.652-4.439-.228Z";

type Mark =
  | { kind: "svg"; path: string }
  | { kind: "word"; text: string; lower?: boolean };

// Keyed by the exact `name` used in Partners' data arrays.
const MARKS: Record<string, Mark> = {
  Replit: { kind: "svg", path: REPLIT },
  Payoneer: { kind: "svg", path: PAYONEER },
  Freelancer: { kind: "svg", path: FREELANCER },
  "Google for Startups": { kind: "svg", path: GOOGLE },
  "AWS Activate": { kind: "word", text: "aws", lower: true },
  NasToNas: { kind: "word", text: "N2N" },
  "Gaza Sky Geeks": { kind: "word", text: "GSG" },
  "Mercy Corps Ventures": { kind: "word", text: "MC" },
};

/**
 * BrandMark — the glyph only (svg or wordmark), tinted via `currentColor`.
 * `variant` keeps the two real call-sites (small marquee chip, larger card chip)
 * proportional without per-site sizing math. RTL-safe (marks are symmetric).
 */
export function BrandMark({
  name,
  variant = "lg",
}: {
  name: string;
  variant?: "sm" | "lg";
}) {
  const m = MARKS[name];

  if (m?.kind === "svg") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
        className={variant === "sm" ? "h-[18px] w-[18px]" : "h-6 w-6"}
      >
        <path d={m.path} />
      </svg>
    );
  }

  const text = m?.kind === "word" ? m.text : name.charAt(0);
  return (
    <span
      aria-hidden
      className={cn(
        "font-display font-black leading-none tracking-tight",
        m?.lower ? "lowercase" : "uppercase",
        variant === "sm" ? "text-[12px]" : "text-[15px]",
      )}
    >
      {text}
    </span>
  );
}

/** Does this brand render as a real vector mark (vs. a wordmark/monogram)? */
export function hasVectorMark(name: string): boolean {
  return MARKS[name]?.kind === "svg";
}
