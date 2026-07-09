import type { ReactNode, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

// Shared admin component kit. One place for the primitives the admin screens kept
// re-inventing — so density, focus states, and (critically) the AA-contrast CTA
// colour are consistent. Primary uses --primary-cta (a darker red tuned for white
// labels → passes WCAG AA), not bg-primary (which fails AA under white text).

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: "bg-[hsl(var(--primary-cta))] text-white hover:shadow-soft-hover",
  secondary: "bg-muted text-foreground/80 hover:bg-foreground/[0.08]",
  ghost: "bg-transparent text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground",
  danger: "bg-rose-500/12 text-rose-400 hover:bg-rose-500/20",
};
const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-[12.5px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-[13.5px] gap-2 rounded-xl",
};

export function AdminButton({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    >
      {loading ? <Loader2 className={size === "sm" ? "w-3.5 h-3.5 animate-spin" : "w-4 h-4 animate-spin"} /> : icon}
      {children}
    </button>
  );
}

type Tone = "success" | "warning" | "info" | "neutral" | "danger" | "brand";
const TONE: Record<Tone, string> = {
  success: "bg-emerald-500/15 text-emerald-400",
  warning: "bg-amber-500/15 text-amber-400",
  info: "bg-sky-500/15 text-sky-400",
  neutral: "bg-foreground/10 text-foreground/55",
  danger: "bg-rose-500/15 text-rose-400",
  brand: "bg-primary/15 text-primary",
};

export function StatusBadge({ tone = "neutral", children, icon }: { tone?: Tone; children: ReactNode; icon?: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TONE[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-14 px-6 text-center">
      {icon && <div className="mx-auto mb-3 w-11 h-11 rounded-2xl bg-foreground/[0.05] grid place-items-center text-foreground/40">{icon}</div>}
      <div className="text-[14px] font-bold text-foreground">{title}</div>
      {description && <p className="mt-1 text-[12.5px] text-foreground/55 max-w-sm mx-auto leading-relaxed">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
