import { motion } from "framer-motion";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";
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

const FEATURED = ALL[0];

/**
 * Gallery — picture essay (Apple Newsroom × NYT Lens × Magnum):
 *   1) Editorial intro with photo-credit micro-stats.
 *   2) Cinematic hero frame — gigantic carved title, location stamp, frame ID.
 *   3) Asymmetric editorial mosaic — varied tiles, some captions always-on.
 *   4) Twin-row contra-rotating marquee — kinetic film strip energy.
 */
export function Gallery() {
  // Mosaic — explicitly orchestrated 12-col grid for editorial rhythm.
  // Each tile picks a span/aspect so the page reads like a print spread.
  const mosaic = [
    { ...ALL[1], col: "col-span-7", aspect: "aspect-[4/3]", showCap: true, num: "02" },
    { ...ALL[6], col: "col-span-5", aspect: "aspect-[3/4]", showCap: true, num: "03" },
    { ...ALL[2], col: "col-span-4", aspect: "aspect-[1/1]", num: "04" },
    { ...ALL[4], col: "col-span-4", aspect: "aspect-[1/1]", num: "05" },
    { ...ALL[8], col: "col-span-4", aspect: "aspect-[1/1]", num: "06" },
    { ...ALL[10], col: "col-span-5", aspect: "aspect-[3/4]", showCap: true, num: "07" },
    { ...ALL[5], col: "col-span-7", aspect: "aspect-[4/3]", showCap: true, num: "08" },
    { ...ALL[3], col: "col-span-6", aspect: "aspect-[16/10]", num: "09" },
    { ...ALL[7], col: "col-span-6", aspect: "aspect-[16/10]", num: "10" },
  ];

  // Two contra-rotating rows — Row A (rightward), Row B (leftward).
  const rowA = [...ALL.slice(0, 9), ...ALL.slice(0, 9)];
  const rowB = [...ALL.slice(9), ...ALL.slice(9)];

  return (
    <section
      id="gallery"
      className="relative bg-background overflow-hidden"
      aria-label="معرض صور آيلاند هيفن"
    >
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px] pt-24 lg:pt-36 pb-12 lg:pb-16">
        {/* ============================================================
            EDITORIAL INTRO
            ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-12 gap-6 lg:gap-12 items-end mb-10 lg:mb-14"
        >
          <div className="col-span-12 lg:col-span-8">
            <div className="flex items-center gap-3 mb-7">
              <span className="h-[1px] w-10 bg-primary/50" />
              <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-primary font-semibold">
                <Camera className="w-3 h-3" strokeWidth={2.5} />
                Picture Essay · {ALL.length} Frames
              </div>
            </div>
            <h2
              className="font-bold text-foreground"
              style={{
                fontSize: "clamp(2.5rem, 6.6vw, 6rem)",
                lineHeight: 0.98,
                letterSpacing: "-0.035em",
              }}
            >
              هكذا تبدأ
              <br />
              <span className="text-accent-gradient">أيّامنا.</span>
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <div className="border-t border-border/70 pt-6">
              <p className="text-base lg:text-lg text-foreground/65 leading-relaxed mb-5">
                مكاتب صباحيّة، فناجين قهوة دافئة، وجوهٌ متفائلة، وجدارٌ يحمل
                اسماً يُذكّرنا بالسبب. كلّ صورة هنا حقيقيّة — لا فبركة، لا ستوك.
              </p>
              <div className="flex items-center gap-4 mb-5 text-[11px] tracking-[0.16em] uppercase font-semibold text-foreground/45">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" strokeWidth={2.5} />
                  Gaza · غزّة
                </span>
                <span className="w-6 h-[1px] bg-border" />
                <span>2024 — 2026</span>
              </div>
              <a
                href="https://www.instagram.com/ih_haven"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary font-semibold text-[13px] hover:gap-3 transition-all"
              >
                المزيد على إنستغرام
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* ============================================================
            HERO FRAME — full-bleed cinematic with gigantic carved title
            ============================================================ */}
        <motion.figure
          initial={{ opacity: 0, scale: 0.985 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden shadow-soft-hover mb-10 lg:mb-14 group bg-black"
        >
          <div className="aspect-[16/10] lg:aspect-[21/9]">
            <img
              src={FEATURED.src}
              alt={FEATURED.caption}
              loading="eager"
              className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
            />
          </div>

          {/* Gradients — top + bottom film vignette */}
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/55 via-black/15 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

          {/* Top — frame ID + live badge */}
          <div className="absolute top-5 lg:top-7 left-5 lg:left-9 right-5 lg:right-9 flex items-start justify-between text-white">
            <div className="text-[11px] tracking-[0.22em] uppercase font-semibold opacity-85">
              Frame · 0001 / 0018
            </div>
            <div className="hidden md:inline-flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase font-semibold bg-white/10 backdrop-blur-md px-3 h-8 rounded-full border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              IH · Real Photo
            </div>
          </div>

          {/* Bottom — gigantic carved title */}
          <figcaption className="absolute bottom-6 lg:bottom-12 right-6 lg:right-12 left-6 lg:left-12 text-white">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div className="max-w-3xl">
                <div className="text-[11px] tracking-[0.22em] uppercase font-semibold opacity-85 mb-3">
                  Featured · صباحٌ في الهيفن
                </div>
                <div
                  className="font-bold leading-[0.95]"
                  style={{
                    fontSize: "clamp(2rem, 5.8vw, 5rem)",
                    letterSpacing: "-0.035em",
                  }}
                >
                  المكان الذي
                  <br />
                  <span className="italic font-light opacity-95">يبدأ منه الأمل.</span>
                </div>
              </div>
              <div className="hidden lg:flex flex-col items-end gap-3 text-right">
                <div className="text-[11px] tracking-[0.18em] uppercase font-semibold opacity-70">
                  Photographed at
                </div>
                <div className="text-base font-bold leading-tight">
                  Island Haven
                  <br />
                  <span className="opacity-70 font-medium">Gaza City</span>
                </div>
                <div className="h-[1px] w-16 bg-white/30 my-1" />
                <div className="font-mono text-[10px] tabular-nums opacity-65">
                  31.50°N · 34.45°E
                </div>
              </div>
            </div>
          </figcaption>
        </motion.figure>

        {/* ============================================================
            EDITORIAL MOSAIC — 12-col print-spread grid
            ============================================================ */}
        <div className="grid grid-cols-12 gap-3 lg:gap-5">
          {mosaic.map((p, i) => (
            <motion.figure
              key={p.src + i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
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

              {/* Always-on bottom gradient when caption is shown */}
              {p.showCap && (
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
              )}
              {/* Hover gradient for tiles without always-on caption */}
              {!p.showCap && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              )}

              {/* Frame number — corner mark */}
              <div className="absolute top-3 left-3 text-[10px] font-mono tabular-nums font-bold text-white/95 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
                {p.num}
              </div>

              {/* Caption — always-on for hero tiles, hover-only for others */}
              {p.showCap ? (
                <figcaption className="absolute bottom-4 right-4 left-4 text-white">
                  <div className="text-[10px] tracking-[0.18em] uppercase font-semibold opacity-80 mb-1">
                    Frame · {p.num}
                  </div>
                  <div className="text-sm lg:text-base font-bold">{p.caption}</div>
                </figcaption>
              ) : (
                <figcaption className="absolute bottom-3 right-3 left-3 text-white text-[12px] font-semibold opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-500">
                  {p.caption}
                </figcaption>
              )}
            </motion.figure>
          ))}
        </div>
      </div>

      {/* ============================================================
          KINETIC FILM STRIP — twin contra-rotating rows
          ============================================================ */}
      <div className="relative pb-24 lg:pb-32 pt-2">
        <div className="container mx-auto px-6 lg:px-12 max-w-[1500px] mb-8 lg:mb-10">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="h-[1px] w-10 bg-primary/50" />
                <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-primary font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Live Strip · شريط حيّ
                </div>
              </div>
              <h3
                className="font-bold text-foreground"
                style={{
                  fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.025em",
                }}
              >
                المكان <span className="text-accent-gradient">يتنفّس بأهله.</span>
              </h3>
            </div>
            <p className="max-w-md text-[14px] lg:text-[15px] text-foreground/60 leading-relaxed border-r-2 border-primary/25 pr-4">
              صفّان لا يتوقّفان — ١٨ لحظة من حياة آيلاند هيفن، تمرّ هنا
              كما تمرّ عندنا كلّ يوم. مرّر بإصبعك أو دع الشريط يحملك.
            </p>
          </div>
        </div>

        {/* Edge fade masks */}
        <div className="relative space-y-4 lg:space-y-5">
          <div className="absolute inset-y-0 right-0 w-24 lg:w-48 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-24 lg:w-48 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />

          {/* Row A — scrolls left (translateX -50%) */}
          <div className="overflow-hidden">
            <div
              className="flex gap-4 lg:gap-5 ih-marquee-a will-change-transform"
              style={{ width: "max-content" }}
            >
              {rowA.map((p, i) => (
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

          {/* Row B — scrolls right (opposite direction, slightly slower) */}
          <div className="overflow-hidden">
            <div
              className="flex gap-4 lg:gap-5 ih-marquee-b will-change-transform"
              style={{ width: "max-content" }}
            >
              {rowB.map((p, i) => (
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
