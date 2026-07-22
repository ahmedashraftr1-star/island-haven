import { useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Btn } from "@/components/ui/Btn";
import { Reveal } from "@/components/landing/Reveal";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { imageUrl } from "@/hooks/use-content";

/**
 * GazaToGlobal — "من غزّة إلى العالم / From Gaza to the World", the homepage's
 * living signature, built on the thesis "الموهبة لا تحدّها الجغرافيا" (talent
 * isn't bounded by geography). It sits on a vivid Gaza PHOTOGRAPH (CinematicMedia
 * + glass-ambient) with the animated reach map and copy floating in a single
 * `glass-panel-lg` tile — the site's dark-glass material.
 *
 * The centerpiece is an ACTUAL WORLD MAP — a recognisable inline-SVG continents
 * silhouette (equirectangular, 0 0 1000 500) drawn faint on the dark glass — with
 * a pulsing terracotta origin (Gaza) at its true map coordinate. Great-circle-
 * style arcs sweep from Gaza to a constellation of real global destinations. On
 * scroll-into-view the arcs DRAW (framer-motion pathLength) and nodes pop +
 * ripple in a stagger.
 *
 * INTERACTIVE: every destination node is keyboard-focusable and hoverable. The
 * active node brightens its own arc + node and dims the rest, and its honest
 * reach line (region + a truthful "our members work with clients here" narrative,
 * NO invented numbers) surfaces in a caption slot below the map. aria-labels on
 * every node; the map has a live-region caption so screen-reader users hear the
 * active reach line.
 *
 * PERF/SECURITY: pure local math + inlined constant path data for the geometry
 * (no external files/URLs, no eval / innerHTML / network beyond the honest reach
 * copy). Everything is transform/opacity only (GPU). The infinite ripple loops
 * are GATED on `useInView` so they PAUSE when the section is scrolled offscreen.
 * Under prefers-reduced-motion the arcs render drawn and static, no loops, and
 * hover/focus still switches the caption.
 */

/* ── Projection — equirectangular into a 1000×500 viewBox. Pure local math:
   longitude −180…180 → 0…1000, latitude 90…−90 → 0…500. Used only to place the
   real-world map coordinates below onto the inline continents silhouette. ── */
const VB_W = 1000;
const VB_H = 500;
const project = (lat: number, lon: number) => ({
  x: ((lon + 180) / 360) * VB_W,
  y: ((90 - lat) / 180) * VB_H,
});

/* Gaza — ~31.5°N, 34.5°E — the terracotta origin. */
const ORIGIN = project(31.5, 34.5);

type Region = {
  id: string;
  lat: number;
  lon: number;
  r: number;
  delay: number;
  /* Arc lift factor — how far the great-circle-style curve bows off the direct
     chord (fraction of chord length, perpendicular). Positive bows "north". */
  lift: number;
  region: { ar: string; en: string };
  reach: { ar: string; en: string };
};

/* Honest reach narrative per region — a truthful "our members work with clients
   / partners here" line. NO specific per-region numbers are invented. The lat/lon
   are the real approximate map positions the arcs terminate on. */
const REGIONS: Region[] = [
  {
    id: "eu",
    lat: 50,
    lon: 10,
    r: 5.5,
    delay: 0.05,
    lift: 0.28,
    region: { ar: "أوروبا", en: "Europe" },
    reach: { ar: "أعضاؤنا يعملون مع عملاء وشركاء هنا.", en: "Our members work with clients & partners here." },
  },
  {
    id: "us",
    lat: 40,
    lon: -90,
    r: 6,
    delay: 0.14,
    lift: 0.22,
    region: { ar: "أمريكا الشماليّة", en: "North America" },
    reach: { ar: "مشاريع تُسلَّم عبر الأطلسي من قلب غزّة.", en: "Projects delivered across the Atlantic from Gaza." },
  },
  {
    id: "gulf",
    lat: 25,
    lon: 50,
    r: 6,
    delay: 0.23,
    lift: 0.42,
    region: { ar: "الخليج", en: "The Gulf" },
    reach: { ar: "شراكات ومهمّات مع فرقٍ في المنطقة.", en: "Partnerships & engagements with teams in the region." },
  },
  {
    id: "asia",
    lat: 30,
    lon: 105,
    r: 5,
    delay: 0.32,
    lift: 0.26,
    region: { ar: "آسيا", en: "Asia" },
    reach: { ar: "عملٌ عن بُعد يصل أسواقًا في القارّة.", en: "Remote work reaching markets across the continent." },
  },
  {
    id: "africa",
    lat: 5,
    lon: 20,
    r: 4.5,
    delay: 0.41,
    lift: -0.3,
    region: { ar: "إفريقيا", en: "Africa" },
    reach: { ar: "تعاونٌ يمتدّ جنوبًا عبر الحدود.", en: "Collaboration reaching south, across borders." },
  },
];

/* Pre-project each region to viewBox px + build a great-circle-style quadratic
   arc from Gaza. The control point is the chord midpoint pushed perpendicular by
   `lift`, so arcs bow gracefully instead of running dead-straight. Pure constant
   math evaluated once at module load. */
type PlacedRegion = Region & { x: number; y: number; d: string };
const PLACED: PlacedRegion[] = REGIONS.map((n) => {
  const { x, y } = project(n.lat, n.lon);
  const mx = (ORIGIN.x + x) / 2;
  const my = (ORIGIN.y + y) / 2;
  const dx = x - ORIGIN.x;
  const dy = y - ORIGIN.y;
  // Perpendicular (rotate the chord 90°), normalised, scaled by chord × lift.
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * len * n.lift;
  const cy = my + ny * n.lift * len;
  return { ...n, x, y, d: `M ${ORIGIN.x} ${ORIGIN.y} Q ${cx} ${cy} ${x} ${y}` };
});

/* ── Inline world map — a simplified, low-detail continents silhouette in the
   same 1000×500 equirectangular viewBox. Public-domain-style hand-simplified
   outlines (no external file/URL, no network). It reads as "the world" and sits
   quietly under the reach arcs. ── */
const WORLD_PATH = [
  // North America
  "M148 96 L206 92 L262 104 L286 128 L268 150 L300 156 L292 182 L256 196 L242 224 L214 236 L200 210 L214 184 L188 176 L170 150 L150 152 L138 128 Z",
  // Central America
  "M256 208 L286 232 L300 258 L288 268 L270 246 L258 222 Z",
  // South America
  "M300 276 L336 268 L360 288 L356 324 L338 372 L320 404 L306 396 L312 356 L294 320 L288 292 Z",
  // Greenland
  "M330 62 L372 58 L392 78 L372 100 L342 96 L326 78 Z",
  // Africa
  "M498 214 L552 206 L586 214 L604 244 L596 288 L572 330 L548 356 L528 344 L520 306 L500 274 L488 244 Z",
  // Europe
  "M486 128 L536 120 L560 116 L556 140 L520 152 L498 168 L476 158 L472 138 Z",
  // Middle East / West Asia
  "M566 158 L604 152 L628 168 L620 196 L592 204 L574 188 Z",
  // Asia (main mass)
  "M566 108 L648 100 L732 104 L806 120 L852 140 L862 168 L820 184 L768 176 L716 188 L672 176 L628 164 L596 148 L574 132 Z",
  // South-East Asia / India peninsula
  "M636 200 L668 196 L680 224 L664 244 L648 222 Z",
  "M732 196 L772 200 L788 224 L766 244 L742 226 Z",
  // Australia
  "M792 320 L848 312 L884 332 L878 366 L840 380 L800 366 L786 342 Z",
].join(" ");

export function GazaToGlobal() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const ar = lang === "ar";

  // Reach stats — straight from the real value props the incubator hands over.
  // FIGURES stay Western/Latin numerals regardless of site language (owner ask);
  // labels read English-primary so the block reads as a tidy English data ledger.
  // None invented beyond the vetted marketplace value props — only reformatted.
  const stats = [
    {
      value: "190+",
      label: t({ ar: "دولة حول العالم", en: "countries reached" }),
      sub: t({ ar: "سوق عمل عالميّ عبر الحدود", en: "Global work marketplace" }),
    },
    {
      value: "100%",
      // "Payoneer" is a brand name — it stays Latin in both locales.
      label: t({ ar: "مدفوعات Payoneer إلى غزّة", en: "Payoneer payouts to Gaza" }),
      sub: t({ ar: "تحويلات دوليّة تصل غزّة", en: "International payments in" }),
    },
    {
      value: "$25K",
      label: t({ ar: "رصيد خدمات سحابيّة", en: "cloud credits" }),
      sub: t({ ar: "أدوات وبنية جاهزة", en: "Tooling & infrastructure" }),
    },
    {
      value: "40+",
      label: t({ ar: "مُرشدون وشركاء", en: "mentors & partners" }),
      sub: t({ ar: "شبكة عالميّة", en: "Global network" }),
    },
  ];

  return (
    <CinematicMedia
      as="section"
      id="gaza-to-global"
      data-testid="gaza-to-global"
      src={imageUrl("/photos/IMG_8358.webp")}
      scrim="medium"
      sideScrim={false}
      data-rail-theme="light"
      className="relative overflow-hidden border-t border-white/[0.06]"
      aria-label={t({ ar: "من غزّة إلى العالم", en: "From Gaza to the world" })}
    >
      {/* Ambient lit-space field so the dark canvas reads as depth, not flat black */}
      <div className="glass-ambient pointer-events-none absolute inset-0" aria-hidden />

      <div className="container-ih section-y relative">
        {/* ── Header — the thesis, stated with one terracotta accent word ── */}
        <Reveal as="header" className="max-w-3xl">
          <span className="mb-5 flex items-center gap-2.5">
            <span aria-hidden className="h-px w-9 bg-primary/70" />
            <span className="eyebrow">{t({ ar: "وصولٌ بلا حدود", en: "Reach without borders" })}</span>
          </span>
          <h2
            className="font-display text-white"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)", fontWeight: 900, lineHeight: 0.98, letterSpacing: "-0.05em" }}
          >
            {t({ ar: "من غزّة ", en: "From Gaza " })}
            <span className="text-primary">{t({ ar: "إلى العالم.", en: "to the world." })}</span>
          </h2>
          <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-white/70">
            {t({
              ar: "الموهبة لا تحدّها الجغرافيا. نفتح الباب من قلب غزّة إلى سوقٍ عالميّ، بمدفوعاتٍ تَعبر الحدود وشبكةٍ تمتدّ عبر القارّات.",
              en: "Talent isn't bounded by geography. From the heart of Gaza we open the door to a global market — with payments that cross borders and a network that spans continents.",
            })}
          </p>
        </Reveal>

        {/* ── Centerpiece + reach stats — floating in one dark-glass tile ── */}
        <Reveal delay={0.04}>
          <div className="mt-[clamp(2.5rem,5vw,4rem)] glass-panel-lg p-5 sm:p-7 lg:p-9">
            <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-12 items-center">
              {/* The interactive reach map — arcs draw + nodes pulse; hover/focus a
                  node to highlight its arc and surface its honest reach line. */}
              <div className="lg:col-span-7">
                <ReachVisual reduce={!!reduce} ar={ar} t={t} />
              </div>

              {/* Reach stats — a tidy data ledger. FIGURES are ALWAYS Western/Latin
                  numerals (owner ask) in gold tnum on a fixed-width column so every
                  baseline aligns; English label leads, muted bilingual sub beneath.
                  Hairline separators, even rhythm — reads as one clean data block. */}
              <div className="lg:col-span-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-sand-bright/80 ltr:tracking-[0.16em] rtl:tracking-normal">
                  {t({ ar: "الوصول بالأرقام", en: "Reach in numbers" })}
                </p>
                <div className="border-t border-white/10">
                  {stats.map((s, i) => (
                    <div
                      key={i}
                      data-testid={`reach-stat-${i}`}
                      className="grid grid-cols-[5.25rem_1fr] items-baseline gap-x-4 sm:gap-x-6 border-b border-white/10 py-3.5 sm:py-4"
                    >
                      {/* Figure — Western numerals always; dir=ltr so RTL never flips
                          digit/glyph order, right-aligned into a fixed-width column so
                          every baseline lines up cleanly down the ledger. */}
                      <span
                        className="font-display tnum text-sand-bright leading-none text-end"
                        dir="ltr"
                        style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.85rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
                      >
                        {s.value}
                      </span>
                      <div className="min-w-0">
                        {/* Primary label — follows the site language (RTL in AR). */}
                        <div className="text-[14.5px] font-semibold text-white leading-snug" dir={ar ? "rtl" : "ltr"}>
                          {s.label}
                        </div>
                        {/* Bilingual context — muted, follows the site language */}
                        <div className="mt-0.5 text-[12px] tracking-[0.03em] text-white/50 font-medium rtl:tracking-normal">
                          {s.sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── Closing line + CTA — confident, plain, inviting ── */}
        <Reveal className="mt-[clamp(1.75rem,3.5vw,2.75rem)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <p
            className="font-display text-white max-w-2xl"
            style={{ fontSize: "clamp(1.3rem, 2.6vw, 2rem)", lineHeight: 1.18, letterSpacing: "-0.015em", fontWeight: 700 }}
          >
            {t({ ar: "موهبتك من غزّة — ", en: "Your talent is from Gaza — " })}
            <span className="text-primary">{t({ ar: "وأثرها للعالم كلّه.", en: "its impact is for the whole world." })}</span>
          </p>
          <Btn asChild variant="primary" size="md" className="group shrink-0">
            <Link href="/apply" data-testid="gaza-to-global-apply">
              {t({ ar: "ابدأ رحلتك للعالم", en: "Start your journey out" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
          </Btn>
        </Reveal>
      </div>
    </CinematicMedia>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ReachVisual — the interactive centerpiece: an ACTUAL WORLD MAP. A faint
   continents silhouette carries a terracotta Gaza origin at its true coordinate,
   from which great-circle-style arcs sweep to real global destination nodes.
   Arcs draw on view (pathLength); nodes pop + ripple in a stagger. Hovering /
   focusing a node highlights its arc + node and surfaces the region's honest
   reach line below.

   PERF: the infinite ripple loops are GATED on `useInView` — when the section is
   scrolled offscreen the loops pause (nodes render in their static resting
   state). SECURITY: geometry + the map are pure inlined constant path data / math;
   the only dynamic strings rendered are the honest bilingual reach copy. Under
   reduced-motion everything renders final + static, but hover/focus still
   switches the caption.
   ───────────────────────────────────────────────────────────────────────── */
function ReachVisual({
  reduce,
  ar,
  t,
}: {
  reduce: boolean;
  ar: boolean;
  t: (bi: { ar: string; en: string }) => string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // Gate the infinite ripples: only run while the map is on screen.
  const onScreen = useInView(wrapRef, { amount: 0.25 });
  const loop = onScreen && !reduce;

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = PLACED.find((r) => r.id === activeId) ?? null;

  // Draw config — short-circuited to "already drawn / shown" under reduced-motion.
  const drawArc = reduce
    ? {}
    : {
        initial: { pathLength: 0, opacity: 0 } as const,
        whileInView: { pathLength: 1, opacity: 1 } as const,
        viewport: { once: true, amount: 0.4 },
      };

  const popNode = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { scale: 0, opacity: 0 } as const,
          whileInView: { scale: 1, opacity: 1 } as const,
          viewport: { once: true, amount: 0.4 } as const,
          transition: { delay: 0.6 + delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto overflow-visible"
        role="group"
        aria-label={t({
          ar: "خريطة العالم تُظهر وصول المواهب من غزّة إلى مناطق حول العالم",
          en: "A world map showing talent reaching from Gaza out to regions around the world",
        })}
      >
        {/* Faint graticule — a couple of latitude/meridian guides for depth. */}
        <g stroke="hsl(var(--sand-bright))" strokeWidth="0.6" opacity="0.08">
          <line x1="0" y1={VB_H / 2} x2={VB_W} y2={VB_H / 2} />
          <line x1={VB_W / 2} y1="0" x2={VB_W / 2} y2={VB_H} />
          <line x1="0" y1={VB_H * 0.28} x2={VB_W} y2={VB_H * 0.28} />
          <line x1="0" y1={VB_H * 0.72} x2={VB_W} y2={VB_H * 0.72} />
        </g>

        {/* The world — a soft continents silhouette in faint white/gold so it sits
            quietly beneath the reach arcs. Pure inlined constant path data. */}
        <path
          d={WORLD_PATH}
          fill="hsl(var(--sand-bright))"
          fillOpacity="0.07"
          stroke="hsl(var(--sand-bright))"
          strokeWidth="0.9"
          strokeOpacity="0.24"
          strokeLinejoin="round"
        />

        {/* Reach arcs — sweep from Gaza to each node, drawing on view. The active
            arc brightens + thickens; the rest dim when any node is engaged. */}
        <g strokeLinecap="round" fill="none">
          {PLACED.map((n) => {
            const isActive = activeId === n.id;
            const dimmed = activeId !== null && !isActive;
            return (
              <motion.path
                key={n.id}
                d={n.d}
                stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--sand-bright))"}
                strokeWidth={isActive ? 3 : 1.8}
                style={{ transition: "stroke .3s ease, stroke-width .3s ease, opacity .3s ease" }}
                animate={{ opacity: dimmed ? 0.16 : isActive ? 0.95 : 0.5 }}
                {...drawArc}
                transition={{
                  pathLength: { delay: 0.15 + n.delay, duration: 1.05, ease: "easeOut" },
                  opacity: { delay: 0.15 + n.delay, duration: 0.3 },
                }}
              />
            );
          })}
        </g>

        {/* Destination nodes — gold, pop + soft ripple in a stagger. Each is an
            interactive, keyboard-focusable button that highlights its arc and
            surfaces its honest reach line. */}
        {PLACED.map((n) => {
          const isActive = activeId === n.id;
          const label = `${t(n.region)} — ${t(n.reach)}`;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              role="button"
              tabIndex={0}
              aria-label={label}
              aria-pressed={isActive ? "true" : "false"}
              className="cursor-pointer focus-visible:outline-none [&:focus-visible>circle.node-ring]:opacity-100"
              onMouseEnter={() => setActiveId(n.id)}
              onMouseLeave={() => setActiveId((cur) => (cur === n.id ? null : cur))}
              onFocus={() => setActiveId(n.id)}
              onBlur={() => setActiveId((cur) => (cur === n.id ? null : cur))}
              style={{ transition: "opacity .3s ease" }}
            >
              {/* Generous invisible hit area for pointer + touch */}
              <circle r={18} fill="transparent" />
              {/* Focus ring — shown on keyboard focus via the selector above */}
              <circle
                className="node-ring"
                r={n.r + 6}
                fill="none"
                stroke="hsl(var(--sand-bright))"
                strokeWidth={1.5}
                opacity={0}
                style={{ transition: "opacity .2s ease" }}
              />
              {/* Ripple — GATED on-screen so the loop pauses when scrolled away */}
              {loop && (
                <motion.circle
                  r={n.r}
                  fill="hsl(var(--sand-bright))"
                  initial={{ scale: 0, opacity: 0.45 }}
                  animate={{ scale: [0, 3.2, 3.2], opacity: [0.45, 0, 0] }}
                  transition={{
                    delay: 0.7 + n.delay,
                    duration: 2.2,
                    repeat: Infinity,
                    repeatDelay: 0.8,
                    ease: "easeOut",
                    times: [0, 0.6, 1],
                  }}
                  style={{ transformBox: "fill-box", originX: "0.5", originY: "0.5" }}
                />
              )}
              {/* The node itself — scales up + turns terracotta when engaged */}
              <motion.circle
                r={n.r}
                fill={isActive ? "hsl(var(--primary))" : "hsl(var(--sand-bright))"}
                stroke="#060608"
                strokeWidth="2"
                animate={reduce ? undefined : { scale: isActive ? 1.6 : 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                style={{
                  transformBox: "fill-box",
                  originX: "0.5",
                  originY: "0.5",
                  transition: "fill .3s ease",
                }}
                {...popNode(n.delay)}
              />
            </g>
          );
        })}

        {/* Origin — Gaza. A terracotta pin with a confident heartbeat ripple
            (GATED on-screen). */}
        <g transform={`translate(${ORIGIN.x}, ${ORIGIN.y})`}>
          {loop && (
            <>
              <motion.circle
                r="9"
                fill="hsl(var(--primary))"
                initial={{ scale: 0, opacity: 0.4 }}
                animate={{ scale: [0, 4.5, 4.5], opacity: [0.4, 0, 0] }}
                transition={{ delay: 0.3, duration: 2.6, repeat: Infinity, ease: "easeOut", times: [0, 0.55, 1] }}
                style={{ transformBox: "fill-box", originX: "0.5", originY: "0.5" }}
              />
              <motion.circle
                r="9"
                fill="hsl(var(--primary))"
                initial={{ scale: 0, opacity: 0.55 }}
                animate={{ scale: [0, 2.8, 2.8], opacity: [0.55, 0, 0] }}
                transition={{ delay: 0.5, duration: 2.6, repeat: Infinity, ease: "easeOut", times: [0, 0.55, 1] }}
                style={{ transformBox: "fill-box", originX: "0.5", originY: "0.5" }}
              />
            </>
          )}
          <motion.circle
            r="9"
            fill="hsl(var(--primary))"
            stroke="#060608"
            strokeWidth="2.5"
            {...(reduce
              ? {}
              : {
                  initial: { scale: 0, opacity: 0 },
                  whileInView: { scale: 1, opacity: 1 },
                  viewport: { once: true, amount: 0.4 },
                  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                })}
            style={{ transformBox: "fill-box", originX: "0.5", originY: "0.5" }}
          />
          <text
            x={ar ? -16 : 16}
            y="5"
            textAnchor={ar ? "end" : "start"}
            fontSize="17"
            fill="hsl(var(--primary))"
            fontWeight="700"
          >
            {t({ ar: "غزّة", en: "Gaza" })}
          </text>
        </g>
      </svg>

      {/* Interactive caption — swaps to the active region's honest reach line on
          hover/focus, and falls back to the origin/destination legend at rest.
          aria-live so screen-reader users hear the active reach narrative. */}
      <div className="mt-4 min-h-[1.75rem]" aria-live="polite">
        {active ? (
          <div className="flex items-start gap-2.5 text-[12.5px]">
            <span aria-hidden className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
            <span className="text-white/85">
              <span className="font-bold text-white">{t(active.region)}</span>
              <span className="text-white/30"> — </span>
              <span className="text-white/70">{t(active.reach)}</span>
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5 text-[12.5px] text-white/55">
            <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="font-semibold text-white/80">{t({ ar: "نقطة الانطلاق: غزّة", en: "Origin: Gaza" })}</span>
            <span className="text-white/25">·</span>
            <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-sand-bright" />
            <span>{t({ ar: "مرّر أو انتقل بين الوجهات", en: "Hover or tab through the destinations" })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
