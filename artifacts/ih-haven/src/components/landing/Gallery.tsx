import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";

const BASE = import.meta.env.BASE_URL;
const photos = [
  { src: `${BASE}photos/IMG_8357.jpg`, caption: "صباح في المساحة" },
  { src: `${BASE}photos/IMG_8300.jpg`, caption: "جدار آيلاند هيفن" },
  { src: `${BASE}photos/IMG_8347.jpg`, caption: "تركيز على التصميم" },
  { src: `${BASE}photos/IMG_8313.jpg`, caption: "ركن العمل المشترك" },
  { src: `${BASE}photos/IMG_8352.jpg`, caption: "ورشة عمل" },
  { src: `${BASE}photos/IMG_8344.jpg`, caption: "زاوية هادئة" },
  { src: `${BASE}photos/IMG_8358.jpg`, caption: "تشبيك ولقاءات" },
  { src: `${BASE}photos/IMG_8346.jpg`, caption: "جلسة عمل" },
];

/** Horizontal-pinned photo essay with clean light captions. */
export function Gallery() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-58%"]);

  return (
    <section className="relative bg-background">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px] pt-24 lg:pt-32 pb-12 lg:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-12 gap-6 lg:gap-12 items-end"
        >
          <div className="col-span-12 lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              من داخل المساحة
            </div>
            <h2
              className="font-bold text-foreground"
              style={{
                fontSize: "clamp(2.25rem, 5.2vw, 4.25rem)",
                lineHeight: 1.06,
                letterSpacing: "-0.02em",
              }}
            >
              هكذا تبدو
              <br />
              <span className="text-accent-gradient">أيّامنا.</span>
            </h2>
          </div>
          <p className="col-span-12 lg:col-span-4 lg:col-start-9 text-base lg:text-lg text-foreground/65 leading-relaxed">
            صورٌ حقيقيّة من قلب آيلاند هيفن — مكاتب، فناجين قهوة،
            وجوهٌ متفائلة، وجدارٌ يُذكّرنا بالسبب.
          </p>
        </motion.div>
      </div>

      {/* Pinned horizontal strip */}
      <div ref={ref} className="relative h-[260vh] lg:h-[300vh] hidden md:block">
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <motion.div
            style={{ x }}
            className="flex gap-5 lg:gap-8 px-6 lg:px-12 will-change-transform"
          >
            {photos.map((p, i) => (
              <figure key={p.src} className="relative shrink-0 w-[70vw] md:w-[55vw] lg:w-[42vw]">
                <div className="relative overflow-hidden rounded-2xl shadow-soft">
                  <img
                    src={p.src}
                    alt={p.caption}
                    loading={i < 2 ? "eager" : "lazy"}
                    className="w-full h-[64vh] object-cover"
                  />
                  <div className="absolute top-4 right-4 text-[11px] font-semibold text-foreground bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-soft tabular-nums">
                    {String(i + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
                  </div>
                </div>
                <figcaption className="mt-4 text-[13px] text-foreground/60 font-medium">
                  {p.caption}
                </figcaption>
              </figure>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Mobile grid */}
      <div className="md:hidden container mx-auto px-6 max-w-[1500px] pb-20">
        <div className="grid grid-cols-2 gap-3">
          {photos.map((p, i) => (
            <motion.figure
              key={p.src}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: DURATION.md, delay: (i % 4) * 0.05, ease: EASE_OUT_EXPO }}
            >
              <img
                src={p.src}
                alt={p.caption}
                loading="lazy"
                className="w-full aspect-[3/4] object-cover rounded-xl"
              />
              <figcaption className="mt-2 text-[12px] text-foreground/60 font-medium">
                {p.caption}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
