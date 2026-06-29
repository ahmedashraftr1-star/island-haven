import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, Phone, ArrowDown, Heart } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";
import { HavenMark } from "./HavenMark";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

const FALLBACK = {
  eyebrow: "Business Incubator · حاضنة أعمال في غزّة",
  title1: "نَحضن أحلامك،",
  title2: "في قلب غزّة.",
  subtitle:
    "حاضنة أعمال غزّاويّة. نأخذ فكرتك من الورقة إلى المنتج، ومن المنتج إلى السّوق — بإرشاد، برامج احتضان، وشبكة من الخبراء والشركاء.",
  backedByLabel: "بُني في غزّة",
  backedByBrand: "Made in Gaza",
  ctaPrimary: "قدّم على الحاضنة",
  ctaPrimaryHref: "/apply",
  ctaSecondary: "تحدّث معنا",
  ctaSecondaryHref: "https://wa.me/972567536815",
  topRight: "Season · 2026 · open",
  onAirLabel: "On Air · غزّة",
  bookCtaLabel: "احجز مقعدك",
  scrollLabel: "Scroll",
  greetingMorning: "صباح الخير",
  greetingNoon: "نهارك مُبارك",
  greetingEvening: "مساء النّور",
  greetingNight: "ليلة هانئة",
  estLabel: "Est · 2024",
  placeLabel: "فلسطين · Gaza",
  stat1Value: "٣٩",
  stat1Label: "مقعد",
  stat2Value: "٨٠+",
  stat2Label: "منتسب",
  stat3Value: "١٠٠٪",
  stat3Label: "مجّانيّ",
  image1: "/photos/IMG_8357.webp",
  image2: "/photos/IMG_8347.webp",
  image3: "/photos/IMG_8358.webp",
  image4: "/photos/IMG_8341.webp",
  image5: "/photos/IMG_8352.webp",
  image6: "/photos/IMG_8300.webp",
};

const EN_FALLBACK = {
  eyebrow: "Gaza's leading tech incubator & startup community",
  title1: "We prepare you",
  title2: "for the world.",
  subtitle:
    "Gaza's business incubator. We take your idea from paper to product, and from product to market — through mentorship, incubation programs, and a global network of experts and partners.",
  backedByLabel: "Built in Gaza",
  backedByBrand: "Made in Gaza",
  ctaPrimary: "Apply to Island Haven",
  ctaPrimaryHref: "/apply",
  ctaSecondary: "Chat with us",
  ctaSecondaryHref: "https://wa.me/972567536815",
  topRight: "Season · 2026 · open",
  onAirLabel: "On Air · Gaza",
  bookCtaLabel: "Book a Seat",
  scrollLabel: "Scroll",
  greetingMorning: "Good Morning",
  greetingNoon: "Good Afternoon",
  greetingEvening: "Good Evening",
  greetingNight: "Good Night",
  estLabel: "Est · 2024",
  placeLabel: "Gaza · Palestine",
  stat1Value: "39",
  stat1Label: "seats",
  stat2Value: "80+",
  stat2Label: "members",
  stat3Value: "100%",
  stat3Label: "free",
  image1: "/photos/IMG_8357.webp",
  image2: "/photos/IMG_8347.webp",
  image3: "/photos/IMG_8358.webp",
  image4: "/photos/IMG_8341.webp",
  image5: "/photos/IMG_8352.webp",
  image6: "/photos/IMG_8300.webp",
};

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
    <span className="block overflow-hidden pt-[0.22em] pb-[0.18em]">
      <motion.span
        className={`block ${accent ? "text-primary" : ""}`}
        initial={reduce ? false : { y: "115%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1.2, delay, ease: EASE_OUT_EXPO }}
      >
        {text}
      </motion.span>
    </span>
  );
}

// The crimson object word of the headline, cycling through a small set so the
// hero's promise reads as dreams → ventures → future → talent. Slides up on
// first paint (with the headline cascade delay), then swaps in place. The word
// sits on its own line, so width changes never shift the rest of the layout.
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
    }, 2800);
    return () => clearInterval(id);
  }, [reduce, words.length]);

  return (
    <span className="relative block overflow-hidden pt-[0.22em] pb-[0.18em]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[i]}
          className="block text-primary will-change-transform"
          initial={reduce ? false : { y: "115%" }}
          animate={{ y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: "-115%" }}
          transition={{ duration: 0.62, delay: first.current ? delay : 0, ease: EASE_OUT_EXPO }}
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
  // Headline is composed (prefix · rotating object word · suffix) so the promise
  // can cycle. Code-defined (the CMS title is a flat string and can't express
  // the swap); keeps the loved register — only the object word animates.
  const headline =
    lang === "en"
      ? { prefix: "We grow Gaza's", words: ["ventures", "dreams", "futures", "talent"], suffix: "for the world." }
      : { prefix: "نَحضن", words: ["مشاريعك", "أحلامك", "مستقبلك", "طاقاتك"], suffix: "في قلب غزّة." };
  const ref = useRef<HTMLElement>(null);
  const [stillIdx, setStillIdx] = useState(0);
  // Live community figures — same /numbers source NumbersBand uses, so the hero
  // can never contradict the "real numbers from our database" section below.
  const [live, setLive] = useState<{ members: number; seatsHosted: number } | null>(null);
  const [now, setNow] = useState<string>("");
  const [hour, setHour] = useState<number>(() => new Date().getHours());

  const greeting = useMemo(() => {
    if (hour >= 5 && hour <= 11) return c.greetingMorning;
    if (hour >= 12 && hour <= 16) return c.greetingNoon;
    if (hour >= 17 && hour <= 19) return c.greetingEvening;
    return c.greetingNight;
  }, [hour, c.greetingMorning, c.greetingNoon, c.greetingEvening, c.greetingNight]);

  const stills = useMemo(
    () =>
      [c.image1, c.image2, c.image3, c.image4, c.image5, c.image6]
        .map(imageUrl)
        .filter(Boolean),
    [c.image1, c.image2, c.image3, c.image4, c.image5, c.image6],
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

  useEffect(() => {
    function tick() {
      const d = new Date();
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      setNow(`${hh}:${mm}`);
      setHour(d.getHours());
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4, restDelta: 0.001 });
  const photoY = useTransform(smooth, [0, 1], ["0%", reduce ? "0%" : "10%"]);
  const photoScale = useTransform(smooth, [0, 1], [1, reduce ? 1 : 1.08]);
  const textY = useTransform(smooth, [0, 1], ["0%", reduce ? "0%" : "-25%"]);
  const overlayOpacity = useTransform(smooth, [0, 1], [1, reduce ? 1 : 1.3]);

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
      className="relative h-[100svh] min-h-[680px] w-full overflow-hidden bg-[#070707] text-white"
    >
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
            className="absolute inset-0 w-full h-full object-cover saturate-[1.08] contrast-[1.03]"
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            {...(i === 0 ? { fetchPriority: "high" as any } : {})}
          />
        ))}
      </motion.div>

      <motion.div style={{ opacity: overlayOpacity }} aria-hidden className="absolute inset-0 z-[1]">
        {/* Base vertical scrim — lighter bottom (0.70) so the photo breathes,
            a fine top-vignette so the brand mark + live clock float clearly. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,7,15,0.55) 0%, rgba(5,7,15,0.10) 30%, rgba(5,7,15,0.34) 58%, rgba(5,7,15,0.84) 100%)",
          }}
        />
        {/* Focused scrim behind the headline (right side, RTL) so text stays
            crisp while the rest of the photo breathes. */}
        <div
          className="absolute inset-y-0 right-0 w-full lg:w-[66%]"
          style={{
            background:
              "linear-gradient(270deg, rgba(5,7,15,0.68) 0%, rgba(5,7,15,0.36) 42%, transparent 78%)",
          }}
        />
        {/* Fine grain — editorial, not noisy (0.05). */}
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />
      </motion.div>

      <motion.div
        initial={{ y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: EASE_OUT_EXPO }}
        className="absolute top-24 lg:top-28 inset-x-0 z-20"
      >
        <div className="container-ih flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] tracking-[0.2em] uppercase font-semibold">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-2 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-2 shadow-[0_0_8px_hsl(var(--accent-2)/0.9)]" />
              </span>
              {c.onAirLabel} · {now}
            </div>
            {greeting && (
              <motion.div
                key={greeting}
                initial={{ x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
                className="hidden sm:inline-flex items-center h-8 px-3.5 rounded-full bg-white/8 backdrop-blur-md border border-white/15 text-[12px] font-semibold text-white/95"
                aria-live="polite"
              >
                {greeting}
              </motion.div>
            )}
          </div>
          {c.topRight && (
            <div className="hidden md:flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/8 backdrop-blur-md border border-white/15 text-[11px] tracking-[0.2em] uppercase font-semibold text-white/85">
              {c.topRight}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        style={{ y: textY }}
        className="relative z-10 h-full flex items-center will-change-transform"
      >
        <div className="container-ih w-full">
          {/* Clean, monumental headline — no glass box. Crimson hairline + an
              oversized black display set on the focused scrim. Stronger, calmer. */}
          <div className="relative max-w-4xl">
            <motion.div
              initial={{ y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: DURATION.lg, ease: EASE_OUT_EXPO }}
              className="mb-6 lg:mb-8 flex items-center gap-3"
            >
              <span className="h-[2px] w-12 bg-primary" />
              <span className="text-[11px] tracking-[0.2em] uppercase text-white/85 font-semibold ltr:tracking-[0.2em] rtl:tracking-normal">
                {c.eyebrow}
              </span>
            </motion.div>

            <h1
              className="t-display text-white"
              style={{ fontSize: "clamp(2.8rem, 7.6vw, 7.5rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.045em" }}
            >
              <KineticLine text={headline.prefix} delay={0.45} reduce={!!reduce} />
              <RotatingWord words={headline.words} delay={0.64} reduce={!!reduce} />
              <KineticLine text={headline.suffix} delay={0.82} reduce={!!reduce} />
            </h1>
          </div>

          <motion.p
            initial={{ y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.25, duration: 0.5, ease: EASE_OUT_EXPO }}
            className="mt-7 lg:mt-9 max-w-2xl text-[1.0625rem] lg:text-xl text-white/82 font-normal leading-[1.7] whitespace-pre-line"
          >
            {c.subtitle}
          </motion.p>

          <motion.div
            initial={{ y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35, duration: 0.5, ease: EASE_OUT_EXPO }}
            className="mt-6 lg:mt-7 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[12px] font-semibold text-white/85"
          >
            <Heart className="h-3.5 w-3.5 text-primary fill-primary/70" />
            <span className="text-white/70">{c.backedByLabel} ·</span>
            <span className="text-white">{c.backedByBrand}</span>
          </motion.div>

          {/* ── ONE primary (Apply) + one quiet secondary (Book a seat).
              "Chat" is demoted to a low-weight text/icon link so the hero leads
              with a single decisive action, not three near-equal pills. ── */}
          <motion.div
            initial={{ y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.45, duration: 0.5, ease: EASE_OUT_EXPO }}
            className="mt-7 lg:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
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
            {c.ctaSecondary && (
              <a
                href={c.ctaSecondaryHref || "#"}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="cta-chat"
                className="group inline-flex items-center justify-center sm:justify-start gap-2 h-12 sm:h-auto px-2 text-white/75 font-semibold text-[14px] hover:text-white transition-colors duration-200"
              >
                <Phone className="h-4 w-4 text-white/60 group-hover:text-white transition-colors" />
                <span className="underline-offset-[6px] group-hover:underline">{c.ctaSecondary}</span>
              </a>
            )}
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7, duration: 1, ease: EASE_OUT_EXPO }}
        className="absolute bottom-0 inset-x-0 z-10 pb-7 lg:pb-9"
      >
        <div className="container-ih">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div className="flex items-end gap-3">
              <HavenMark size={56} className="text-white" delay={1.6} />
              <div className="pb-1.5 leading-tight">
                <div className="text-[10px] tracking-[0.2em] uppercase text-white/65 font-semibold">
                  {c.estLabel}
                </div>
                <div className="text-[12px] text-white/85 font-medium">{c.placeLabel}</div>
              </div>
            </div>

            <div className="flex items-stretch gap-0">
              {stats.map((s, i) => (
                <div
                  key={`${s.l}-${i}`}
                  className={`flex flex-col justify-end px-6 lg:px-8 ${i > 0 ? "border-s border-white/[0.22]" : ""}`}
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
              className="hidden md:flex flex-col items-center gap-2 text-white/65"
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
