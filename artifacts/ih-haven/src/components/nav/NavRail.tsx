import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { NAV_ITEMS, isNavActive } from "./navConfig";

/**
 * The shared primary navigation rail — one component, rendered identically on
 * the landing header and every inner page. A single spring-driven indicator
 * (framer-motion `layoutId`) morphs between items as you navigate, giving the
 * bar a continuous, intentional feel rather than a static list of links.
 *
 * `tone` adapts the palette to the surface it sits on (bright header vs the
 * deep-navy inner pages). `pillId` must be unique per mounted instance so the
 * desktop and compact rails don't fight over the same shared layout element.
 */
export function NavRail({
  tone = "onDark",
  pillId = "nav-pill",
}: {
  tone?: "onLight" | "onDark";
  pillId?: string;
}) {
  const [loc] = useLocation();
  const onLight = tone === "onLight";

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(loc, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            data-testid={`nav-${item.key}`}
            className={`relative shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-semibold whitespace-nowrap transition-colors duration-200 ${
              active
                ? onLight
                  ? "text-primary"
                  : "text-white"
                : onLight
                  ? "text-foreground/60 hover:text-foreground"
                  : "text-white/60 hover:text-white"
            }`}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                aria-hidden
                className={`absolute inset-0 -z-10 rounded-full ${
                  onLight
                    ? "bg-primary/10 ring-1 ring-primary/15"
                    : "bg-primary/25 ring-1 ring-primary/40"
                }`}
                transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
              />
            )}
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}
