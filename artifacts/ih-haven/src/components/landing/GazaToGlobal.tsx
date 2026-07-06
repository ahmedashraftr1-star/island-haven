import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { imageUrl } from "@/hooks/use-content";

/**
 * GazaToGlobal — "من غزّة إلى العالم / From Gaza to the World", the brand's wow
 * moment, built on the thesis "الموهبة لا تحدّها الجغرافيا" (talent isn't bounded
 * by geography). It sits on a full-bleed workspace PHOTOGRAPH (CinematicMedia,
 * heavy scrim) so the animated reach arcs feel like they radiate from a real
 * place — bold display headline, white type, crimson + gold accents over the
 * dimmed photo.
 *
 * The centerpiece is a HAND-BUILT viewBox SVG of REACH — a single crimson origin
 * (Gaza) from which stylised arcs sweep outward to a constellation of global
 * nodes. On scroll-into-view the arcs DRAW (framer-motion pathLength) and the
 * nodes fade + pulse in a stagger. No external map data. Everything is
 * transform/opacity only (GPU) and fully short-circuited under reduced-motion.
 * The SVG lives in a subtle glass card so the photo shows through slightly.
 *
 * Alongside it, four reach stats (gold tnum numerals, Arabic-Indic in AR) drawn
 * from the real value props — Payoneer payments, Freelancer marketplace, cloud
 * credits, global mentors — then a confident closing line + an /apply CTA.
 */

/* Destination constellation — fixed points in the 760×440 viewBox. The origin
   (Gaza) sits low-left; arcs sweep up and outward. `cp` is the bezier control
   point that gives each arc its lift. */
const ORIGIN = { x: 150, y: 312 };

type Node = {
  id: string;
  x: number;
  y: number;
  cx: number;
  cy: number;
  r: number;
  delay: number;
};

const NODES: Node[] = [
  { id: "eu", x: 360, y: 96, cx: 230, cy: 150, r: 5, delay: 0.05 },
  { id: "us", x: 232, y: 150, cx: 168, cy: 232, r: 6, delay: 0.14 },
  { id: "gulf", x: 540, y: 168, cx: 360, cy: 168, r: 5.5, delay: 0.23 },
  { id: "asia", x: 660, y: 248, cx: 470, cy: 248, r: 5, delay: 0.32 },
  { id: "africa", x: 470, y: 332, cx: 320, cy: 360, r: 4.5, delay: 0.41 },
];

const arcPath = (n: Node) =>
  `M ${ORIGIN.x} ${ORIGIN.y} Q ${n.cx} ${n.cy} ${n.x} ${n.y}`;

export function GazaToGlobal() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const ar = lang === "ar";

  const num = (v: string) =>
    ar ? v.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]) : v;

  // Reach stats — straight from the real value props the incubator hands over.
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
      scrim="heavy"
      sideScrim={false}
      className="border-t border-white/[0.06]"
      aria-label={t({ ar: "من غزّة إلى العالم", en: "From Gaza to the world" })}
    >
      <div className="container-ih section-y">
        {/* ── Header — the thesis, stated with one italic crimson accent ── */}
        <Reveal as="header" className="max-w-3xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="h-px w-9 bg-primary/60" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-primary font-bold rtl:tracking-normal">
              {t({ ar: "وصولٌ بلا حدود", en: "Reach without borders" })}
            </span>
          </div>
          <h2
            className="font-display text-white"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)", fontWeight: 900, lineHeight: 0.98, letterSpacing: "-0.05em" }}
          >
            {t({ ar: "من غزّة ", en: "From Gaza " })}
            <span className="italic text-primary">{t({ ar: "إلى العالم.", en: "to the world." })}</span>
          </h2>
          <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-white/70">
            {t({
              ar: "الموهبة لا تحدّها الجغرافيا. نفتح الباب من قلب غزّة إلى سوقٍ عالميّ، بمدفوعاتٍ تَعبر الحدود وشبكةٍ تمتدّ عبر القارّات.",
              en: "Talent isn't bounded by geography. From the heart of Gaza we open the door to a global market — with payments that cross borders and a network that spans continents.",
            })}
          </p>
        </Reveal>

        {/* ── Centerpiece + reach stats — asymmetric editorial split ── */}
        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-center">
          {/* The reach visual — hand-built SVG, arcs draw + nodes pulse on view */}
          <Reveal as="div" className="lg:col-span-7" delay={0.04}>
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm p-5 sm:p-7 lg:p-8">
              <ReachVisual reduce={!!reduce} ar={ar} t={t} />
            </div>
          </Reveal>

          {/* Reach stats — gold tnum numerals, hairline ledger (no chips) */}
          <div className="lg:col-span-5">
            <div className="border-t border-white/10">
              {stats.map((s, i) => (
                <Reveal key={i} delay={i * 0.06}>
                  <div
                    data-testid={`reach-stat-${i}`}
                    className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 sm:gap-x-7 border-b border-white/10 py-6 sm:py-7"
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
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* ── Closing line + CTA — confident, plain, inviting ── */}
        <Reveal className="mt-[clamp(2.5rem,5vw,4rem)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <p
            className="font-display text-white max-w-2xl"
            style={{ fontSize: "clamp(1.3rem, 2.6vw, 2rem)", lineHeight: 1.18, letterSpacing: "-0.015em", fontWeight: 700 }}
          >
            {t({ ar: "موهبتك من غزّة — ", en: "Your talent is from Gaza — " })}
            <span className="italic text-primary">{t({ ar: "وأثرها للعالم كلّه.", en: "its impact is for the whole world." })}</span>
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
   ReachVisual — the hand-built SVG centerpiece. A crimson Gaza origin radiates
   stylised arcs to a constellation of cerulean global nodes. Arcs draw on view
   (pathLength), nodes fade + ripple in a stagger. Transform/opacity only.
   Under reduced-motion every element renders in its final state immediately.
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
    <div className="relative w-full">
      <svg
        viewBox="0 0 760 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        role="img"
        aria-label={t({
          ar: "رسمٌ يُظهر وصول المواهب من غزّة إلى نقاطٍ حول العالم",
          en: "A diagram showing talent reaching from Gaza out to points around the world",
        })}
      >
        {/* Faint latitude/meridian field — gives the constellation a "world" frame
            without depending on real map data. Gold, very low opacity. */}
        <g stroke="hsl(var(--sand-bright))" strokeWidth="0.75" opacity="0.16">
          <path d="M 40 120 Q 380 96 720 120" />
          <path d="M 40 220 Q 380 196 720 220" />
          <path d="M 40 320 Q 380 296 720 320" />
          <path d="M 200 40 Q 224 220 200 400" />
          <path d="M 380 40 Q 400 220 380 400" />
          <path d="M 560 40 Q 584 220 560 400" />
        </g>

        {/* Reach arcs — sweep from Gaza to each global node, drawing on view */}
        <g
          stroke="hsl(var(--sand-bright))"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        >
          {NODES.map((n) => (
            <motion.path
              key={n.id}
              d={arcPath(n)}
              opacity={0.55}
              {...drawArc}
              transition={{ pathLength: { delay: 0.15 + n.delay, duration: 1.05, ease: "easeOut" }, opacity: { delay: 0.15 + n.delay, duration: 0.3 } }}
            />
          ))}
        </g>

        {/* Destination nodes — cerulean, pop + soft ripple in a stagger */}
        {NODES.map((n) => (
          <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
            {!reduce && (
              <motion.circle
                r={n.r}
                fill="hsl(var(--sand-bright))"
                opacity={0.4}
                initial={{ scale: 0, opacity: 0.45 }}
                whileInView={{ scale: [0, 3.2, 3.2], opacity: [0.45, 0, 0] }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: 0.7 + n.delay, duration: 2.2, repeat: Infinity, repeatDelay: 0.8, ease: "easeOut", times: [0, 0.6, 1] }}
                style={{ transformBox: "fill-box", originX: "0.5", originY: "0.5" }}
              />
            )}
            <motion.circle
              r={n.r}
              fill="hsl(var(--sand-bright))"
              stroke="#060608"
              strokeWidth="2"
              {...popNode(n.delay)}
              style={{ transformBox: "fill-box", originX: "0.5", originY: "0.5" }}
            />
          </g>
        ))}

        {/* Origin — Gaza. A crimson pin with a confident heartbeat ripple. */}
        <g transform={`translate(${ORIGIN.x}, ${ORIGIN.y})`}>
          {!reduce && (
            <>
              <motion.circle
                r="9"
                fill="hsl(var(--primary))"
                opacity={0.35}
                initial={{ scale: 0, opacity: 0.4 }}
                whileInView={{ scale: [0, 4.5, 4.5], opacity: [0.4, 0, 0] }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: 0.3, duration: 2.6, repeat: Infinity, ease: "easeOut", times: [0, 0.55, 1] }}
                style={{ transformBox: "fill-box", originX: "0.5", originY: "0.5" }}
              />
              <motion.circle
                r="9"
                fill="hsl(var(--primary))"
                opacity={0.5}
                initial={{ scale: 0, opacity: 0.55 }}
                whileInView={{ scale: [0, 2.8, 2.8], opacity: [0.55, 0, 0] }}
                viewport={{ once: true, amount: 0.4 }}
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

      {/* Caption — names the thesis under the visual, low and quiet */}
      <div className="mt-4 flex items-center gap-2.5 text-[12.5px] text-white/55">
        <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-primary" />
        <span className="font-semibold text-white/80">{t({ ar: "نقطة الانطلاق: غزّة", en: "Origin: Gaza" })}</span>
        <span className="text-white/25">·</span>
        <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-sand-bright" />
        <span>{t({ ar: "وجهات حول العالم", en: "Destinations worldwide" })}</span>
      </div>
    </div>
  );
}
