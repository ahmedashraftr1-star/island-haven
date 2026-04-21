import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#about", label: "من نحن" },
  { href: "#audience", label: "الفئات" },
  { href: "#offerings", label: "ما نقدّم" },
  { href: "#programs", label: "الفعاليّات" },
  { href: "#campaign", label: "الفرع الجديد" },
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
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-foreground/12 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl flex items-center justify-between gap-6">
        {/* Logo lockup — editorial, no rounded chrome */}
        <a href="#" className="flex items-center gap-3 group shrink-0">
          <img
            src="/logo.png"
            alt="Island Haven"
            className="w-11 h-11 object-contain"
          />
          <div className="leading-tight hidden sm:block">
            <div
              className="font-bold text-foreground text-[15px] tracking-tight"
              style={{ fontFamily: "Cairo, sans-serif" }}
            >
              Island Haven
            </div>
            <div className="text-[10px] text-foreground/55 font-bold tracking-[0.3em] uppercase">
              آيلاند هيفن · غزّة
            </div>
          </div>
        </a>

        {/* Editorial nav: small caps, hairline hover underline */}
        <nav className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative text-[13px] font-bold text-foreground/75 hover:text-foreground transition-colors py-1"
            >
              <span>{l.label}</span>
              <span className="absolute -bottom-0.5 right-0 left-0 h-px bg-primary scale-x-0 group-hover:scale-x-100 origin-right transition-transform duration-300" />
            </a>
          ))}
        </nav>

        {/* CTA — hairline, no shadow, editorial */}
        <a
          href="https://nas2nas.org"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:inline-flex items-center gap-2 h-10 px-5 border border-foreground bg-foreground text-background text-[12px] tracking-[0.25em] uppercase font-bold hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
        >
          <span>تبرّع الآن</span>
          <span aria-hidden>→</span>
        </a>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden w-10 h-10 border border-foreground/15 flex items-center justify-center text-foreground hover:bg-foreground hover:text-background transition-colors"
          aria-label="القائمة"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-foreground/12 bg-background/97 backdrop-blur-md">
          <nav className="container mx-auto px-6 py-4 flex flex-col">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline justify-between gap-3 py-3 border-b border-foreground/10 text-[15px] font-bold text-foreground hover:text-primary transition-colors"
              >
                <span>{l.label}</span>
                <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40 font-bold">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </a>
            ))}
            <a
              href="https://nas2nas.org"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center justify-between gap-2 h-12 px-5 bg-foreground text-background text-[12px] tracking-[0.25em] uppercase font-bold hover:bg-primary transition-colors"
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
