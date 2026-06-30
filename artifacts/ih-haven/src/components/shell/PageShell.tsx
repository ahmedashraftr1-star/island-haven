import { type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/landing/Header";

export function PageShell({
  eyebrow,
  title,
  highlight,
  subtitle,
  heroAside,
  children,
  maxWidth = "max-w-6xl",
}: {
  eyebrow?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
  /** Optional visual for the RIGHT of the hero (a stat, ticker, or illustration)
   *  so the page title never sits beside empty space. */
  heroAside?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
  /** Kept for call-site compatibility; the shared NavRail derives the active
   * item from the current route, so this is no longer needed. */
  active?: string;
}) {
  const { dir } = useLanguage();

  return (
    <div
      dir={dir}
      className="relative min-h-screen overflow-hidden bg-background text-foreground"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[45vh] brand-aura opacity-50" />

      {/* Unified site header — the same mega-menu + ⌘K nav used everywhere. */}
      <Header />

      <div className="relative z-10 px-5 sm:px-8 lg:px-14 pt-28 sm:pt-32 pb-16">
        <div className={`mx-auto ${maxWidth}`}>
          {(eyebrow || title || subtitle || heroAside) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-10 sm:mb-14"
            >
              {/* Focal brand aura behind the page title — atmosphere, not flat */}
              <div aria-hidden className="pointer-events-none absolute -z-10 -top-16 inset-x-0 h-[150%] brand-aura opacity-40" />
              <div className={heroAside ? "grid lg:grid-cols-[1.15fr_0.85fr] gap-x-10 gap-y-9 lg:items-center" : ""}>
                <div>
                  {eyebrow && (
                    <div className="flex items-center gap-3 mb-5">
                      <span className="h-px w-9 bg-primary/50" />
                      <span className="text-[11px] tracking-[0.22em] uppercase text-primary font-bold rtl:tracking-normal">
                        {eyebrow}
                      </span>
                    </div>
                  )}
                  {title && (
                    <h1
                      className="font-display font-extrabold text-foreground leading-[1.0]"
                      style={{
                        fontSize: "clamp(2.6rem, 7vw, 5.25rem)",
                        letterSpacing: "-0.04em",
                      }}
                    >
                      {title}
                      {highlight && (
                        <>
                          {" "}
                          <span className="text-primary">{highlight}</span>
                        </>
                      )}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="mt-5 text-fg-secondary text-[15px] sm:text-[17px] leading-[1.8] max-w-2xl">
                      {subtitle}
                    </p>
                  )}
                </div>
                {heroAside && <div className="w-full lg:justify-self-end">{heroAside}</div>}
              </div>
              <div aria-hidden className="mt-9 sm:mt-11 h-px w-full bg-gradient-to-r from-border-strong via-border-strong/40 to-transparent rtl:bg-gradient-to-l" />
            </motion.div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-[12px] tracking-[0.16em] uppercase text-muted-foreground hover:text-foreground transition-colors font-semibold mb-6"
    >
      <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
      {label}
    </Link>
  );
}

export function GlassCard({
  children,
  className = "",
  testId,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
  onClick?: () => void;
}) {
  return (
    <div
      data-testid={testId}
      onClick={onClick}
      className={`relative rounded-[24px] bg-surface-2 border border-border-strong shadow-soft overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative text-center py-16 sm:py-24">
      <div className="ambient-grid absolute inset-0 -z-10" aria-hidden />
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/30 mb-5 ring-edge">
        <span className="block w-2 h-2 rounded-full bg-primary" aria-hidden />
      </div>
      <div className="text-foreground text-[16px] font-semibold mb-1">{title}</div>
      {hint && <div className="text-muted-foreground text-[13.5px]">{hint}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
