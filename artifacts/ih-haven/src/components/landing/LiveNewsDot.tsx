import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDaily } from "@/hooks/use-public-data";

interface DailyPost {
  publishedAt: string;
}

const FRESH_MS = 48 * 60 * 60 * 1000; // 48h
const ANCHOR = "events-slider";

/**
 * LiveNewsDot — a subtle pulsing crimson dot in the navbar that appears ONLY
 * when the space has actually posted something in the last 48h AND the visitor
 * hasn't yet reached the events section. Click smooth-scrolls to that section;
 * an IntersectionObserver hides the dot once the section is on screen. Home only
 * (that's the single page carrying #events-slider). No invented state — the dot
 * is driven entirely by the real /daily feed.
 */
export function LiveNewsDot() {
  const { t, dir } = useLanguage();
  const reduce = useReducedMotion();
  const [loc] = useLocation();
  const [seen, setSeen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const onHome = loc === "/";

  // Same SHARED /daily query NewsSlider uses (deduped by React Query — one
  // request, not two). Only enabled on home; on error `data` is undefined →
  // no dot rather than a wrong dot.
  const { data } = useDaily<DailyPost>({ enabled: onHome });
  const fresh = useMemo(() => {
    if (!onHome || !data?.posts) return false;
    const now = Date.now();
    return data.posts.some(
      (p) => now - new Date(p.publishedAt).getTime() < FRESH_MS,
    );
  }, [onHome, data]);

  // Hide once the events section has been reached. The section is lazily
  // mounted, so retry attaching the observer until the element exists.
  useEffect(() => {
    if (!onHome || !fresh || seen) return;
    let io: IntersectionObserver | null = null;
    let tries = 0;
    const attach = () => {
      const el = document.getElementById(ANCHOR);
      if (!el) return false;
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) setSeen(true);
        },
        { threshold: 0.15 },
      );
      io.observe(el);
      return true;
    };
    if (attach()) return () => io?.disconnect();
    const timer = window.setInterval(() => {
      tries += 1;
      if (attach() || tries > 40) window.clearInterval(timer);
    }, 400);
    return () => {
      window.clearInterval(timer);
      io?.disconnect();
    };
  }, [onHome, fresh, seen]);

  if (!onHome || !fresh || seen) return null;

  const label = t({ ar: "أخبار جديدة في المساحة", en: "New in the space" });

  return (
    <button
      type="button"
      onClick={() =>
        document
          .getElementById(ANCHOR)
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={label}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors duration-200 hover:text-white hover:bg-white/[0.06]"
    >
      <span className="relative flex h-2.5 w-2.5">
        {!reduce && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        )}
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-[#0a0a0a]" />
      </span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full mt-2 whitespace-nowrap rounded-lg bg-[#111] px-2.5 py-1 text-[11.5px] font-medium text-white shadow-lg ring-1 ring-white/10 transition-opacity duration-200 ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
        style={dir === "rtl" ? { right: 0 } : { left: 0 }}
      >
        {label}
      </span>
    </button>
  );
}
