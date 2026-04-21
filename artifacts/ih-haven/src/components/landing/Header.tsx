import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#about", label: "من نحن" },
  { href: "#audience", label: "الفئات" },
  { href: "#offerings", label: "ما نقدّم" },
  { href: "#programs", label: "الفعاليّات" },
  { href: "#visit", label: "تواصل" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-4 inset-x-4 lg:inset-x-6 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        scrolled ? "top-3" : "top-5"
      }`}
    >
      <div
        className={`glass-strong mx-auto max-w-[1500px] flex items-center justify-between gap-6 rounded-2xl px-4 lg:px-6 transition-all duration-500 ${
          scrolled ? "py-2" : "py-3"
        }`}
      >
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group shrink-0">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-1 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background:
                  "conic-gradient(from 0deg, hsl(var(--violet)), hsl(var(--magenta)), hsl(var(--cyan)), hsl(var(--violet)))",
              }}
            />
            <img
              src="/logo.png"
              alt="Island Haven"
              className="relative w-10 h-10 object-contain rounded-full bg-background p-1"
            />
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="font-medium text-foreground text-[14px] tracking-tight">
              Island Haven
            </div>
            <div className="text-[9px] text-foreground/55 tracking-[0.3em] uppercase font-mono">
              Gaza · 2026
            </div>
          </div>
        </a>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-full">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative px-4 py-1.5 text-[13px] font-medium text-foreground/70 hover:text-foreground transition-colors rounded-full hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <a
          href="https://nas2nas.org"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:inline-flex items-center gap-2 h-9 px-5 rounded-full text-[12px] tracking-[0.15em] uppercase font-medium text-white font-mono transition-all duration-500 hover:scale-[1.04]"
          style={{
            background:
              "linear-gradient(100deg, hsl(var(--violet)) 0%, hsl(var(--magenta)) 60%, hsl(var(--cyan)) 100%)",
            boxShadow: "0 0 20px -3px hsl(var(--violet) / 0.55)",
          }}
        >
          <span>تبرّع الآن</span>
          <span aria-hidden>→</span>
        </a>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden w-9 h-9 rounded-full glass flex items-center justify-center text-foreground"
          aria-label="القائمة"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden mt-2 glass-strong rounded-2xl overflow-hidden">
          <nav className="px-4 py-3 flex flex-col">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline justify-between gap-3 py-3 border-b border-white/5 text-[15px] font-medium text-foreground hover:text-primary transition-colors"
              >
                <span>{l.label}</span>
                <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40 font-mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </a>
            ))}
            <a
              href="https://nas2nas.org"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 h-11 rounded-full text-[12px] tracking-[0.15em] uppercase font-medium text-white font-mono"
              style={{
                background:
                  "linear-gradient(100deg, hsl(var(--violet)) 0%, hsl(var(--magenta)) 60%, hsl(var(--cyan)) 100%)",
              }}
            >
              <span>تبرّع الآن</span>
              <span aria-hidden>→</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
