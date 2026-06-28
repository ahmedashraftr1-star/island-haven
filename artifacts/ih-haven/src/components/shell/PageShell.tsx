import { type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, LogIn, UserCircle2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { HavenMark } from "@/components/landing/HavenMark";
import { useAuth } from "@/lib/auth";
import { NavRail } from "@/components/nav/NavRail";
import { NotificationBell } from "@/components/shell/NotificationBell";
import { useLanguage } from "@/contexts/LanguageContext";
import { LangToggle } from "@/components/nav/LangToggle";

export function PageShell({
  eyebrow,
  title,
  highlight,
  subtitle,
  children,
  maxWidth = "max-w-6xl",
}: {
  eyebrow?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
  /** Kept for call-site compatibility; the shared NavRail derives the active
   * item from the current route, so this is no longer needed. */
  active?: string;
}) {
  const { user, loading } = useAuth();
  const { dir, lang, t } = useLanguage();
  const navLabel = t({ ar: "التنقّل الرئيسيّ", en: "Main navigation" });

  return (
    <div
      dir={dir}
      className="relative min-h-screen overflow-hidden bg-background text-foreground"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[45vh] brand-aura opacity-50" />

      <header className="relative z-30 px-5 sm:px-8 lg:px-14 pt-6 sm:pt-8">
        <div className={`mx-auto ${maxWidth} flex items-center justify-between gap-4`}>
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 hover-elevate active-elevate-2 rounded-full px-2.5 py-1.5 -mx-2.5"
          >
            <HavenMark size={32} strokeColor="hsl(354 80% 60%)" />
            <div className="leading-tight text-right">
              <div className="text-[13px] font-bold tracking-tight">Island Haven</div>
              <div className="text-[10px] text-muted-foreground tracking-[0.16em] uppercase">
                آيلاند هيفن
              </div>
            </div>
          </Link>

          <nav
            aria-label={navLabel}
            className="hidden xl:flex items-center gap-0.5 rounded-full p-1 bg-white/[0.04] border border-white/10 backdrop-blur-md"
          >
            <NavRail tone="onDark" pillId="shell-rail" />
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              aria-label={t({ ar: "بحث", en: "Search" })}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] border border-white/15 hover:bg-white/[0.1] transition-colors"
              data-testid="link-search"
            >
              <Search className="w-4 h-4 text-white/70" />
            </Link>
            <LangToggle tone="onDark" />
            {!loading && user ? <NotificationBell /> : null}
            {!loading && user ? (
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-[12.5px] font-semibold text-white hover:bg-white/[0.1] transition-colors"
                data-testid="link-profile"
              >
                <UserCircle2 className="w-4 h-4 text-primary" />
                <span className="max-w-[120px] truncate">{user.fullName}</span>
              </Link>
            ) : !loading ? (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-[12.5px] font-semibold text-white hover:bg-white/[0.1] transition-colors"
                data-testid="link-login"
              >
                <LogIn className="w-3.5 h-3.5" />
                {lang === "en" ? "Login" : "دخول"}
              </Link>
            ) : null}
            {/* Primary CTA — consistent with the homepage header (was missing here) */}
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[12.5px] font-semibold cta-fill shadow-soft hover:scale-[1.03] transition-transform"
              data-testid="shell-apply"
            >
              {lang === "en" ? "Apply" : "انتسب"}
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>

        {/* Same rail, horizontally scrollable below xl — identical items, so the
            bar never changes shape between breakpoints or pages. */}
        <nav
          aria-label={navLabel}
          className="xl:hidden mt-4 flex items-center gap-0.5 overflow-x-auto rounded-full p-1 bg-white/[0.04] border border-white/10 backdrop-blur-md [&::-webkit-scrollbar]:hidden"
        >
          <NavRail tone="onDark" pillId="shell-scroll" />
        </nav>
      </header>

      <div className="relative z-10 px-5 sm:px-8 lg:px-14 pt-10 sm:pt-14 pb-16">
        <div className={`mx-auto ${maxWidth}`}>
          {(eyebrow || title || subtitle) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-10 sm:mb-14"
            >
              {/* Focal brand aura behind the page title — atmosphere, not flat */}
              <div aria-hidden className="pointer-events-none absolute -z-10 -top-16 inset-x-0 h-[150%] brand-aura opacity-40" />
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
