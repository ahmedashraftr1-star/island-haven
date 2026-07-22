import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Btn — the ONE marketing/landing button. Before this, the homepage alone carried
 * ~15 button shapes across 25 buttons (five radii, a dozen heights). This collapses
 * that to THREE variants × THREE fixed sizes, a single pill radius, one icon gap,
 * and consistent hover/focus/active/disabled + reduced-motion behaviour.
 *
 *   variant: primary  → terracotta fill, white label (AA via --primary-cta)
 *            secondary → glass/outline on dark
 *            ghost     → text-only
 *   size:    sm 36px · md 44px (touch min) · lg 52px
 *
 * Render a wouter <Link> (or <a>) with identical styling via `asChild`:
 *   <Btn asChild variant="secondary" size="md"><Link href="/ventures">…</Link></Btn>
 */
const btnVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none " +
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
    "disabled:opacity-50 disabled:pointer-events-none [&_svg]:shrink-0 motion-safe:hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        primary: "cta-fill shadow-soft",
        secondary:
          "bg-white/10 border border-white/15 text-white backdrop-blur-md hover:bg-white/15",
        ghost: "text-white/85 hover:text-white hover:bg-white/[0.06]",
      },
      size: {
        sm: "h-9 px-4 text-[13px] [&_svg]:size-4",
        md: "h-11 px-6 text-[14px] [&_svg]:size-4",
        lg: "h-[52px] px-7 text-[15px] [&_svg]:size-[18px]",
      },
    },
    compoundVariants: [
      // Ghost reads as an inline text link, not a filled control: drop the fixed
      // button-box height + heavy side padding, keep a compact hit-area and the
      // shared pill focus ring / hover. (Unifies the old rounded-md "learn more →"
      // links onto ONE ghost pattern without boxing them.)
      { variant: "ghost", class: "h-auto px-2 py-1.5" },
    ],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface BtnProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof btnVariants> {
  asChild?: boolean;
}

export const Btn = React.forwardRef<HTMLButtonElement, BtnProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(btnVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Btn.displayName = "Btn";

export { btnVariants };
