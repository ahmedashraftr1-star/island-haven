import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const OPEN_HOUR = 9; // 09:00
const CLOSE_HOUR = 18; // 18:00 — "السّاعة ٦"

const DAYS = [
  { ar: "أحد", en: "Sun", idx: 0 },
  { ar: "إثنين", en: "Mon", idx: 1 },
  { ar: "ثلاثاء", en: "Tue", idx: 2 },
  { ar: "أربعاء", en: "Wed", idx: 3 },
  { ar: "خميس", en: "Thu", idx: 4 },
  { ar: "جمعة", en: "Fri", idx: 5, closed: true },
  { ar: "سبت", en: "Sat", idx: 6 },
];

/**
 * OpeningHours — a cinematic, world-class hours moment.
 *
 * A 24-hour SVG clock dial. The 9→18 open arc is traced on scroll-in
 * (stroke-dashoffset). A live indicator orbits the dial showing the
 * current Gaza time. A massive "09 → 18" headline anchors the moment.
 * Below: a weekly strip with today highlighted and Friday marked closed.
 *
 * Apple keynote energy applied to the most utilitarian piece of NGO copy.
 */
export function OpeningHours() {
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
      const wk = get("weekday"); // "Mon", "Tue", ...
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

  // Live time math (Gaza-local)
  const hours = gazaTime.h;
  const minutes = gazaTime.m;
  const totalMinutes = hours * 60 + minutes;
  const dayOfWeek = gazaTime.dow;
  const isFriday = dayOfWeek === 5;
  const inHours =
    !isFriday && totalMinutes >= OPEN_HOUR * 60 && totalMinutes < CLOSE_HOUR * 60;
  const liveStatus = isFriday
    ? { ar: "مغلق اليوم", en: "Closed today", color: "bg-foreground/30" }
    : inHours
    ? { ar: "مفتوح الآن", en: "Open now", color: "bg-emerald-500" }
    : { ar: "مغلق الآن — يفتح ٩ صباحاً", en: "Opens 9am", color: "bg-amber-500" };

  // SVG geometry
  const SIZE = 420;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R_TICK_OUTER = 198;
  const R_TICK_INNER = 184;
  const R_ARC = 160;
  const STROKE = 22;

  // Convert hour (0-24) to angle (degrees). 0h = 12 o'clock = -90°
  const hourToAngle = (h: number) => (h / 24) * 360 - 90;
  const polar = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: CX + Math.cos(rad) * r, y: CY + Math.sin(rad) * r };
  };
  // Arc path from open to close
  const startA = hourToAngle(OPEN_HOUR);
  const endA = hourToAngle(CLOSE_HOUR);
  const start = polar(startA, R_ARC);
  const end = polar(endA, R_ARC);
  const largeArc = endA - startA > 180 ? 1 : 0;
  const arcPath = `M ${start.x} ${start.y} A ${R_ARC} ${R_ARC} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  // Live time pointer (24h)
  const liveAngle = hourToAngle(hours + minutes / 60);
  const liveDot = polar(liveAngle, R_ARC);

  // Tick marks (24)
  const ticks = Array.from({ length: 24 }, (_, i) => i);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="mb-12 lg:mb-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-[#0A0E1A] text-white rounded-3xl p-7 lg:p-12 shadow-soft-hover overflow-hidden relative"
    >
      {/* Subtle indigo halo for depth */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(232 100% 70% / 0.18) 0%, transparent 65%)",
          filter: "blur(70px)",
        }}
      />

      {/* LEFT: Headline + week strip */}
      <div className="relative lg:col-span-7 order-2 lg:order-1">
        <div className="flex items-center gap-3 mb-7">
          <span className="h-[1px] w-10 bg-white/40" />
          <span className="text-[11px] tracking-[0.22em] uppercase text-white/75 font-semibold">
            Opening hours · ساعات العمل
          </span>
        </div>

        {/* MASSIVE hour-to-hour display */}
        <div
          dir="ltr"
          className="font-bold text-white tabular-nums leading-none flex items-baseline gap-3 lg:gap-5 mb-7"
          style={{
            fontSize: "clamp(4.5rem, 10vw, 9rem)",
            letterSpacing: "-0.045em",
          }}
        >
          <motion.span
            initial={{ y: "100%", opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="block"
          >
            09
          </motion.span>
          <motion.span
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            className="origin-left inline-block w-12 lg:w-20 h-[6px] lg:h-[10px] bg-white/85 rounded-full -translate-y-[0.42em]"
            aria-hidden
          />
          <motion.span
            initial={{ y: "100%", opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
            className="block"
          >
            18
          </motion.span>
        </div>

        <h3
          className="font-bold text-white leading-[1.1] tracking-tight mb-4"
          style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.022em" }}
        >
          العمل في المساحة
          <br />
          من <span className="text-accent-gradient">٩ صباحاً</span> حتّى{" "}
          <span className="text-accent-gradient">٦ مساءً.</span>
        </h3>

        <p className="text-[15px] lg:text-[17px] text-white/70 leading-relaxed max-w-md mb-9">
          تسع ساعات يوميّة، خمسة أيّام في الأسبوع. الإنترنت مستقرّ، والكهرباء بلا
          انقطاع — والقهوة دائماً جاهزة.
        </p>

        {/* Live status pill */}
        <div className="inline-flex items-center gap-2.5 h-10 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[13px] font-semibold mb-9">
          <span className={`w-2 h-2 rounded-full ${liveStatus.color} ${inHours ? "animate-pulse" : ""}`} />
          <span>{liveStatus.ar}</span>
          <span className="text-white/40 tabular-nums">
            · {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")} غزّة
          </span>
        </div>

        {/* Weekly strip */}
        <div className="flex flex-wrap gap-1.5 lg:gap-2 max-w-md">
          {DAYS.map((d) => {
            const isToday = d.idx === dayOfWeek;
            return (
              <div
                key={d.en}
                className={`flex-1 min-w-[68px] flex flex-col items-center justify-center px-1 py-3 rounded-xl border transition-all ${
                  isToday
                    ? "bg-white text-[#0A0E1A] border-white shadow-[0_8px_30px_-10px_rgba(255,255,255,0.4)]"
                    : d.closed
                    ? "bg-white/5 text-white/30 border-white/10 line-through decoration-white/30"
                    : "bg-white/[0.04] text-white/70 border-white/10"
                }`}
              >
                <div className="text-[10px] tracking-[0.16em] uppercase font-semibold opacity-65">
                  {d.en}
                </div>
                <div className="text-[15px] font-bold mt-0.5">{d.ar}</div>
                <div className="text-[10px] mt-1.5 tabular-nums opacity-75">
                  {d.closed ? "—" : "9–18"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live status announced to assistive tech without being visually duplicated */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveStatus.ar} — الساعة {String(hours).padStart(2, "0")}:
        {String(minutes).padStart(2, "0")} بتوقيت غزّة.
      </div>

      {/* RIGHT: SVG 24-hour clock with traced arc */}
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
              العمل من التاسعة صباحاً حتّى السادسة مساءً، ومؤشّر متحرّك
              يعكس الوقت الحالي بتوقيت غزّة.
            </desc>
            <defs>
              <linearGradient id="oh-arc" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(232 100% 70%)" />
                <stop offset="100%" stopColor="hsl(232 100% 55%)" />
              </linearGradient>
              <radialGradient id="oh-glow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="hsl(232 100% 65%)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(232 100% 65%)" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Glow */}
            <circle cx={CX} cy={CY} r={R_ARC + 30} fill="url(#oh-glow)" />

            {/* Outer ring */}
            <circle
              cx={CX}
              cy={CY}
              r={R_TICK_OUTER + 6}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />

            {/* 24 ticks */}
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

            {/* Hour labels at 0, 6, 12, 18 */}
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

            {/* Background ring for the arc */}
            <circle
              cx={CX}
              cy={CY}
              r={R_ARC}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={STROKE}
            />

            {/* Open arc — traced on scroll-in */}
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

            {/* OPEN endpoint */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.45 }}
              style={{ transformOrigin: `${start.x}px ${start.y}px` }}
            >
              <circle cx={start.x} cy={start.y} r="9" fill="white" />
              <circle cx={start.x} cy={start.y} r="4" fill="hsl(232 100% 55%)" />
            </motion.g>

            {/* CLOSE endpoint */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 1.85 }}
              style={{ transformOrigin: `${end.x}px ${end.y}px` }}
            >
              <circle cx={end.x} cy={end.y} r="9" fill="white" />
              <circle cx={end.x} cy={end.y} r="4" fill="hsl(232 100% 55%)" />
            </motion.g>

            {/* Live time pointer — orbits */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 2.1 }}
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

            {/* Centre — current time text */}
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
    </motion.div>
  );
}
