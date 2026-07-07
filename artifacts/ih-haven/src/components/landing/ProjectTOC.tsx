import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface TOCSection {
  id: string;
  icon: LucideIcon;
  /** Bilingual label for the section. */
  label: { ar: string; en: string };
}

/**
 * ProjectTOC — a sticky editorial index for the case study. It sits on the
 * logical-START side of the page grid, which places it on the RIGHT for Arabic
 * (RTL) and the LEFT for LTR. A single IntersectionObserver watches every
 * section id and highlights the topmost one currently in view; clicking an item
 * smooth-scrolls to its section (instant under reduced-motion).
 *
 * Desktop (lg+) only — on smaller screens it renders nothing (per spec: no
 * fragile horizontal bar). All items are real <button>s with focus-visible
 * rings and aria-current on the active one.
 */
export function ProjectTOC({ sections }: { sections: TOCSection[] }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");
  // Keep the freshest section list inside the observer without re-subscribing.
  const idsRef = useRef<string[]>(sections.map((s) => s.id));
  idsRef.current = sections.map((s) => s.id);

  useEffect(() => {
    const ids = idsRef.current;
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    // Track intersecting sections; pick the topmost (smallest boundingTop that is
    // still in the upper band of the viewport).
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        }
        if (visible.size === 0) return;
        // Topmost = smallest top offset among the intersecting sections.
        let topId = "";
        let topOffset = Infinity;
        for (const [id, top] of visible) {
          if (top < topOffset) {
            topOffset = top;
            topId = id;
          }
        }
        // Preserve the source order (ids) so ties resolve deterministically.
        if (topId) setActive(topId);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 1] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // Re-subscribe when the actual section ids change (not just their count), so
    // navigating between two ventures with the same section count but different
    // sections rebinds the observer instead of leaving it stuck on stale nodes.
  }, [sections.map((s) => s.id).join("|")]);

  if (sections.length === 0) return null;

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <nav
      data-testid="case-study-toc"
      aria-label={t({ ar: "فهرس دراسة الحالة", en: "Case study index" })}
      className="hidden lg:block sticky top-28 self-start"
    >
      <div className="mb-4 text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold rtl:tracking-normal">
        {t({ ar: "المحتوى", en: "Contents" })}
      </div>
      <ul className="flex flex-col gap-1">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = s.id === active;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => go(s.id)}
                aria-current={isActive ? "true" : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                  isActive
                    ? "bg-primary/[0.08] text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? "text-primary" : "text-fg-faint group-hover:text-primary/70"
                  }`}
                />
                <span className="truncate leading-snug">{t(s.label)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
