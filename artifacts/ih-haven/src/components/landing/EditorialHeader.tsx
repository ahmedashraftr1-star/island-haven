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
 * Clean section header — Galata's quiet confidence.
 * Soft indigo eyebrow pill, bold display headline, calm sub.
 */
export function EditorialHeader({ label, title, sub, align = "start" }: Props) {
  const isCenter = align === "center";
  return (
    <div className={`mb-14 lg:mb-20 ${isCenter ? "text-center max-w-3xl mx-auto" : "max-w-3xl"}`}>
      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-6`}>
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        {label}
      </div>
      <h2
        className="font-bold text-foreground"
        style={{
          fontSize: "clamp(2rem, 5vw, 4.25rem)",
          lineHeight: 1.06,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      {sub && (
        <p className="mt-6 text-base lg:text-lg text-foreground/65 font-normal leading-relaxed">
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
    <div className="grid grid-cols-12 gap-4 lg:gap-8 items-baseline py-8 lg:py-10 border-t border-border">
      <div className="col-span-2 lg:col-span-1 text-[11px] tracking-[0.1em] font-mono font-medium text-foreground/40 tabular-nums">
        {no}
      </div>
      <div className="col-span-10 lg:col-span-3">
        <h3 className="font-bold leading-tight text-foreground text-xl lg:text-2xl">
          {ar}
        </h3>
        <div className="text-[11px] tracking-[0.1em] mt-1.5 text-foreground/45 font-medium">
          {en}
        </div>
      </div>
      <div className="col-span-12 lg:col-span-8 text-[15px] lg:text-base leading-relaxed text-foreground/70">
        {body}
      </div>
    </div>
  );
}
