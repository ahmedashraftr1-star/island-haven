import { type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, LogIn, UserCircle2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { HavenMark } from "@/components/landing/HavenMark";
import { useAuth } from "@/lib/auth";
import { AuthBackgroundAura } from "@/components/auth/AuthShell";
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
  const { dir, lang } = useLanguage();

  return (
    <div
      dir={dir}
      className="relative min-h-screen overflow-hidden bg-[#0A0E1A] text-white"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      <AuthBackgroundAura />

      <header className="relative z-30 px-5 sm:px-8 lg:px-14 pt-6 sm:pt-8">
        <div className={`mx-auto ${maxWidth} flex items-center justify-between gap-4`}>
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 hover-elevate active-elevate-2 rounded-full px-2.5 py-1.5 -mx-2.5"
          >
            <HavenMark size={32} strokeColor="hsl(354 80% 60%)" />
            <div className="leading-tight text-right">
              <div className="text-[13px] font-bold tracking-tight">Island Haven</div>
              <div className="text-[10px] text-white/45 tracking-[0.16em] uppercase">
                آيلاند هيفن
              </div>
            </div>
          </Link>

          <nav
            aria-label="التنقّل الرئيسيّ"
            className="hidden xl:flex items-center gap-0.5 rounded-full p-1 bg-white/[0.04] border border-white/10 backdrop-blur-md"
          >
            <NavRail tone="onDark" pillId="shell-rail" />
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              aria-label="بحث"
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
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-[12.5px] font-semibold hover:bg-white/[0.1] transition-colors"
                data-testid="link-profile"
              >
                <UserCircle2 className="w-4 h-4 text-primary" />
                <span className="max-w-[120px] truncate">{user.fullName}</span>
              </Link>
            ) : !loading ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-[12.5px] font-semibold hover:bg-white/[0.1] transition-colors"
                data-testid="link-login"
              >
                <LogIn className="w-3.5 h-3.5" />
                {lang === "en" ? "Login" : "دخول"}
              </Link>
            ) : null}
          </div>
        </div>

        {/* Same rail, horizontally scrollable below xl — identical items, so the
            bar never changes shape between breakpoints or pages. */}
        <nav
          aria-label="التنقّل الرئيسيّ"
          className="xl:hidden mt-4 flex items-center gap-0.5 overflow-x-auto rounded-full p-1 bg-white/[0.04] border border-white/10 [&::-webkit-scrollbar]:hidden"
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
              className="mb-10 sm:mb-12"
            >
              {eyebrow && (
                <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-3">
                  {eyebrow}
                </div>
              )}
              {title && (
                <h1
                  className="font-bold text-white leading-[1.05] mb-3"
                  style={{
                    fontSize: "clamp(2rem, 5vw, 3rem)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {title}
                  {highlight && (
                    <>
                      {" "}
                      <span className="text-accent-gradient">{highlight}</span>
                    </>
                  )}
                </h1>
              )}
              {subtitle && (
                <p className="text-white/55 text-[14.5px] sm:text-[15.5px] leading-[1.85] max-w-2xl">
                  {subtitle}
                </p>
              )}
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
      className="group inline-flex items-center gap-2 text-[12px] tracking-[0.16em] uppercase text-white/55 hover:text-white transition-colors font-semibold mb-6"
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
      className={`relative rounded-[24px] bg-white/[0.045] border border-white/10 backdrop-blur-2xl shadow-[0_20px_60px_-25px_rgba(0,0,0,0.6)] overflow-hidden ${className}`}
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
      <div className="text-white/85 text-[16px] font-semibold mb-1">{title}</div>
      {hint && <div className="text-white/45 text-[13.5px]">{hint}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
