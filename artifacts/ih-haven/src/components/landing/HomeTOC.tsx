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
 * HomeTOC — a whisper-quiet, sticky chapter index for the 5-act homepage. It
 * pins to the logical-START edge of the viewport (RIGHT in RTL / Arabic), pinned
 * vertically-centered, and lists the acts as tiny icon + numeral + label rows.
 *
 * A single IntersectionObserver watches every act anchor and highlights the
 * topmost one currently in view (terracotta / full-opacity); the rest stay
 * muted. Clicking a row smooth-scrolls to that act (instant under reduced-motion).
 *
 * Restraint by design: small, low-opacity at rest, brightening on hover — Apple
 * section-dot calm, not a heavy nav. Desktop (lg+) only; on smaller screens it
 * renders nothing (per spec: no fragile mobile bar). Every row is a real
 * <button> with a focus-visible ring and aria-current on the active act. It
 * sits at z-30 — above the z-10 content, below the fixed Header (z-40) and the
 * FloatingContact pill, which lives in the opposite corner and never overlaps.
 */
export function HomeTOC() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string>(ACTS[0].id);
  // Guard against the observer stomping the active item right after a click.
  const lockRef = useRef<number>(0);

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

  return (
    <nav
      data-testid="home-toc"
      aria-label={t({ ar: "فهرس الصفحة", en: "Page index" })}
      className="hidden lg:flex fixed top-1/2 -translate-y-1/2 start-4 xl:start-6 z-30 flex-col gap-0.5"
    >
      {ACTS.map((a) => {
        const Icon = a.icon;
        const isActive = a.id === active;
        const num = lang === "ar" ? toAr(a.num) : a.num;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => go(a.id)}
            aria-current={isActive ? "true" : undefined}
            title={t(a.label)}
            className={`group flex items-center gap-2.5 rounded-full py-1.5 pe-2.5 ps-2 text-start transition-[color,opacity] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              isActive
                ? "opacity-100"
                : "opacity-45 hover:opacity-90"
            }`}
          >
            {/* Marker dot — terracotta when active, faint when at rest. */}
            <span
              aria-hidden
              className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300 ${
                isActive
                  ? "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)]"
                  : "bg-fg-faint/60 group-hover:bg-primary/70"
              }`}
            />
            <Icon
              className={`h-3.5 w-3.5 shrink-0 transition-colors duration-300 ${
                isActive ? "text-primary" : "text-fg-faint group-hover:text-primary/70"
              }`}
            />
            <span
              className={`font-mono text-[10px] tabular-nums leading-none transition-colors duration-300 ${
                isActive ? "text-[hsl(var(--gold))]" : "text-fg-faint/80 group-hover:text-[hsl(var(--sand-bright))]"
              }`}
            >
              {num}
            </span>
            <span
              className={`whitespace-nowrap text-[11px] font-semibold leading-none transition-colors duration-300 ${
                isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/90"
              }`}
            >
              {t(a.label)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
