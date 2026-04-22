import { useEffect, useState } from "react";
import { Menu, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { href: "#about", label: "من نحن", group: "المساحة" },
  { href: "#audience", label: "الفئات", group: "المجتمع" },
  { href: "#offerings", label: "ما نقدّم", group: "التجربة" },
  { href: "#programs", label: "الفعاليّات", group: "المجتمع" },
  { href: "#visit", label: "تواصل", group: "الزيارة" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy: track which section is currently in viewport
  useEffect(() => {
    const ids = links.map((l) => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of the viewport that's intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive("#" + visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-border py-2.5"
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
            <div className="relative w-12 h-12 lg:w-13 lg:h-13 rounded-2xl bg-[#0A0E1A] border border-white/10 shadow-soft flex items-center justify-center p-1.5 group-hover:shadow-soft-hover transition-all duration-300">
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

        {/* Nav with scrollspy + active pill */}
        <nav className="hidden lg:flex items-center gap-1 relative">
          {links.map((l) => {
            const isActive = active === l.href;
            return (
              <a
                key={l.href}
                href={l.href}
                className={`relative px-4 py-2 text-[14px] font-medium transition-colors rounded-full ${
                  scrolled
                    ? isActive
                      ? "text-primary"
                      : "text-foreground/70 hover:text-foreground hover:bg-foreground/[0.04]"
                    : isActive
                    ? "text-white"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className={`absolute inset-0 rounded-full -z-10 ${
                      scrolled ? "bg-primary/10" : "bg-white/15 backdrop-blur-sm"
                    }`}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{l.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="nav-dot"
                    className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                      scrolled ? "bg-primary" : "bg-white"
                    }`}
                  />
                )}
              </a>
            );
          })}
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-border bg-white/95 backdrop-blur-xl"
          >
            <nav className="container mx-auto px-6 py-4 flex flex-col">
              {links.map((l) => {
                const isActive = active === l.href;
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`py-3 border-b border-border text-[15px] font-medium transition-colors flex items-center justify-between ${
                      isActive ? "text-primary" : "text-foreground hover:text-primary"
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="text-[10px] tracking-[0.18em] uppercase text-foreground/40 font-semibold">
                      {l.group}
                    </span>
                  </a>
                );
              })}
              <a
                href={`${import.meta.env.BASE_URL}apply`}
                className="mt-4 inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold"
              >
                <span>انتسب الآن</span>
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
