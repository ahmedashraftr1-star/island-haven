import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Camera, ArrowLeft, MapPin } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const ALL = [
  { src: `${BASE}photos/IMG_8357.jpg`, caption: "صباحٌ في المساحة" },
  { src: `${BASE}photos/IMG_8300.jpg`, caption: "الجدار الذي يحمل اسمنا" },
  { src: `${BASE}photos/IMG_8347.jpg`, caption: "تركيزٌ عميق على التصميم" },
  { src: `${BASE}photos/IMG_8313.jpg`, caption: "ركن العمل المشترك" },
  { src: `${BASE}photos/IMG_8352.jpg`, caption: "ورشةٌ نتعلّم فيها معاً" },
  { src: `${BASE}photos/IMG_8344.jpg`, caption: "زاوية هادئة للتفكير" },
  { src: `${BASE}photos/IMG_8358.jpg`, caption: "تشبيكٌ بين الأرواح" },
  { src: `${BASE}photos/IMG_8346.jpg`, caption: "جلسة عملٍ مفتوحة" },
  { src: `${BASE}photos/IMG_8341.jpg`, caption: "حواراتٌ تُولد منها فرص" },
  { src: `${BASE}photos/IMG_8345.jpg`, caption: "في انتظار البدء" },
  { src: `${BASE}photos/IMG_8349.jpg`, caption: "أيدٍ تبني الغد" },
  { src: `${BASE}photos/IMG_8353.jpg`, caption: "مساحةٌ تتّسع للتجربة" },
  { src: `${BASE}photos/IMG_8356.jpg`, caption: "ضحكاتٌ بين الأقران" },
  { src: `${BASE}photos/IMG_8303.jpg`, caption: "تفاصيل مكاننا" },
  { src: `${BASE}photos/IMG_8304.jpg`, caption: "أمسيةٌ في الهيفن" },
  { src: `${BASE}photos/IMG_8307.jpg`, caption: "حضورٌ مهنيّ" },
  { src: `${BASE}photos/IMG_8308.jpg`, caption: "تركيزٌ جماعيّ" },
  { src: `${BASE}photos/IMG_8314.jpg`, caption: "وجوهٌ نفخر بها" },
];

/**
 * Gallery — picture essay rendered in the same editorial luxury language
 * as the Voices section: deep ink-black canvas, indigo nebula glow, dim
 * photographic underlay for texture, massive serif-weight Arabic display
 * type, frame counters, and ALL-CAPS tracked editorial labels.
 *
 * The cinematic hero auto-advances through 6 curated frames; the user can
 * also click any thumb in the rail to cut to it. Below, a 12-col print-
 * spread mosaic and a contra-rotating film strip extend the essay.
 */
export function Gallery() {
  // Curated hero rotation — 6 most cinematic frames.
  const HERO = [ALL[0], ALL[6], ALL[4], ALL[1], ALL[8], ALL[15]];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HERO.length), 6500);
    return () => clearInterval(t);
  }, [HERO.length]);

  const v = HERO[idx];

  // Mosaic — print-spread asymmetry.
  const mosaic = [
    { ...ALL[2], col: "col-span-7", aspect: "aspect-[4/3]", showCap: true, num: "07" },
    { ...ALL[10], col: "col-span-5", aspect: "aspect-[3/4]", showCap: true, num: "08" },
    { ...ALL[3], col: "col-span-4", aspect: "aspect-[1/1]", num: "09" },
    { ...ALL[5], col: "col-span-4", aspect: "aspect-[1/1]", num: "10" },
    { ...ALL[7], col: "col-span-4", aspect: "aspect-[1/1]", num: "11" },
    { ...ALL[11], col: "col-span-5", aspect: "aspect-[3/4]", showCap: true, num: "12" },
    { ...ALL[12], col: "col-span-7", aspect: "aspect-[4/3]", showCap: true, num: "13" },
  ];

  const stripRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="gallery"
      className="relative bg-[#0A0E1A] text-white overflow-hidden"
      aria-label="معرض صور آيلاند هيفن"
    >
      {/* Photographic underlay — extremely dim for texture only */}
      <div aria-hidden className="absolute inset-0 opacity-[0.10] pointer-events-none">
        <img
          src={`${BASE}photos/IMG_8313.jpg`}
          alt=""
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,14,26,0.95) 0%, rgba(10,14,26,0.7) 50%, rgba(10,14,26,0.98) 100%)",
          }}
        />
      </div>

      {/* Indigo nebula glow */}
      <div
        aria-hidden
        className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[60vh] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(232 100% 70% / 0.16) 0%, transparent 65%)",
          filter: "blur(70px)",
        }}
      />

      <div className="container relative mx-auto px-6 lg:px-12 max-w-[1500px] pt-28 lg:pt-40 pb-20 lg:pb-28">
        {/* ============================================================
            EDITORIAL EYEBROW — matches Voices grammar exactly
            ============================================================ */}
        <div className="flex items-center justify-between gap-6 mb-12 lg:mb-16">
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-10 bg-white/40" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-white/75 font-semibold inline-flex items-center gap-2">
              <Camera className="w-3 h-3" strokeWidth={2.5} />
              Picture Essay · معرض الصور
            </span>
          </div>
          <div className="text-[11px] font-mono text-white/40 tabular-nums tracking-wider">
            {String(idx + 1).padStart(2, "0")} / {String(HERO.length).padStart(2, "0")}
          </div>
        </div>

        {/* ============================================================
            EDITORIAL HEADLINE — luxury display type
            ============================================================ */}
        <div className="grid grid-cols-12 gap-6 lg:gap-12 items-end mb-14 lg:mb-20">
          <div className="col-span-12 lg:col-span-8">
            <h2
              className="font-bold text-white"
              style={{
                fontSize: "clamp(2.75rem, 7.4vw, 6.5rem)",
                lineHeight: 0.96,
                letterSpacing: "-0.04em",
                fontWeight: 600,
              }}
            >
              هكذا تبدأ
              <br />
              <span className="italic font-light text-white/95">أيّامنا.</span>
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <div className="border-t border-white/15 pt-6">
              <p className="text-base lg:text-lg text-white/65 leading-relaxed mb-5">
                مكاتب صباحيّة، فناجين قهوة دافئة، وجدارٌ يحمل اسماً يُذكّرنا
                بالسبب. كلّ صورة هنا حقيقيّة — لا فبركة، لا ستوك.
              </p>
              <div className="flex items-center gap-4 text-[11px] tracking-[0.18em] uppercase text-white/45 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" strokeWidth={2.5} />
                  Gaza · غزّة
                </span>
                <span className="w-6 h-[1px] bg-white/20" />
                <span>2024 — 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            CINEMATIC HERO — auto-rotating 6 frames + giant carved title
            Mirrors Voices' AnimatePresence quote treatment.
            ============================================================ */}
        <div className="relative rounded-3xl overflow-hidden bg-black shadow-soft-hover mb-7 lg:mb-9">
          <div className="relative aspect-[16/10] lg:aspect-[21/9]">
            {HERO.map((p, i) => (
              <motion.img
                key={p.src}
                src={p.src}
                alt={p.caption}
                loading={i === 0 ? "eager" : "lazy"}
                initial={false}
                animate={{
                  opacity: i === idx ? 1 : 0,
                  scale: i === idx ? 1 : 1.05,
                }}
                transition={{
                  opacity: { duration: 1.0, ease: [0.16, 1, 0.3, 1] },
                  scale: { duration: 6.5, ease: [0.16, 1, 0.3, 1] },
                }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ))}

            {/* Top vignette */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/55 via-black/15 to-transparent pointer-events-none" />
            {/* Bottom vignette */}
            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

            {/* Giant ghosted quotation glyph — Voices motif */}
            <div
              aria-hidden
              className="absolute -top-10 lg:-top-20 right-2 lg:right-8 text-white/[0.08] font-bold leading-none select-none pointer-events-none"
              style={{ fontSize: "clamp(10rem, 18vw, 20rem)" }}
            >
              "
            </div>

            {/* Top — Frame ID + live badge */}
            <div className="absolute top-5 lg:top-8 left-5 lg:left-10 right-5 lg:right-10 flex items-start justify-between text-white">
              <div className="text-[11px] tracking-[0.22em] uppercase font-semibold opacity-85">
                Frame · {String(idx + 1).padStart(4, "0")} / 0018
              </div>
              <div className="hidden md:inline-flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase font-semibold bg-white/10 backdrop-blur-md px-3 h-8 rounded-full border border-white/15">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                IH · Real Photo
              </div>
            </div>

            {/* Bottom — gigantic editorial caption */}
            <div className="absolute bottom-6 lg:bottom-12 right-6 lg:right-12 left-6 lg:left-12 text-white">
              <div className="flex items-end justify-between gap-6 flex-wrap">
                <motion.div
                  key={`cap-${idx}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-3xl"
                >
                  <div className="text-[11px] tracking-[0.22em] uppercase font-semibold opacity-85 mb-3">
                    Featured · مشهد رقم {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div
                    className="font-bold leading-[0.95]"
                    style={{
                      fontSize: "clamp(2rem, 5.6vw, 4.75rem)",
                      letterSpacing: "-0.038em",
                      fontWeight: 600,
                    }}
                  >
                    {v.caption}
                  </div>
                  <div className="mt-5 text-[12px] tracking-[0.16em] uppercase text-white/55 font-semibold">
                    — مُلتقطة في آيلاند هيفن ·{" "}
                    <span className="text-white/35">Island Haven, Gaza</span>
                  </div>
                </motion.div>
                <div className="hidden lg:flex flex-col items-end gap-3 text-right">
                  <div className="text-[11px] tracking-[0.18em] uppercase font-semibold opacity-70">
                    Coordinates
                  </div>
                  <div className="font-mono text-[12px] tabular-nums opacity-75">
                    31.50°N · 34.45°E
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            HERO RAIL — clickable thumbs + progress bar (Voices grammar)
            ============================================================ */}
        <div className="flex items-center gap-5 lg:gap-7 mb-20 lg:mb-28">
          <div className="flex-1 h-px bg-white/10 relative overflow-hidden">
            <motion.div
              key={idx}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 6.5, ease: "linear" }}
              className="absolute inset-0 bg-white origin-right"
              style={{ transformOrigin: "right" }}
            />
          </div>
          <div ref={stripRef} className="flex gap-2 lg:gap-2.5">
            {HERO.map((p, i) => (
              <button
                key={p.src}
                onClick={() => setIdx(i)}
                aria-label={`عرض المشهد ${i + 1}: ${p.caption}`}
                className={`relative shrink-0 rounded-md overflow-hidden transition-all duration-500 ${
                  i === idx
                    ? "w-16 h-12 lg:w-20 lg:h-14 ring-2 ring-white"
                    : "w-9 h-12 lg:w-11 lg:h-14 opacity-50 hover:opacity-90"
                }`}
              >
                <img src={p.src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================
            EDITORIAL MOSAIC — print-spread on the same dark canvas
            ============================================================ */}
        <div className="flex items-center gap-3 mb-7 lg:mb-9">
          <span className="h-[1px] w-10 bg-white/40" />
          <span className="text-[11px] tracking-[0.22em] uppercase text-white/75 font-semibold">
            The Spread · لقطات من الأرشيف
          </span>
        </div>

        <div className="grid grid-cols-12 gap-3 lg:gap-5">
          {mosaic.map((p, i) => (
            <motion.figure
              key={p.src + i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.7,
                delay: (i % 3) * 0.07,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`relative overflow-hidden rounded-2xl shadow-soft hover:shadow-soft-hover transition-all duration-700 group bg-black ${p.col} ${p.aspect}`}
            >
              <img
                src={p.src}
                alt={p.caption}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.06]"
              />
              {p.showCap && (
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              )}
              {!p.showCap && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              )}

              <div className="absolute top-3 left-3 text-[10px] font-mono tabular-nums font-bold text-white bg-black/45 backdrop-blur-md px-2 py-1 rounded-md tracking-wider">
                {p.num}
              </div>

              {p.showCap ? (
                <figcaption className="absolute bottom-4 right-4 left-4 text-white">
                  <div className="text-[10px] tracking-[0.2em] uppercase font-semibold opacity-80 mb-1.5">
                    Frame · {p.num}
                  </div>
                  <div className="text-sm lg:text-base font-bold leading-snug">
                    {p.caption}
                  </div>
                </figcaption>
              ) : (
                <figcaption className="absolute bottom-3 right-3 left-3 text-white text-[12px] font-semibold opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-500">
                  {p.caption}
                </figcaption>
              )}
            </motion.figure>
          ))}
        </div>

        {/* Instagram CTA — Voices-style understated */}
        <div className="mt-10 lg:mt-14 flex items-center justify-between gap-6 flex-wrap pt-6 border-t border-white/10">
          <div className="text-[12px] tracking-[0.18em] uppercase text-white/55 font-semibold">
            ١٨ لقطة · كلّها حقيقيّة · مُلتقطة في غزّة
          </div>
          <a
            href="https://www.instagram.com/ih_haven"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-white font-semibold text-[13px] hover:gap-3 transition-all"
          >
            تابعنا على إنستغرام @ih_haven
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* ============================================================
          KINETIC FILM STRIP — twin contra-rotating rows on dark
          ============================================================ */}
      <div className="relative pb-24 lg:pb-32">
        <div className="container relative mx-auto px-6 lg:px-12 max-w-[1500px] mb-8 lg:mb-10">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="h-[1px] w-10 bg-white/40" />
                <span className="text-[11px] tracking-[0.22em] uppercase text-white/75 font-semibold inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Strip · شريط حيّ
                </span>
              </div>
              <h3
                className="font-bold text-white"
                style={{
                  fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.025em",
                }}
              >
                المكان <span className="italic font-light text-white/85">يتنفّس بأهله.</span>
              </h3>
            </div>
            <p className="max-w-md text-[14px] lg:text-[15px] text-white/60 leading-relaxed border-r-2 border-white/20 pr-4">
              صفّان لا يتوقّفان — ١٨ لحظة من حياة آيلاند هيفن، تمرّ هنا
              كما تمرّ عندنا كلّ يوم.
            </p>
          </div>
        </div>

        <div className="relative space-y-4 lg:space-y-5">
          <div className="absolute inset-y-0 right-0 w-24 lg:w-48 bg-gradient-to-l from-[#0A0E1A] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-24 lg:w-48 bg-gradient-to-r from-[#0A0E1A] to-transparent z-10 pointer-events-none" />

          {/* Row A — leftward */}
          <div className="overflow-hidden">
            <div
              className="flex gap-4 lg:gap-5 ih-marquee-a will-change-transform"
              style={{ width: "max-content" }}
            >
              {[...ALL.slice(0, 9), ...ALL.slice(0, 9)].map((p, i) => (
                <figure
                  key={`a-${p.src}-${i}`}
                  className="shrink-0 w-[220px] lg:w-[300px] aspect-[4/5] rounded-2xl overflow-hidden shadow-soft relative group bg-black"
                >
                  <img
                    src={p.src}
                    alt={p.caption}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <figcaption className="absolute bottom-3 right-3 left-3 text-white text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {p.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          {/* Row B — rightward, slower, smaller */}
          <div className="overflow-hidden">
            <div
              className="flex gap-4 lg:gap-5 ih-marquee-b will-change-transform"
              style={{ width: "max-content" }}
            >
              {[...ALL.slice(9), ...ALL.slice(9)].map((p, i) => (
                <figure
                  key={`b-${p.src}-${i}`}
                  className="shrink-0 w-[180px] lg:w-[240px] aspect-[5/4] rounded-2xl overflow-hidden shadow-soft relative group bg-black"
                >
                  <img
                    src={p.src}
                    alt={p.caption}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </figure>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes ih-marquee-a { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          @keyframes ih-marquee-b { from { transform: translateX(-50%); } to { transform: translateX(0); } }
          .ih-marquee-a { animation: ih-marquee-a 70s linear infinite; }
          .ih-marquee-b { animation: ih-marquee-b 90s linear infinite; }
          .ih-marquee-a:hover, .ih-marquee-b:hover { animation-play-state: paused; }
          @media (prefers-reduced-motion: reduce) {
            .ih-marquee-a, .ih-marquee-b { animation: none; }
          }
        `}</style>
      </div>
    </section>
  );
}
