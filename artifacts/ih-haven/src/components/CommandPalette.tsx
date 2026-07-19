// ⌘K command palette — the keyboard-first way into Island Haven.
//
// Opens on Cmd/Ctrl+K or a global `ih:open-search` event (the header search
// button dispatches it). Closes on Escape or a backdrop click. Returns null
// when closed so it has zero layout impact.
//
// Empty query → "Quick links" (the shared NAV_STRUCTURE mega items + MOBILE_LINKS,
// deduped, plus the Apply / Book actions). Query ≥ 2 chars → debounced GET /search
// via the api() helper, grouped by entity. A flat index drives ArrowUp/Down + Enter
// navigation; the active row wears the gold/red accent.
//
// Bilingual (ar/en), RTL-safe, reduced-motion-safe, accessible (role=dialog,
// aria-label, focus trap).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Search as SearchIcon,
  ArrowLeft,
  CornerDownLeft,
  Award,
  Rocket,
  Layers,
  BookOpen,
  Users,
  Compass,
  Send,
  CalendarCheck,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { NAV_STRUCTURE, MOBILE_LINKS, type Bi } from "@/lib/nav";
import { EASE_OUT_EXPO } from "@/lib/motion";

/* ── Remote search result shapes (mirrors GET /search + the Search page). ── */
interface Hit {
  id: number;
  title: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  type?: string;
}
interface Results {
  experts: Hit[];
  ventures: Hit[];
  programs: Hit[];
  courses: Hit[];
  members: Hit[];
}

const RESULT_GROUPS: {
  key: keyof Results;
  label: Bi;
  icon: typeof Award;
  to: (h: Hit) => string;
}[] = [
  { key: "experts", label: { ar: "الخبراء", en: "Experts" }, icon: Award, to: (h) => `/experts/${h.id}` },
  { key: "ventures", label: { ar: "المشاريع", en: "Ventures" }, icon: Rocket, to: (h) => `/ventures/${h.id}` },
  { key: "programs", label: { ar: "البرامج", en: "Programs" }, icon: Layers, to: (h) => `/programs/${h.id}` },
  { key: "courses", label: { ar: "الكورسات والورشات", en: "Courses & Workshops" }, icon: BookOpen, to: (h) => `/courses/${h.id}` },
  { key: "members", label: { ar: "المنتسبون", en: "Members" }, icon: Users, to: (h) => `/u/${h.id}` },
];

/* ── A flat, navigable row. Both quick-links and remote hits collapse into
   this one shape so the keyboard index can cycle a single ordered list. ── */
interface PaletteRow {
  id: string; // stable React key + active-id
  title: string;
  subtitle?: string | null;
  href: string;
  icon: typeof Award;
  avatarUrl?: string | null;
  accent?: boolean; // primary (red) tint, e.g. the Apply action
}

interface PaletteGroup {
  key: string;
  label: Bi;
  rows: PaletteRow[];
}

/* ── Quick links — built from the SHARED nav data so the palette never drifts
   from the mega-menu / mobile menu, plus the two primary actions. ── */
function buildQuickLinks(t: (bi: Bi) => string): PaletteGroup[] {
  // Every destination the mega-menu exposes, in order, deduped by href.
  const seen = new Set<string>();
  const navRows: PaletteRow[] = [];

  const push = (label: Bi, href: string, icon: typeof Award, desc?: Bi) => {
    if (seen.has(href)) return;
    seen.add(href);
    navRows.push({
      id: `nav:${href}`,
      title: t(label),
      subtitle: desc ? t(desc) : null,
      href,
      icon,
    });
  };

  for (const entry of NAV_STRUCTURE) {
    if (entry.href) push(entry.label, entry.href, Compass);
    if (entry.mega) {
      for (const cat of entry.mega) {
        for (const item of cat.items) {
          push(item.title, item.href, NAV_ICON(item.icon), item.desc);
        }
      }
    }
  }
  // Fold in any mobile-only destinations the mega-menu didn't already cover.
  for (const link of MOBILE_LINKS) push(link.label, link.href, Compass);

  const actionRows: PaletteRow[] = [
    {
      id: "action:/apply",
      title: t({ ar: "سجّل طلبك", en: "Apply" }),
      subtitle: t({ ar: "انضمّ إلى الدفعة القادمة", en: "Join the next cohort" }),
      href: "/apply",
      icon: Send,
      accent: true,
    },
    {
      id: "action:/book",
      title: t({ ar: "احجز مقعدًا", en: "Book a seat" }),
      subtitle: t({ ar: "احجز جلسة أو مقعدًا في فعالية", en: "Reserve a session or event seat" }),
      href: "/book",
      icon: CalendarCheck,
    },
  ];

  return [
    { key: "actions", label: { ar: "إجراءات سريعة", en: "Quick actions" }, rows: actionRows },
    { key: "links", label: { ar: "روابط سريعة", en: "Quick links" }, rows: navRows },
  ];
}

/* Lucide icon names in nav.ts → the icons we actually import here. We keep a
   tiny map so the palette stays a thin module; anything unmapped falls back to
   the generic Compass glyph. */
function NAV_ICON(name: string): typeof Award {
  switch (name) {
    case "Layers": return Layers;
    case "Rocket": return Rocket;
    case "Users": return Users;
    case "Briefcase":
    case "Handshake": return Compass;
    case "FileText":
    case "Newspaper": return BookOpen;
    case "CalendarDays": return CalendarCheck;
    default: return Compass;
  }
}

const EMPTY_RESULTS: Results = { experts: [], ventures: [], programs: [], courses: [], members: [] };

export function CommandPalette() {
  const { lang, dir, t } = useLanguage();
  const reduce = useReducedMotion();
  const [, navigate] = useLocation();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const term = query.trim();

  /* ── Open / close plumbing — Cmd/Ctrl+K and the header's custom event. ── */
  const openPalette = useCallback(() => {
    restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    // Return focus to whatever opened the palette (the search button / page).
    const el = restoreFocusRef.current;
    if (el && typeof el.focus === "function") {
      window.requestAnimationFrame(() => el.focus());
    }
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        setOpen((prev) => {
          if (prev) return prev; // already open — leave it
          restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null;
          return true;
        });
      }
    }
    function onOpenEvent() {
      openPalette();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("ih:open-search", onOpenEvent as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ih:open-search", onOpenEvent as EventListener);
    };
  }, [openPalette]);

  /* ── Reset transient state + focus the input each time we open. Lock body
     scroll while open so the page behind doesn't move under the overlay. ── */
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    setResults(null);
    setError(null);
    setLoading(false);
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  /* ── Debounced remote search (≥ 2 chars). Mirrors the Search page contract. ── */
  useEffect(() => {
    if (!open) return;
    if (term.length < 2) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      api<Results & { q?: string }>(`/search?q=${encodeURIComponent(term)}`)
        .then((r) => {
          if (cancelled) return;
          setResults({
            experts: r.experts ?? [],
            ventures: r.ventures ?? [],
            programs: r.programs ?? [],
            courses: r.courses ?? [],
            members: r.members ?? [],
          });
          setError(null);
        })
        .catch(() => {
          // Never surface the raw server message ("HTTP 500") — a calm, localized
          // line, and the static quick-links stay visible below it (see render).
          if (!cancelled) {
            setError(t({ ar: "تعذّر البحث، حاول لاحقًا", en: "Search failed. Please try again later." }));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, open]);

  /* ── The visible groups: quick links when empty, remote hits otherwise. ── */
  const quickLinks = useMemo(() => buildQuickLinks(t), [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups: PaletteGroup[] = useMemo(() => {
    // Empty query OR a search failure → the static quick-links, so navigation
    // always works even when /search is down (the error note renders above them).
    if (term.length < 2 || error) return quickLinks;
    const r = results ?? EMPTY_RESULTS;
    return RESULT_GROUPS.map((g) => {
      const items = r[g.key] ?? [];
      return {
        key: g.key,
        label: g.label,
        rows: items.map<PaletteRow>((h) => ({
          id: `${g.key}:${h.id}`,
          title: h.title,
          subtitle: h.subtitle ?? null,
          href: g.to(h),
          icon: g.icon,
          avatarUrl: h.avatarUrl ?? null,
        })),
      };
    }).filter((g) => g.rows.length > 0);
  }, [term, results, quickLinks, error]);

  // Flat ordered list — the single source of truth for keyboard navigation.
  const flatRows = useMemo(() => groups.flatMap((g) => g.rows), [groups]);

  // Keep the active index in range whenever the result set changes.
  useEffect(() => {
    setActive((a) => (flatRows.length === 0 ? 0 : Math.min(a, flatRows.length - 1)));
  }, [flatRows.length]);

  const go = useCallback(
    (href: string) => {
      closePalette();
      navigate(href);
    },
    [closePalette, navigate],
  );

  /* ── Keyboard nav inside the panel: cycle rows, Enter to go, Escape to close,
     Tab kept inside the panel (focus trap). ── */
  const onPanelKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePalette();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (flatRows.length) setActive((a) => (a + 1) % flatRows.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (flatRows.length) setActive((a) => (a - 1 + flatRows.length) % flatRows.length);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        setActive(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        if (flatRows.length) setActive(flatRows.length - 1);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const row = flatRows[active];
        if (row) go(row.href);
        return;
      }
      // Focus trap: keep Tab within the panel (only the input is tabbable here).
      if (e.key === "Tab") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    },
    [active, flatRows, closePalette, go],
  );

  // Scroll the active row into view as the selection moves.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  if (!open) return null;

  const overlayDur = reduce ? 0 : 0.18;
  const panelDur = reduce ? 0 : 0.26;
  const total = flatRows.length;

  return (
    <AnimatePresence>
      <motion.div
        key="ih-cmdk"
        className="fixed inset-0 z-[200] flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: overlayDur, ease: EASE_OUT_EXPO }}
        dir={dir}
      >
        {/* Backdrop — blur + dim. Click anywhere off the panel to dismiss. */}
        <button
          type="button"
          aria-label={t({ ar: "إغلاق البحث", en: "Close search" })}
          onClick={closePalette}
          className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-default"
          tabIndex={-1}
        />

        {/* Centered panel, top ≈ 15vh. */}
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t({ ar: "البحث في آيلاند هيفن", en: "Search Island Haven" })}
          onKeyDown={onPanelKeyDown}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.985 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.985 }}
          transition={{ duration: panelDur, ease: EASE_OUT_EXPO }}
          style={{ marginTop: "15vh" }}
          className="card-base relative z-10 w-[calc(100%-2rem)] max-w-[640px] h-fit max-h-[70vh] flex flex-col overflow-hidden"
        >
          {/* ── Search row ── */}
          <div className="relative flex items-center border-b border-border-strong/70 px-4">
            <SearchIcon
              className={`pointer-events-none w-5 h-5 shrink-0 transition-colors ${
                term.length >= 2 ? "text-primary" : "text-fg-faint"
              }`}
              aria-hidden
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              role="combobox"
              aria-expanded="true"
              aria-controls="ih-cmdk-list"
              aria-activedescendant={flatRows[active]?.id}
              aria-autocomplete="list"
              placeholder={t({ ar: "ابحث في آيلاند هيفن…", en: "Search Island Haven…" })}
              className="w-full h-14 bg-transparent px-3 text-foreground text-[16px] tracking-tight placeholder-fg-faint outline-none border-0"
              data-testid="input-command-palette"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 shrink-0 font-mono text-[10px] tracking-[0.12em] text-muted-foreground border border-border-strong rounded-md px-1.5 py-1 rtl:tracking-normal">
              ESC
            </kbd>
          </div>

          {/* ── Results / quick links ── */}
          <div
            ref={listRef}
            id="ih-cmdk-list"
            className="flex-1 overflow-y-auto overscroll-contain p-2"
          >
            {error && (
              <div className="px-3 py-2.5 mb-1 text-center text-destructive text-[13px] border-b border-border-strong/40">
                {error}
              </div>
            )}
            {loading && !results && !error ? (
              <div className="space-y-2 p-1.5" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl border border-border-strong skeleton-shimmer"
                    style={{ opacity: 1 - i * 0.16 }}
                  />
                ))}
              </div>
            ) : total === 0 ? (
              <div className="px-3 py-10 text-center">
                <p className="text-foreground text-[14.5px] font-semibold">
                  {term.length >= 2
                    ? t({ ar: "لا نتائج", en: "No results" })
                    : t({ ar: "ابدأ بالكتابة", en: "Start typing" })}
                </p>
                <p className="text-muted-foreground text-[12.5px] mt-1.5">
                  {term.length >= 2
                    ? lang === "ar"
                      ? `لم نجد شيئًا لـ «${term}».`
                      : `Nothing found for “${term}”.`
                    : t({ ar: "ابحث في الخبراء والمشاريع والبرامج والمنتسبين.", en: "Search experts, ventures, programs and members." })}
                </p>
              </div>
            ) : (
              <div>
                {groups.map((group) => (
                <div key={group.key} className="mb-1 last:mb-0">
                  {/* Category header — gold (secondary) micro-label. Sits OUTSIDE the
                     per-group listbox so the listbox keeps its option-only children. */}
                  <div className="flex items-center gap-2 px-3 pt-3 pb-1.5" aria-hidden>
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-sand rtl:tracking-normal rtl:text-[12px]">
                      {t(group.label)}
                    </span>
                    <span className="hairline-sand flex-1" />
                    <span className="text-sand text-[11px] font-semibold tabular-nums">{group.rows.length}</span>
                  </div>

                  <div role="listbox" aria-label={t(group.label)} className="space-y-0.5">
                    {group.rows.map((row) => {
                      const flatIndex = flatRows.findIndex((r) => r.id === row.id);
                      const isActive = flatIndex === active;
                      const Icon = row.icon;
                      return (
                        <button
                          key={row.id}
                          id={row.id}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          data-row-index={flatIndex}
                          data-testid={`cmdk-row-${row.id}`}
                          onMouseMove={() => {
                            if (!isActive) setActive(flatIndex);
                          }}
                          onClick={() => go(row.href)}
                          className={`group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors outline-none ${
                            isActive
                              ? "bg-primary/[0.08] ring-1 ring-primary/40 border-e-2 border-primary"
                              : "border-e-2 border-transparent hover:bg-white/[0.04]"
                          }`}
                        >
                          {row.avatarUrl ? (
                            <img loading="lazy" decoding="async"
                              src={row.avatarUrl}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-border-strong shrink-0"
                            />
                          ) : (
                            <span
                              className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                row.accent || isActive
                                  ? "bg-primary-soft border-primary/30 text-primary"
                                  : "bg-surface-3 border-border-strong text-muted-foreground"
                              }`}
                            >
                              <Icon className="w-[18px] h-[18px]" aria-hidden />
                            </span>
                          )}

                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-[14px] font-semibold tracking-tight transition-colors ${
                                isActive ? "text-primary" : "text-foreground"
                              } ${row.accent && !isActive ? "text-primary" : ""}`}
                            >
                              {row.title}
                            </span>
                            {row.subtitle ? (
                              <span className="block truncate text-[12px] text-muted-foreground mt-0.5">
                                {row.subtitle}
                              </span>
                            ) : null}
                          </span>

                          {isActive ? (
                            <CornerDownLeft className="w-4 h-4 text-primary shrink-0 rtl:-scale-x-100" aria-hidden />
                          ) : (
                            <ArrowLeft className="w-4 h-4 text-fg-faint shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180" aria-hidden />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Footer hint bar — keyboard legend, gold/red accents. ── */}
          <div className="flex items-center justify-between gap-3 border-t border-border-strong/70 px-4 py-2.5">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <kbd className="font-mono text-[10px] border border-border-strong rounded px-1 py-0.5">↑↓</kbd>
                <span className="hidden xs:inline">{t({ ar: "تنقّل", en: "Navigate" })}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <kbd className="font-mono text-[10px] border border-border-strong rounded px-1 py-0.5 inline-flex items-center">
                  <CornerDownLeft className="w-3 h-3 rtl:-scale-x-100" aria-hidden />
                </kbd>
                <span className="hidden xs:inline">{t({ ar: "فتح", en: "Open" })}</span>
              </span>
            </div>
            {total > 0 ? (
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-sand tabular-nums rtl:tracking-normal">
                {lang === "ar"
                  ? `${total} ${total === 1 ? "نتيجة" : "نتائج"}`
                  : `${total} ${total === 1 ? "result" : "results"}`}
              </span>
            ) : (
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-fg-faint rtl:tracking-normal">
                {t({ ar: "آيلاند هيفن", en: "Island Haven" })}
              </span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
