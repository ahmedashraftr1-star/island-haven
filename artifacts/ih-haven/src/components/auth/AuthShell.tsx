import type { ReactNode } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { HavenMark } from "@/components/landing/HavenMark";

export function AuthBackgroundAura() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.5] pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 0%, rgba(220,38,55,0.32) 0%, transparent 60%), radial-gradient(50% 40% at 0% 100%, rgba(220,38,55,0.16) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  );
}

export function AuthShell({
  eyebrow,
  title,
  highlight,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#0A0E1A] text-white"
      style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
    >
      <AuthBackgroundAura />

      <header className="relative z-20 px-5 sm:px-8 lg:px-14 pt-6 sm:pt-8">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[12px] tracking-[0.18em] uppercase text-white/55 hover:text-white transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            العودة
          </Link>
          <div className="flex items-center gap-2.5">
            <HavenMark size={32} strokeColor="hsl(354 80% 60%)" />
            <div className="leading-tight text-right">
              <div className="text-[13px] font-bold tracking-tight">Island Haven</div>
              <div className="text-[10px] text-white/45 tracking-[0.16em] uppercase">آيلاند هيفن</div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 px-5 sm:px-8 lg:px-14 pt-10 sm:pt-14 pb-16">
        <div className="mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 backdrop-blur-md mb-5">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold">
                {eyebrow}
              </span>
            </div>
            <h1
              className="font-bold text-white leading-[1.05]"
              style={{
                fontSize: "clamp(1.85rem, 5.5vw, 2.6rem)",
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
            <p className="text-white/55 text-[13.5px] sm:text-[14.5px] leading-[1.85] mt-4 max-w-sm mx-auto">
              {subtitle}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-[28px] p-6 sm:p-8 bg-white/[0.045] border border-white/10 backdrop-blur-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                background:
                  "radial-gradient(80% 40% at 50% 0%, rgba(220,38,55,0.18) 0%, transparent 60%)",
              }}
            />
            <div className="relative">{children}</div>
          </motion.div>

          {footer && (
            <div className="mt-7 text-center text-[12.5px] text-white/55">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuthField({
  id,
  label,
  hint,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  ltr = false,
  autoComplete,
}: {
  id: string;
  label: string;
  hint: string;
  icon: React.ElementType;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  ltr?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center justify-between mb-2 text-[11.5px] tracking-[0.06em]"
      >
        <span className="text-white/75 font-semibold">{label}</span>
        <span className="inline-flex items-center gap-1.5 text-white/35">
          <Icon className="w-3 h-3" />
          <span className="text-[10px] tracking-[0.16em] uppercase">{hint}</span>
        </span>
      </label>
      <div
        className={`rounded-2xl px-4 py-3 bg-white/[0.04] border backdrop-blur-md transition-colors focus-within:bg-white/[0.06] ${
          error
            ? "border-red-500/45 focus-within:border-red-500/65"
            : "border-white/10 focus-within:border-primary/45"
        }`}
      >
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={ltr ? "ltr" : "auto"}
          autoComplete={autoComplete}
          className="block w-full bg-transparent text-white placeholder-white/30 text-[14.5px] outline-none px-1 py-0.5"
          data-testid={`input-${id}`}
        />
      </div>
      {error && (
        <div className="text-[11.5px] text-red-300 mt-1.5 px-1">{error}</div>
      )}
    </div>
  );
}
