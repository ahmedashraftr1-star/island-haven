import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const photos = [
  "/photos/IMG_8344.jpg",
  "/photos/IMG_8347.jpg",
  "/photos/IMG_8352.jpg",
  "/photos/IMG_8358.jpg",
  "/photos/IMG_8300.jpg",
  "/photos/IMG_8313.jpg",
];

const words = ["غزّة", "الحُلم", "المعرفة", "المستقبل"];

export function ImageFillType() {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  useEffect(() => {
    const t = setInterval(() => setPhotoIdx((i) => (i + 1) % photos.length), 2400);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setWordIdx((i) => (i + 1) % words.length), 4800);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      ref={ref}
      className="relative bg-background py-24 lg:py-32 overflow-hidden"
    >
      {/* meta */}
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl mb-12 lg:mb-16 flex items-end justify-between gap-6 flex-wrap">
        <div className="max-w-xl">
          <div className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold mb-3">
            [ N°02 — لأجل من؟ ]
          </div>
          <h2
            className="font-bold text-foreground leading-[1.1]"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
            }}
          >
            مساحة بُنيت من القلب،
            <br />
            لقلبٍ آخر.
          </h2>
        </div>
        <div className="text-xs text-muted-foreground tracking-[0.3em] uppercase font-medium max-w-xs leading-relaxed">
          ـ من قلب القطاع، نُصرّ أنّ المعرفة لا تنتظر استقراراً، وأنّ الفرصة لا تطلب إذناً.
        </div>
      </div>

      {/* the giant word — letters filled with photos */}
      <div
        className="relative w-full flex items-center justify-center select-none"
        style={{ height: "min(80vw, 72vh)" }}
      >
        {/* outline ghost layer */}
        <h2
          aria-hidden
          className="absolute inset-0 flex items-center justify-center text-transparent pointer-events-none"
          style={{
            fontSize: "clamp(7rem, 30vw, 26rem)",
            fontWeight: 900,
            lineHeight: 0.85,
            WebkitTextStroke: "1px rgba(33,29,28,0.10)",
          }}
        >
          {words[wordIdx]}
        </h2>

        {/* photo-filled word */}
        {photos.map((p, i) => (
          <motion.h2
            key={p}
            className="absolute inset-0 flex items-center justify-center text-center"
            animate={{ opacity: i === photoIdx ? 1 : 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{
              fontSize: "clamp(7rem, 30vw, 26rem)",
              fontWeight: 900,
              lineHeight: 0.85,
              backgroundImage: `url(${p})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            {words[wordIdx]}
          </motion.h2>
        ))}

        {/* corner labels */}
        <div className="absolute bottom-4 right-6 lg:right-10 text-[10px] tracking-[0.4em] uppercase font-bold text-foreground/50">
          {String(wordIdx + 1).padStart(2, "0")} / {String(words.length).padStart(2, "0")}
        </div>
        <div className="absolute bottom-4 left-6 lg:left-10 text-[10px] tracking-[0.4em] uppercase font-bold text-foreground/50">
          A Living Portrait
        </div>

        {/* faint scrolling photo strip behind for depth */}
        <motion.div
          aria-hidden
          style={{ y: bgY }}
          className="absolute inset-x-0 -bottom-8 h-24 opacity-[0.08] flex gap-2 overflow-hidden pointer-events-none"
        >
          {photos.concat(photos).map((p, i) => (
            <img
              key={i}
              src={p}
              alt=""
              className="h-full w-40 object-cover flex-shrink-0"
            />
          ))}
        </motion.div>
      </div>

      <div className="container mx-auto px-6 lg:px-10 max-w-7xl mt-12 lg:mt-16 flex items-end justify-end">
        <p
          className="text-foreground italic text-lg lg:text-xl max-w-md text-right leading-relaxed"
        >
          «نُؤمن أنّ المعرفة، والخبرة، والتعاون قادرة على بناء مستقبل — حتى في أصعب الظروف.»
        </p>
      </div>
    </section>
  );
}
