import { motion } from "framer-motion";

const photos = [
  { src: "/photos/IMG_8357.jpg", h: "tall", caption: "صباح في المساحة" },
  { src: "/photos/IMG_8300.jpg", h: "tall", caption: "جدار island haven" },
  { src: "/photos/IMG_8347.jpg", h: "short", caption: "تركيز على التصميم" },
  { src: "/photos/IMG_8313.jpg", h: "short", caption: "ركن العمل المشترك" },
  { src: "/photos/IMG_8352.jpg", h: "tall", caption: "ورشة عمل" },
  { src: "/photos/IMG_8344.jpg", h: "short", caption: "زاوية هادئة" },
  { src: "/photos/IMG_8358.jpg", h: "short", caption: "تشبيك ولقاءات" },
  { src: "/photos/IMG_8346.jpg", h: "tall", caption: "جلسة عمل" },
];

export function Gallery() {
  return (
    <section id="gallery" className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 max-w-2xl"
        >
          <p className="text-sm font-medium text-primary tracking-[0.25em] uppercase mb-3">
            من داخل المساحة
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4" style={{ fontFamily: "Cairo, sans-serif" }}>
            هكذا تبدو أيّامنا.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
            صور حقيقيّة من قلب آيلاند هيفن — مكاتب نُحبّها، فناجين قهوة، شاشات تُضيء وجوهاً
            متفائلة، ولوحات على الجدار تُذكّرنا بالسبب.
          </p>
        </motion.div>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
          {photos.map((p, i) => (
            <motion.figure
              key={p.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: (i % 4) * 0.08 }}
              className="mb-4 break-inside-avoid relative group overflow-hidden rounded-xl border border-border"
            >
              <img
                src={p.src}
                alt={p.caption}
                loading="lazy"
                className={`w-full ${
                  p.h === "tall" ? "aspect-[3/4]" : "aspect-[4/3]"
                } object-cover group-hover:scale-105 transition-transform duration-700`}
              />
              <figcaption className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-foreground/85 to-transparent text-background text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {p.caption}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
