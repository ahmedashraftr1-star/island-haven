import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";

const FALLBACK = {
  image: "/photos/IMG_8347.webp",
  v1Quote:
    "في واقعٍ تتكاثر فيه التحدّيات وتضيق فيه المساحات الآمنة للتعلّم والعمل، وُلد Island Haven كفكرة بسيطة في جوهرها، عميقة في أثرها.",
  v1Source: "من الملف التعريفي للمجتمع",
  v1En: "Founding profile",
  v2Quote:
    "نعم هو مكانٌ للعمل، لكنّه قبل ذلك مساحة للالتقاء، وللتعلّم، ولبناء الثقة بالنفس وبالطريق.",
  v2Source: "رؤية Island Haven",
  v2En: "Vision",
  v3Quote:
    "محاولة جادّة لبناء شيءٍ مستدامٍ في مكانٍ يفتقر إلى الاستقرار، واستثمار حقيقيّ في الإنسان قبل أيّ شيء آخر.",
  v3Source: "كلمة فريق التأسيس",
  v3En: "From the founding team",
};

export function Voices() {
  const { t } = useLanguage();
  const c = useContentSection("voices", FALLBACK);
  const voices = useMemo(
    () =>
      [
        { quote: c.v1Quote, source: c.v1Source, en: c.v1En },
        { quote: c.v2Quote, source: c.v2Source, en: c.v2En },
        { quote: c.v3Quote, source: c.v3Source, en: c.v3En },
      ].filter((v) => v.quote && v.quote.trim().length > 0),
    [c.v1Quote, c.v1Source, c.v1En, c.v2Quote, c.v2Source, c.v2En, c.v3Quote, c.v3Source, c.v3En],
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (voices.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % voices.length), 7500);
    return () => clearInterval(t);
  }, [voices.length]);

  if (voices.length === 0) return null;
  const safe = Math.min(idx, voices.length - 1);
  const v = voices[safe];

  return (
    <section className="relative bg-[#0A0E1A] text-white py-28 lg:py-40 overflow-hidden">
      <div aria-hidden className="absolute inset-0 opacity-[0.42] pointer-events-none">
        <img src={imageUrl(c.image)} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover saturate-[1.05]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,14,26,0.72) 0%, rgba(10,14,26,0.38) 50%, rgba(10,14,26,0.88) 100%)",
          }}
        />
      </div>

      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(354 100% 70% / 0.18) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      <div className="container relative mx-auto px-6 lg:px-12 max-w-[1500px]">
        <div className="flex items-center justify-between gap-6 mb-14 lg:mb-20">
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-10 bg-white/40" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-white/75 font-semibold">
              {t({ ar: "Voices · بكلماتنا", en: "Voices · In Our Words" })}
            </span>
          </div>
          <div className="text-[11px] font-mono text-white/40 tabular-nums tracking-wider">
            {String(safe + 1).padStart(2, "0")} / {String(voices.length).padStart(2, "0")}
          </div>
        </div>

        <div className="relative min-h-[280px] lg:min-h-[420px]">
          <div
            aria-hidden
            className="absolute -top-8 lg:-top-16 right-0 lg:right-2 text-white/[0.06] font-bold leading-none select-none pointer-events-none"
            style={{ fontSize: "clamp(12rem, 22vw, 24rem)" }}
          >
            "
          </div>

          <AnimatePresence mode="wait">
            <motion.blockquote
              key={safe}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
              className="relative text-white max-w-[1300px]"
              style={{
                fontSize: "clamp(1.75rem, 4.6vw, 4rem)",
                lineHeight: 1.18,
                letterSpacing: "-0.022em",
                fontWeight: 600,
              }}
            >
              {v.quote}

              <motion.figcaption
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION.md, delay: 0.35 }}
                className="block mt-10 lg:mt-14 text-[13px] tracking-[0.16em] uppercase text-white/55 font-semibold"
              >
                — {v.source} · <span className="text-white/35">{v.en}</span>
              </motion.figcaption>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="mt-16 lg:mt-20 flex items-center gap-6">
          <div className="flex-1 h-px bg-white/10 relative overflow-hidden">
            <motion.div
              key={safe}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 7.5, ease: "linear" }}
              className="absolute inset-0 bg-white origin-right"
            />
          </div>
          <div className="flex gap-2">
            {voices.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={t({ ar: `اقتباس ${i + 1}`, en: `Quote ${i + 1}` })}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === safe ? "bg-white w-8" : "bg-white/25 hover:bg-white/45 w-2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
