import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

interface SectionHeaderProps {
  /** Arabic eyebrow, e.g. "شبكة المرشدين". */
  eyebrow?: string;
  /** Latin/mono eyebrow prefix, e.g. "MENTORS". */
  eyebrowEN?: string;
  /** The headline — pass JSX so a word can carry `text-primary`. */
  headline: ReactNode;
  /** Supporting sentence. In `split` mode it fills the opposite column so the
   *  heading never sits beside an empty half ("right-cliff" fix). */
  subline?: string;
  cta?: { label: string; href: string };
  /** "split" = headline (start) + subline/cta (opposite column). "start" = stacked. */
  align?: "start" | "split";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  eyebrowEN,
  headline,
  subline,
  cta,
  align = "split",
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`${
        align === "split"
          ? "grid grid-cols-1 lg:grid-cols-2 gap-x-[clamp(2rem,5vw,6rem)] gap-y-5 lg:items-end"
          : "max-w-3xl"
      } ${className}`}
    >
      {/* Eyebrow + headline */}
      <div className="flex flex-col gap-3">
        {(eyebrow || eyebrowEN) && (
          <div className="flex items-center gap-3">
            <span aria-hidden className="block h-px w-6 shrink-0 bg-primary" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary rtl:tracking-normal">
              {eyebrowEN && <span className="opacity-50">{eyebrowEN} · </span>}
              {eyebrow}
            </span>
          </div>
        )}
        <h2
          className="font-display font-bold leading-[1.05] text-foreground"
          style={{ fontSize: "clamp(2rem,4.5vw,3.75rem)", letterSpacing: "-0.03em" }}
        >
          {headline}
        </h2>
      </div>

      {/* Subline + CTA — fills the opposite column in split mode */}
      {align === "split" && (subline || cta) && (
        <div className="flex flex-col gap-4 lg:pb-2">
          {subline && (
            <p className="t-body leading-relaxed max-w-xl" style={{ fontSize: "clamp(1rem,1.5vw,1.125rem)" }}>
              {subline}
            </p>
          )}
          {cta && (
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 self-start rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:border-primary/40 hover:text-primary motion-reduce:transition-none"
              aria-label={cta.label}
            >
              {cta.label}
              <ArrowLeft className="h-3.5 w-3.5 ltr:rotate-180" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
