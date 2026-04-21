import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";

const voices = [
  {
    quote:
      "في واقعٍ تتكاثر فيه التحدّيات وتضيق فيه المساحات الآمنة للتعلّم والعمل، وُلد Island Haven كفكرة بسيطة في جوهرها، عميقة في أثرها.",
    source: "من الملف التعريفي للمجتمع",
  },
  {
    quote:
      "نعم هو مكانٌ للعمل، لكنّه قبل ذلك مساحة للالتقاء، وللتعلّم، ولبناء الثقة بالنفس وبالطريق.",
    source: "رؤية Island Haven",
  },
  {
    quote:
      "محاولة جادّة لبناء شيءٍ مستدامٍ في مكانٍ يفتقر إلى الاستقرار، واستثمار حقيقيّ في الإنسان قبل أيّ شيء آخر.",
    source: "كلمة فريق التأسيس",
  },
];

export function Voices() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % voices.length), 6500);
    return () => clearInterval(t);
  }, []);

  const v = voices[idx];

  return (
    <section className="relative bg-foreground text-background overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px] py-32 lg:py-44 min-h-[80vh] flex flex-col justify-center">
        {/* Editorial header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
          className="flex items-baseline justify-between mb-16 lg:mb-24"
        >
          <div className="text-[10px] tracking-[0.45em] uppercase text-primary font-mono">
            N°06 — بكلماتنا
          </div>
          <div className="hidden md:block text-[10px] tracking-[0.45em] uppercase text-background/40 font-mono">
            In our own words
          </div>
        </motion.div>

        {/* Massive single-quote rotator */}
        <div className="relative min-h-[40vh] lg:min-h-[50vh]">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
              className="text-background"
              style={{
                fontSize: "clamp(1.75rem, 4.2vw, 4rem)",
                lineHeight: 1.18,
                letterSpacing: "-0.01em",
                fontWeight: 400,
              }}
            >
              <span className="text-primary opacity-60">«</span>
              {v.quote}
              <span className="text-primary opacity-60">»</span>

              <motion.figcaption
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: DURATION.md, delay: 0.4 }}
                className="block mt-10 text-[10px] tracking-[0.45em] uppercase text-background/55 font-mono"
              >
                — {v.source}
              </motion.figcaption>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        {/* Indicator row */}
        <div className="mt-16 lg:mt-20 flex items-center gap-6">
          <div className="text-[10px] tracking-[0.45em] uppercase text-background/40 font-mono tabular-nums">
            {String(idx + 1).padStart(2, "0")} / {String(voices.length).padStart(2, "0")}
          </div>
          <div className="flex-1 h-px bg-background/15 relative overflow-hidden">
            <motion.div
              key={idx}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 6.5, ease: "linear" }}
              className="absolute inset-0 bg-primary origin-right"
            />
          </div>
          <div className="flex gap-2">
            {voices.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`اقتباس ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  i === idx ? "bg-primary w-6" : "bg-background/25 hover:bg-background/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
