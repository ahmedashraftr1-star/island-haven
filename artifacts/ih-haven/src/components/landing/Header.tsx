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
          ? "bg-background/85 backdrop-blur-md border-b border-border/60 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl flex items-center justify-between">
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm group-hover:shadow-md transition-shadow">
            IH
          </div>
          <div className="leading-tight">
            <div className="font-bold text-foreground text-base">Island Haven</div>
            <div className="text-[11px] text-muted-foreground font-light">آيلاند هيفن · غزّة</div>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <a
            href="https://nas2nas.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            تبرّع الآن
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden w-10 h-10 rounded-md flex items-center justify-center text-foreground hover:bg-secondary/20 transition-colors"
          aria-label="القائمة"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background/95 backdrop-blur-md">
          <nav className="container mx-auto px-6 py-4 flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-secondary/20 transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="https://nas2nas.org"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center h-11 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              تبرّع الآن
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
