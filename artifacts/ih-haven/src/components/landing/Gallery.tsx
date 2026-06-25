import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Camera, ArrowLeft, MapPin } from "lucide-react";
import { useContentSection, imageUrl } from "@/hooks/use-content";

const FALLBACK = {
  eyebrow: "Picture Essay · معرض الصور",
  titleA: "صورٌ من قلب",
  titleAccent: "المساحة.",
  sub: "كلّ صورة هنا التُقطت داخل آيلاند هيفن — وجوه، تركيز، تفاصيل، وحياة يوميّة في مكان نُحبّه.",
  p01: "/photos/IMG_8357.webp", c01: "صباحٌ في المساحة",
  p02: "/photos/IMG_8300.webp", c02: "الجدار الذي يحمل اسمنا",
  p03: "/photos/IMG_8347.webp", c03: "تركيزٌ عميق على التصميم",
  p04: "/photos/IMG_8313.webp", c04: "ركن العمل المشترك",
  p05: "/photos/IMG_8352.webp", c05: "ورشةٌ نتعلّم فيها معاً",
  p06: "/photos/IMG_8344.webp", c06: "زاوية هادئة للتفكير",
  p07: "/photos/IMG_8358.webp", c07: "تشبيكٌ بين الأرواح",
  p08: "/photos/IMG_8346.webp", c08: "جلسة عملٍ مفتوحة",
  p09: "/photos/IMG_8341.webp", c09: "حواراتٌ تُولد منها فرص",
  p10: "/photos/IMG_8345.webp", c10: "في انتظار البدء",
  p11: "/photos/IMG_8349.webp", c11: "أيدٍ تبني الغد",
  p12: "/photos/IMG_8353.webp", c12: "مساحةٌ تتّسع للتجربة",
  p13: "/photos/IMG_8356.webp", c13: "ضحكاتٌ بين الأقران",
  p14: "/photos/IMG_8303.webp", c14: "تفاصيل مكاننا",
  p15: "/photos/IMG_8304.webp", c15: "أمسيةٌ في الهيفن",
  p16: "/photos/IMG_8307.webp", c16: "حضورٌ مهنيّ",
  p17: "/photos/IMG_8308.webp", c17: "تركيزٌ جماعيّ",
  p18: "/photos/IMG_8314.webp", c18: "وجوهٌ نفخر بها",
};

export function Gallery() {
  const c = useContentSection("gallery", FALLBACK);
  const ALL = [
    { src: imageUrl(c.p01), caption: c.c01 },
    { src: imageUrl(c.p02), caption: c.c02 },
    { src: imageUrl(c.p03), caption: c.c03 },
    { src: imageUrl(c.p04), caption: c.c04 },
    { src: imageUrl(c.p05), caption: c.c05 },
    { src: imageUrl(c.p06), caption: c.c06 },
    { src: imageUrl(c.p07), caption: c.c07 },
    { src: imageUrl(c.p08), caption: c.c08 },
    { src: imageUrl(c.p09), caption: c.c09 },
    { src: imageUrl(c.p10), caption: c.c10 },
    { src: imageUrl(c.p11), caption: c.c11 },
    { src: imageUrl(c.p12), caption: c.c12 },
    { src: imageUrl(c.p13), caption: c.c13 },
    { src: imageUrl(c.p14), caption: c.c14 },
    { src: imageUrl(c.p15), caption: c.c15 },
    { src: imageUrl(c.p16), caption: c.c16 },
    { src: imageUrl(c.p17), caption: c.c17 },
    { src: imageUrl(c.p18), caption: c.c18 },
  ];
  const HERO = [ALL[0], ALL[6], ALL[4], ALL[1], ALL[8], ALL[15]];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HERO.length), 6500);
    return () => clearInterval(t);
  }, [HERO.length]);

  const v = HERO[idx];
  const mosaic = [
    { ...ALL[2], col: "col-span-7", aspect: "aspect-[4/3]", showCap: true, num: "07" },
    { ...ALL[10], col: "col-span-5", aspect: "aspect-[3/4]", showCap: true, num: "08" },
    { ...ALL[3], col: "col-span-4", aspect: "aspect-[1/1]", num: "09", showCap: false },
    { ...ALL[5], col: "col-span-4", aspect: "aspect-[1/1]", num: "10", showCap: false },
    { ...ALL[7], col: "col-span-4", aspect: "aspect-[1/1]", num: "11", showCap: false },
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
      <div aria-hidden className="absolute inset-0 opacity-[0.10] pointer-events-none">
        <img src={imageUrl(c.p04)} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,14,26,0.95) 0%, rgba(10,14,26,0.7) 50%, rgba(10,14,26,0.98) 100%)",
          }}
        />
      </div>

      <div
        aria-hidden
        className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[60vh] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, hsl(354 100% 70% / 0.16) 0%, transparent 65%)",
          filter: "blur(70px)",
        }}
      />

      <div className="container relative mx-auto px-6 lg:px-12 max-w-[1500px] pt-28 lg:pt-40 pb-20 lg:pb-28">
        <div className="flex items-center justify-between gap-6 mb-12 lg:mb-16">
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-10 bg-white/40" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-white/75 font-semibold inline-flex items-center gap-2">
              <Camera className="w-3 h-3" strokeWidth={2.5} />
              {c.eyebrow}
            </span>
          </div>
          <div className="text-[11px] font-mono text-white/40 tabular-nums tracking-wider">
            {String(idx + 1).padStart(2, "0")} / {String(HERO.length).padStart(2, "0")}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 lg:gap-12 items-end mb-14 lg:mb-20">
          <div className="col-span-12 lg:col-span-8">
            <h2
              className="font-bold text-white"
              style={{ fontSize: "clamp(2.75rem, 7.4vw, 6.5rem)", lineHeight: 0.96, letterSpacing: "-0.04em", fontWeight: 600 }}
            >
              {c.titleA}
              <br />
              <span className="italic font-light text-white/95">{c.titleAccent}</span>
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <div className="border-t border-white/15 pt-6">
              <p className="text-base lg:text-lg text-white/65 leading-relaxed mb-5">
                {c.sub}
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

        <div className="relative rounded-3xl overflow-hidden bg-black shadow-soft-hover mb-7 lg:mb-9">
          <div className="relative aspect-[16/10] lg:aspect-[21/9]">
            {HERO.map((p, i) => (
              <motion.img
                key={p.src + i}
                src={p.src}
                alt={p.caption}
                loading={i === 0 ? "eager" : "lazy"}
                initial={false}
                animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.05 }}
                transition={{
                  opacity: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
                  scale: { duration: 6.5, ease: [0.16, 1, 0.3, 1] },
                }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ))}

            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/55 via-black/15 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

            <div
              aria-hidden
              className="absolute -top-10 lg:-top-20 right-2 lg:right-8 text-white/[0.08] font-bold leading-none select-none pointer-events-none"
              style={{ fontSize: "clamp(10rem, 18vw, 20rem)" }}
            >
              "
            </div>

            <div className="absolute top-5 lg:top-8 left-5 lg:left-10 right-5 lg:right-10 flex items-start justify-between text-white">
              <div className="text-[11px] tracking-[0.22em] uppercase font-semibold opacity-85">
                Frame · {String(idx + 1).padStart(4, "0")} / 0018
              </div>
              <div className="hidden md:inline-flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase font-semibold bg-white/10 backdrop-blur-md px-3 h-8 rounded-full border border-white/15">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                IH · Real Photo
              </div>
            </div>

            <div className="absolute bottom-6 lg:bottom-12 right-6 lg:right-12 left-6 lg:left-12 text-white">
              <div className="flex items-end justify-between gap-6 flex-wrap">
                <motion.div
                  key={`cap-${idx}`}
                  initial={{ y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-3xl"
                >
                  <div className="text-[11px] tracking-[0.22em] uppercase font-semibold opacity-85 mb-3">
                    Featured · مشهد رقم {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div
                    className="font-bold leading-[0.95]"
                    style={{ fontSize: "clamp(2rem, 5.6vw, 4.75rem)", letterSpacing: "-0.038em", fontWeight: 600 }}
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
                key={p.src + i}
                onClick={() => setIdx(i)}
                aria-label={`عرض المشهد ${i + 1}: ${p.caption}`}
                className={`relative shrink-0 rounded-md overflow-hidden transition-all duration-300 ${
                  i === idx
                    ? "w-16 h-12 lg:w-20 lg:h-14 ring-2 ring-white"
                    : "w-9 h-12 lg:w-11 lg:h-14 opacity-50 hover:opacity-90"
                }`}
              >
                <img src={p.src} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

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
              initial={{ y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className={`relative overflow-hidden rounded-2xl shadow-soft hover:shadow-soft-hover transition-all duration-400 group bg-black ${p.col} ${p.aspect}`}
            >
              <img
                src={p.src}
                alt={p.caption}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.06]"
              />
              {p.showCap && (
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              )}
              {!p.showCap && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                <figcaption className="absolute bottom-3 right-3 left-3 text-white text-[12px] font-semibold opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-300">
                  {p.caption}
                </figcaption>
              )}
            </motion.figure>
          ))}
        </div>

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

      <ClosingScene
        frames={[
          { src: imageUrl(c.p17), caption: c.c17, en: "A shared focus" },
          { src: imageUrl(c.p18), caption: c.c18, en: "Faces we are proud of" },
          { src: imageUrl(c.p15), caption: c.c15, en: "An evening at the Haven" },
          { src: imageUrl(c.p10), caption: c.c10, en: "Awaiting the spark" },
          { src: imageUrl(c.p14), caption: c.c14, en: "The fine grain of place" },
        ]}
      />
    </section>
  );
}

type Frame = { src: string; caption: string; en: string };

function ClosingScene({ frames }: { frames: Frame[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % frames.length), 7500);
    return () => clearInterval(t);
  }, [frames.length]);
  const v = frames[idx];

  return (
    <section
      className="relative bg-[#0A0E1A] text-white py-24 lg:py-36 overflow-hidden border-t border-white/[0.06]"
      aria-label="خاتمة المعرض"
    >
      <div aria-hidden className="absolute inset-0 opacity-[0.18] pointer-events-none">
        <img
          src={v.src}
          key={`bg-${idx}`}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(10,14,26,0.85) 0%, rgba(10,14,26,0.55) 50%, rgba(10,14,26,0.95) 100%)",
          }}
        />
      </div>

      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, hsl(354 100% 70% / 0.18) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      <div className="container relative mx-auto px-6 lg:px-12 max-w-[1500px]">
        <div className="flex items-center justify-between gap-6 mb-12 lg:mb-16">
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-10 bg-white/40" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-white/75 font-semibold">
              Closing Scene · خاتمة المعرض
            </span>
          </div>
          <div className="text-[11px] font-mono text-white/40 tabular-nums tracking-wider">
            {String(idx + 1).padStart(2, "0")} / {String(frames.length).padStart(2, "0")}
          </div>
        </div>

        <div className="relative min-h-[260px] lg:min-h-[380px]">
          <div
            aria-hidden
            className="absolute -top-8 lg:-top-16 right-0 lg:right-2 text-white/[0.06] font-bold leading-none select-none pointer-events-none"
            style={{ fontSize: "clamp(12rem, 22vw, 24rem)" }}
          >
            "
          </div>

          <motion.figure
            key={idx}
            initial={{ y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative text-white max-w-[1300px]"
          >
            <div
              className="font-bold"
              style={{ fontSize: "clamp(1.75rem, 4.6vw, 4rem)", lineHeight: 1.18, letterSpacing: "-0.022em", fontWeight: 600 }}
            >
              {v.caption}
            </div>

            <motion.figcaption
              initial={{ y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.35 }}
              className="block mt-10 lg:mt-14 text-[13px] tracking-[0.16em] uppercase text-white/55 font-semibold"
            >
              — مُلتقطة في آيلاند هيفن ·{" "}
              <span className="text-white/35">{v.en}</span>
            </motion.figcaption>
          </motion.figure>
        </div>

        <div className="mt-16 lg:mt-20 flex items-center gap-6">
          <div className="flex-1 h-px bg-white/10 relative overflow-hidden">
            <motion.div
              key={idx}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 7.5, ease: "linear" }}
              className="absolute inset-0 bg-white origin-right"
              style={{ transformOrigin: "right" }}
            />
          </div>
          <div className="flex gap-2">
            {frames.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`عرض المشهد ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === idx ? "bg-white w-8" : "bg-white/25 hover:bg-white/45 w-2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
