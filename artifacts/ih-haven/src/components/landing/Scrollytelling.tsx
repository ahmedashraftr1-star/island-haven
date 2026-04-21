import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const beats = [
  {
    word: "مساحة",
    caption: "في قلب غزّة، طوابق هادئة وكهرباء لا تنقطع.",
    photo: "/photos/IMG_8357.jpg",
  },
  {
    word: "مجتمع",
    caption: "ثمانون منتسباً يدورون أسبوعيّاً، يتعلّمون من بعضهم.",
    photo: "/photos/IMG_8344.jpg",
  },
  {
    word: "مهارة",
    caption: "ورش تطبيقيّة تربط المعرفة بسوق العمل، يومٌ بعد يوم.",
    photo: "/photos/IMG_8352.jpg",
  },
  {
    word: "مستقبل",
    caption: "خريجون ومستقلّون وطلبة يبنون أفقاً مهنيّاً مشتركاً.",
    photo: "/photos/IMG_8358.jpg",
  },
];

export function Scrollytelling() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={ref}
      className="relative bg-foreground text-background"
      style={{ height: `${beats.length * 110}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* photo crossfade stack */}
        {beats.map((b, i) => {
          const start = i / beats.length;
          const end = (i + 1) / beats.length;
          const mid = (start + end) / 2;
          const opacity = useTransform(
            scrollYProgress,
            [start, mid - 0.02, mid + 0.02, end],
            [0, 1, 1, 0]
          );
          const scale = useTransform(
            scrollYProgress,
            [start, end],
            [1.15, 1.0]
          );
          return (
            <motion.div
              key={i}
              style={{ opacity }}
              className="absolute inset-0"
            >
              <motion.img
                src={b.photo}
                alt=""
                style={{ scale }}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-foreground/55" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-transparent" />
            </motion.div>
          );
        })}

        {/* word stack */}
        <div className="relative z-10 h-full flex flex-col">
          <div className="container mx-auto px-6 lg:px-10 max-w-7xl pt-28 flex items-center justify-between">
            <div className="text-[10px] tracking-[0.4em] uppercase text-background/70 font-bold">
              [ N°05 — السرديّة ]
            </div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-background/50 font-medium">
              مرّر / Scroll
            </div>
          </div>

          <div className="flex-1 flex items-center">
            <div className="container mx-auto px-6 lg:px-10 max-w-7xl w-full">
              {beats.map((b, i) => {
                const start = i / beats.length;
                const end = (i + 1) / beats.length;
                const mid = (start + end) / 2;
                const opacity = useTransform(
                  scrollYProgress,
                  [start, mid - 0.04, mid + 0.04, end],
                  [0, 1, 1, 0]
                );
                const y = useTransform(
                  scrollYProgress,
                  [start, end],
                  [60, -60]
                );
                return (
                  <motion.div
                    key={i}
                    style={{ opacity, y }}
                    className="absolute inset-x-0 px-6 lg:px-10 max-w-7xl mx-auto"
                  >
                    <div className="flex items-center gap-6 mb-6">
                      <span className="text-background/70 text-xs tracking-[0.4em] uppercase font-bold">
                        {String(i + 1).padStart(2, "0")} / {String(beats.length).padStart(2, "0")}
                      </span>
                      <div className="h-px w-24 bg-background/40" />
                    </div>
                    <h3
                      className="font-extrabold leading-[1.05] tracking-tight text-background mb-8"
                      style={{
                        fontSize: "clamp(5rem, 18vw, 18rem)",
                      }}
                    >
                      {b.word}
                      <span className="text-primary">.</span>
                    </h3>
                    <p className="text-lg lg:text-2xl text-background/85 font-light leading-relaxed max-w-2xl">
                      {b.caption}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="container mx-auto px-6 lg:px-10 max-w-7xl pb-10">
            <div className="h-[2px] bg-background/15 overflow-hidden rounded-full">
              <motion.div
                className="h-full bg-primary origin-left"
                style={{ scaleX: scrollYProgress }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
