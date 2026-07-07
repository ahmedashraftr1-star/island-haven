import { useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
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
 * The centerpiece is a HAND-BUILT viewBox SVG of REACH — a pulsing terracotta
 * origin (Gaza) from which arcs sweep outward to a constellation of global
 * destination nodes. On scroll-into-view the arcs DRAW (framer-motion
 * pathLength) and nodes pop + ripple in a stagger.
 *
 * INTERACTIVE: every destination node is keyboard-focusable and hoverable. The
 * active node brightens its own arc + node and dims the rest, and its honest
 * reach line (region + a truthful "our members work with clients here" narrative,
 * NO invented numbers) surfaces in a caption slot below the map. aria-labels on
 * every node; the map has a live-region caption so screen-reader users hear the
 * active reach line.
 *
 * PERF/SECURITY: pure local math for the geometry (no eval / innerHTML / network
 * beyond the honest reach copy). Everything is transform/opacity only (GPU). The
 * infinite ripple loops are GATED on `useInView` so they PAUSE when the section
 * is scrolled offscreen. Under prefers-reduced-motion the arcs render drawn and
 * static, no loops, and hover/focus still switches the caption.
 */

/* ── Geometry — a stylised world frame in a 760×440 viewBox. The origin (Gaza)
   sits low-left; arcs sweep up and outward to each destination. `cx/cy` is the
   quadratic-bezier control point that gives each arc its lift. Pure constants —
   no map data, no runtime math beyond building the path string. ── */
const ORIGIN = { x: 150, y: 312 };

type Region = {
  id: string;
  x: number;
  y: number;
  cx: number;
  cy: number;
  r: number;
  delay: number;
  region: { ar: string; en: string };
  reach: { ar: string; en: string };
};

/* Honest reach narrative per region — a truthful "our members work with clients
   / partners here" line. NO specific per-region numbers are invented. */
const REGIONS: Region[] = [
  {
    id: "eu",
    x: 360,
    y: 96,
    cx: 230,
    cy: 150,
    r: 5.5,
    delay: 0.05,
    region: { ar: "أوروبا", en: "Europe" },
    reach: { ar: "أعضاؤنا يعملون مع عملاء وشركاء هنا.", en: "Our members work with clients & partners here." },
  },
  {
    id: "us",
    x: 232,
    y: 150,
    cx: 168,
    cy: 232,
    r: 6,
    delay: 0.14,
    region: { ar: "أمريكا الشماليّة", en: "North America" },
    reach: { ar: "مشاريع تُسلَّم عبر الأطلسي من قلب غزّة.", en: "Projects delivered across the Atlantic from Gaza." },
  },
  {
    id: "gulf",
    x: 540,
    y: 168,
    cx: 360,
    cy: 168,
    r: 6,
    delay: 0.23,
    region: { ar: "الخليج", en: "The Gulf" },
    reach: { ar: "شراكات ومهمّات مع فرقٍ في المنطقة.", en: "Partnerships & engagements with teams in the region." },
  },
  {
    id: "asia",
    x: 660,
    y: 248,
    cx: 470,
    cy: 248,
    r: 5,
    delay: 0.32,
    region: { ar: "آسيا", en: "Asia" },
    reach: { ar: "عملٌ عن بُعد يصل أسواقًا في القارّة.", en: "Remote work reaching markets across the continent." },
  },
  {
    id: "africa",
    x: 470,
    y: 332,
    cx: 320,
    cy: 360,
    r: 4.5,
    delay: 0.41,
    region: { ar: "إفريقيا", en: "Africa" },
    reach: { ar: "تعاونٌ يمتدّ جنوبًا عبر الحدود.", en: "Collaboration reaching south, across borders." },
  },
];

const arcPath = (n: Region) => `M ${ORIGIN.x} ${ORIGIN.y} Q ${n.cx} ${n.cy} ${n.x} ${n.y}`;

export function GazaToGlobal() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const ar = lang === "ar";

  const num = (v: string) => (ar ? v.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]) : v);

  // Reach stats — straight from the real value props the incubator hands over.
  // (Gold tnum figures; none invented beyond the vetted marketplace value props.)
  const stats = [
    {
      value: "190+",
      label: t({ ar: "دولة يصلها العمل عبر الحدود", en: "Countries reached across borders" }),
      sub: t({ ar: "سوق عمل عالميّ", en: "Global work marketplace" }),
    },
    {
      value: "100%",
      label: t({ ar: "مدفوعات دوليّة تصل غزّة", en: "International payments into Gaza" }),
      sub: t({ ar: "Payoneer", en: "via Payoneer" }),
    },
    {
      value: "$25K",
      label: t({ ar: "أرصدة سحابيّة وأدوات عالميّة", en: "Cloud credits & global tooling" }),
      sub: t({ ar: "بنية جاهزة", en: "Ready infrastructure" }),
    },
    {
      value: "40+",
      label: t({ ar: "مرشد وشريك حول العالم", en: "Mentors & partners worldwide" }),
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

              {/* Reach stats — gold tnum numerals, hairline ledger (no chips) */}
              <div className="lg:col-span-5">
                <div className="border-t border-white/10">
                  {stats.map((s, i) => (
                    <div
                      key={i}
                      data-testid={`reach-stat-${i}`}
                      className="grid grid-cols-[auto_1fr] items-baseline gap-x-5 sm:gap-x-7 border-b border-white/10 py-6 sm:py-7"
                    >
                      <span
                        className="font-display tnum text-sand-bright leading-none"
                        style={{ fontSize: "clamp(2rem, 3.6vw, 3rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
                      >
                        {num(s.value)}
                      </span>
                      <div>
                        <div className="text-[15px] font-semibold text-white leading-snug">{s.label}</div>
                        <div className="mt-1 text-[12px] tracking-[0.04em] text-white/55 font-semibold rtl:tracking-normal">
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
        <Reveal className="mt-[clamp(2.5rem,5vw,4rem)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <p
            className="font-display text-white max-w-2xl"
            style={{ fontSize: "clamp(1.3rem, 2.6vw, 2rem)", lineHeight: 1.18, letterSpacing: "-0.015em", fontWeight: 700 }}
          >
            {t({ ar: "موهبتك من غزّة — ", en: "Your talent is from Gaza — " })}
            <span className="text-primary">{t({ ar: "وأثرها للعالم كلّه.", en: "its impact is for the whole world." })}</span>
          </p>
          <Link
            href="/apply"
            data-testid="gaza-to-global-apply"
            className="cta-fill group inline-flex items-center justify-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5 shrink-0"
          >
            {t({ ar: "ابدأ رحلتك للعالم", en: "Start your journey out" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </CinematicMedia>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ReachVisual — the interactive SVG centerpiece. A terracotta Gaza origin
   radiates arcs to a constellation of gold destination nodes. Arcs draw on view
   (pathLength); nodes pop + ripple in a stagger. Hovering / focusing a node
   highlights its arc + node and surfaces the region's honest reach line below.

   PERF: the infinite ripple loops are GATED on `useInView` — when the section is
   scrolled offscreen the loops pause (nodes render in their static resting
   state). SECURITY: geometry is pure constant math; the only strings rendered
   are the honest bilingual reach copy. Under reduced-motion everything renders
   final + static, but hover/focus still switches the caption.
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
  const active = REGIONS.find((r) => r.id === activeId) ?? null;

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
        viewBox="0 0 760 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={t({
          ar: "خريطة تفاعليّة تُظهر وصول المواهب من غزّة إلى مناطق حول العالم",
          en: "An interactive map showing talent reaching from Gaza out to regions around the world",
        })}
      >
        {/* Faint latitude/meridian field — a "world" frame without real map data. */}
        <g stroke="hsl(var(--sand-bright))" strokeWidth="0.75" opacity="0.16">
          <path d="M 40 120 Q 380 96 720 120" />
          <path d="M 40 220 Q 380 196 720 220" />
          <path d="M 40 320 Q 380 296 720 320" />
          <path d="M 200 40 Q 224 220 200 400" />
          <path d="M 380 40 Q 400 220 380 400" />
          <path d="M 560 40 Q 584 220 560 400" />
        </g>

        {/* Reach arcs — sweep from Gaza to each node, drawing on view. The active
            arc brightens + thickens; the rest dim when any node is engaged. */}
        <g strokeLinecap="round" fill="none">
          {REGIONS.map((n) => {
            const isActive = activeId === n.id;
            const dimmed = activeId !== null && !isActive;
            return (
              <motion.path
                key={n.id}
                d={arcPath(n)}
                stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--sand-bright))"}
                strokeWidth={isActive ? 2.6 : 1.6}
                style={{ transition: "stroke .3s ease, stroke-width .3s ease, opacity .3s ease" }}
                animate={{ opacity: dimmed ? 0.18 : isActive ? 0.95 : 0.55 }}
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
        {REGIONS.map((n) => {
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
              className="cursor-pointer focus:outline-none [&:focus-visible>circle.node-ring]:opacity-100"
              onMouseEnter={() => setActiveId(n.id)}
              onMouseLeave={() => setActiveId((cur) => (cur === n.id ? null : cur))}
              onFocus={() => setActiveId(n.id)}
              onBlur={() => setActiveId((cur) => (cur === n.id ? null : cur))}
              style={{ transition: "opacity .3s ease" }}
            >
              {/* Generous invisible hit area for pointer + touch */}
              <circle r={16} fill="transparent" />
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
            fontSize="15"
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
