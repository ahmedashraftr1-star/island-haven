import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";
import { useRef } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";

/**
 * Cinematic hero — full-bleed photo behind, the headline pinned over it.
 * As you scroll, the photo scales and dims, the headline glides up and out.
 * Inspired by Apple iPhone product pages and Linear's hero choreography.
 */
const slideUp = (delay: number) => ({
  initial: { y: "110%" },
  animate: { y: 0 },
  transition: { duration: DURATION.lg, delay, ease: EASE_OUT_EXPO },
});

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const photoScale = useTransform(scrollYProgress, [0, 1], [1.0, reduce ? 1 : 1.12]);
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "8%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.7], [0.55, reduce ? 0.55 : 0.85]);
  const headlineY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-25%"]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, reduce ? 1 : 0]);

  return (
    <section
      ref={ref}
      className="relative h-screen min-h-[680px] flex flex-col overflow-hidden bg-foreground text-background"
    >
      {/* Full-bleed cinema image */}
      <motion.div
        className="absolute inset-0 z-0 will-change-transform"
        style={{ scale: photoScale, y: photoY }}
      >
        <img
          src="/photos/IMG_8357.jpg"
          alt="منتسبو آيلاند هيفن أثناء العمل في المساحة المشتركة في غزّة"
          className="w-full h-full object-cover object-center"
        />
      </motion.div>

      {/* Cinematic gradient + dim overlay */}
      <motion.div
        className="absolute inset-0 z-0 bg-gradient-to-t from-foreground via-foreground/40 to-foreground/30"
        style={{ opacity: overlayOpacity }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-foreground/60 via-transparent to-foreground/20" />

      {/* Top meta row */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.lg, delay: 0.2, ease: EASE_OUT_EXPO }}
        className="relative z-10 pt-24 lg:pt-28 px-6 lg:px-12"
      >
        <div className="max-w-[1500px] mx-auto flex items-center justify-between text-[10px] font-medium tracking-[0.4em] uppercase text-background/70 font-mono">
          <span className="flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Gaza · Palestine
          </span>
          <span className="hidden md:inline">[ N°01 — Volume One ]</span>
          <span className="text-primary hidden sm:inline">A Nas to Nas Initiative</span>
        </div>
      </motion.div>

      {/* Headline anchored bottom-right (RTL leading), scroll-pinned */}
      <motion.div
        style={{ y: headlineY, opacity: headlineOpacity }}
        className="relative z-10 flex-1 flex flex-col justify-end px-6 lg:px-12 pb-20 lg:pb-24"
      >
        <div className="max-w-[1500px] mx-auto w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DURATION.md, delay: 0.3, ease: EASE_OUT_EXPO }}
            className="text-[10px] tracking-[0.45em] uppercase text-primary mb-6 font-mono"
          >
            مساحة · مجتمع · مستقبل
          </motion.div>

          <h1
            className="font-bold text-background"
            style={{
              fontSize: "clamp(3rem, 11vw, 11rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.02em",
            }}
          >
            <span className="block overflow-hidden">
              <motion.span className="block" {...slideUp(0.5)}>
                مساحة تتّسع
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span className="block" {...slideUp(0.7)}>
                <span className="text-primary">لأحلامك.</span>
              </motion.span>
            </span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.lg, delay: 1.2, ease: EASE_OUT_EXPO }}
            className="mt-10 grid grid-cols-12 gap-6 lg:gap-12 items-end"
          >
            <p className="col-span-12 lg:col-span-5 text-base lg:text-lg text-background/85 font-light leading-relaxed max-w-md">
              مجتمع مهنيّ في قلب غزّة يحتضن المستقلّين والخريجين وطلبة الجامعات.
              <span className="text-background"> ٣٩ مقعداً</span>،
              <span className="text-background"> ٨٠ منتسباً</span>،
              <span className="text-background"> ١٠٠٪ مجاناً</span>.
            </p>

            <div className="col-span-12 lg:col-span-7 flex flex-col sm:flex-row gap-3 lg:justify-end items-stretch sm:items-center">
              <a
                href={`${import.meta.env.BASE_URL}apply`}
                data-testid="cta-apply"
                className="group inline-flex items-center justify-center h-13 lg:h-14 px-7 lg:px-9 bg-background text-foreground font-medium text-xs lg:text-sm tracking-[0.2em] uppercase rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-primary hover:text-background hover:scale-[1.03] font-mono"
              >
                سجّل للانتساب
                <ArrowLeft className="mr-3 h-4 w-4 rtl:rotate-180 transition-transform duration-700 group-hover:-translate-x-1.5" />
              </a>
              <a
                href={`${import.meta.env.BASE_URL}apply?type=guest`}
                className="inline-flex items-center justify-center h-13 lg:h-14 px-7 lg:px-9 border border-background/40 text-background font-medium text-xs lg:text-sm tracking-[0.2em] uppercase rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-background hover:text-foreground hover:border-background font-mono"
              >
                مقعد ضيف
              </a>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom hairline — Apple-style "more below" cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.lg, delay: 1.8, ease: EASE_OUT_EXPO }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3"
      >
        <span className="text-[9px] tracking-[0.5em] uppercase text-background/55 font-mono">
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
