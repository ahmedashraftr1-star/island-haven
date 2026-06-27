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

// Brand-token SVG colors resolved from the live (.theme-light-inherited) canvas
// so the dial reads on white: muted neutral track, crimson active range, cerulean
// accents, deep-navy ink. Live status open = an AA green, otherwise muted.
const INK = "hsl(219 47% 13%)"; // foreground (deep-navy ink)
const INK_55 = "hsl(219 30% 38%)"; // muted-foreground-ish, for ticks / labels
const TRACK = "hsl(215 25% 88%)"; // border — quiet base track
const CERULEAN = "hsl(213 84% 40%)"; // --sand (brand cerulean) for caps / labels
const CRIMSON = "hsl(354 78% 47%)"; // --primary (deepened crimson) — active arc
const CRIMSON_HI = "hsl(354 80% 58%)"; // --primary-bright — arc gradient end
const OPEN_GREEN = "hsl(160 64% 34%)"; // AA-safe green cursor when open now

/**
 * OpeningHours — editorial LIGHT panel.
 *
 * Turns "ساعات العمل" into a piece of design on the homepage's warm-white canvas:
 * an oversized 09—17 display and a 24-hour SVG dial tracing the open arc (09→17),
 * with live Gaza time on the dial. The whole thing renders as crafted light
 * material (surface-1 panel + surface-2 dial plate + hairline rows), recoloured to
 * brand tokens — crimson active range, cerulean accents, muted track, deep-navy
 * ink. Hairline-divided day rows, a quiet status chip. Zero glass, no dark void.
 * Keeps live Gaza updates, Friday-closed, the 09—17 display, the status pill, and
 * every data-testid (day-tile-*).
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
    ? { ar: "مغلق اليوم", en: "Closed today", dot: "bg-muted-foreground" }
    : inHours
    ? { ar: "مفتوح الآن", en: "Open now", dot: "bg-[hsl(160_64%_34%)]" }
    : { ar: "مغلق الآن — يفتح ٩ صباحاً", en: "Opens 9am", dot: "bg-muted-foreground" };

  // Localized "now" clock — Arabic-Indic numerals in AR.
  const clock = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const clockLoc = lang === "ar" ? clock.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]) : clock;

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
      className="surface-1 card-base rounded-[28px] overflow-hidden"
    >
      {/* ─── CONTENT — crafted light panel ───────────────────────── */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center text-foreground p-7 lg:p-12">
        {/* faint cerulean data-tint anchored to the dial corner, light register */}
        <div
          aria-hidden
          className="absolute -bottom-32 -right-24 w-[520px] h-[520px] pointer-events-none rtl:right-auto rtl:-left-24"
          style={{
            background:
              "radial-gradient(circle, hsl(213 84% 40% / 0.07) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />

        {/* LEFT — editorial content */}
        <div className="relative lg:col-span-7 order-2 lg:order-1">
          <div className="flex items-center gap-3 mb-7">
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="eyebrow">
              {lang === "en" ? "Opening hours · ساعات العمل" : "Opening hours · ساعات العمل"}
            </span>
          </div>

          {/* Massive 09 → 17 display — cerulean numerals, crimson rule */}
          <div
            dir="ltr"
            className="font-display font-extrabold text-sand tnum leading-none flex items-baseline gap-3 lg:gap-5 mb-7 rtl:justify-end"
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
              className="origin-left inline-block w-12 lg:w-20 h-[6px] lg:h-[10px] bg-primary rounded-full -translate-y-[0.42em]"
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

          {/* Editorial serif headline + single italic crimson accent (YC register) */}
          <h3
            className="font-editorial text-foreground leading-[1.08] mb-4"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.018em", fontWeight: 600 }}
          >
            {lang === "en" ? (
              <>Work at the space<br />from <span className="italic text-primary">9 am</span> until{" "}<span className="italic text-primary">5 pm.</span></>
            ) : (
              <>العمل في المساحة<br />من <span className="text-primary">٩ صباحاً</span> حتّى{" "}<span className="text-primary">٥ مساءً.</span></>
            )}
          </h3>

          <p className="t-body leading-relaxed max-w-md mb-9">
            {lang === "en"
              ? "Eight hours a day, five days a week. Stable internet, uninterrupted power — and coffee always ready."
              : "تسع ساعات يوميّة، خمسة أيّام في الأسبوع. الإنترنت مستقرّ، والكهرباء بلا انقطاع — والقهوة دائماً جاهزة."}
          </p>

          {/* Live status — quiet hairline-edged chip on a white plate */}
          <div className="inline-flex items-center gap-2.5 h-10 px-4 rounded-full text-[13px] font-semibold mb-9 bg-surface-2 border border-border-strong text-foreground">
            <span className={`w-2 h-2 rounded-full ${liveStatus.dot} ${inHours ? "animate-pulse" : ""}`} />
            <span>{lang === "en" ? liveStatus.en : liveStatus.ar}</span>
            <span className="text-muted-foreground tnum font-mono">
              · {clockLoc} {lang === "en" ? "Gaza" : "غزّة"}
            </span>
          </div>

          {/* Weekly strip — hairline-divided rows with dark ink */}
          <div className="w-full max-w-md border-t border-border-strong">
            {DAYS.map((d) => {
              const isToday = d.idx === dayOfWeek;
              return (
                <div
                  key={d.en}
                  className={`flex items-baseline justify-between gap-4 py-3 border-b border-border-strong ${
                    isToday
                      ? "text-foreground"
                      : d.closed
                      ? "text-fg-faint"
                      : "text-fg-secondary"
                  }`}
                  data-testid={`day-tile-${d.en.toLowerCase()}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isToday && (
                      <span
                        aria-hidden
                        className="h-px w-5 bg-primary shrink-0"
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
                    className={`text-[13px] tnum font-mono shrink-0 ${
                      d.closed ? "line-through decoration-border-strong" : ""
                    } ${isToday ? "text-foreground" : ""}`}
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

        {/* RIGHT — 24h dial framed on a contained white plate */}
        <div className="relative lg:col-span-5 order-1 lg:order-2 flex items-center justify-center">
          <div
            className="relative w-full max-w-[440px] aspect-square rounded-full bg-surface-2 border border-border-strong flex items-center justify-center"
            style={{ boxShadow: "0 1px 0 0 hsl(0 0% 100% / 0.6) inset, 0 18px 44px -22px hsl(219 47% 13% / 0.28)" }}
          >
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="w-[92%] h-[92%]"
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
                  <stop offset="0%" stopColor={CRIMSON_HI} />
                  <stop offset="100%" stopColor={CRIMSON} />
                </linearGradient>
              </defs>

              {/* faint outer guide ring */}
              <circle
                cx={CX}
                cy={CY}
                r={R_TICK_OUTER + 6}
                fill="none"
                stroke={TRACK}
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
                    stroke={major ? CERULEAN : INK_55}
                    strokeOpacity={major ? 0.75 : 0.35}
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
                    fill={CERULEAN}
                    fillOpacity="0.85"
                    fontSize="13"
                    fontWeight="700"
                    fontFamily="ui-monospace, monospace"
                    letterSpacing="2"
                  >
                    {label}
                  </text>
                );
              })}

              {/* base track behind the open arc — muted neutral */}
              <circle
                cx={CX}
                cy={CY}
                r={R_ARC}
                fill="none"
                stroke={TRACK}
                strokeWidth={STROKE}
              />

              {/* crimson open-hours arc */}
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

              {/* open pin */}
              <motion.g
                initial={{ scale: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.45 }}
                style={{ transformOrigin: `${start.x}px ${start.y}px` }}
              >
                <circle cx={start.x} cy={start.y} r="9" fill="hsl(0 0% 100%)" stroke={CRIMSON} strokeWidth="2" />
                <circle cx={start.x} cy={start.y} r="4" fill={CRIMSON} />
              </motion.g>

              {/* close pin */}
              <motion.g
                initial={{ scale: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 1.85 }}
                style={{ transformOrigin: `${end.x}px ${end.y}px` }}
              >
                <circle cx={end.x} cy={end.y} r="9" fill="hsl(0 0% 100%)" stroke={CRIMSON} strokeWidth="2" />
                <circle cx={end.x} cy={end.y} r="4" fill={CRIMSON} />
              </motion.g>

              {/* live cursor — green when open, muted ink otherwise */}
              <motion.g
                initial={{}}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.42, delay: 2.1 }}
              >
                <line
                  x1={CX}
                  y1={CY}
                  x2={liveDot.x}
                  y2={liveDot.y}
                  stroke={inHours ? OPEN_GREEN : INK_55}
                  strokeOpacity={inHours ? 1 : 0.5}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx={liveDot.x}
                  cy={liveDot.y}
                  r="6"
                  fill={inHours ? OPEN_GREEN : INK}
                  fillOpacity={inHours ? 1 : 0.55}
                  stroke="hsl(0 0% 100%)"
                  strokeWidth="2"
                />
                {inHours && (
                  <circle
                    cx={liveDot.x}
                    cy={liveDot.y}
                    r="14"
                    fill={OPEN_GREEN}
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
                      values="0.35;0;0.35"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </motion.g>

              {/* center readout — cerulean label + deep-navy clock */}
              <text
                x={CX}
                y={CY - 8}
                textAnchor="middle"
                fill={CERULEAN}
                fillOpacity="0.9"
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
                fill={INK}
                fontSize="42"
                fontWeight="800"
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
