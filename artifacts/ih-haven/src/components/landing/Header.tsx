import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { Link, useLocation } from "wouter";
import {
  Menu,
  X,
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  Search,
  Command,
  Sparkles,
  Layers,
  Rocket,
  CalendarDays,
  FileText,
  Users,
  Briefcase,
  Handshake,
  Heart,
  Newspaper,
  Phone,
  LogIn,
  ShieldCheck,
  type LucideProps,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { useContentSection, imageUrl } from "@/hooks/use-content";
import { LangToggle } from "@/components/nav/LangToggle";
import { LiveNewsDot } from "@/components/landing/LiveNewsDot";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  NAV_STRUCTURE,
  type MegaCategory,
  type NavBadge,
} from "@/lib/nav";
import { useVisibleNav } from "@/hooks/use-visible-nav";

const FALLBACK = {
  logo: "/logo.png",
  brand: "Island Haven",
  tagline: "آيلاند هيفن · غزّة",
  ctaLabel: "انتسب الآن",
  ctaHref: "/apply",
  bookCtaLabel: "احجز مقعد",
  menuLabel: "القائمة",
};

// Map the lucide icon NAMES stored in lib/nav into real components. Keeping the
// map local (vs. the whole lucide barrel) keeps the bundle honest.
const ICONS: Record<string, ComponentType<LucideProps>> = {
  Layers,
  Rocket,
  CalendarDays,
  FileText,
  Users,
  Briefcase,
  Handshake,
  Heart,
  Newspaper,
  Phone,
  ShieldCheck,
};

function isActive(loc: string, href?: string) {
  if (!href) return false;
  if (href === "/") return loc === "/" || loc === "";
  return loc === href || loc.startsWith(href + "/");
}

// Localise an index into Eastern-Arabic numerals when in Arabic, padded to 2.
function navIndex(i: number, ar: boolean) {
  const padded = String(i + 1).padStart(2, "0");
  return ar ? padded.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]) : padded;
}

function Badge({ badge }: { badge: NavBadge }) {
  const { t } = useLanguage();
  const isNew = badge === "new";
  const label = isNew
    ? t({ ar: "جديد", en: "New" })
    : t({ ar: "قريبًا", en: "Soon" });
  return (
    <span
      className={`inline-flex items-center h-[18px] px-1.5 rounded-full font-mono text-[9px] font-semibold uppercase tracking-[0.12em] leading-none ${
        isNew
          ? "bg-primary-soft text-primary border border-primary/30"
          : "chip-sand"
      }`}
    >
      {label}
    </span>
  );
}

/* ───────────────────────── MEGA MENU PANEL ───────────────────────── */

function MegaPanel({
  categories,
  loc,
  onNavigate,
}: {
  categories: MegaCategory[];
  loc: string;
  onNavigate: () => void;
}) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-x-0 top-full pt-3"
    >
      <div className="container-ih">
        <div className="surface-3 ring-edge rounded-[24px] border border-border-strong overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_0.92fr]">
            {/* Three category columns */}
            {categories.map((cat) => (
              <div
                key={cat.label.en}
                className="p-6 lg:p-7 border-b lg:border-b-0 lg:border-e border-border/70"
              >
                <div className="eyebrow eyebrow-sand font-mono mb-4">
                  {t(cat.label)}
                </div>
                <ul className="flex flex-col gap-1">
                  {cat.items.map((item) => {
                    const Icon = ICONS[item.icon] ?? Sparkles;
                    const active = isActive(loc, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={`group/item flex items-start gap-3.5 rounded-2xl p-2.5 -mx-1 transition-colors duration-200 hover-elevate ${
                            active ? "bg-white/[0.04]" : ""
                          }`}
                        >
                          <span
                            aria-hidden
                            className="relative z-[1] mt-0.5 w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0 transition-transform duration-200 group-hover/item:scale-105"
                          >
                            <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                          </span>
                          <span className="relative z-[1] min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span
                                className={`t-h3 text-[15px] leading-tight transition-colors ${
                                  active
                                    ? "text-primary"
                                    : "text-foreground group-hover/item:text-primary"
                                }`}
                              >
                                {t(item.title)}
                              </span>
                              {item.badge && <Badge badge={item.badge} />}
                            </span>
                            <span className="block t-caption text-fg-secondary mt-0.5 truncate">
                              {t(item.desc)}
                            </span>
                          </span>
                          <ArrowUpRight
                            aria-hidden
                            className="relative z-[1] w-4 h-4 mt-1 text-fg-faint opacity-0 -translate-x-1 rtl:translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200 shrink-0 rtl:-scale-x-100"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {/* Featured panel — latest venture teaser */}
            <Link
              href="/ventures"
              onClick={onNavigate}
              className="group/feat relative flex flex-col justify-between p-6 lg:p-7 bg-primary-soft/40 overflow-hidden"
            >
              <div aria-hidden className="absolute inset-0 brand-aura opacity-80" />
              <div className="relative z-[1]">
                <span className="inline-flex items-center gap-1.5 eyebrow text-primary font-mono">
                  <Sparkles className="w-3 h-3" aria-hidden />
                  {t({ ar: "أحدث مشروع", en: "Latest venture" })}
                </span>
                <h3 className="t-h2 text-[clamp(1.5rem,2vw,1.9rem)] mt-4 leading-[1.05]">
                  {t({ ar: "مُستشارك", en: "Mushtasharak" })}
                </h3>
                <p className="t-caption text-fg-secondary mt-2 leading-relaxed">
                  {t({
                    ar: "منصّة إرشاد ذكيّة تربط روّاد غزّة بخبراء عالميّين.",
                    en: "A smart advisory platform linking Gaza founders to global experts.",
                  })}
                </p>
              </div>
              <span className="relative z-[1] inline-flex items-center gap-2 mt-6 t-caption font-semibold text-primary">
                {t({ ar: "استكشف المشاريع", en: "Explore ventures" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform duration-200 group-hover/feat:-translate-x-0.5 rtl:group-hover/feat:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ───────────────────────── HEADER ───────────────────────── */

export function Header() {
  const { lang, t } = useLanguage();
  const { nav, mobile } = useVisibleNav();
  const reduce = useReducedMotion();
  const cms = useContentSection("header", FALLBACK);
  const c = {
    ...cms,
    tagline: lang === "en" ? "Gaza · Palestine" : cms.tagline,
    ctaLabel: lang === "en" ? "Apply Now" : cms.ctaLabel,
    bookCtaLabel: lang === "en" ? "Book a Seat" : cms.bookCtaLabel,
    menuLabel: lang === "en" ? "Menu" : cms.menuLabel,
  };

  const [scrolledRaw, setScrolled] = useState(false);
  const [open, setOpen] = useState(false); // mobile overlay
  const [megaOpen, setMegaOpen] = useState(false); // desktop mega
  const [loc] = useLocation();
  const [hoveredNav, setHoveredNav] = useState<string | null>(null); // pill target
  const closeTimer = useRef<number | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobilePanelRef = useRef<HTMLDivElement | null>(null);

  // The sliding pill (PillNav): it rests on the current-page tab and glides to
  // whichever tab the pointer/focus is on. A shared layoutId lets framer-motion
  // animate the move; reduced-motion collapses it to an instant swap.
  const navKey = (entry: (typeof NAV_STRUCTURE)[number]) =>
    entry.mega ? `mega:${entry.label.en}` : entry.href!;
  const activeNavKey =
    nav.find((e) => !e.mega && isActive(loc, e.href))?.href ?? null;
  const pillKey = hoveredNav ?? activeNavKey;
  const navPill = (
    <motion.span
      layoutId="nav-pill"
      className="absolute inset-0 rounded-full bg-white/10"
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 36 }}
    />
  );

  // On routes other than the dark hero home, always render the blurred style so
  // the nav stays readable over content sections.
  const isHome = loc === "/" || loc === "";
  const scrolled = scrolledRaw || !isHome;

  // Slide the bar out of the way on scroll-down, bring it back on scroll-up.
  // Never while a menu is open, never near the top, never under reduced-motion.
  const scrollDir = useScrollDirection(8);
  const hidden = !reduce && scrollDir === "down" && !megaOpen && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close every menu on route change.
  useEffect(() => {
    setOpen(false);
    setMegaOpen(false);
  }, [loc]);

  // Lock body scroll while the full-screen mobile overlay is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus handoff for the mobile menu. It's a disclosure (the z-40 bar with the
  // search/close/lang controls stays interactive above the z-30 overlay), not a
  // modal — so instead of trapping focus we move it into the first menu link on
  // open and return it to the toggle on close. Escape already closes both menus.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      mobilePanelRef.current
        ?.querySelector<HTMLElement>('a[href],button:not([disabled])')
        ?.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      menuToggleRef.current?.focus();
    };
  }, [open]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  // Small grace delay so the pointer can travel from the trigger to the panel.
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 120);
  }, [cancelClose]);

  const openMega = useCallback(() => {
    cancelClose();
    setMegaOpen(true);
  }, [cancelClose]);

  // Escape closes both menus; click-outside closes the mega.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaOpen(false);
        setOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onClick);
    };
  }, []);

  const openSearch = useCallback(() => {
    window.dispatchEvent(new Event("ih:open-search"));
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${
        scrolled || megaOpen
          ? "bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 py-2.5"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container-ih flex items-center justify-between gap-4">
        {/* ── Logo lockup (preserved) ── */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-1 rounded-2xl bg-primary/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            <div className="relative w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-soft flex items-center justify-center p-1.5 group-hover:shadow-soft-hover transition-all duration-300">
              <img
                src={imageUrl(c.logo)}
                alt=""
                decoding="async"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="leading-tight">
            <div className="font-bold text-[15px] lg:text-[16px] tracking-tight text-white">
              {c.brand}
            </div>
            <div className="text-[10.5px] font-medium tracking-wide text-white/70">
              {c.tagline}
            </div>
          </div>
        </Link>

        {/* ── Desktop nav ── */}
        <nav
          ref={navRef}
          aria-label={t({ ar: "التنقّل الرئيسيّ", en: "Main navigation" })}
          className="hidden xl:flex flex-1 items-center justify-center gap-1 mx-2 min-w-0"
          onMouseLeave={() => setHoveredNav(null)}
        >
          {nav.map((entry) => {
            const key = navKey(entry);
            const highlighted = pillKey === key;
            if (entry.mega) {
              return (
                <div
                  key={entry.label.en}
                  className="relative"
                  onMouseEnter={() => {
                    openMega();
                    setHoveredNav(key);
                  }}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    type="button"
                    onClick={() => setMegaOpen((v) => !v)}
                    onFocus={() => {
                      openMega();
                      setHoveredNav(key);
                    }}
                    aria-expanded={megaOpen}
                    aria-haspopup="true"
                    className={`relative inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold transition-colors duration-200 ${
                      highlighted || megaOpen ? "text-white" : "text-white/85 hover:text-white"
                    }`}
                  >
                    {highlighted && navPill}
                    <span className="relative z-10 inline-flex items-center gap-1.5">
                      {t(entry.label)}
                      <ChevronDown
                        aria-hidden
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          megaOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>
                </div>
              );
            }
            const active = isActive(loc, entry.href);
            return (
              <Link
                key={entry.href}
                href={entry.href!}
                onMouseEnter={() => setHoveredNav(key)}
                onFocus={() => setHoveredNav(key)}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex items-center h-9 px-3.5 rounded-full text-[13px] font-semibold transition-colors duration-200 ${
                  highlighted || active ? "text-white" : "text-white/85 hover:text-white"
                }`}
              >
                {highlighted && navPill}
                <span className="relative z-10">{t(entry.label)}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── Desktop actions ── */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openSearch}
            aria-label={t({ ar: "بحث (⌘K)", en: "Search (⌘K)" })}
            title={t({ ar: "بحث", en: "Search" })}
            className="group inline-flex items-center gap-1.5 h-9 ps-3 pe-2 rounded-full text-[12px] font-medium transition-all duration-200 border border-white/15 bg-white/[0.06] backdrop-blur-md text-white/70 hover:text-white hover:bg-white/10"
          >
            <Search className="w-3.5 h-3.5" aria-hidden />
            <span className="hidden 2xl:inline-flex items-center gap-0.5 font-mono text-[10px] text-white/55 group-hover:text-white/75">
              <Command className="w-2.5 h-2.5" aria-hidden />K
            </span>
          </button>
          <LiveNewsDot />
          <LangToggle tone="onDark" />
          <Link
            href="/login"
            className="hidden xl:inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[12.5px] font-medium text-white/70 transition-colors duration-200 hover:text-white hover:bg-white/[0.06]"
          >
            <LogIn className="w-3.5 h-3.5 rtl:-scale-x-100" aria-hidden />
            {t({ ar: "دخول الأعضاء", en: "Member Login" })}
          </Link>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[12.5px] font-semibold transition-all duration-300 hover:scale-[1.03] bg-white/10 backdrop-blur-md border border-white/15 text-white hover:bg-white/15"
          >
            {c.bookCtaLabel}
          </Link>
          <Link
            href={c.ctaHref || "/apply"}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[12.5px] font-semibold transition-all duration-300 shadow-soft hover:scale-[1.03] cta-fill"
          >
            <span>{c.ctaLabel}</span>
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>

        {/* ── Mobile actions ── */}
        <div className="xl:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={openSearch}
            aria-label={t({ ar: "بحث", en: "Search" })}
            className="hidden sm:inline-flex w-11 h-11 rounded-full items-center justify-center border border-white/20 bg-white/10 backdrop-blur-md text-white"
          >
            <Search className="w-4 h-4" aria-hidden />
          </button>
          <span className="lg:hidden">
            <LiveNewsDot />
          </span>
          <LangToggle tone="onDark" />
          <button
            ref={menuToggleRef}
            onClick={() => setOpen((v) => !v)}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border border-white/20 bg-white/10 backdrop-blur-md text-white"
            aria-label={c.menuLabel}
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            data-testid="button-mobile-menu"
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Desktop mega-menu panel ── */}
      <AnimatePresence>
        {megaOpen && (
          <div
            className="hidden xl:block"
            onMouseEnter={openMega}
            onMouseLeave={scheduleClose}
          >
            <MegaPanel
              categories={nav.find((e) => e.mega)?.mega ?? []}
              loc={loc}
              onNavigate={() => setMegaOpen(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── Full-screen mobile overlay ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav-panel"
            ref={mobilePanelRef}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="xl:hidden fixed inset-0 top-0 z-30 bg-[#0a0a0a] flex flex-col"
          >
            <div aria-hidden className="absolute inset-0 brand-aura" />
            {/* Spacer matching the bar so big rows clear the logo/X. */}
            <div className="h-[72px] shrink-0" />

            <nav
              aria-label={t({ ar: "قائمة الجوّال", en: "Mobile menu" })}
              className="relative z-[1] flex-1 overflow-y-auto container-ih flex flex-col justify-center py-4"
            >
              <ul className="flex flex-col">
                {mobile.map((link, i) => {
                  const active = isActive(loc, link.href);
                  return (
                    <motion.li
                      key={link.href}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: reduce ? 0 : 0.12 + i * 0.05,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="group/row flex items-baseline gap-4 py-3 border-b border-white/10"
                      >
                        <span className="font-mono text-[13px] font-semibold text-primary tabular-nums shrink-0 w-9">
                          {navIndex(i, lang === "ar")}.
                        </span>
                        <span
                          className={`t-display text-[clamp(2rem,9vw,3rem)] leading-[1.02] flex-1 transition-colors ${
                            active
                              ? "text-primary"
                              : "text-foreground group-hover/row:text-primary"
                          }`}
                        >
                          {t(link.label)}
                        </span>
                        <ArrowUpRight
                          aria-hidden
                          className="w-6 h-6 self-center text-fg-faint shrink-0 transition-all duration-200 group-hover/row:text-primary group-hover/row:-translate-y-0.5 rtl:-scale-x-100"
                        />
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            {/* Bottom strip: language + Book + Apply */}
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: reduce ? 0 : 0.12 + mobile.length * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative z-[1] container-ih pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 border-t border-white/10"
            >
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mb-3 inline-flex items-center gap-2 text-[13.5px] font-medium text-white/70 transition-colors hover:text-white"
              >
                <LogIn className="w-4 h-4 rtl:-scale-x-100" aria-hidden />
                {t({ ar: "دخول الأعضاء", en: "Member Login" })}
              </Link>
              <div className="flex items-center gap-3">
                <LangToggle tone="onDark" />
                <Link
                  href="/book"
                  onClick={() => setOpen(false)}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-[52px] rounded-full bg-white/10 border border-white/15 text-white text-[14px] font-semibold"
                >
                  {c.bookCtaLabel}
                </Link>
                <Link
                  href={c.ctaHref || "/apply"}
                  onClick={() => setOpen(false)}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-[52px] rounded-full cta-fill text-[14px] font-semibold"
                >
                  <span>{c.ctaLabel}</span>
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
