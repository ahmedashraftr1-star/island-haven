import type { ReactNode } from "react";

type Props = {
  no?: string;
  label: string;
  title: ReactNode;
  sub?: ReactNode;
  alignRight?: boolean;
  meta?: ReactNode;
  dark?: boolean;
  align?: "start" | "center";
};

/**
 * Editorial section header — magazine confidence.
 * Hairline + uppercase eyebrow, oversized display headline,
 * generous calm sub paragraph.
 */
export function EditorialHeader({ label, title, sub, align = "start" }: Props) {
  const isCenter = align === "center";
  return (
    <div
      className={`mb-10 lg:mb-14 ${
        isCenter ? "text-center max-w-3xl mx-auto" : "max-w-[1100px]"
      }`}
    >
      <div
        className={`flex items-center gap-3 mb-7 ${
          isCenter ? "justify-center" : ""
        }`}
      >
        <span className="h-[1px] w-10 bg-primary/40" />
        <span className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold">
          {label}
        </span>
      </div>
      <h2
        className="font-bold text-foreground"
        style={{
          fontSize: "clamp(2.25rem, 5.8vw, 5rem)",
          lineHeight: "var(--lh-display)",
          letterSpacing: "-0.03em",
        }}
      >
        {title}
      </h2>
      {sub && (
        <p className="mt-7 lg:mt-8 text-base lg:text-xl text-foreground/65 font-normal leading-relaxed max-w-2xl">
          {sub}
        </p>
      )}
    </div>
  );
}

export function HairlineRow({
  no,
  ar,
  en,
  body,
}: {
  no: string;
  ar: string;
  en: string;
  body: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-8 items-baseline py-9 lg:py-11 border-t border-foreground/10">
      <div className="col-span-2 lg:col-span-1 text-[11px] tracking-[0.1em] font-mono font-medium text-foreground/40 tabular-nums">
        {no}
      </div>
      <div className="col-span-10 lg:col-span-3">
        <h3 className="font-bold leading-tight text-foreground text-xl lg:text-[26px] tracking-tight">
          {ar}
        </h3>
        <div className="text-[11px] tracking-[0.16em] uppercase mt-2 text-primary font-semibold">
          {en}
        </div>
      </div>
      <div className="col-span-12 lg:col-span-8 text-[15px] lg:text-[17px] leading-relaxed text-foreground/70">
        {body}
      </div>
    </div>
  );
}
