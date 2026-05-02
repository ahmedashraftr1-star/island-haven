import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useContentSection, imageUrl } from "@/hooks/use-content";

const FALLBACK = {
  logo: "/logo.png",
  brand: "Island Haven",
  tagline: "آيلاند هيفن · غزّة",
  ctaLabel: "انتسب الآن",
  ctaHref: "/apply",
};

const NAV: Array<{ label: string; en: string; href: string }> = [
  { label: "الرئيسيّة", en: "Home", href: "/" },
  { label: "منتسبو المساحة", en: "Members", href: "/members" },
  { label: "البرنامج التّدريبيّ", en: "Programs", href: "/courses" },
  { label: "مُجتمعنا بالأرقام", en: "Numbers", href: "/numbers" },
  { label: "فعاليّات آيلاند", en: "Events", href: "/events" },
  { label: "معرض الصّور", en: "Gallery", href: "/gallery" },
  { label: "من نحن", en: "About", href: "/about" },
];

function isActiveRoute(loc: string, href: string): boolean {
  if (href === "/") return loc === "/" || loc === "";
  return loc === href || loc.startsWith(href + "/");
}

export function Header() {
  const c = useContentSection("header", FALLBACK);
  const [scrolledRaw, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loc] = useLocation();
  // On routes other than the dark hero home, always render the
  // light/condensed style so the nav stays readable on white sections.
  const isHome = loc === "/" || loc === "";
  const scrolled = scrolledRaw || !isHome;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change.
  useEffect(() => {
    setOpen(false);
  }, [loc]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-border py-2.5"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-5 lg:px-8 max-w-[1500px] flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-1 rounded-2xl bg-primary/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
            <div className="relative w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-[#0A0E1A] border border-white/10 shadow-soft flex items-center justify-center p-1.5 group-hover:shadow-soft-hover transition-all duration-300">
              <img
                src={imageUrl(c.logo)}
                alt={c.brand}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="leading-tight">
            <div
              className={`font-bold text-[15px] lg:text-[16px] tracking-tight transition-colors duration-300 ${
                scrolled ? "text-foreground" : "text-white"
              }`}
            >
              {c.brand}
            </div>
            <div
              className={`text-[10.5px] font-medium tracking-wide transition-colors duration-300 ${
                scrolled ? "text-foreground/60" : "text-white/70"
              }`}
            >
              {c.tagline}
            </div>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-0.5 relative">
          {NAV.map((l) => {
            const active = isActiveRoute(loc, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative px-3 py-2 text-[13.5px] font-semibold transition-colors rounded-full whitespace-nowrap ${
                  scrolled
                    ? active
                      ? "text-primary"
                      : "text-foreground/70 hover:text-foreground hover:bg-foreground/[0.04]"
                    : active
                    ? "text-white"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
                data-testid={`nav-${l.en.toLowerCase()}`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className={`absolute inset-0 rounded-full -z-10 ${
                      scrolled ? "bg-primary/10" : "bg-white/15 backdrop-blur-sm"
                    }`}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Link
            href="/book"
            className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[12.5px] font-semibold transition-all duration-300 hover:scale-[1.03] ${
              scrolled
                ? "bg-primary-soft text-primary hover:bg-primary/15"
                : "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/15"
            }`}
          >
            احجز مقعد
          </Link>
          <Link
            href={c.ctaHref || "/apply"}
            className={`inline-flex items-center gap-2 h-9 px-4 rounded-full text-[12.5px] font-semibold transition-all duration-300 shadow-soft hover:scale-[1.03] ${
              scrolled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-white text-[#0A0E1A] hover:bg-white/90"
            }`}
          >
            <span>{c.ctaLabel}</span>
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className={`xl:hidden w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            scrolled
              ? "border border-border bg-white text-foreground"
              : "border border-white/25 bg-white/10 backdrop-blur-md text-white"
          }`}
          aria-label="القائمة"
          data-testid="button-mobile-menu"
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
            className="xl:hidden border-t border-border bg-white/95 backdrop-blur-xl"
          >
            <nav className="container mx-auto px-6 py-4 flex flex-col">
              {NAV.map((l) => {
                const active = isActiveRoute(loc, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`py-3 border-b border-border text-[15px] font-semibold transition-colors flex items-center justify-between ${
                      active ? "text-primary" : "text-foreground hover:text-primary"
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="text-[10px] tracking-[0.16em] uppercase text-foreground/40 font-semibold">
                      {l.en}
                    </span>
                  </Link>
                );
              })}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary-soft text-primary text-[14px] font-semibold"
                >
                  احجز مقعد
                </Link>
                <Link
                  href={c.ctaHref || "/apply"}
                  className="inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold"
                >
                  <span>{c.ctaLabel}</span>
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
