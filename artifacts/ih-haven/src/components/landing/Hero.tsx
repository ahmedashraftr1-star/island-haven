import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, ArrowDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

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
  stat1Value: "٣٩",
  stat1Label: "مقعد",
  stat2Value: "٨٠+",
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
  stat1Value: "39",
  stat1Label: "seats",
  stat2Value: "80+",
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
        className={`block ${accent ? "text-primary" : ""}`}
        initial={reduce ? false : { y: "115%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1.1, delay, ease: EASE_OUT_EXPO }}
      >
        {text}
      </motion.span>
    </span>
  );
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
  // Live community figures — same /numbers source NumbersBand uses, so the hero
  // can never contradict the "real numbers from our database" section below.
  const [live, setLive] = useState<{ members: number; seatsHosted: number } | null>(null);

  const stills = useMemo(
    () =>
      [c.image1, c.image2, c.image3, c.image5, c.image6]
        .map(imageUrl)
        .filter(Boolean),
    [c.image1, c.image2, c.image3, c.image5, c.image6],
  );

  useEffect(() => {
    if (reduce || stills.length < 2) return;
    const id = setInterval(() => setStillIdx((i) => (i + 1) % stills.length), 5500);
    return () => clearInterval(id);
  }, [reduce, stills.length]);

  useEffect(() => {
    let cancelled = false;
    api<{ numbers: { members: number; seatsHosted: number } }>("/numbers")
      .then((r) => { if (!cancelled) setLive({ members: r.numbers.members, seatsHosted: r.numbers.seatsHosted }); })
      .catch(() => { /* keep content fallbacks */ });
    return () => { cancelled = true; };
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
  const stats = [
    { v: live ? fmt(live.seatsHosted) : c.stat1Value, l: c.stat1Label },
    { v: live ? fmt(live.members) : c.stat2Value, l: c.stat2Label },
    { v: c.stat3Value, l: c.stat3Label },
  ].filter((s) => s.v || s.l);

  return (
    <section
      id="hero"
      ref={ref}
      className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-[#060608] text-white"
    >
      {/* ── Full-bleed photography, kept sharp (the room's real energy is the
          soul of the page). Slow Ken-Burns cross-fade between stills. ── */}
      <motion.div
        style={{ y: photoY, scale: photoScale }}
        className="absolute inset-0 will-change-transform"
        aria-hidden
      >
        {stills.map((src, i) => (
          <motion.img
            key={`${src}-${i}`}
            src={src}
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

      {/* ── Cinematic scrim — sharp in the middle (image breathes), dark only at
          the top (behind the nav) and bottom (behind stats/CTAs). Much lighter
          than before so the photograph reads crisp, not muddy. ── */}
      <div aria-hidden className="absolute inset-0 z-[1]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,6,10,0.64) 0%, rgba(6,6,10,0.30) 18%, rgba(6,6,10,0.06) 46%, rgba(6,6,10,0.42) 78%, rgba(6,6,10,0.9) 100%)",
          }}
        />
        {/* Focused directional scrim behind the headline (right side in RTL) so
            the type stays razor-crisp while the rest of the frame stays open. */}
        <div
          className="absolute inset-y-0 right-0 w-full lg:w-[62%]"
          style={{
            background:
              "linear-gradient(270deg, rgba(6,6,10,0.72) 0%, rgba(6,6,10,0.38) 46%, transparent 82%)",
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

      {/* ── The message. One eyebrow, one monumental headline, one line of
          support, one decisive action. Nothing else competes. ── */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 h-full flex items-center will-change-transform"
      >
        <div className="container-ih w-full">
          <div className="relative max-w-4xl">
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
              style={{ fontSize: "clamp(3rem, 7.6vw, 7.75rem)", fontWeight: 900, lineHeight: 0.94, letterSpacing: "-0.05em" }}
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
            className="mt-7 lg:mt-9 max-w-2xl text-[1.0625rem] lg:text-xl text-white/85 font-normal leading-[1.7] whitespace-pre-line"
          >
            {c.subtitle}
          </motion.p>

          {/* One primary action (Apply) + one quiet secondary (Book a seat). */}
          <motion.div
            initial={{ y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.82, duration: 0.5, ease: EASE_OUT_EXPO }}
            className="mt-9 lg:mt-11 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
          >
            <a
              href={c.ctaPrimaryHref || "/apply"}
              data-testid="cta-apply"
              className="cta-fill group relative inline-flex items-center justify-center gap-3 h-14 lg:h-[60px] px-9 rounded-full font-bold text-[15.5px] tracking-[-0.005em] hover:scale-[1.02] active:scale-[0.99] transition-transform duration-200 ease-out shadow-[0_24px_64px_-14px_hsl(354_82%_40%/0.62)]"
            >
              <span className="relative z-10">{c.ctaPrimary}</span>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 relative z-10" />
            </a>
            <a
              href={`${import.meta.env.BASE_URL}book`}
              data-testid="cta-book"
              className="group relative inline-flex items-center justify-center gap-3 h-14 lg:h-[58px] px-7 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-[14px] tracking-[-0.005em] hover:bg-white/15 hover:border-white/30 active:bg-white/20 transition-colors duration-300"
            >
              <span className="relative z-10">{c.bookCtaLabel}</span>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 relative z-10" />
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Slim proof bar: three real figures + a quiet scroll cue. ── */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05, duration: 1, ease: EASE_OUT_EXPO }}
        className="absolute bottom-0 inset-x-0 z-10 pb-7 lg:pb-9"
      >
        <div className="container-ih">
          <div className="flex items-end justify-between gap-6">
            <div className="flex items-stretch gap-0">
              {stats.map((s, i) => (
                <div
                  key={`${s.l}-${i}`}
                  className={`flex flex-col justify-end px-5 lg:px-7 ${i === 0 ? "ps-0" : "border-s border-white/[0.22]"}`}
                >
                  <div className="t-h2 !text-white tnum leading-none">
                    {s.v}
                  </div>
                  <div className="text-[11px] text-white/65 mt-2 font-medium tracking-wide">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            <motion.div
              animate={reduce ? undefined : { y: [0, 6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="hidden md:flex flex-col items-center gap-2 text-white/60"
            >
              <span className="text-[10px] tracking-[0.2em] uppercase font-semibold">{c.scrollLabel}</span>
              <ArrowDown className="w-4 h-4" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
