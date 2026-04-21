import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";

const photos = [
  { src: "/photos/IMG_8357.jpg", caption: "Morning · صباح في المساحة" },
  { src: "/photos/IMG_8300.jpg", caption: "Wall · جدار آيلاند هيفن" },
  { src: "/photos/IMG_8347.jpg", caption: "Focus · تركيز على التصميم" },
  { src: "/photos/IMG_8313.jpg", caption: "Co-working · ركن العمل المشترك" },
  { src: "/photos/IMG_8352.jpg", caption: "Workshop · ورشة عمل" },
  { src: "/photos/IMG_8344.jpg", caption: "Quiet · زاوية هادئة" },
  { src: "/photos/IMG_8358.jpg", caption: "Network · تشبيك ولقاءات" },
  { src: "/photos/IMG_8346.jpg", caption: "Session · جلسة عمل" },
];

/**
 * Horizontal-pinned photo essay. The section pins to the viewport while
 * the user scrolls vertically; the strip translates horizontally. Used by
 * Apple, Stripe, Linear for product galleries.
 */
export function Gallery() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  // RTL: move to the right (positive X) as user scrolls
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-58%"]);

  return (
    <section className="relative bg-background">
      {/* Header — sits above the pinned strip */}
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px] pt-32 lg:pt-44 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-12 gap-6 lg:gap-12 items-end"
        >
          <div className="col-span-12 lg:col-span-7">
            <div className="text-[10px] tracking-[0.45em] uppercase text-primary font-mono mb-5">
              N°05 — من داخل المساحة
            </div>
            <h2
              className="font-bold text-foreground"
              style={{
                fontSize: "clamp(2.25rem, 6vw, 5.5rem)",
                lineHeight: 1.04,
                letterSpacing: "-0.015em",
              }}
            >
              هكذا تبدو
              <br />
              <span className="text-primary">أيّامنا.</span>
            </h2>
          </div>
          <p className="col-span-12 lg:col-span-4 lg:col-start-9 text-base lg:text-lg text-foreground/70 font-light leading-relaxed">
            صورٌ حقيقيّة من قلب آيلاند هيفن — مكاتب، فناجين قهوة، وجوهٌ متفائلة، وجدارٌ يُذكّرنا بالسبب.
          </p>
        </motion.div>
      </div>

      {/* Pinned horizontal strip — height controls how long the pin lasts */}
      <div ref={ref} className="relative h-[280vh] lg:h-[320vh] hidden md:block">
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <motion.div
            style={{ x }}
            className="flex gap-6 lg:gap-10 px-6 lg:px-12 will-change-transform"
          >
            {photos.map((p, i) => (
              <figure key={p.src} className="relative shrink-0 w-[70vw] md:w-[55vw] lg:w-[42vw]">
                <div className="relative overflow-hidden">
                  <img
                    src={p.src}
                    alt={p.caption}
                    loading={i < 2 ? "eager" : "lazy"}
                    className="w-full h-[68vh] object-cover grayscale-[8%]"
                  />
                  <div className="absolute top-4 right-4 text-[10px] tracking-[0.4em] uppercase font-mono text-background/90 bg-foreground/40 backdrop-blur-sm px-3 py-1.5">
                    {String(i + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
                  </div>
                </div>
                <figcaption className="mt-4 flex items-baseline justify-between text-[10px] tracking-[0.4em] uppercase font-mono text-foreground/55">
                  <span>{p.caption}</span>
                </figcaption>
              </figure>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Mobile: stacked grid (no horizontal scroll on touch) */}
      <div className="md:hidden container mx-auto px-6 max-w-[1500px] pb-20">
        <div className="grid grid-cols-2 gap-3">
          {photos.map((p, i) => (
            <motion.figure
              key={p.src}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: DURATION.md, delay: (i % 4) * 0.06, ease: EASE_OUT_EXPO }}
            >
              <img
                src={p.src}
                alt={p.caption}
                loading="lazy"
                className="w-full aspect-[3/4] object-cover"
              />
              <figcaption className="mt-2 text-[9px] tracking-[0.3em] uppercase font-mono text-foreground/55">
                {p.caption}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
