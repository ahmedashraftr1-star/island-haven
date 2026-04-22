import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";

type Item = {
  id: string;
  no: string;
  ar: string;
  en: string;
  group: string;
};

const items: Item[] = [
  { id: "hero",       no: "01", ar: "البداية",       en: "Open",       group: "المساحة" },
  { id: "about",      no: "02", ar: "من نحن",        en: "About",      group: "المساحة" },
  { id: "offerings",  no: "03", ar: "ما نقدّم",       en: "Offerings",  group: "التجربة" },
  { id: "audience",   no: "04", ar: "الفئات",        en: "Audience",   group: "المجتمع" },
  { id: "programs",   no: "05", ar: "الفعاليّات",    en: "Programs",   group: "المجتمع" },
  { id: "gallery",    no: "06", ar: "لمحات",         en: "Glimpses",   group: "المجتمع" },
  { id: "story",      no: "07", ar: "القصّة",         en: "Story",      group: "المجتمع" },
  { id: "visit",      no: "08", ar: "الزيارة",       en: "Visit",      group: "الزيارة" },
];

export function SideRail() {
  const [active, setActive] = useState<string>("hero");
  const [hovered, setHovered] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Show after first scroll, hide on top
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.3);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: 0 }
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Vertical progress bar inside the rail
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const railFill = useTransform(progress, (v) => `${v * 100}%`);

  const onJump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isOpen = expanded || hovered !== null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:block fixed top-1/2 -translate-y-1/2 right-5 xl:right-7 z-30 select-none"
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => {
            setExpanded(false);
            setHovered(null);
          }}
          aria-label="ملاحة الأقسام"
        >
          {/* Glass capsule */}
          <motion.div
            animate={{ width: isOpen ? 248 : 56 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[28px] py-5 pr-3 pl-3"
            style={{
              background: "rgba(10, 14, 26, 0.72)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "0 24px 60px -20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.4)",
            }}
          >
            {/* Inner ambient glow */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                background:
                  "radial-gradient(120% 80% at 100% 0%, hsl(354 70% 52% / 0.18), transparent 60%), radial-gradient(120% 80% at 0% 100%, hsl(354 70% 62% / 0.10), transparent 60%)",
              }}
            />

            {/* Vertical progress rail (left side of capsule) */}
            <div className="absolute right-[26px] top-6 bottom-6 w-[2px] rounded-full bg-white/8 overflow-hidden">
              <motion.div
                style={{ height: railFill }}
                className="w-full origin-top rounded-full"
              >
                <div
                  className="w-full h-full"
                  style={{
                    background:
                      "linear-gradient(to bottom, hsl(354 70% 62%) 0%, hsl(354 70% 52%) 100%)",
                    boxShadow: "0 0 12px hsl(354 70% 60% / 0.6)",
                  }}
                />
              </motion.div>
            </div>

            {/* Items */}
            <ul className="relative space-y-1.5">
              {items.map((it) => {
                const isActive = active === it.id;
                const isHovered = hovered === it.id;
                return (
                  <li key={it.id}>
                    <button
                      onClick={() => onJump(it.id)}
                      onMouseEnter={() => setHovered(it.id)}
                      className="group w-full flex items-center gap-3 py-1.5 pr-1 pl-2 rounded-2xl transition-colors text-right"
                      aria-current={isActive ? "true" : undefined}
                      aria-label={`${it.ar} — ${it.en}`}
                    >
                      {/* Label area (fades in when expanded) */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <motion.div
                          animate={{
                            opacity: isOpen ? 1 : 0,
                            x: isOpen ? 0 : 8,
                          }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className="flex items-baseline justify-end gap-2"
                        >
                          <span
                            className={`text-[10px] tracking-[0.22em] uppercase font-semibold transition-colors ${
                              isActive
                                ? "text-white/55"
                                : isHovered
                                ? "text-white/45"
                                : "text-white/30"
                            }`}
                          >
                            {it.en}
                          </span>
                          <span
                            className={`text-[14px] font-semibold transition-colors whitespace-nowrap ${
                              isActive
                                ? "text-white"
                                : isHovered
                                ? "text-white/85"
                                : "text-white/55"
                            }`}
                          >
                            {it.ar}
                          </span>
                        </motion.div>
                      </div>

                      {/* Number — visible only when expanded */}
                      <motion.span
                        animate={{
                          opacity: isOpen ? 1 : 0,
                          width: isOpen ? "auto" : 0,
                        }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={`text-[10px] font-mono font-semibold tabular-nums tracking-wider overflow-hidden ${
                          isActive ? "text-white/60" : "text-white/25"
                        }`}
                      >
                        {it.no}
                      </motion.span>

                      {/* Dot + active indicator */}
                      <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                        {/* Active halo */}
                        {isActive && (
                          <motion.span
                            layoutId="rail-halo"
                            className="absolute inset-0 rounded-full"
                            style={{
                              background:
                                "radial-gradient(circle, hsl(354 70% 62% / 0.45) 0%, transparent 70%)",
                            }}
                            transition={{ type: "spring", stiffness: 360, damping: 28 }}
                          />
                        )}
                        {/* Active solid pill */}
                        {isActive && (
                          <motion.span
                            layoutId="rail-active"
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                              background: "hsl(354 70% 62%)",
                              boxShadow:
                                "0 0 0 3px rgba(255,255,255,0.18), 0 0 14px hsl(354 70% 60% / 0.8)",
                            }}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        {/* Inactive dot */}
                        {!isActive && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              isHovered
                                ? "bg-white/80 scale-125"
                                : "bg-white/30 group-hover:bg-white/55"
                            }`}
                          />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Footer mini-CTA — only when expanded */}
            <motion.div
              animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? "auto" : 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between gap-2 px-2">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="text-[10px] tracking-[0.22em] uppercase font-semibold text-white/45 hover:text-white transition-colors"
                >
                  ↑ للأعلى
                </button>
                <a
                  href={`${import.meta.env.BASE_URL}apply`}
                  className="text-[11px] font-semibold text-white px-3 py-1.5 rounded-full transition-all hover:scale-[1.04]"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(354 70% 58%), hsl(354 70% 48%))",
                    boxShadow:
                      "0 6px 16px -4px hsl(354 70% 40% / 0.6), inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  انتسب
                </a>
              </div>
            </motion.div>
          </motion.div>

          {/* Tiny chapter hint floating beside (when collapsed) */}
          <AnimatePresence>
            {!isOpen && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="absolute top-1/2 -translate-y-1/2 right-full mr-3 pointer-events-none"
              >
                <div className="text-[10px] tracking-[0.22em] uppercase font-semibold text-foreground/40 whitespace-nowrap">
                  {items.find((i) => i.id === active)?.group}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
