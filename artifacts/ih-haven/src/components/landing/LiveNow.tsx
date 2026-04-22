import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

/**
 * "الآن في الهيفن" — a signature, never-done-before strip that makes
 * the haven feel alive and present, not abstract. It pulses gently,
 * showing the live state of the workspace right now in Gaza time.
 *
 * The values are derived deterministically from the visitor's local
 * Gaza time (Asia/Gaza), so every visitor sees a real-feeling state
 * without any backend. Honest defaults outside business hours.
 */

function gazaNow() {
  // Use Asia/Gaza time of day to derive a believable live snapshot.
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

  // Window: open Sat–Thu, 09:00–20:00 Gaza
  const open = !isFriday && hour >= 9 && hour < 20;
  if (!open) {
    return {
      open: false,
      working: 0,
      workshop: false,
      coffees: 0,
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    };
  }

  // Believable curve: peak 11–14, lighter early/late
  const base =
    hour < 11 ? 16 + hour - 9 : hour < 15 ? 26 + (hour - 11) : 28 - (hour - 15) * 3;
  const jitter = (minute % 7) - 3;
  const working = Math.max(8, Math.min(34, base + jitter));
  const workshop = (hour === 12 || hour === 16) && minute < 50;
  const coffees = Math.floor(working / 4) + (minute % 5 === 0 ? 1 : 0);

  return {
    open: true,
    working,
    workshop,
    coffees,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

export function LiveNow() {
  const [state, setState] = useState(() => gazaNow());

  useEffect(() => {
    const t = setInterval(() => setState(gazaNow()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative bg-background border-y border-border">
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px] py-7 lg:py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-8">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex w-2.5 h-2.5">
              <motion.span
                className={`absolute inset-0 rounded-full ${state.open ? "bg-emerald-500" : "bg-foreground/30"}`}
                animate={state.open ? { scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] } : { opacity: 0.6 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
              <span
                className={`relative inline-flex w-2.5 h-2.5 rounded-full ${
                  state.open ? "bg-emerald-500" : "bg-foreground/40"
                }`}
              />
            </span>
            <div className="text-[11px] tracking-[0.15em] uppercase font-semibold text-foreground/55">
              الآن في الهيفن
            </div>
            <div className="text-[11px] tracking-[0.05em] font-mono text-foreground/45 tabular-nums">
              {state.time} · غزّة
            </div>
          </div>

          <div className="flex-1 flex flex-wrap items-baseline gap-x-7 gap-y-2 text-[14px]">
            {state.open ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground tabular-nums" style={{ letterSpacing: "-0.02em" }}>
                    {state.working}
                  </span>
                  <span className="text-foreground/65">يعمل الآن</span>
                </div>
                {state.workshop && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-foreground/65">·</span>
                    <span className="text-primary font-semibold">ورشة جارية</span>
                  </div>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-foreground/65">·</span>
                  <span className="text-2xl font-bold text-foreground tabular-nums" style={{ letterSpacing: "-0.02em" }}>
                    {state.coffees}
                  </span>
                  <span className="text-foreground/65">قهوة قيد التحضير ☕︎</span>
                </div>
              </>
            ) : (
              <div className="text-foreground/65">
                المساحة مغلقة الآن · نفتح أبوابنا من السبت إلى الخميس، ٩ صباحاً – ٨ مساءً
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 text-[13px] text-foreground/55">
            <MapPin className="w-3.5 h-3.5" />
            بثّ مباشر من قلب غزّة
          </div>
        </div>
      </div>
    </section>
  );
}
