import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { useContentSection } from "@/hooks/use-content";

const FALLBACK = {
  label: "الآن في الهيفن",
  placeLabel: "غزّة",
  workingLabel: "يعمل الآن",
  workshopLabel: "ورشة جارية",
  coffeeLabel: "قهوة قيد التحضير ☕︎",
  closedLabel: "المساحة مغلقة الآن · نفتح أبوابنا من السبت إلى الخميس، ٩ صباحاً – ٥ مساءً",
  liveBadge: "بثّ مباشر من قلب غزّة",
};

function gazaNow() {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Gaza",
    hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
  });
  const parts = fmt.formatToParts(new Date());
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  const weekday = parts.find((p) => p.type === "weekday")?.value || "Mon";
  const isFriday = weekday === "Fri";
  const open = !isFriday && hour >= 9 && hour < 17;
  if (!open) {
    return { open: false, working: 0, workshop: false, coffees: 0,
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
  }
  const base =
    hour < 11 ? 14 + (hour - 9) * 3 : hour < 14 ? 22 + (hour - 11) * 2 : 28 - (hour - 14) * 4;
  const jitter = (minute % 7) - 3;
  const working = Math.max(8, Math.min(34, base + jitter));
  const workshop = (hour === 11 || hour === 15) && minute < 50;
  const coffees = Math.floor(working / 4) + (minute % 5 === 0 ? 1 : 0);
  return { open: true, working, workshop, coffees,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

export function LiveNow() {
  const c = useContentSection("livenow", FALLBACK);
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
              <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ${state.open ? "bg-emerald-500" : "bg-foreground/40"}`} />
            </span>
            <div className="text-[11px] tracking-[0.15em] uppercase font-semibold text-foreground/55">
              {c.label}
            </div>
            <div className="text-[11px] tracking-[0.05em] font-mono text-foreground/45 tabular-nums">
              {state.time} · {c.placeLabel}
            </div>
          </div>

          <div className="flex-1 flex flex-wrap items-baseline gap-x-7 gap-y-2 text-[14px]">
            {state.open ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground tabular-nums" style={{ letterSpacing: "-0.02em" }}>
                    {state.working}
                  </span>
                  <span className="text-foreground/65">{c.workingLabel}</span>
                </div>
                {state.workshop && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-foreground/65">·</span>
                    <span className="text-primary font-semibold">{c.workshopLabel}</span>
                  </div>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-foreground/65">·</span>
                  <span className="text-2xl font-bold text-foreground tabular-nums" style={{ letterSpacing: "-0.02em" }}>
                    {state.coffees}
                  </span>
                  <span className="text-foreground/65">{c.coffeeLabel}</span>
                </div>
              </>
            ) : (
              <div className="text-foreground/65">{c.closedLabel}</div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 text-[13px] text-foreground/55">
            <MapPin className="w-3.5 h-3.5" />
            {c.liveBadge}
          </div>
        </div>
      </div>
    </section>
  );
}
