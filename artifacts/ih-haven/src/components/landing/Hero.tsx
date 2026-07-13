import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, ArrowDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";
import { imageUrl, photoSrcSet, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCountUp } from "@/hooks/use-count-up";
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
  const totalSeats = summaryData?.totalSeats ?? 50;

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
    { n: live ? live.members : null, v: live ? fmt(live.members) : c.stat2Value, l: c.stat2Label },
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

      {/* ── Cinematic wash — dark at the top (behind the nav) and the bottom
          (behind the CTAs/figures), open through the middle so the photograph
          still breathes. It deliberately does NOT try to carry the type: a
          page-wide veil strong enough for a terracotta headline would have to
          crush the picture to near-black. The type is protected by a field
          anchored to the TEXT COLUMN instead (see below), which is strictly more
          cover where the glyphs are and strictly less everywhere else. ── */}
      <div aria-hidden className="absolute inset-0 z-[1]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,6,10,0.64) 0%, rgba(6,6,10,0.30) 18%, rgba(6,6,10,0.12) 46%, rgba(6,6,10,0.50) 74%, rgba(6,6,10,0.82) 88%, rgba(6,6,10,0.97) 100%)",
          }}
        />
        {/* Extra deep, tight scrim hugging the very bottom edge so the live
            stats bar keeps razor WCAG-AA contrast even over the brightest photo
            regions — kept below the top/side scrims so the image still breathes. */}
        <div
          className="absolute inset-x-0 bottom-0 h-[34%]"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(6,6,10,0.34) 42%, rgba(6,6,10,0.78) 100%)",
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

      {/* ── The message. One eyebrow, one monumental headline, one line of
          support, one decisive action. Nothing else competes. ── */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 h-full flex flex-col justify-center pt-24 lg:pt-28 pb-10 lg:pb-14 will-change-transform"
      >
        <div className="container-ih w-full">
        <div className="relative">
          {/* ── Type-protection field ──────────────────────────────────────────
              Anchored to the TEXT COLUMN, not the page. This is the whole fix for
              the first screen: the accent word is terracotta (relative luminance
              ≈0.21), so to clear AA-large against it the ground underneath must
              fall below ≈0.02 — i.e. near-black. A page-wide scrim strong enough
              for that would flatten the photograph, which IS the brand. A field
              bound to the column gives the glyphs a ~0.90 core (ground → ≈0.01,
              terracotta clears ~4.3:1) while leaving the rest of the frame — the
              people at the desks, the poster — MORE alive than before, because
              the old directional wedge that dimmed a whole 62% of the frame is
              gone. It is also direction-agnostic by construction: the radial is
              centred on the column, so it mirrors itself in EN with no rtl:
              branch (the old wedge was pinned to physical `right-0` and darkened
              the wrong side entirely in English). ─────────────────────────────*/}
          <div
            aria-hidden
            className="pointer-events-none absolute -z-10 -inset-x-[14%] -top-[16%] -bottom-[18%]"
            style={{
              // Core sits at 36% — on the ACCENT LINE, which is the only run that
              // actually needs ~0.93 (terracotta, Y≈0.21, needs ground ≤0.037 to
              // clear AA-large). The tall 88% extent then carries the lede, the
              // CTAs and the live figures at 0.5–0.86, which is ample for white
              // and sand. Measured, not guessed.
              background:
                "radial-gradient(76% 88% at 50% 36%, rgba(6,6,10,0.93) 0%, rgba(6,6,10,0.88) 34%, rgba(6,6,10,0.66) 62%, rgba(6,6,10,0.30) 82%, transparent 100%)",
            }}
          />
          <div className="relative max-w-4xl">
            <motion.div
              initial={{ y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: DURATION.lg, ease: EASE_OUT_EXPO }}
              className="mb-5 lg:mb-7 flex items-center gap-3"
            >
              <span className="h-[2px] w-12 bg-primary" />
              <span className="text-[11px] tracking-[0.2em] uppercase text-white/85 font-semibold ltr:tracking-[0.2em] rtl:tracking-normal">
                {c.eyebrow}
              </span>
            </motion.div>

            <h1
              className="t-display text-white"
              style={{
                // Trimmed from 7.75rem: the live figures now sit in this same
                // stack, so the column is ~110px taller and the old cap pushed the
                // eyebrow up into the nav at 1440×900.
                fontSize: "clamp(2.9rem, 6.8vw, 6.6rem)",
                fontWeight: 900,
                // Arabic carries marks above AND below the baseline (the shadda of
                // «غزّة», the fatha of «نَحضن»). At 0.94 they collide with the line
                // above and get sheared by RotatingWord's overflow mask. Latin keeps
                // the monumental 0.94 / -0.05em.
                lineHeight: lang === "en" ? 0.94 : 1.14,
                letterSpacing: lang === "en" ? "-0.05em" : "0",
                // A halo, not a shadow: lifts a glyph off any specular highlight the
                // field can't fully swallow (a lamp, the white poster) without
                // reading as an effect.
                textShadow: "0 2px 30px rgba(6,6,10,0.55), 0 1px 4px rgba(6,6,10,0.40)",
              }}
            >
              <KineticLine text={headline.prefix} delay={0.4} reduce={!!reduce} />
              <RotatingWord words={headline.words} delay={0.6} reduce={!!reduce} />
              <KineticLine text={headline.suffix} delay={0.78} reduce={!!reduce} />
            </h1>
          </div>

          {/* Rhythm ladder — the gap GROWS as importance falls: eyebrow→h1 (20/28),
              h1→lede (24/32), lede→CTAs (32/40). The lede also gets a real measure
              so it stops out-running the headline and staying outside the field. */}
          <motion.p
            initial={{ y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5, ease: EASE_OUT_EXPO }}
            className="mt-6 lg:mt-8 max-w-2xl md:max-w-[34rem] lg:max-w-[38rem] text-[1.0625rem] lg:text-xl text-white/85 font-normal leading-[1.7] whitespace-pre-line"
          >
            {c.subtitle}
          </motion.p>

          {/* One primary action (Apply) + one quiet secondary (Book a seat). */}
          <motion.div
            initial={{ y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.82, duration: 0.5, ease: EASE_OUT_EXPO }}
            className="mt-8 lg:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
          >
            <a
              href={c.ctaPrimaryHref || "/apply"}
              data-testid="cta-apply"
              className="cta-fill group relative inline-flex items-center justify-center gap-3 h-14 lg:h-[60px] px-9 rounded-full font-bold text-[15.5px] tracking-[-0.005em] hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-200 ease-out shadow-[0_24px_64px_-14px_hsl(354_82%_40%/0.62)]"
            >
              <span className="relative z-10">{c.ctaPrimary}</span>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 relative z-10" />
            </a>
            <a
              href={`${import.meta.env.BASE_URL}book`}
              data-testid="cta-book"
              className="group relative inline-flex items-center justify-center gap-3 h-14 lg:h-[58px] px-7 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-[14px] tracking-[-0.005em] hover:bg-white/15 hover:border-white/30 active:bg-white/20 transition-colors duration-200"
            >
              <span className="relative z-10">{c.bookCtaLabel}</span>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 relative z-10" />
            </a>
          </motion.div>

          {/* ── Proof, in the same stack ────────────────────────────────────────
              These three live figures used to be an `absolute bottom-0` bar while
              the message above was `h-full flex items-center`. Two independent
              vertical systems means the distance between them is whatever the
              viewport happens to leave over — never designed. At 820×1180 that
              was ~290px of dead photograph between the CTAs and the figures,
              which clung to the very bottom edge. Now the hero is ONE stack: the
              air is distributed once, so the composition holds at every height,
              and the figures sit inside the protection field with the type they
              belong to. ─────────────────────────────────────────────────────── */}
          <motion.div
            className="mt-9 lg:mt-12 flex items-stretch gap-0"
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
        </div>
        </div>
      </motion.div>

      {/* Quiet scroll cue — on the AXIS of the frame, so it is right in Arabic and
          English alike. It used to be a Latin "SCROLL" pinned to the bottom-LEFT of
          an RTL page: the far side from every other element, in the wrong script.
          The arrow says it without a word; the label returns only in EN. */}
      <motion.div
        aria-hidden
        animate={reduce ? undefined : { y: [0, 6, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="hidden md:flex absolute bottom-7 lg:bottom-9 inset-x-0 z-10 flex-col items-center gap-2 text-white/60 will-change-transform pointer-events-none"
      >
        {lang === "en" && (
          <span className="text-[10px] tracking-[0.2em] uppercase font-semibold">{c.scrollLabel}</span>
        )}
        <ArrowDown className="w-4 h-4" />
      </motion.div>
    </section>
  );
}
