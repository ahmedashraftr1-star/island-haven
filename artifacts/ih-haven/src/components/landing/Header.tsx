import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useDialogA11y } from "@/hooks/use-dialog-a11y";
import { Btn } from "@/components/ui/Btn";
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
  APPLY_CTA,
  type MegaCategory,
  type NavBadge,
} from "@/lib/nav";
import { useVisibleNav } from "@/hooks/use-visible-nav";

const FALLBACK = {
  logo: "/logo.png",
  brand: "Island Haven",
  tagline: "آيلاند هيفن · غزّة",
  ctaLabel: APPLY_CTA.ar,
  ctaHref: "/apply",
  bookCtaLabel: "احجز مقعدك",
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
          ? "bg-primary-soft text-primary-bright border border-primary/30"
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
  id,
  ariaLabel,
  onMouseEnter,
  onMouseLeave,
}: {
  categories: MegaCategory[];
  loc: string;
  onNavigate: () => void;
  id?: string;
  ariaLabel?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  return (
    // The semantic container (id + role) IS this real, sized panel — not a
    // collapsed 0-height wrapper. It's an absolute dropdown (overlays the hero, no
    // CLS), lifted above it with z-50, and caps its height on short viewports so it
    // scrolls instead of clipping. Entry/exit ≤180ms, reduced-motion respected.
    <motion.div
      id={id}
      role="region"
      aria-label={ariaLabel}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="hidden xl:block absolute inset-x-0 top-full pt-3 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto"
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
                          aria-current={active ? "page" : undefined}
                          className={`group/item flex items-start gap-3.5 rounded-2xl p-2.5 -mx-1 transition-colors duration-200 hover-elevate ${
                            active ? "bg-primary/[0.1] ring-1 ring-inset ring-primary/25" : ""
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`relative z-[1] mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover/item:scale-105 ${
                              active ? "bg-primary text-white" : "bg-primary-soft text-primary"
                            }`}
                          >
                            <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                          </span>
                          <span className="relative z-[1] min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span
                                className={`t-h3 text-[15px] leading-tight transition-colors ${
                                  active
                                    ? "text-primary-bright"
                                    : "text-foreground group-hover/item:text-primary-bright"
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
  const { nav } = useVisibleNav();
  const reduce = useReducedMotion();
  const cms = useContentSection("header", FALLBACK);
  const c = {
    ...cms,
    tagline: lang === "en" ? "Gaza · Palestine" : cms.tagline,
    // The apply LABEL is code-owned so it stays the ONE canonical string across
    // header, mobile menu, drawer, footer and palette (APPLY_CTA) — a stale CMS
    // override must not reintroduce drift. The compact header keeps a short
    // English label by design (same pattern as "Book a Seat"). The DESTINATION
    // (ctaHref) still comes from the CMS via ...cms — destinations are untouched.
    ctaLabel: lang === "en" ? "Apply" : APPLY_CTA.ar,
    bookCtaLabel: lang === "en" ? "Book a Seat" : "احجز مقعدك",
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
  // The mobile overlay is a real full-screen MODAL: useDialogA11y gives it a focus
  // trap, Escape-to-close, focus-in-on-open, focus-restore-to-the-toggle on close,
  // and a body-scroll lock — engaged only while `open`. It is portalled to <body>
  // (below) so it escapes the <header>'s transform, which was making its
  // `fixed inset-0` size to the 52px bar instead of the viewport.
  const closeMobile = useCallback(() => setOpen(false), []);
  const mobilePanelRef = useDialogA11y(closeMobile, open);

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

  // (Body-scroll lock + focus trap/handoff for the mobile overlay are handled by
  // useDialogA11y above — no bespoke effects needed here.)

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
                aria-hidden="true"
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
                    id="mega-explore-trigger"
                    // Click OPENS reliably. Previously it toggled, which fought the
                    // hover-open (mouseenter set it open, the same click flipped it
                    // shut) so it read as "never opens". Hover keeps opening; Escape,
                    // click-outside, pointer-leave, or selecting a link all close it.
                    onClick={() => setMegaOpen(true)}
                    onFocus={() => {
                      openMega();
                      setHoveredNav(key);
                    }}
                    aria-expanded={megaOpen}
                    aria-haspopup="true"
                    aria-controls="mega-explore-panel"
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
          {/* The three header actions share ONE box — Btn size sm (h-9 · px-4 · pill)
              with a single variant each: login=ghost, book=secondary, apply=primary.
              (Ghost's compact-link compound is overridden back to h-9 px-4 so all
              three read as the same 36px pill.) The hero CTA stays excluded. */}
          <Btn asChild variant="ghost" size="sm" className="hidden xl:inline-flex h-9 px-4 text-white/70 text-[12.5px]">
            <Link href="/login">
              <LogIn className="w-3.5 h-3.5 rtl:-scale-x-100" aria-hidden />
              {t({ ar: "دخول الأعضاء", en: "Member Login" })}
            </Link>
          </Btn>
          <Btn asChild variant="secondary" size="sm" className="text-[12.5px]">
            <Link href="/book">{c.bookCtaLabel}</Link>
          </Btn>
          <Btn asChild variant="primary" size="sm" className="text-[12.5px] shadow-soft">
            <Link href={c.ctaHref || "/apply"}>
              <span>{c.ctaLabel}</span>
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </Btn>
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
          <MegaPanel
            id="mega-explore-panel"
            ariaLabel={t({ ar: "قائمة الاستكشاف", en: "Explore menu" })}
            onMouseEnter={openMega}
            onMouseLeave={scheduleClose}
            categories={nav.find((e) => e.mega)?.mega ?? []}
            loc={loc}
            onNavigate={() => setMegaOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Full-screen mobile overlay — a real modal, PORTALLED to <body> ──
          so it escapes the <header>'s transform (which was sizing its
          `fixed inset-0` to the 52px bar). z-[60] sits above the z-40 bar, so it
          carries its OWN top bar with logo + close button. */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-nav-panel"
              ref={mobilePanelRef}
              role="dialog"
              aria-modal="true"
              aria-label={t({ ar: "قائمة التنقّل", en: "Navigation menu" })}
              initial={reduce ? { opacity: 0 } : { y: "100%" }}
              animate={reduce ? { opacity: 1 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : { y: "100%" }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="xl:hidden fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col"
            >
              <div aria-hidden className="absolute inset-0 brand-aura" />
              {/* Own top bar (logo + close) — the header bar is behind this modal. */}
              <div className="relative z-[1] container-ih flex items-center justify-between h-[72px] shrink-0">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <span className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center p-1.5">
                    <img src={imageUrl(c.logo)} alt="" aria-hidden="true" decoding="async" className="w-full h-full object-contain" />
                  </span>
                  <span className="font-bold text-[15px] tracking-tight text-white">{c.brand}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t({ ar: "إغلاق القائمة", en: "Close menu" })}
                  className="w-11 h-11 rounded-full flex items-center justify-center border border-white/20 bg-white/10 backdrop-blur-md text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            <nav
              aria-label={t({ ar: "قائمة الجوّال", en: "Mobile menu" })}
              className="relative z-[1] flex-1 overflow-y-auto"
            >
              {/* min-h-full centres the list when it fits, but lets it grow and
                  scroll when it doesn't — plain `justify-center` on the scroll
                  container clipped the top rows out of reach on short screens. */}
              {/* Grouped like the desktop mega (For Founders / Network / About) —
                  each item an icon-tile + title + one-line description + NEW badge,
                  the active page highlighted (aria-current). Rows stagger in on open
                  and collapse to an instant render under reduced-motion. */}
              <div className="container-ih py-5 space-y-7">
                {(nav.find((e) => e.mega)?.mega ?? []).map((cat, ci) => (
                  <section key={cat.label.en}>
                    <div className="eyebrow eyebrow-sand font-mono mb-3 px-1.5">
                      {t(cat.label)}
                    </div>
                    <ul className="space-y-1.5">
                      {cat.items.map((item, ii) => {
                        const Icon = ICONS[item.icon] ?? Sparkles;
                        const active = isActive(loc, item.href);
                        return (
                          <motion.li
                            key={item.href}
                            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.38,
                              delay: reduce ? 0 : 0.08 + ci * 0.06 + ii * 0.035,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                          >
                            <Link
                              href={item.href}
                              onClick={() => setOpen(false)}
                              aria-current={active ? "page" : undefined}
                              className={`group/mi flex items-center gap-3.5 rounded-2xl p-2.5 min-h-[56px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                                active
                                  ? "bg-primary/[0.12] ring-1 ring-inset ring-primary/25"
                                  : "hover:bg-white/[0.05] active:bg-white/[0.08]"
                              }`}
                            >
                              <span
                                aria-hidden
                                className={`grid place-items-center w-11 h-11 rounded-xl shrink-0 transition-colors duration-200 ${
                                  active
                                    ? "bg-primary text-white"
                                    : "bg-primary-soft text-primary group-hover/mi:scale-105 motion-reduce:group-hover/mi:scale-100"
                                }`}
                              >
                                <Icon className="w-[19px] h-[19px]" strokeWidth={2} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                  <span
                                    className={`text-[15.5px] font-semibold leading-tight transition-colors ${
                                      active ? "text-primary-bright" : "text-foreground group-hover/mi:text-primary-bright"
                                    }`}
                                  >
                                    {t(item.title)}
                                  </span>
                                  {item.badge && <Badge badge={item.badge} />}
                                </span>
                                <span className="block text-[12.5px] text-fg-secondary mt-0.5 truncate">
                                  {t(item.desc)}
                                </span>
                              </span>
                            </Link>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            </nav>

            {/* Bottom strip: language + Book + Apply */}
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: reduce ? 0 : 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative z-[1] container-ih pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 border-t border-white/10 space-y-3"
            >
              {/* Full-width primary + secondary CTAs stack — never squeezed onto
                  one crowded row (a longer apply label would wrap onto two lines
                  on narrow phones). Login + language sit on their own compact row. */}
              <Btn asChild variant="primary" size="lg" className="w-full whitespace-nowrap">
                <Link href={c.ctaHref || "/apply"} onClick={() => setOpen(false)}>
                  <span>{c.ctaLabel}</span>
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                </Link>
              </Btn>
              <Btn asChild variant="secondary" size="lg" className="w-full whitespace-nowrap">
                <Link href="/book" onClick={() => setOpen(false)}>{c.bookCtaLabel}</Link>
              </Btn>
              <div className="flex items-center justify-between gap-3 pt-1">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 text-[13.5px] font-medium text-white/70 transition-colors hover:text-white"
                >
                  <LogIn className="w-4 h-4 rtl:-scale-x-100" aria-hidden />
                  {t({ ar: "دخول الأعضاء", en: "Member Login" })}
                </Link>
                <LangToggle tone="onDark" />
              </div>
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </header>
  );
}
