import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";

const photos = [
  { src: "/photos/IMG_8357.jpg", h: "tall", caption: "Morning · صباح في المساحة" },
  { src: "/photos/IMG_8300.jpg", h: "tall", caption: "Wall · جدار آيلاند هيفن" },
  { src: "/photos/IMG_8347.jpg", h: "short", caption: "Focus · تركيز على التصميم" },
  { src: "/photos/IMG_8313.jpg", h: "short", caption: "Co-working · ركن العمل المشترك" },
  { src: "/photos/IMG_8352.jpg", h: "tall", caption: "Workshop · ورشة عمل" },
  { src: "/photos/IMG_8344.jpg", h: "short", caption: "Quiet · زاوية هادئة" },
  { src: "/photos/IMG_8358.jpg", h: "short", caption: "Network · تشبيك ولقاءات" },
  { src: "/photos/IMG_8346.jpg", h: "tall", caption: "Session · جلسة عمل" },
];

export function Gallery() {
  return (
    <section id="gallery" className="relative bg-background py-24 lg:py-32 border-t border-foreground/10">
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
        <EditorialHeader
          no="10"
          label="من داخل المساحة"
          meta={<>Photo<br />essay</>}
          title={
            <>
              هكذا تبدو
              <br />
              <span className="text-primary italic">أيّامنا.</span>
            </>
          }
          sub="صور حقيقيّة من قلب آيلاند هيفن — مكاتب نُحبّها، فناجين قهوة، شاشات تُضيء وجوهاً متفائلة، ولوحات على الجدار تُذكّرنا بالسبب."
        />

        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
          {photos.map((p, i) => (
            <motion.figure
              key={p.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.08 }}
              className="mb-3 break-inside-avoid relative group overflow-hidden"
            >
              <img
                src={p.src}
                alt={p.caption}
                loading="lazy"
                className={`w-full ${
                  p.h === "tall" ? "aspect-[3/4]" : "aspect-[4/3]"
                } object-cover grayscale-[10%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700`}
              />
              <div className="mt-2 flex items-baseline justify-between text-[10px] tracking-[0.3em] uppercase font-bold text-foreground/55">
                <span>{p.caption}</span>
                <span>{String(i + 1).padStart(2, "0")}</span>
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
