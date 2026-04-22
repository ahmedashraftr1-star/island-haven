import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Floating "Now in the Haven" pill — appears after the user scrolls past
 * the LiveNow strip and stays as a quiet, beating presence in the
 * bottom-left of the viewport. Click to gently jump back to the top.
 *
 * No backend — derived from Asia/Gaza local time, same logic as LiveNow.
 */
function gazaLive() {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Gaza",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(new Date());
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  const weekday = parts.find((p) => p.type === "weekday")?.value || "Mon";
  const isFriday = weekday === "Fri";
  const open = !isFriday && hour >= 8 && hour < 17;
  if (!open) return { open, working: 0, time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
  const base =
    hour < 10 ? 16 + hour - 8 : hour < 14 ? 26 + (hour - 10) : 28 - (hour - 14) * 3;
  const jitter = (minute % 7) - 3;
  const working = Math.max(8, Math.min(34, base + jitter));
  return { open, working, time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

export function FloatingLivePill() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState(() => gazaLive());

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Show after passing the hero+livenow strip (~900px), hide before footer.
    const threshold = 900;
    const max = document.documentElement.scrollHeight - window.innerHeight - 600;
    setVisible(latest > threshold && latest < max);
  });

  useEffect(() => {
    const t = setInterval(() => setState(gazaLive()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 16, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.94 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 left-5 z-30 group flex items-center gap-2.5 h-11 pl-2 pr-4 rounded-full bg-white border border-border shadow-soft-hover hover:shadow-[0_20px_60px_hsl(232_70%_30%/0.18)] hover:-translate-y-0.5 transition-all duration-300"
          aria-label="عرض حالة المساحة الآن"
        >
          <span className="relative inline-flex w-7 h-7 rounded-full bg-primary-soft items-center justify-center">
            <motion.span
              className={`absolute w-2 h-2 rounded-full ${state.open ? "bg-emerald-500" : "bg-foreground/40"}`}
              animate={state.open ? { scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] } : { opacity: 0.6 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            />
            <span className={`relative w-2 h-2 rounded-full ${state.open ? "bg-emerald-500" : "bg-foreground/40"}`} />
          </span>
          {state.open ? (
            <span className="text-[12.5px] font-semibold text-foreground">
              <span className="tabular-nums">{state.working}</span>
              <span className="text-foreground/60 font-medium"> يعمل في الهيفن الآن</span>
            </span>
          ) : (
            <span className="text-[12.5px] font-medium text-foreground/65">المساحة مغلقة الآن</span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
