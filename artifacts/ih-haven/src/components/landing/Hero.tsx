import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";
import { useRef } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";
// Apple-style hero: silent text, scroll-driven image only. No mouse jitter,
// no infinite spins, no pulsing words.

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
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "10%"]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.05]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col pt-24 overflow-hidden bg-background"
    >
      {/* Editorial photo panel — slow scroll-driven parallax only (no mouse jitter) */}
      <motion.div
        className="absolute top-0 left-0 w-[44%] h-full z-0 hidden lg:block overflow-hidden"
        style={{ y: photoY, scale: photoScale }}
      >
        <img
          src="/photos/IMG_8357.jpg"
          alt="منتسبو آيلاند هيفن أثناء العمل في المساحة المشتركة في غزّة"
          className="w-full h-full object-cover grayscale-[10%] contrast-[1.03]"
        />
        <div className="absolute inset-0 bg-foreground/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-l from-background via-background/0 to-transparent" />
      </motion.div>

      {/* Mobile bg */}
      <div className="absolute inset-0 z-0 lg:hidden">
        <div className="absolute top-0 inset-x-0 h-[45%]">
          <img
            src="/photos/IMG_8357.jpg"
            alt="منتسبو آيلاند هيفن أثناء العمل في المساحة المشتركة في غزّة"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/40 mix-blend-multiply" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-background" />
        </div>
        <div className="absolute bottom-0 inset-x-0 h-[55%] bg-background" />
      </div>

      {/* Vertical hairline */}
      <div className="absolute top-0 left-[44%] w-px h-full z-0 bg-foreground/10 hidden lg:block" />

      <div className="container relative z-10 mx-auto px-6 lg:px-10 max-w-7xl flex-1 flex flex-col justify-end lg:justify-center pb-6 pt-24 lg:py-12">
        {/* Top meta bar — quiet entry */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION.lg, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="hidden lg:flex items-center justify-between text-[10px] font-medium tracking-[0.4em] uppercase text-foreground/60 mb-12 lg:mb-16 font-mono"
        >
          <span className="flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Gaza · Palestine
          </span>
          <span className="hidden md:inline">[ N°01 — Volume One ]</span>
          <span className="text-primary">A Nas to Nas Initiative</span>
        </motion.div>

        {/* Quiet, confident headline — single curve, no pulse, no spin */}
        <div className="grid grid-cols-12 gap-4 lg:gap-8 items-end">
          <div className="col-span-12 lg:col-span-9 lg:col-start-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: DURATION.md, delay: 0.2, ease: EASE_OUT_EXPO }}
              className="text-[9px] lg:text-[10px] tracking-[0.4em] uppercase text-primary font-medium mb-4 lg:mb-6 font-mono"
            >
              مساحة · مجتمع · مستقبل
            </motion.div>

            <h1
              className="font-bold text-foreground"
              style={{
                fontSize: "clamp(2.75rem, 9.5vw, 9rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
              }}
            >
              <span className="block overflow-hidden">
                <motion.span className="block" {...slideUp(0.35)}>
                  مساحة
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span className="block" {...slideUp(0.5)}>
                  <span className="text-primary">تتّسع</span>{" "}
                  <span className="text-foreground/95">لأحلامك.</span>
                </motion.span>
              </span>
            </h1>

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: DURATION.lg, delay: 1.0, ease: EASE_OUT_EXPO }}
              className="mt-7 lg:mt-9 flex items-center gap-4 lg:gap-5 origin-right"
            >
              <div className="h-px flex-1 bg-foreground/25 max-w-[60px] lg:max-w-[80px]" />
              <span className="text-base md:text-xl font-medium text-foreground tracking-tight">
                Island Haven
              </span>
              <div className="h-px flex-1 bg-foreground/25 max-w-[60px] lg:max-w-[80px]" />
            </motion.div>
          </div>
        </div>

        {/* Bottom row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.lg, delay: 1.1, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-12 gap-4 lg:gap-10 mt-10 lg:mt-16"
        >
          <div className="col-span-12 lg:col-span-5 order-2 lg:order-1">
            <p className="text-sm md:text-base lg:text-lg text-foreground/80 leading-relaxed font-light max-w-md">
              مجتمع مهنيّ في قلب غزّة يحتضن المستقلّين والخريجين وطلبة الجامعات.
              <span className="font-medium text-foreground"> ٣٩ مقعداً</span>،
              <span className="font-medium text-foreground"> ٨٠ منتسباً</span>،
              <span className="font-medium text-foreground"> ١٠٠٪ مجاناً</span>.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-7 order-1 lg:order-2 flex flex-col sm:flex-row flex-wrap gap-3 lg:justify-end items-stretch sm:items-center">
            <a
              href={`${import.meta.env.BASE_URL}apply`}
              data-testid="cta-apply"
              className="group inline-flex w-full sm:w-auto items-center justify-center h-12 lg:h-14 px-6 lg:px-8 bg-foreground text-background font-medium text-xs lg:text-sm tracking-[0.18em] uppercase transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-primary hover:scale-[1.02] font-mono"
            >
              سجّل للانتساب
              <ArrowLeft className="mr-3 h-4 w-4 rtl:rotate-180 transition-transform duration-500 group-hover:-translate-x-1" />
            </a>
            <a
              href={`${import.meta.env.BASE_URL}apply?type=guest`}
              className="inline-flex w-full sm:w-auto items-center justify-center h-12 lg:h-14 px-6 lg:px-8 border border-foreground text-foreground font-medium text-xs lg:text-sm tracking-[0.18em] uppercase transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-foreground hover:text-background font-mono"
            >
              مقعد ضيف
            </a>
            <a
              href="#story"
              className="hidden sm:inline-flex items-center justify-center h-12 lg:h-14 px-2 text-foreground/70 font-light text-xs lg:text-sm tracking-[0.15em] uppercase underline-offset-8 hover:text-foreground hover:underline transition-colors duration-300 font-mono"
            >
              اقرأ قصّتنا ←
            </a>
          </div>
        </motion.div>
      </div>

      {/* Calm scroll indicator — fade in only, no bounce */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.lg, delay: 1.6, ease: EASE_OUT_EXPO }}
        className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex-col items-center gap-3"
      >
        <span className="text-[9px] tracking-[0.5em] uppercase text-foreground/50 font-medium font-mono">
          Scroll
        </span>
        <span className="block w-px h-10 bg-gradient-to-b from-foreground/50 to-transparent" />
      </motion.div>
    </section>
  );
}
