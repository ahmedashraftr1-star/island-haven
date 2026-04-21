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

const words = ["غزّة", "الحلم", "المعرفة", "المستقبل"];

export function ImageFillType() {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  useEffect(() => {
    const t = setInterval(() => {
      setPhotoIdx((i) => (i + 1) % photos.length);
    }, 2400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setWordIdx((i) => (i + 1) % words.length);
    }, 4800);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      ref={ref}
      className="relative bg-background py-24 lg:py-32 overflow-hidden"
    >
      {/* meta header */}
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl mb-12 flex items-end justify-between gap-6 flex-wrap">
        <div className="max-w-xl">
          <div className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold mb-3">
            [ N°02 — لأجل من؟ ]
          </div>
          <h2
            className="font-bold text-foreground leading-[1.05]"
            style={{
              fontFamily: "Reem Kufi, sans-serif",
              fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
            }}
          >
            مساحة بُنيت من القلب،<br />لقلبٍ آخر.
          </h2>
        </div>
        <div className="text-xs text-muted-foreground tracking-[0.3em] uppercase font-medium max-w-xs leading-relaxed">
          ـ من قلب القطاع، نُصرّ أنّ المعرفة لا تنتظر استقراراً، وأنّ الفرصة لا تطلب إذناً.
        </div>
      </div>

      {/* the giant word */}
      <div className="relative w-full" style={{ height: "min(78vw, 70vh)" }}>
        {/* photos behind for clip */}
        <div className="absolute inset-0 overflow-hidden">
          {photos.map((p, i) => (
            <motion.div
              key={p}
              className="absolute inset-0"
              animate={{ opacity: i === photoIdx ? 1 : 0 }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            >
              <motion.img
                src={p}
                alt=""
                style={{ scale: bgScale, y: bgY }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </motion.div>
          ))}
          <div className="absolute inset-0 bg-foreground/20" />
        </div>

        {/* the word — duplicated layers, one as image-clipped */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* outline */}
          <h2
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-transparent select-none pointer-events-none"
            style={{
              fontFamily: "Cairo, sans-serif",
              fontSize: "clamp(8rem, 32vw, 28rem)",
              fontWeight: 900,
              lineHeight: 0.85,
              WebkitTextStroke: "1px rgba(255,255,255,0.25)",
            }}
          >
            {words[wordIdx]}
          </h2>

          {/* solid background — clip the word area to background */}
          <div
            aria-hidden
            className="absolute inset-0 bg-background"
            style={{
              WebkitMaskImage: "radial-gradient(ellipse 70% 70% at center, transparent 0%, transparent 50%, black 75%)",
              maskImage: "radial-gradient(ellipse 70% 70% at center, transparent 0%, transparent 50%, black 75%)",
            }}
          />

          {/* the actual word — solid background-color for cutout look */}
          <h2
            className="relative font-black select-none"
            style={{
              fontFamily: "Cairo, sans-serif",
              fontSize: "clamp(8rem, 32vw, 28rem)",
              fontWeight: 900,
              lineHeight: 0.85,
              color: "transparent",
              WebkitTextStroke: "0",
              backgroundImage: `url(${photos[photoIdx]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              transition: "background-image 1.4s ease",
            }}
            key={`fill-${photoIdx}-${wordIdx}`}
          >
            {words[wordIdx]}
          </h2>
        </div>

        {/* corner labels */}
        <div className="absolute bottom-6 right-6 lg:right-10 z-10 text-[10px] tracking-[0.4em] uppercase font-bold text-background/80">
          {String(wordIdx + 1).padStart(2, "0")} / {String(words.length).padStart(2, "0")}
        </div>
        <div className="absolute bottom-6 left-6 lg:left-10 z-10 text-[10px] tracking-[0.4em] uppercase font-bold text-background/80">
          A Living Portrait
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-10 max-w-7xl mt-12 flex items-end justify-end">
        <p
          className="text-foreground italic text-lg lg:text-xl max-w-md text-right leading-relaxed"
          style={{ fontFamily: "Amiri, serif" }}
        >
          «نُؤمن أنّ المعرفة، والخبرة، والتعاون قادرة على بناء مستقبل — حتى في أصعب الظروف.»
        </p>
      </div>
    </section>
  );
}
