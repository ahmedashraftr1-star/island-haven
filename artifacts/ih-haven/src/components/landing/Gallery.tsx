import { motion } from "framer-motion";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";
import { Camera, ArrowLeft } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

/* All 18 photos, curated with captions. */
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
// Asymmetric mosaic — 9 picks, mix of tall/short
const MOSAIC = [
  { ...ALL[1], span: "row-span-2 aspect-[3/4]" },
  { ...ALL[4], span: "aspect-[4/3]" },
  { ...ALL[8], span: "aspect-[4/3]" },
  { ...ALL[2], span: "aspect-[4/3]" },
  { ...ALL[6], span: "row-span-2 aspect-[3/4]" },
  { ...ALL[5], span: "aspect-[4/3]" },
  { ...ALL[10], span: "aspect-[4/3]" },
  { ...ALL[7], span: "aspect-[4/3]" },
  { ...ALL[3], span: "aspect-[4/3]" },
];

/**
 * Gallery — three-act photo essay:
 *   1) Editorial intro + cinematic featured frame.
 *   2) Asymmetric mosaic mixing tall and wide tiles.
 *   3) Infinite-scroll marquee — "the place breathes its people".
 */
export function Gallery() {
  // Duplicate the row so the marquee loops seamlessly.
  const marqueeRow = [...ALL, ...ALL];

  return (
    <section id="gallery" className="relative bg-background overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px] pt-24 lg:pt-32 pb-12 lg:pb-16">
        {/* Editorial intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-12 gap-6 lg:gap-12 items-end mb-12 lg:mb-16"
        >
          <div className="col-span-12 lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-6">
              <Camera className="w-3 h-3" strokeWidth={2.5} />
              من داخل المساحة · {ALL.length} لقطة
            </div>
            <h2
              className="font-bold text-foreground"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 5.25rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.025em",
              }}
            >
              هكذا تبدأ
              <br />
              <span className="text-accent-gradient">أيّامنا.</span>
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:col-start-9">
            <p className="text-base lg:text-lg text-foreground/65 leading-relaxed mb-4">
              مكاتب صباحيّة، فناجين قهوة دافئة، وجوهٌ متفائلة، وجدارٌ يحمل اسماً
              يُذكّرنا بالسبب. كلّ صورة هنا حقيقيّة — لا فبركة، لا ستوك.
            </p>
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
        </motion.div>

        {/* Featured cinematic frame */}
        <motion.figure
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden shadow-soft-hover mb-5 lg:mb-6 group"
        >
          <div className="aspect-[16/9] lg:aspect-[21/9]">
            <img
              src={FEATURED.src}
              alt={FEATURED.caption}
              loading="eager"
              className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.02]"
            />
          </div>
          {/* Bottom gradient + caption */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
          <figcaption className="absolute bottom-5 lg:bottom-7 right-5 lg:right-9 left-5 lg:left-9 flex items-end justify-between gap-4 text-white">
            <div>
              <div className="text-[11px] tracking-[0.18em] uppercase font-semibold opacity-80 mb-1.5">
                Featured · 01
              </div>
              <div className="text-lg lg:text-xl font-bold">{FEATURED.caption}</div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[11px] tracking-wide opacity-80 bg-white/15 backdrop-blur-md px-3 h-8 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              مُلتقطة في الهيفن
            </div>
          </figcaption>
        </motion.figure>

        {/* Asymmetric mosaic */}
        <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[180px] lg:auto-rows-[220px] gap-3 lg:gap-5">
          {MOSAIC.map((p, i) => (
            <motion.figure
              key={p.src + i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.6,
                delay: (i % 4) * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`relative overflow-hidden rounded-2xl shadow-soft hover:shadow-soft-hover hover:-translate-y-0.5 transition-all duration-500 group ${p.span}`}
            >
              <img
                src={p.src}
                alt={p.caption}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
              />
              {/* Hover caption */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <figcaption className="absolute bottom-3 right-3 left-3 text-white text-[12px] font-semibold opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-500">
                {p.caption}
              </figcaption>
              {/* Index chip — top-right (visual rhythm) */}
              <div className="absolute top-2.5 right-2.5 text-[10px] font-bold text-white/90 bg-black/30 backdrop-blur-md tabular-nums px-2 py-1 rounded-full">
                {String(i + 2).padStart(2, "0")}
              </div>
            </motion.figure>
          ))}
        </div>
      </div>

      {/* Marquee — "the place breathes its people" */}
      <div className="relative pb-20 lg:pb-28">
        <div className="container mx-auto px-6 lg:px-12 max-w-[1500px] mb-7 lg:mb-9">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live Stream
              </div>
              <h3
                className="font-bold text-foreground tracking-tight"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", lineHeight: 1.1 }}
              >
                المكان <span className="text-accent-gradient">يتنفّس بأهله.</span>
              </h3>
            </div>
            <p className="max-w-md text-[14px] text-foreground/60 leading-relaxed">
              شريطٌ لا يتوقّف — ١٨ لحظة من حياة آيلاند هيفن، تمرّ هنا كما تمرّ
              عندنا كلّ يوم.
            </p>
          </div>
        </div>

        {/* Edge fade masks */}
        <div className="relative">
          <div className="absolute inset-y-0 right-0 w-24 lg:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-24 lg:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden">
            <div
              className="flex gap-4 lg:gap-5 marquee-track will-change-transform"
              style={{ width: "max-content" }}
            >
              {marqueeRow.map((p, i) => (
                <figure
                  key={`${p.src}-${i}`}
                  className="shrink-0 w-[260px] lg:w-[340px] aspect-[4/5] rounded-2xl overflow-hidden shadow-soft relative group"
                >
                  <img
                    src={p.src}
                    alt={p.caption}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <figcaption className="absolute bottom-3 right-3 left-3 text-white text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {p.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes ih-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .marquee-track { animation: ih-marquee 60s linear infinite; }
          .marquee-track:hover { animation-play-state: paused; }
          @media (prefers-reduced-motion: reduce) {
            .marquee-track { animation: none; }
          }
        `}</style>
      </div>
    </section>
  );
}
