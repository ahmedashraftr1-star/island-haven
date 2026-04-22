import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Phone, ArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";
import { HavenMark } from "./HavenMark";

const BASE = import.meta.env.BASE_URL;

/* Six rotating hero stills — the place breathes. */
const STILLS = [
  `${BASE}photos/IMG_8357.jpg`,
  `${BASE}photos/IMG_8347.jpg`,
  `${BASE}photos/IMG_8358.jpg`,
  `${BASE}photos/IMG_8341.jpg`,
  `${BASE}photos/IMG_8352.jpg`,
  `${BASE}photos/IMG_8300.jpg`,
];

/* Single-line slide reveal — clean, cinematic, never fights itself. */
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
    <span className="block overflow-hidden pb-[0.16em]">
      <motion.span
        className={`block ${accent ? "text-accent-gradient" : ""}`}
        initial={{ y: "108%" }}
        animate={{ y: 0 }}
        transition={{
          duration: 1.2,
          delay,
          ease: [0.19, 1, 0.22, 1],
        }}
      >
        {text}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [stillIdx, setStillIdx] = useState(0);
  const [now, setNow] = useState<string>("");

  // Slowly rotate background stills — never static.
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setStillIdx((i) => (i + 1) % STILLS.length);
    }, 5500);
    return () => clearInterval(id);
  }, [reduce]);

  // Live Gaza time (UTC+2/+3, follow user clock — Gaza & most users in same TZ).
  useEffect(() => {
    function tick() {
      const d = new Date();
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      setNow(`${hh}:${mm}`);
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "10%"]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-25%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.3]);

  return (
    <section
      id="hero"
      ref={ref}
      className="relative h-[100svh] min-h-[680px] w-full overflow-hidden bg-[#0A0E1A] text-white"
    >
      {/* Cinematic still stage — Ken Burns + crossfade */}
      <motion.div
        style={{ y: photoY, scale: photoScale }}
        className="absolute inset-0 will-change-transform"
        aria-hidden
      >
        {STILLS.map((src, i) => (
          <motion.img
            key={src}
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
            className="absolute inset-0 w-full h-full object-cover"
            loading={i < 2 ? "eager" : "lazy"}
          />
        ))}
      </motion.div>

      {/* Dark cinematic gradient — Apple-keynote depth */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        aria-hidden
        className="absolute inset-0 z-[1]"
      >
        {/* Vertical: dark top → mid breathe → dark bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,14,26,0.55) 0%, rgba(10,14,26,0.18) 30%, rgba(10,14,26,0.45) 65%, rgba(10,14,26,0.92) 100%)",
          }}
        />
        {/* Indigo glow halo behind headline */}
        <div
          className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[55vh]"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(232 100% 65% / 0.28) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        {/* Subtle film grain via SVG noise */}
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />
      </motion.div>

      {/* TOP UI BAR — live signal */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, ease: EASE_OUT_EXPO }}
        className="absolute top-24 lg:top-28 inset-x-0 z-20 px-6 lg:px-12"
      >
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] tracking-[0.18em] uppercase font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            On Air · غزّة · {now}
          </div>
          <div className="hidden md:flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/8 backdrop-blur-md border border-white/15 text-[11px] tracking-[0.16em] uppercase font-semibold text-white/85">
            Season · 2026 · open
          </div>
        </div>
      </motion.div>

      {/* CONTENT */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 h-full flex items-center will-change-transform"
      >
        <div className="container mx-auto max-w-[1500px] px-6 lg:px-12 w-full">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: DURATION.lg, ease: EASE_OUT_EXPO }}
            className="mb-6 lg:mb-8 flex items-center gap-3"
          >
            <span className="h-[1px] w-10 bg-white/40" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-white/75 font-semibold">
              Island Haven · Gaza · Free Workspace
            </span>
          </motion.div>

          {/* MASSIVE kinetic headline */}
          <h1
            className="font-bold text-white"
            style={{
              fontSize: "clamp(2.75rem, 7.2vw, 7.5rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
            }}
          >
            <KineticLine text="مساحةٌ تتّسع لأحلامك،" delay={0.45} />
            <KineticLine text="في قلب غزّة." delay={0.62} accent />
          </h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.25, duration: 0.9, ease: EASE_OUT_EXPO }}
            className="mt-7 lg:mt-9 max-w-2xl text-base lg:text-xl text-white/80 font-normal leading-relaxed"
          >
            بيتٌ مهنيّ يحتضن المستقلّين والخرّيجين وطلبة الجامعات.
            مكتبٌ، إنترنت، وقهوة — مجّاناً وبكلّ راحة.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.45, duration: 0.9, ease: EASE_OUT_EXPO }}
            className="mt-9 lg:mt-11 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <a
              href={`${BASE}apply`}
              data-testid="cta-apply"
              className="group relative inline-flex items-center justify-center gap-3 h-14 lg:h-[58px] px-8 rounded-full bg-white text-[#0A0E1A] font-semibold text-[14px] tracking-[-0.005em] hover:scale-[1.025] transition-all duration-500 shadow-[0_20px_60px_-15px_rgba(255,255,255,0.4)]"
            >
              <span className="relative z-10">سجّل للانتساب — مجّاناً</span>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-500 group-hover:-translate-x-1 relative z-10" />
            </a>
            <a
              href="https://wa.me/970599000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 h-14 lg:h-[58px] px-7 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-[14px] hover:bg-white/15 transition-all duration-500"
            >
              <Phone className="h-4 w-4" />
              تحدّث معنا
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* BOTTOM RAIL — stats + brand */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7, duration: 1, ease: EASE_OUT_EXPO }}
        className="absolute bottom-0 inset-x-0 z-10 px-6 lg:px-12 pb-7 lg:pb-9"
      >
        <div className="max-w-[1500px] mx-auto">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            {/* HavenMark + place */}
            <div className="flex items-end gap-3">
              <HavenMark size={56} className="text-white" delay={1.6} />
              <div className="pb-1.5 leading-tight">
                <div className="text-[10px] tracking-[0.2em] uppercase text-white/55 font-semibold">
                  Est · 2024
                </div>
                <div className="text-[12px] text-white/80 font-medium">
                  فلسطين · Gaza
                </div>
              </div>
            </div>

            {/* Stats — newspaper-style with dividers */}
            <div className="flex items-stretch gap-0">
              {[
                { v: "٣٩", l: "مقعد" },
                { v: "٨٠+", l: "منتسب" },
                { v: "١٠٠٪", l: "مجّانيّ" },
              ].map((s, i) => (
                <div
                  key={s.l}
                  className={`px-5 lg:px-7 ${i > 0 ? "border-r border-white/15" : ""}`}
                >
                  <div className="text-2xl lg:text-3xl font-bold text-white tabular-nums leading-none">
                    {s.v}
                  </div>
                  <div className="text-[11px] text-white/60 mt-1.5 font-medium tracking-wide">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll cue */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="hidden md:flex flex-col items-center gap-2 text-white/65"
            >
              <span className="text-[10px] tracking-[0.2em] uppercase font-semibold">
                Scroll
              </span>
              <ArrowDown className="w-4 h-4" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
