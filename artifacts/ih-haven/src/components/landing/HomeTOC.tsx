import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Sparkles, Hammer, Gift, MapPin, DoorOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toAr = (s: string) => s.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

/** The five narrative acts, in page order. Each `id` is an anchor rendered in
 *  Home.tsx that the observer watches; `num` is the two-digit act numeral (gold). */
interface Act {
  id: string;
  num: string;
  icon: LucideIcon;
  label: { ar: string; en: string };
}

const ACTS: Act[] = [
  { id: "act-0", num: "0", icon: Sparkles, label: { ar: "الافتتاح", en: "Opening" } },
  { id: "act-1", num: "1", icon: Hammer, label: { ar: "العمل", en: "The Work" } },
  { id: "act-2", num: "2", icon: Gift, label: { ar: "ما تحصل عليه", en: "What you get" } },
  { id: "act-3", num: "3", icon: MapPin, label: { ar: "المكان والناس", en: "Place & People" } },
  { id: "act-4", num: "4", icon: DoorOpen, label: { ar: "انضمّ", en: "Join" } },
];

/**
 * HomeTOC — a whisper-quiet, sticky chapter index for the 5-act homepage,
 * shaped as a COMPACT EDGE RAIL that lives entirely inside the outer page
 * margin so it can NEVER overlap the centered container content at any width.
 *
 * The homepage is full-bleed: section backgrounds run edge-to-edge but their
 * content is boxed in a centered `container-ih` (max-width 1280, padding-inline
 * up to 3rem). The rail is flush to the logical-START edge (`start-2` → RIGHT in
 * RTL) and, AT REST, shows only a tiny marker dot + the gold two-digit numeral —
 * so its resting footprint is ~2.25rem, small enough to sit inside even the
 * container's own inline padding. Nothing is required to overlap content.
 *
 * On HOVER or keyboard FOCUS of an act, its icon + label bloom out as an
 * absolutely-positioned popout that expands toward the logical-END (leftward in
 * RTL) into the open canvas — opacity/transform only, on the same solid
 * dark-glass panel so it reads. The popout is purely additive: it reserves no
 * layout space at rest and is never needed for basic use, because the ACTIVE
 * act stays highlighted at rest (terracotta dot + gold numeral) so the reader
 * always sees where they are without hovering.
 *
 * A single IntersectionObserver watches every act anchor and highlights the
 * topmost one currently in view. Clicking smooth-scrolls (instant under
 * reduced-motion). Desktop (lg+) only; smaller screens render nothing (per
 * spec: no fragile mobile bar). Every act is a real <button> carrying its name
 * in `aria-label`/`title` (so the collapsed label stays accessible), with a
 * focus-visible ring and `aria-current` on the active act. z-30 — above the
 * z-10 content, below the fixed Header (z-40) and the FloatingContact pill,
 * which lives in the opposite corner and never overlaps.
 */
export function HomeTOC() {
  const { t, lang, dir } = useLanguage();
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string>(ACTS[0].id);
  // Deliberate Apple-style reveal: the rail stays hidden while the busy hero
  // photo fills the viewport (where it was illegible), then fades + slides in
  // once the user scrolls past the hero into the first dark content section.
  const [revealed, setRevealed] = useState(false);
  // Guard against the observer stomping the active item right after a click.
  const lockRef = useRef<number>(0);

  // Reveal gate — watch the full-height hero section. While any part of it is on
  // screen the rail is hidden; once it fully leaves the viewport we reveal, and
  // scrolling back up to the hero hides it again.
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      // No hero on the page (e.g. an inner route) — default to shown.
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setRevealed(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const els = ACTS.map((a) => document.getElementById(a.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (els.length === 0) return;

    // Track intersecting anchors; the active act is the topmost among them.
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        }
        if (visible.size === 0) return;
        let topId = "";
        let topOffset = Infinity;
        for (const [id, top] of visible) {
          if (top < topOffset) {
            topOffset = top;
            topId = id;
          }
        }
        if (topId) setActive(topId);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    // Brief lock so the scroll-spy doesn't fight the smooth-scroll mid-flight.
    lockRef.current = Date.now() + (reduce ? 0 : 700);
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  // Hidden resting transform: slide slightly IN from the logical-start edge.
  // Start edge is RIGHT in RTL (translate +X) / LEFT in LTR (translate -X).
  // Reduced-motion drops the slide entirely — it just appears in place.
  const hiddenShift = reduce ? "0px" : dir === "rtl" ? "12px" : "-12px";

  // Resting X-offset of the hover/focus popout. It nudges toward the rail (the
  // logical-START edge) so, on reveal, the panel appears to bloom OUT into the
  // content-side canvas: +X in RTL (start = right), −X in LTR (start = left).
  // group-hover/focus zero it via `translate-x-0`. Reduced-motion drops the
  // slide (translate-x-0 at rest) — the popout just fades in.
  const popRestX = reduce ? "translate-x-0" : dir === "rtl" ? "translate-x-1.5" : "-translate-x-1.5";

  return (
    <nav
      data-testid="home-toc"
      aria-label={t({ ar: "فهرس الصفحة", en: "Page index" })}
      aria-hidden={revealed ? undefined : true}
      style={{
        transform: `translateY(-50%) translateX(${revealed ? "0px" : hiddenShift})`,
        opacity: revealed ? 1 : 0,
        transition: reduce
          ? "opacity 0.2s linear"
          : "opacity 500ms cubic-bezier(0.16,1,0.3,1), transform 500ms cubic-bezier(0.16,1,0.3,1)",
      }}
      className={`hidden lg:flex fixed top-1/2 start-2 z-30 flex-col gap-0.5 rounded-2xl border border-[hsl(var(--gold)/0.16)] bg-[#0a0a0c]/[0.78] p-1 shadow-[0_12px_36px_-10px_rgba(0,0,0,0.78)] backdrop-blur-md ${
        revealed ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {ACTS.map((a) => {
        const Icon = a.icon;
        const isActive = a.id === active;
        const num = lang === "ar" ? toAr(a.num) : a.num;
        const name = t(a.label);
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => go(a.id)}
            aria-current={isActive ? "true" : undefined}
            aria-label={name}
            title={name}
            className="group relative flex items-center gap-1.5 rounded-full py-1.5 pe-1.5 ps-2 text-start transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]"
          >
            {/* ── Resting rail: dot + gold numeral ONLY (tiny footprint, lives in
                the page margin). Active act stays lit so location is legible
                without hovering. ── */}
            {/* Marker dot — terracotta when active, readable-muted at rest. */}
            <span
              aria-hidden
              className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300 ${
                isActive
                  ? "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)]"
                  : "bg-white/40 group-hover:bg-primary/70"
              }`}
            />
            <span
              className={`font-mono text-[10px] tabular-nums leading-none transition-colors duration-300 ${
                isActive
                  ? "text-[hsl(var(--gold))]"
                  : "text-white/55 group-hover:text-[hsl(var(--sand-bright))]"
              }`}
            >
              {num}
            </span>
            {/* ── Hover/focus popout: icon + label, on the SAME dark-glass panel,
                growing toward the logical-END (leftward in RTL) into open
                canvas. Reserves NO resting space (absolute) and never overlaps
                content at rest. Opacity/transform only; reduced-motion drops the
                slide. aria-hidden — the accessible name lives on the button. ── */}
            <span
              aria-hidden
              className={`pointer-events-none absolute end-full top-1/2 z-10 me-1 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[hsl(var(--gold)/0.16)] bg-[#0a0a0c]/[0.9] py-1.5 pe-3 ps-2.5 opacity-0 shadow-[0_12px_36px_-10px_rgba(0,0,0,0.85)] backdrop-blur-md transition-[opacity,transform] duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 ${popRestX}`}
            >
              <Icon
                className={`h-3.5 w-3.5 shrink-0 ${
                  isActive ? "text-primary" : "text-primary/80"
                }`}
              />
              <span className="text-[11px] font-semibold leading-none text-white">
                {name}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
