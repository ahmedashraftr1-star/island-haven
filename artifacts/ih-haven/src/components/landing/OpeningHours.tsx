import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const OPEN_HOUR = 9; // 09:00
const CLOSE_HOUR = 17; // 17:00 — "السّاعة ٥ مساءً"

// Week starts on Saturday (Gaza convention).
// Note: `idx` is the JS Date.getDay() value (Sun=0…Sat=6) so we can
// compare against Asia/Gaza day-of-week to highlight today correctly.
const DAYS = [
  { ar: "سبت", en: "Sat", idx: 6 },
  { ar: "أحد", en: "Sun", idx: 0 },
  { ar: "إثنين", en: "Mon", idx: 1 },
  { ar: "ثلاثاء", en: "Tue", idx: 2 },
  { ar: "أربعاء", en: "Wed", idx: 3 },
  { ar: "خميس", en: "Thu", idx: 4 },
  { ar: "جمعة", en: "Fri", idx: 5, closed: true },
];

/**
 * OpeningHours — editorial deep-ink treatment.
 *
 * Turns "ساعات العمل" into a piece of design on a flat deep-ink canvas:
 * an oversized 09—17 display and a 24-hour SVG dial tracing the open arc
 * (09→17), with live Gaza time on the dial. Hairline-divided day rows,
 * a quiet status chip — zero glassmorphism. Compact, premium, on-brand.
 */
export function OpeningHours() {
  const { lang } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  // Always show Gaza local time (Asia/Gaza), regardless of viewer location.
  const getGazaParts = () => {
    try {
      const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Gaza",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
      const parts = fmt.formatToParts(new Date());
      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
      const h = parseInt(get("hour"), 10) || 0;
      const m = parseInt(get("minute"), 10) || 0;
      const wk = get("weekday");
      const map: Record<string, number> = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
      };
      return { h, m, dow: map[wk] ?? new Date().getDay() };
    } catch {
      const d = new Date();
      return { h: d.getHours(), m: d.getMinutes(), dow: d.getDay() };
    }
  };

  const [gazaTime, setGazaTime] = useState(getGazaParts);

  useEffect(() => {
    const id = setInterval(() => setGazaTime(getGazaParts()), 30_000);
    return () => clearInterval(id);
  }, []);

  const hours = gazaTime.h;
  const minutes = gazaTime.m;
  const totalMinutes = hours * 60 + minutes;
  const dayOfWeek = gazaTime.dow;
  const isFriday = dayOfWeek === 5;
  const inHours =
    !isFriday && totalMinutes >= OPEN_HOUR * 60 && totalMinutes < CLOSE_HOUR * 60;
  const liveStatus = isFriday
    ? { ar: "مغلق اليوم", en: "Closed today", color: "bg-muted-foreground" }
    : inHours
    ? { ar: "مفتوح الآن", en: "Open now", color: "bg-emerald-400" }
    : { ar: "مغلق الآن — يفتح ٩ صباحاً", en: "Opens 9am", color: "bg-muted-foreground" };

  // SVG geometry
  const SIZE = 420;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R_TICK_OUTER = 198;
  const R_TICK_INNER = 184;
  const R_ARC = 160;
  const STROKE = 22;

  const hourToAngle = (h: number) => (h / 24) * 360 - 90;
  const polar = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: CX + Math.cos(rad) * r, y: CY + Math.sin(rad) * r };
  };
  const startA = hourToAngle(OPEN_HOUR);
  const endA = hourToAngle(CLOSE_HOUR);
  const start = polar(startA, R_ARC);
  const end = polar(endA, R_ARC);
  const largeArc = endA - startA > 180 ? 1 : 0;
  const arcPath = `M ${start.x} ${start.y} A ${R_ARC} ${R_ARC} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  const liveAngle = hourToAngle(hours + minutes / 60);
  const liveDot = polar(liveAngle, R_ARC);

  const ticks = Array.from({ length: 24 }, (_, i) => i);

  return (
    <motion.div
      ref={ref}
      initial={{ y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mb-12 lg:mb-14 relative rounded-[28px] overflow-hidden"
      style={{
        boxShadow:
          "0 30px 80px -20px rgba(10,14,26,0.45), 0 8px 24px -8px rgba(10,14,26,0.25)",
      }}
    >
      {/* ─── LAYER 1 · deep indigo canvas ───────────────────────── */}
      <div className="absolute inset-0 bg-[#0A0E1A]" aria-hidden />

      {/* ─── LAYER 2 · photographic underlay (depth) ────────────── */}
      <div aria-hidden className="absolute inset-0 opacity-[0.16] pointer-events-none">
        <img
          src={`${import.meta.env.BASE_URL}photos/IMG_8347.webp`}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* ─── LAYER 3 · single restrained cerulean data-glow ─────── */}
      <div
        aria-hidden
        className="absolute -bottom-32 -right-24 w-[520px] h-[520px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(195 100% 60% / 0.14) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />

      {/* ─── CONTENT ─────────────────────────────────────────────── */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center text-white p-7 lg:p-12">
        {/* LEFT — editorial content */}
        <div className="relative lg:col-span-7 order-2 lg:order-1">
          <div className="flex items-center gap-3 mb-7">
            <span className="h-[1px] w-10 bg-white/40" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-white/75 font-semibold">
              {lang === "en" ? "Opening hours · ساعات العمل" : "Opening hours · ساعات العمل"}
            </span>
          </div>

          {/* Massive 09 → 17 display */}
          <div
            dir="ltr"
            className="font-bold text-white tabular-nums leading-none flex items-baseline gap-3 lg:gap-5 mb-7"
            style={{
              fontSize: "clamp(4.5rem, 10vw, 9rem)",
              letterSpacing: "-0.045em",
            }}
          >
            <motion.span
              initial={{ y: "100%" }}
              animate={inView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="block"
            >
              09
            </motion.span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
              className="origin-left inline-block w-12 lg:w-20 h-[6px] lg:h-[10px] bg-white/85 rounded-full -translate-y-[0.42em]"
              aria-hidden
            />
            <motion.span
              initial={{ y: "100%" }}
              animate={inView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
              className="block"
            >
              17
            </motion.span>
          </div>

          <h3
            className="font-bold text-white leading-[1.1] tracking-tight mb-4"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.022em" }}
          >
            {lang === "en" ? (
              <>Work at the space<br />from <span className="text-primary">9 am</span> until{" "}<span className="text-primary">5 pm.</span></>
            ) : (
              <>العمل في المساحة<br />من <span className="text-primary">٩ صباحاً</span> حتّى{" "}<span className="text-primary">٥ مساءً.</span></>
            )}
          </h3>

          <p className="text-[15px] lg:text-[17px] text-white/70 leading-relaxed max-w-md mb-9">
            {lang === "en"
              ? "Eight hours a day, five days a week. Stable internet, uninterrupted power — and coffee always ready."
              : "تسع ساعات يوميّة، خمسة أيّام في الأسبوع. الإنترنت مستقرّ، والكهرباء بلا انقطاع — والقهوة دائماً جاهزة."}
          </p>

          {/* Live status — quiet hairline-edged chip */}
          <div className="inline-flex items-center gap-2.5 h-10 px-4 rounded-full text-[13px] font-semibold mb-9 bg-white/[0.03] border border-border-strong">
            <span className={`w-2 h-2 rounded-full ${liveStatus.color} ${inHours ? "animate-pulse" : ""}`} />
            <span>{lang === "en" ? liveStatus.en : liveStatus.ar}</span>
            <span className="text-white/45 tabular-nums font-mono">
              · {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")} Gaza
            </span>
          </div>

          {/* Weekly strip — hairline-divided rows on the flat canvas */}
          <div className="w-full max-w-md border-t border-border-strong">
            {DAYS.map((d) => {
              const isToday = d.idx === dayOfWeek;
              return (
                <div
                  key={d.en}
                  className={`flex items-baseline justify-between gap-4 py-3 border-b border-border-strong ${
                    isToday
                      ? "text-white"
                      : d.closed
                      ? "text-white/35"
                      : "text-white/75"
                  }`}
                  data-testid={`day-tile-${d.en.toLowerCase()}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isToday && (
                      <span
                        aria-hidden
                        className="h-[1px] w-5 bg-primary shrink-0"
                      />
                    )}
                    <span
                      className={`truncate ${
                        isToday
                          ? "text-[15px] font-bold"
                          : "text-[15px] font-semibold"
                      }`}
                    >
                      {lang === "en" ? d.en : d.ar}
                    </span>
                  </div>
                  <span
                    className={`text-[13px] tabular-nums font-mono shrink-0 ${
                      d.closed ? "line-through decoration-white/30" : ""
                    } ${isToday ? "text-white" : ""}`}
                  >
                    {d.closed ? (lang === "en" ? "Closed" : "مغلق") : "9–17"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SR-only live region */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {lang === "en" ? liveStatus.en : liveStatus.ar} — {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")} Gaza time.
        </div>

        {/* RIGHT — 24h dial on the flat canvas */}
        <div className="relative lg:col-span-5 order-1 lg:order-2 flex items-center justify-center">
          <div className="relative w-full max-w-[420px] aspect-square">
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="w-full h-full"
              role="img"
              aria-labelledby="oh-title oh-desc"
            >
              <title id="oh-title">ساعة آيلاند هيفن — ٢٤ ساعة</title>
              <desc id="oh-desc">
                ساعة دائريّة بأربعٍ وعشرين قسماً، يُظهر فيها قوسٌ ملوّن ساعات
                العمل من الثامنة صباحاً حتّى الخامسة مساءً، ومؤشّر متحرّك
                يعكس الوقت الحالي بتوقيت غزّة.
              </desc>
              <defs>
                <linearGradient id="oh-arc" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(354 100% 75%)" />
                  <stop offset="100%" stopColor="hsl(354 100% 55%)" />
                </linearGradient>
                <radialGradient id="oh-glow" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="hsl(354 100% 65%)" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="hsl(354 100% 65%)" stopOpacity="0" />
                </radialGradient>
              </defs>

              <circle cx={CX} cy={CY} r={R_ARC + 30} fill="url(#oh-glow)" />

              <circle
                cx={CX}
                cy={CY}
                r={R_TICK_OUTER + 6}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />

              {ticks.map((t) => {
                const a = hourToAngle(t);
                const major = t % 6 === 0;
                const r1 = major ? R_TICK_INNER - 6 : R_TICK_INNER + 4;
                const r2 = R_TICK_OUTER;
                const p1 = polar(a, r1);
                const p2 = polar(a, r2);
                return (
                  <line
                    key={t}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="rgba(255,255,255,0.32)"
                    strokeWidth={major ? 2 : 1}
                    strokeLinecap="round"
                  />
                );
              })}

              {[
                { h: 0, label: "00" },
                { h: 6, label: "06" },
                { h: 12, label: "12" },
                { h: 18, label: "18" },
              ].map(({ h, label }) => {
                const a = hourToAngle(h);
                const p = polar(a, R_TICK_INNER - 22);
                return (
                  <text
                    key={h}
                    x={p.x}
                    y={p.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(255,255,255,0.55)"
                    fontSize="13"
                    fontWeight="700"
                    fontFamily="ui-monospace, monospace"
                    letterSpacing="2"
                  >
                    {label}
                  </text>
                );
              })}

              <circle
                cx={CX}
                cy={CY}
                r={R_ARC}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={STROKE}
              />

              <motion.path
                d={arcPath}
                fill="none"
                stroke="url(#oh-arc)"
                strokeWidth={STROKE}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : {}}
                transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              />

              <motion.g
                initial={{ scale: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.45 }}
                style={{ transformOrigin: `${start.x}px ${start.y}px` }}
              >
                <circle cx={start.x} cy={start.y} r="9" fill="white" />
                <circle cx={start.x} cy={start.y} r="4" fill="hsl(354 100% 55%)" />
              </motion.g>

              <motion.g
                initial={{ scale: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 1.85 }}
                style={{ transformOrigin: `${end.x}px ${end.y}px` }}
              >
                <circle cx={end.x} cy={end.y} r="9" fill="white" />
                <circle cx={end.x} cy={end.y} r="4" fill="hsl(354 100% 55%)" />
              </motion.g>

              <motion.g
                initial={{  }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.42, delay: 2.1 }}
              >
                <line
                  x1={CX}
                  y1={CY}
                  x2={liveDot.x}
                  y2={liveDot.y}
                  stroke={inHours ? "hsl(160 84% 50%)" : "rgba(255,255,255,0.25)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx={liveDot.x}
                  cy={liveDot.y}
                  r="6"
                  fill={inHours ? "hsl(160 84% 50%)" : "rgba(255,255,255,0.45)"}
                />
                {inHours && (
                  <circle
                    cx={liveDot.x}
                    cy={liveDot.y}
                    r="14"
                    fill="hsl(160 84% 50%)"
                    fillOpacity="0.18"
                  >
                    <animate
                      attributeName="r"
                      values="6;18;6"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="fill-opacity"
                      values="0.4;0;0.4"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </motion.g>

              <text
                x={CX}
                y={CY - 8}
                textAnchor="middle"
                fill="rgba(255,255,255,0.55)"
                fontSize="10"
                letterSpacing="3"
                fontWeight="700"
              >
                GAZA · NOW
              </text>
              <text
                x={CX}
                y={CY + 22}
                textAnchor="middle"
                fill="white"
                fontSize="42"
                fontWeight="700"
                fontFamily="ui-monospace, monospace"
                letterSpacing="-1"
              >
                {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}
              </text>
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
