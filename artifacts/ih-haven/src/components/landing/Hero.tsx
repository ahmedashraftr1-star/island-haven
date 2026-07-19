import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, ArrowDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";
import { imageUrl, photoSrcSet, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCountUp } from "@/hooks/use-count-up";
import { SpecularSheen } from "@/components/ui/SpecularButton";
import { useNumbers, useAttendanceSummary } from "@/hooks/use-public-data";
import { ParticleField } from "./ParticleField";

const FALLBACK = {
  eyebrow: "Business Incubator · حاضنة أعمال في غزّة",
  title1: "نَحضن أحلامك،",
  title2: "في قلب غزّة.",
  subtitle:
    "حاضنة أعمال غزّاويّة. نأخذ فكرتك من الورقة إلى المنتج، ومن المنتج إلى السّوق — بإرشاد، برامج احتضان، وشبكة من الخبراء والشركاء.",
  ctaPrimary: "قدّم على الحاضنة",
  ctaPrimaryHref: "/apply",
  bookCtaLabel: "احجز مقعدك",
  scrollLabel: "Scroll",
  // Live-numeric stats have NO fabricated fallback — the real /numbers value
  // fills them in (counting up); until then only the label shows. Never a
  // hardcoded/inflated figure. stat3 (100% free) is an always-true constant.
  stat1Value: "",
  stat1Label: "مقعد",
  stat2Value: "",
  stat2Label: "منتسب",
  stat3Value: "١٠٠٪",
  stat3Label: "مجّانيّ",
  image1: "/photos/IMG_8341.webp",
  image2: "/photos/IMG_8347.webp",
  image3: "/photos/IMG_8358.webp",
  image5: "/photos/IMG_8352.webp",
  image6: "/photos/IMG_8300.webp",
};

const EN_FALLBACK = {
  eyebrow: "Gaza's leading tech incubator & startup community",
  title1: "We prepare you",
  title2: "for the world.",
  subtitle:
    "Gaza's business incubator. We take your idea from paper to product, and from product to market — through mentorship, incubation programs, and a global network of experts and partners.",
  ctaPrimary: "Apply to Island Haven",
  ctaPrimaryHref: "/apply",
  bookCtaLabel: "Book a Seat",
  scrollLabel: "Scroll",
  stat1Value: "",
  stat1Label: "seats",
  stat2Value: "",
  stat2Label: "members",
  stat3Value: "100%",
  stat3Label: "free",
  image1: "/photos/IMG_8341.webp",
  image2: "/photos/IMG_8347.webp",
  image3: "/photos/IMG_8358.webp",
  image5: "/photos/IMG_8352.webp",
  image6: "/photos/IMG_8300.webp",
};

// A single headline line that rises up from behind a clipping mask on first
// paint (transform-only, GPU). Reduced motion → static.
function KineticLine({
  text,
  delay = 0,
  accent = false,
  reduce = false,
}: {
  text: string;
  delay?: number;
  accent?: boolean;
  reduce?: boolean;
}) {
  return (
    <span className="block overflow-hidden pt-[0.14em] pb-[0.1em]">
      <motion.span
        className={`block will-change-transform ${accent ? "text-primary" : ""}`}
        initial={reduce ? false : { y: "115%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1.05, delay, ease: EASE_OUT_EXPO }}
      >
        {text}
      </motion.span>
    </span>
  );
}

// A single hero figure. When given a real numeric `target` (a live /numbers
// value), it counts up 0→target once the bar has entered, then formats it in
// the active locale (Arabic-Indic in AR). When the value is a non-numeric
// display string ("100%", "80+", or a pre-fetch fallback), it renders as-is —
// we NEVER count to an invented number. Reduced-motion → the real value, instant.
function StatFigure({
  target,
  display,
  active,
  fmt,
}: {
  target: number | null;
  display: string;
  active: boolean;
  fmt: (n: number) => string;
}) {
  const count = useCountUp(target ?? 0, 1200, active && target !== null);
  if (target === null) return <>{display}</>;
  return <>{fmt(count)}</>;
}

// The crimson object-word of the headline, cycling through the promise
// (ventures → dreams → futures → talent). Slides up on first paint (with the
// headline cascade delay), then swaps in place — the kinetic heartbeat of the
// hero. On its own line so width changes never shift the rest of the layout.
// Reduced-motion → the first word, static.
function RotatingWord({
  words,
  delay = 0,
  reduce = false,
}: {
  words: string[];
  delay?: number;
  reduce?: boolean;
}) {
  const [i, setI] = useState(0);
  const first = useRef(true);
  useEffect(() => {
    if (reduce || words.length < 2) return;
    const id = setInterval(() => {
      first.current = false;
      setI((p) => (p + 1) % words.length);
    }, 2600);
    return () => clearInterval(id);
  }, [reduce, words.length]);

  return (
    <span className="relative block overflow-hidden pt-[0.14em] pb-[0.1em]" style={{ perspective: "1000px" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[i]}
          className="block text-primary will-change-transform"
          initial={reduce ? false : { y: "60%", rotateX: -42, opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, rotateX: 0, opacity: 1, filter: "blur(0px)" }}
          exit={reduce ? { opacity: 0 } : { y: "-60%", rotateX: 42, opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.7, delay: first.current ? delay : 0, ease: EASE_OUT_EXPO }}
          style={{ transformOrigin: "center" }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Hero() {
  const { lang } = useLanguage();
  const cms = useContentSection("hero", FALLBACK);
  const c = lang === "en" ? EN_FALLBACK : cms;
  const reduce = useReducedMotion();
  // Monumental headline (prefix · rotating object-word · suffix) — the crimson
  // word cycles the promise (ventures → dreams → futures → talent), the kinetic
  // heartbeat of the hero. Big, bold, alive.
  const headline =
    lang === "en"
      ? { prefix: "We grow Gaza's", words: ["ventures", "dreams", "futures", "talent"], suffix: "for the world." }
      : { prefix: "نَحضن", words: ["مشاريعك", "أحلامك", "مستقبلك", "طاقاتك"], suffix: "في قلب غزّة." };
  const ref = useRef<HTMLElement>(null);
  const [stillIdx, setStillIdx] = useState(0);
  // Flips true one frame after mount — gates the stats count-up so it begins
  // only once the bar itself has entered (after the headline cascade), matching
  // the Apple "figures settle last" rhythm. Reduced-motion still shows real
  // values instantly (useCountUp snaps regardless of this flag).
  const [entered, setEntered] = useState(false);
  // Live community figures — same shared /numbers query NumbersBand reads (ONE
  // cached request, deduped by React Query), so the hero can never contradict the
  // "real numbers from our database" section below. Null until it resolves, so the
  // count-up + honest empty fallbacks keep working exactly as before.
  const { data: numbersData } = useNumbers();
  const live = numbersData?.numbers
    ? { members: numbersData.numbers.members, seatsHosted: numbersData.numbers.seatsHosted }
    : null;
  // Seat figure = the space's fixed CAPACITY (same live-summary `totalSeats` the
  // SeatsBoard leads with: "50 seats"), NOT the taken count — so the hero can
  // never be read as "6 total seats" and never contradicts the board two
  // sections down. Falls back to the known real capacity when the summary is
  // still loading. This is the single source both the hero and board share.
  const { data: summaryData } = useAttendanceSummary();
  // `|| 50` (not `??`) so a degraded `{ totalSeats: 0 }` response never renders a
  // misleading "٠ مقعد" — the space has 50 real seats; 0 only means "unknown".
  const totalSeats = summaryData?.totalSeats || 50;

  const stills = useMemo(
    () =>
      [c.image1, c.image2, c.image3, c.image5, c.image6]
        .map(imageUrl)
        .filter(Boolean),
    [c.image1, c.image2, c.image3, c.image5, c.image6],
  );

  // Every still is `absolute inset-0` — i.e. INSIDE the viewport, merely
  // transparent — so `loading="lazy"` does not hold the non-visible ones back:
  // the browser eagerly pulled all five (~800KB of webp) during first paint,
  // starving the LCP still. None of them is shown before the first cross-fade at
  // 5.5s, so mount only the LCP still up front and add the rest once the browser
  // is idle. Reduced-motion never cross-fades, so it never pays for them at all.
  const [showRestStills, setShowRestStills] = useState(false);
  useEffect(() => {
    if (reduce || stills.length < 2) return;
    type IdleWin = Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    const w = window as IdleWin;
    const id = w.requestIdleCallback
      ? w.requestIdleCallback(() => setShowRestStills(true), { timeout: 2500 })
      : window.setTimeout(() => setShowRestStills(true), 1200);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [reduce, stills.length]);

  // Only cycle across the stills that are actually mounted.
  const mountedStills = showRestStills ? stills : stills.slice(0, 1);

  useEffect(() => {
    if (reduce || mountedStills.length < 2) return;
    const id = setInterval(
      () => setStillIdx((i) => (i + 1) % mountedStills.length),
      5500,
    );
    return () => clearInterval(id);
  }, [reduce, mountedStills.length]);

  // Kick the count-up shortly after the headline lines have risen, so the
  // figures are the last thing to settle (Apple cadence). One-shot.
  useEffect(() => {
    const id = window.setTimeout(() => setEntered(true), 1150);
    return () => window.clearTimeout(id);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4, restDelta: 0.001 });
  const photoY = useTransform(smooth, [0, 1], ["0%", reduce ? "0%" : "10%"]);
  const photoScale = useTransform(smooth, [0, 1], [1, reduce ? 1 : 1.08]);
  const textY = useTransform(smooth, [0, 1], ["0%", reduce ? "0%" : "-22%"]);

  // Format a live count in the active locale (Arabic-Indic in AR, Western in EN)
  // so the hero stats read identically to NumbersBand and never disagree.
  const fmt = (n: number) => n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
  // Each stat carries an optional real numeric `n` (only ever a live /numbers
  // value) so it can count up; when `n` is null the display string renders
  // verbatim — so the pre-fetch fallbacks and the non-numeric "100% free" never
  // animate toward an invented figure.
  const stats: { n: number | null; v: string; l: string }[] = [
    { n: totalSeats, v: fmt(totalSeats), l: c.stat1Label },
    { n: live ? live.members : null, v: live ? fmt(live.members) : (c.stat2Value || "—"), l: c.stat2Label },
    { n: null, v: c.stat3Value, l: c.stat3Label },
  ].filter((s) => s.v || s.l);

  return (
    <section
      id="hero"
      ref={ref}
      className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-[#060608] text-white"
    >
      {/* ── Full-bleed photography, kept sharp (the room's real energy is the
          soul of the page). Two nested transform layers so they never fight:
          the OUTER runs the one-shot entrance (scale 1.05→1 + fade in over ~1s
          on first mount), the INNER carries the scroll-driven Ken-Burns
          (parallax + zoom). Reduced-motion → outer holds static at scale 1. ── */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        aria-hidden
        initial={reduce ? false : { scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      >
      <motion.div
        style={{ y: photoY, scale: photoScale }}
        className="absolute inset-0 will-change-transform"
      >
        {mountedStills.map((src, i) => (
          <motion.img
            key={`${src}-${i}`}
            src={src}
            // Full-bleed: the browser picks the 640/960/1350 variant by viewport
            // × DPR instead of always pulling the 1350w original.
            srcSet={photoSrcSet(src)}
            sizes="100vw"
            alt=""
            initial={false}
            animate={{
              opacity: i === stillIdx ? 1 : 0,
              scale: i === stillIdx ? (reduce ? 1 : 1.08) : 1,
            }}
            transition={{
              opacity: { duration: 1.6, ease: [0.16, 1, 0.3, 1] },
              scale: { duration: 7, ease: "linear" },
            }}
            className="absolute inset-0 w-full h-full object-cover saturate-[1.24] contrast-[1.12] brightness-[1.08]"
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            {...(i === 0 ? { fetchPriority: "high" as any } : {})}
          />
        ))}
      </motion.div>
      </motion.div>

      {/* ── THE MONUMENT · scrim ──
          There used to be three scrims here, and together they were the problem:
          a directional wash behind the headline plus a full-frame darkener plus a
          floor. They bought contrast by DIMMING the photograph — and the vivid Gaza
          photograph is the brand. Every WCAG number went green while the thing the
          site is built on turned to mud.
          The type no longer needs the photo dimmed, because it now stands on ground
          of its own (the column below). So all that is left is a whisper: enough at
          the very top for the nav to sit on, enough at the floor for the edge, and
          NOTHING across the middle. The photograph is untouched. ── */}
      <div aria-hidden className="absolute inset-0 z-[1]">
        <div
          className="absolute inset-0"
          style={{
            // The top stop carries the nav, which floats on the picture beside the
            // column: at 0.55 the last link before the photo's bright half ("الشركاء")
            // measured 3.59:1 against its worst pixel — under AA. It is deepened only in
            // the top ~14% of the frame, a strip that is ceiling and sky in every still,
            // and it is fully out of the way by 40%. The photograph's subject is untouched.
            background:
              "linear-gradient(180deg, rgba(6,6,10,0.86) 0%, rgba(6,6,10,0.62) 8%, rgba(6,6,10,0.18) 24%, rgba(6,6,10,0) 45%, rgba(6,6,10,0.30) 85%, rgba(6,6,10,0.70) 100%)",
          }}
        />
      </div>

      {/* Ambient depth — a slow crimson/gold breathing glow in the dark corners,
          giving the hero a living, iOS-like depth. Reduced-motion holds still. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 z-[1] pointer-events-none will-change-transform"
        style={{
          background:
            "radial-gradient(50% 45% at 84% 14%, rgba(233,74,51,0.10) 0%, transparent 62%), radial-gradient(52% 50% at 14% 88%, rgba(224,178,102,0.06) 0%, transparent 64%)",
        }}
        animate={reduce ? undefined : { scale: [1, 1.08, 1], opacity: [0.82, 1, 0.82] }}
        transition={reduce ? undefined : { duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── Constellation of Gaza's talent — an ambient canvas of drifting,
          connecting glow-points that gently react to the cursor. Sits above the
          photo + scrim, below the headline; never blocks clicks. Subtle by
          design; honours reduced-motion (single static frame). ── */}
      <div aria-hidden className="absolute inset-0 z-[2] pointer-events-none">
        <ParticleField />
      </div>

      {/* ── THE MONUMENT · the column ──
          The type used to float directly on the photograph, and it lost every fight
          it picked: terracotta on a lit wall is unreadable at any scrim strength
          (its luminance is ~0.21 — it needs a ground below 0.037 to clear AA, and no
          veil that leaves a photograph alive can get there).
          So the type stops fighting and takes ground of its own: a solid column of
          the brand's own canvas ink, hard-edged, closed by a single terracotta rule.
          Contrast is now solved by COMPOSITION, not by dimming — the panel is opaque
          so the type reads at ~19:1, and the photograph beside it keeps 100% of its
          life. It reads like an inscription cut into stone next to a window.
          Below `lg` the column becomes the full width (a phone has no room for a
          seam) and the photograph shows through as a dark ambient ground. ── */}
      <div className="absolute inset-y-0 start-0 z-10 flex w-full flex-col justify-center border-e border-primary/70 bg-[#060608]/[0.94] px-6 backdrop-blur-[2px] sm:px-10 lg:w-[54%] lg:px-[clamp(2.5rem,4.5vw,5rem)] lg:pt-24 lg:pb-32 xl:w-[50%]">
        {/* The parallax rides the CONTENT, never the column: an architectural edge
            that drifts is no longer architecture. */}
        {/* Header/stats clearance lives on the COLUMN (lg:pt-24 / lg:pb-32) so the
            centred message is centred in the space BETWEEN the fixed nav and the proof
            bar — never behind either. On mobile the column is full-bleed, so the
            clearance stays here instead. Putting a tall bottom padding on THIS div was
            the bug: it inflated the content to ~viewport height, so centring pushed the
            eyebrow up into the header. */}
        <motion.div style={{ y: textY }} className="mx-auto w-full max-w-[34rem] pt-24 pb-36 lg:pt-0 lg:pb-0">
          <div className="relative">
            <motion.div
              initial={{ y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: DURATION.lg, ease: EASE_OUT_EXPO }}
              className="mb-6 lg:mb-8 flex items-center gap-3"
            >
              <span className="h-[2px] w-12 bg-primary" />
              <span className="text-[11px] tracking-[0.2em] uppercase text-white/85 font-semibold ltr:tracking-[0.2em] rtl:tracking-normal">
                {c.eyebrow}
              </span>
            </motion.div>

            <h1
              className="t-display text-white"
              // Sized for the COLUMN, not the viewport. 7.75rem was set when the
              // headline had the whole 1440px to run across; inside a 50% column it
              // would break every line to pieces. Against its own narrower measure
              // this reads BIGGER, not smaller — which is the whole trick of a
              // monument: it is scaled to its plinth, not to the field around it.
              // Leading stays tight (1.02) so the three lines still stack as one mass.
              // Height-aware: on a SHORT desktop viewport the `9vh` term shrinks the
              // headline so the whole monument (eyebrow → headline → sub → CTAs) still
              // fits between the fixed nav and the proof bar, instead of the centred
              // block overflowing upward into the header. Stays full-size on tall screens.
              style={{ fontSize: "clamp(3rem, min(5.4vw, 8vh), 5.4rem)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.045em" }}
            >
              <KineticLine text={headline.prefix} delay={0.4} reduce={!!reduce} />
              <RotatingWord words={headline.words} delay={0.6} reduce={!!reduce} />
              <KineticLine text={headline.suffix} delay={0.78} reduce={!!reduce} />
            </h1>
          </div>

          <motion.p
            initial={{ y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5, ease: EASE_OUT_EXPO }}
            className="mt-5 lg:mt-7 max-w-[30rem] text-[1.0625rem] lg:text-[1.125rem] text-white/75 font-normal leading-[1.75] whitespace-pre-line"
          >
            {c.subtitle}
          </motion.p>

          {/* One primary action (Apply) + one quiet secondary (Book a seat). */}
          <motion.div
            initial={{ y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.82, duration: 0.5, ease: EASE_OUT_EXPO }}
            className="mt-7 lg:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
          >
            <a
              href={c.ctaPrimaryHref || "/apply"}
              data-testid="cta-apply"
              className="cta-fill group relative overflow-hidden inline-flex items-center justify-center gap-3 h-14 lg:h-[60px] px-9 rounded-full font-bold text-[15.5px] tracking-[-0.005em] hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-200 ease-out shadow-[0_24px_64px_-14px_hsl(354_82%_40%/0.62)]"
            >
              <SpecularSheen intensity={0.72} />
              <span className="relative z-10">{c.ctaPrimary}</span>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 relative z-10" />
            </a>
            <a
              href={`${import.meta.env.BASE_URL}book`}
              data-testid="cta-book"
              className="group relative overflow-hidden spectral-edge inline-flex items-center justify-center gap-3 h-14 lg:h-[58px] px-7 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-[14px] tracking-[-0.005em] hover:bg-white/15 hover:border-white/30 active:bg-white/20 transition-colors duration-200"
            >
              {/* The glass Book capsule carries the liquid-glass spectral rim (edge-only —
                  no sheen here, so the two CTAs stay distinct and neither crowds). */}
              <span className="relative z-10">{c.bookCtaLabel}</span>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 relative z-10" />
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Slim proof bar: three real figures + a quiet scroll cue. Enters
          AFTER the headline, each figure on a gentle ~80ms stagger, the numeric
          values counting up once from 0 to the live /numbers value. ── */}
      {/* Held inside the COLUMN, not across the frame. Spanning the full width put
          half the figures on the photograph, where terracotta and white both die.
          Same padding and same measure as the headline above, so the numbers sit on
          its baseline grid rather than near it. */}
      <div className="absolute bottom-0 start-0 z-10 w-full pb-7 lg:w-[54%] lg:pb-9 xl:w-[50%]">
        <div className="px-6 sm:px-10 lg:px-[clamp(2.5rem,4.5vw,5rem)]">
          <div className="mx-auto flex w-full max-w-[34rem] items-end justify-between gap-6 border-t border-white/[0.12] pt-6">
            <motion.div
              className="flex items-stretch gap-0"
              initial={reduce ? false : "hidden"}
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { delayChildren: 1.0, staggerChildren: 0.08 } },
              }}
            >
              {stats.map((s, i) => (
                <motion.div
                  key={`${s.l}-${i}`}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0, transition: { duration: DURATION.lg, ease: EASE_OUT_EXPO } },
                  }}
                  className={`flex flex-col justify-end px-5 lg:px-7 ${i === 0 ? "ps-0" : "border-s border-white/[0.22]"}`}
                >
                  <div className="t-h2 !text-sand-bright tnum leading-none">
                    <StatFigure target={s.n} display={s.v} active={entered} fmt={fmt} />
                  </div>
                  <div className="text-[11px] text-white/65 mt-2 font-medium tracking-wide">
                    {s.l}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Quiet scroll cue — a gentle synchronized bob + opacity breathe
                (motion-safe). Reduced-motion holds it still and fully visible. */}
            <motion.div
              animate={reduce ? undefined : { y: [0, 6, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="hidden md:flex flex-col items-center gap-2 text-white/60 will-change-transform"
            >
              <span className="text-[10px] tracking-[0.2em] uppercase font-semibold">{c.scrollLabel}</span>
              <ArrowDown className="w-4 h-4" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
