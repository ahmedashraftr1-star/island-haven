import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, Phone, ArrowDown, Heart } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";
import { HavenMark } from "./HavenMark";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";

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
}: {
  text: string;
  delay?: number;
  accent?: boolean;
}) {
  return (
    <span className="block overflow-hidden pt-[0.22em] pb-[0.18em]">
      <motion.span
        className={`block ${accent ? "text-accent-gradient" : ""}`}
        initial={{ y: "115%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1.2, delay, ease: [0.19, 1, 0.22, 1] }}
      >
        {text}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const { lang } = useLanguage();
  const cms = useContentSection("hero", FALLBACK);
  const c = lang === "en" ? EN_FALLBACK : cms;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [stillIdx, setStillIdx] = useState(0);
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

  const stats = [
    { v: c.stat1Value, l: c.stat1Label },
    { v: c.stat2Value, l: c.stat2Label },
    { v: c.stat3Value, l: c.stat3Label },
  ].filter((s) => s.v || s.l);

  return (
    <section
      id="hero"
      ref={ref}
      className="relative h-[100svh] min-h-[680px] w-full overflow-hidden bg-[#0A0E1A] text-white"
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
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,14,26,0.38) 0%, rgba(10,14,26,0.06) 34%, rgba(10,14,26,0.30) 62%, rgba(10,14,26,0.82) 100%)",
          }}
        />
        {/* Focused scrim behind the headline (right side, RTL) so text stays
            crisp while the rest of the photo breathes. */}
        <div
          className="absolute inset-y-0 right-0 w-full lg:w-[68%]"
          style={{
            background:
              "linear-gradient(270deg, rgba(10,14,26,0.62) 0%, rgba(10,14,26,0.30) 38%, transparent 72%)",
          }}
        />
        <div
          className="absolute top-[42%] right-[20%] -translate-y-1/2 w-[60vw] h-[55vh]"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(354 100% 62% / 0.22) 0%, transparent 65%)",
            filter: "blur(70px)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />
      </motion.div>

      <motion.div
        initial={{ y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, ease: EASE_OUT_EXPO }}
        className="absolute top-24 lg:top-28 inset-x-0 z-20 px-6 lg:px-12"
      >
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] tracking-[0.18em] uppercase font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {c.onAirLabel} · {now}
            </div>
            {greeting && (
              <motion.div
                key={greeting}
                initial={{ x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                className="hidden sm:inline-flex items-center h-8 px-3.5 rounded-full bg-white/8 backdrop-blur-md border border-white/15 text-[12px] font-semibold text-white/95"
                aria-live="polite"
              >
                {greeting}
              </motion.div>
            )}
          </div>
          {c.topRight && (
            <div className="hidden md:flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/8 backdrop-blur-md border border-white/15 text-[11px] tracking-[0.16em] uppercase font-semibold text-white/85">
              {c.topRight}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        style={{ y: textY }}
        className="relative z-10 h-full flex items-center will-change-transform"
      >
        <div className="container mx-auto max-w-[1500px] px-6 lg:px-12 w-full">
          <motion.div
            initial={{ y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: DURATION.lg, ease: EASE_OUT_EXPO }}
            className="mb-6 lg:mb-8 flex items-center gap-3"
          >
            <span className="h-px w-10 bg-white/50" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-white/85 font-semibold">
              {c.eyebrow}
            </span>
          </motion.div>

          <h1
            className="font-bold text-white"
            style={{
              fontSize: "clamp(2.1rem, 7.2vw, 7.5rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
            }}
          >
            <KineticLine text={c.title1} delay={0.45} />
            <KineticLine text={c.title2} delay={0.62} accent />
          </h1>

          <motion.p
            initial={{ y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.25, duration: 0.9, ease: EASE_OUT_EXPO }}
            className="mt-7 lg:mt-9 max-w-2xl text-base lg:text-xl text-white/80 font-normal leading-relaxed whitespace-pre-line"
          >
            {c.subtitle}
          </motion.p>

          <motion.div
            initial={{ y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35, duration: 0.8, ease: EASE_OUT_EXPO }}
            className="mt-6 lg:mt-7 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[12px] font-semibold text-white/85"
          >
            <Heart className="h-3.5 w-3.5 text-primary fill-primary/70" />
            <span className="text-white/70">{c.backedByLabel} ·</span>
            <span className="text-white">{c.backedByBrand}</span>
          </motion.div>

          <motion.div
            initial={{ y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.45, duration: 0.9, ease: EASE_OUT_EXPO }}
            className="mt-7 lg:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <a
              href={c.ctaPrimaryHref || "/apply"}
              data-testid="cta-apply"
              className="group relative inline-flex items-center justify-center gap-3 h-14 lg:h-[60px] px-9 rounded-full bg-primary text-primary-foreground font-bold text-[15.5px] tracking-[-0.005em] hover:scale-[1.03] active:scale-[0.99] transition-transform duration-300 ease-out shadow-[0_24px_70px_-12px_rgba(220,68,84,0.7)]"
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
                className="inline-flex items-center justify-center gap-3 h-14 lg:h-[58px] px-7 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-[14px] hover:bg-white/15 hover:border-white/30 active:bg-white/20 transition-colors duration-300"
              >
                <Phone className="h-4 w-4" />
                {c.ctaSecondary}
              </a>
            )}
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7, duration: 1, ease: EASE_OUT_EXPO }}
        className="absolute bottom-0 inset-x-0 z-10 px-6 lg:px-12 pb-7 lg:pb-9"
      >
        <div className="max-w-[1500px] mx-auto">
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
                  className={`px-5 lg:px-7 ${i > 0 ? "border-s border-white/20" : ""}`}
                >
                  <div className="text-2xl lg:text-3xl font-bold text-white tabular-nums leading-none">
                    {s.v}
                  </div>
                  <div className="text-[11px] text-white/70 mt-1.5 font-medium tracking-wide">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            <motion.div
              animate={{ y: [0, 6, 0] }}
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
