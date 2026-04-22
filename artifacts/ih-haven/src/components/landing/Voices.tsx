import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
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
    <section className="relative bg-background py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px]">
        <div className="bg-gradient-to-br from-primary-soft via-primary-soft to-white border border-primary/20 rounded-3xl p-10 lg:p-20 shadow-soft relative overflow-hidden">
          {/* subtle indigo halo */}
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, hsl(232 100% 70% / 0.18) 0%, transparent 60%)",
              filter: "blur(40px)",
            }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-primary text-[11px] tracking-[0.15em] uppercase font-semibold mb-10 shadow-soft border border-border">
              <Quote className="w-3 h-3" />
              بكلماتنا
            </div>

            <div className="relative min-h-[200px] lg:min-h-[260px]">
              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
                  className="text-foreground"
                  style={{
                    fontSize: "clamp(1.5rem, 3.4vw, 3rem)",
                    lineHeight: 1.25,
                    letterSpacing: "-0.015em",
                    fontWeight: 600,
                  }}
                >
                  «{v.quote}»

                  <motion.figcaption
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: DURATION.md, delay: 0.3 }}
                    className="block mt-8 text-[13px] text-foreground/60 font-medium"
                  >
                    — {v.source}
                  </motion.figcaption>
                </motion.blockquote>
              </AnimatePresence>
            </div>

            <div className="mt-12 flex items-center gap-5">
              <div className="text-[12px] text-foreground/50 font-mono tabular-nums">
                {String(idx + 1).padStart(2, "0")} / {String(voices.length).padStart(2, "0")}
              </div>
              <div className="flex-1 h-px bg-foreground/10 relative overflow-hidden">
                <motion.div
                  key={idx}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 6.5, ease: "linear" }}
                  className="absolute inset-0 bg-primary origin-right"
                />
              </div>
              <div className="flex gap-1.5">
                {voices.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    aria-label={`اقتباس ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      i === idx ? "bg-primary w-6" : "bg-foreground/20 hover:bg-foreground/40 w-2"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
