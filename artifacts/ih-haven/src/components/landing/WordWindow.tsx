import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { useContentSection, imageUrl } from "@/hooks/use-content";

const FALLBACK = {
  eyebrow: "A window · نافذة",
  word: "هنا.",
  captionA: "في قلب غزّة، فتحنا باباً واحداً —",
  captionB: "ليبقى مفتوحاً.",
  captionEn: "Inside, the work continues",
  image1: "/photos/IMG_8358.jpg",
  image2: "/photos/IMG_8347.jpg",
  image3: "/photos/IMG_8344.jpg",
};

export function WordWindow() {
  const c = useContentSection("wordwindow", FALLBACK);
  const PHOTOS = [c.image1, c.image2, c.image3].filter(Boolean).map(imageUrl);
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [photoIdx, setPhotoIdx] = useState(0);
  const maskId = useId();

  useEffect(() => {
    if (reduce || PHOTOS.length < 2) return;
    const id = setInterval(() => setPhotoIdx((i) => (i + 1) % PHOTOS.length), 4500);
    return () => clearInterval(id);
  }, [reduce, PHOTOS.length]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, reduce ? 0.92 : 1.18]);
  const wordOpacity = useTransform(scrollYProgress, [0, 0.82, 1], [1, 1, 0]);
  const labelOpacity = useTransform(scrollYProgress, [0, 0.08, 0.85, 1], [0, 1, 1, 0]);
  const captionY = useTransform(scrollYProgress, [0.1, 0.45], [16, 0]);
  const captionOpacity = useTransform(scrollYProgress, [0.1, 0.45], [0, 1]);
  const haloScale = useTransform(scrollYProgress, [0, 1], [1, 1.6]);
  const seamOpacity = useTransform(scrollYProgress, [0.78, 1], [0, 1]);

  const VB_W = 1600;
  const VB_H = 800;

  return (
    <section
      id="word-window"
      ref={ref}
      className="relative h-[240vh] bg-[#0A0E1A] text-white"
      aria-label="نافذة على المساحة"
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center bg-[#0A0E1A]">
        <motion.div
          aria-hidden
          style={{ scale: haloScale }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[60vh] pointer-events-none will-change-transform"
        >
          <div
            className="w-full h-full"
            style={{
              background: "radial-gradient(ellipse at center, hsl(232 100% 65% / 0.32) 0%, transparent 65%)",
              filter: "blur(60px)",
            }}
          />
        </motion.div>

        <motion.div
          style={{ opacity: labelOpacity }}
          className="absolute top-10 lg:top-14 inset-x-0 flex items-center justify-center gap-3 z-10"
        >
          <span className="h-[1px] w-10 bg-white/40" />
          <span className="text-[11px] tracking-[0.24em] uppercase text-white/65 font-semibold">
            {c.eyebrow}
          </span>
          <span className="h-[1px] w-10 bg-white/40" />
        </motion.div>

        <motion.div
          dir="rtl"
          style={{ scale, opacity: wordOpacity }}
          className="relative w-[92vw] max-w-[1600px] aspect-[2/1] will-change-transform"
        >
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
            aria-hidden
          >
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse">
                <rect width={VB_W} height={VB_H} fill="black" />
                <text
                  x={VB_W / 2}
                  y={VB_H * 0.62}
                  textAnchor="middle"
                  fill="white"
                  fontSize="640"
                  fontWeight="900"
                  fontFamily="'IBM Plex Sans Arabic', system-ui, sans-serif"
                  letterSpacing="-30"
                >
                  {c.word}
                </text>
              </mask>
            </defs>

            <g mask={`url(#${maskId})`}>
              {PHOTOS.map((src, i) => (
                <image
                  key={src + i}
                  href={src}
                  width={VB_W}
                  height={VB_H}
                  preserveAspectRatio="xMidYMid slice"
                  style={{
                    opacity: i === photoIdx ? 1 : 0,
                    transition: "opacity 1.6s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              ))}
              <rect width={VB_W} height={VB_H} fill="hsl(232 70% 52%)" opacity="0.12" />
            </g>
          </svg>
        </motion.div>

        <motion.div
          style={{ opacity: captionOpacity, y: captionY }}
          className="absolute bottom-16 lg:bottom-24 inset-x-0 text-center px-6 z-10"
        >
          <p
            className="text-white font-semibold mx-auto max-w-[680px]"
            style={{ fontSize: "clamp(1.125rem, 1.8vw, 1.625rem)", letterSpacing: "-0.012em", lineHeight: 1.35 }}
          >
            {c.captionA}{" "}
            <span className="text-white/65">{c.captionB}</span>
          </p>
          <p className="mt-3 text-[11px] tracking-[0.22em] uppercase text-white/45 font-semibold">
            {c.captionEn}
          </p>
        </motion.div>

        <motion.div
          style={{ opacity: labelOpacity }}
          className="absolute bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10"
        >
          {PHOTOS.map((_, i) => (
            <span
              key={i}
              className={`h-[3px] transition-all duration-700 ${
                i === photoIdx ? "w-8 bg-white" : "w-3 bg-white/25"
              }`}
            />
          ))}
        </motion.div>

        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />

        <motion.div
          aria-hidden
          style={{ opacity: seamOpacity }}
          className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
        >
          <div
            className="w-full h-full"
            style={{ background: "linear-gradient(180deg, transparent 0%, #ffffff 100%)" }}
          />
        </motion.div>
      </div>
    </section>
  );
}
