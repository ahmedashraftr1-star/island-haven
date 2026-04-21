import type { ReactNode } from "react";

type Props = {
  no: string;
  label: string;
  title: ReactNode;
  sub?: ReactNode;
  alignRight?: boolean;
  meta?: ReactNode;
  dark?: boolean;
};

export function EditorialHeader({ no, label, title, sub, alignRight, meta, dark }: Props) {
  const text = dark ? "text-background" : "text-foreground";
  const muted = dark ? "text-background/60" : "text-foreground/55";
  return (
    <div className="grid grid-cols-12 gap-6 lg:gap-10 items-end mb-14 lg:mb-20">
      <div className={`col-span-12 lg:col-span-9 ${alignRight ? "lg:col-start-4" : ""}`}>
        <div className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold mb-4">
          [ N°{no} — {label} ]
        </div>
        <h2
          className={`font-extrabold ${text} leading-[1.12] tracking-tight`}
          style={{
            fontSize: "clamp(2rem, 5.5vw, 5rem)",
          }}
        >
          {title}
        </h2>
        {sub && (
          <p
            className={`mt-6 text-base lg:text-lg ${dark ? "text-background/75" : "text-foreground/70"} font-light leading-relaxed max-w-2xl`}
          >
            {sub}
          </p>
        )}
      </div>
      <div className="col-span-12 lg:col-span-3 hidden lg:flex justify-end">
        <div className={`text-[10px] tracking-[0.4em] uppercase ${muted} font-bold text-right`}>
          {meta}
        </div>
      </div>
    </div>
  );
}

export function HairlineRow({
  no,
  ar,
  en,
  body,
  dark,
}: {
  no: string;
  ar: string;
  en: string;
  body: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-12 gap-4 lg:gap-8 items-baseline py-7 lg:py-9 border-t ${
        dark ? "border-background/15" : "border-foreground/12"
      }`}
    >
      <div
        className={`col-span-2 lg:col-span-1 text-[11px] tracking-[0.3em] font-bold ${
          dark ? "text-background/45" : "text-foreground/45"
        }`}
      >
        {no}
      </div>
      <div className="col-span-10 lg:col-span-3">
        <h3
          className={`font-bold leading-tight ${dark ? "text-background" : "text-foreground"}`}
          style={{
            fontSize: "clamp(1.25rem, 1.8vw, 1.75rem)",
          }}
        >
          {ar}
        </h3>
        <div
          className={`text-[10px] tracking-[0.3em] uppercase mt-2 ${
            dark ? "text-background/45" : "text-foreground/45"
          }`}
        >
          {en}
        </div>
      </div>
      <div
        className={`col-span-12 lg:col-span-8 text-[15px] lg:text-base leading-relaxed font-light ${
          dark ? "text-background/80" : "text-foreground/75"
        }`}
      >
        {body}
      </div>
    </div>
  );
}
