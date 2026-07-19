import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import LineSidebar from "@/components/ui/LineSidebar";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toAr = (s: string) => s.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

/** The five narrative acts, in page order. Each `id` is an anchor rendered in
 *  Home.tsx that the scroll-spy observes; labels are bilingual (from spec). */
const ACTS: { id: string; label: { ar: string; en: string } }[] = [
  { id: "act-0", label: { ar: "الافتتاح", en: "Intro" } },
  { id: "act-1", label: { ar: "العمل", en: "Work" } },
  { id: "act-2", label: { ar: "ما تحصل عليه", en: "What You Get" } },
  { id: "act-3", label: { ar: "المكان والناس", en: "Place & People" } },
  { id: "act-4", label: { ar: "انضمّ", en: "Join" } },
];

/**
 * HomeTOC — the homepage's chapter rail, rendered in the "Line Sidebar" style
 * (React Bits): each act shows a zero-padded numeral + a lit hairline marker,
 * and as the cursor nears an item its label slides in and colours toward gold
 * (a single rAF proximity lerp inside LineSidebar). The accent is the same gold
 * as the NarrativeThread (#DDBD7E) with a soft glow on the active act, so the
 * rail reads as a branch of that thread — one coherent gold system.
 *
 * It doubles as a scroll-spy + jump nav: a single IntersectionObserver watches
 * the five act anchors and drives the CONTROLLED activeIndex (topmost in view);
 * clicking an item smooth-scrolls to its section (instant under reduced-motion).
 *
 * Reveal: hidden while the busy hero fills the viewport (where a rail would be
 * illegible), then fades + slides in once the reader scrolls into the dark
 * content. Bilingual + fully RTL-mirrored (LineSidebar.css handles the mirror;
 * numerals switch to Arabic-Indic in AR). Shown on wide screens only — full
 * labels from 2xl (there's outer-margin room), numerals+markers on xl, hidden
 * below xl (no fragile mobile bar). a11y: LineSidebar items are role="button"
 * with aria-current + keyboard (Enter/Space); the whole rail respects
 * prefers-reduced-motion (proximity easing collapses to an instant snap).
 */
export function HomeTOC() {
  const { t, lang, dir } = useLanguage();
  const reduce = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  // Guard against the scroll-spy stomping the active item right after a click.
  const lockRef = useRef(0);

  // Reveal gate — while any part of the full-height hero is on screen the rail
  // stays hidden; once it leaves we reveal, and scrolling back up hides it again.
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
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

  // Scroll-spy — the active act is the topmost anchor currently in view.
  useEffect(() => {
    const idToIndex = new Map(ACTS.map((a, i) => [a.id, i]));
    const els = ACTS.map((a) => document.getElementById(a.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (els.length === 0) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
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
        const idx = idToIndex.get(topId);
        if (idx != null) setActiveIdx(idx);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const go = (index: number) => {
    const el = document.getElementById(ACTS[index].id);
    if (!el) return;
    setActiveIdx(index);
    // Brief lock so the scroll-spy doesn't fight the smooth-scroll mid-flight.
    lockRef.current = Date.now() + (reduce ? 0 : 700);
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const items = ACTS.map((a) => t(a.label));
  const formatIndex = (i: number) => {
    const two = String(i + 1).padStart(2, "0");
    return lang === "ar" ? toAr(two) : two;
  };

  // Hidden resting slide: nudge IN from the logical-start edge (RIGHT in RTL →
  // +X, LEFT in LTR → −X). Reduced-motion drops the slide — it just appears.
  const hiddenShift = reduce ? "0px" : dir === "rtl" ? "14px" : "-14px";

  return (
    <div
      data-testid="home-toc"
      aria-hidden={revealed ? undefined : true}
      style={{
        transform: `translateY(-50%) translateX(${revealed ? "0px" : hiddenShift})`,
        opacity: revealed ? 1 : 0,
        transition: reduce
          ? "opacity 0.2s linear"
          : "opacity 500ms cubic-bezier(0.16,1,0.3,1), transform 500ms cubic-bezier(0.16,1,0.3,1)",
      }}
      className={`home-rail hidden xl:block fixed top-1/2 start-3 2xl:start-7 z-30 ${
        revealed ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <LineSidebar
        items={items}
        activeIndex={activeIdx}
        defaultActive={0}
        onItemClick={go}
        formatIndex={formatIndex}
        ariaLabel={t({ ar: "فهرس الصفحة", en: "Page index" })}
        accentColor="#DDBD7E"
        textColor="rgba(240,234,225,0.42)"
        markerColor="rgba(255,255,255,0.20)"
        proximityRadius={100}
        maxShift={26}
        falloff="smooth"
        markerLength={48}
        tickScale={0.5}
        scaleTick
        itemGap={22}
        fontSize={0.9}
        smoothing={100}
      />
    </div>
  );
}
