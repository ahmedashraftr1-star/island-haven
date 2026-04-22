import { useEffect, useState } from "react";
import { Menu, X, ArrowLeft } from "lucide-react";

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
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-border py-3"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px] flex items-center justify-between gap-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group shrink-0">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-1 rounded-2xl bg-primary/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
            <div className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-[#0A0E1A] border border-white/10 shadow-soft flex items-center justify-center p-1.5 group-hover:shadow-soft-hover transition-all duration-300">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Island Haven"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="leading-tight">
            <div
              className={`font-bold text-[16px] lg:text-[17px] tracking-tight transition-colors duration-300 ${
                scrolled ? "text-foreground" : "text-white"
              }`}
            >
              Island Haven
            </div>
            <div
              className={`text-[11px] font-medium tracking-wide transition-colors duration-300 ${
                scrolled ? "text-foreground/60" : "text-white/70"
              }`}
            >
              آيلاند هيفن · غزّة
            </div>
          </div>
        </a>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`relative px-4 py-2 text-[14px] font-medium transition-colors rounded-full ${
                scrolled
                  ? "text-foreground/70 hover:text-foreground hover:bg-foreground/[0.04]"
                  : "text-white/85 hover:text-white hover:bg-white/10"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <a
          href={`${import.meta.env.BASE_URL}apply`}
          className={`hidden lg:inline-flex items-center gap-2 h-10 px-5 rounded-full text-[13px] font-semibold transition-all duration-300 shadow-soft hover:scale-[1.03] ${
            scrolled
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-white text-[#0A0E1A] hover:bg-white/90"
          }`}
        >
          <span>انتسب الآن</span>
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
        </a>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`lg:hidden w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            scrolled
              ? "border border-border bg-white text-foreground"
              : "border border-white/25 bg-white/10 backdrop-blur-md text-white"
          }`}
          aria-label="القائمة"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-white/95 backdrop-blur-xl">
          <nav className="container mx-auto px-6 py-4 flex flex-col">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 border-b border-border text-[15px] font-medium text-foreground hover:text-primary transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href={`${import.meta.env.BASE_URL}apply`}
              className="mt-4 inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold"
            >
              <span>انتسب الآن</span>
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
