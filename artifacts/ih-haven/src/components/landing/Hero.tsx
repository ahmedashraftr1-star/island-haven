import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useRef } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";

const slideUp = (delay: number) => ({
  initial: { y: "110%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: DURATION.lg, delay, ease: EASE_OUT_EXPO },
});

/**
 * 2026 Hero — Vercel / Arc.net energy.
 * Dark mesh-gradient backdrop, floating glass photo card, gradient headline,
 * neon-glow CTA. Photo parallax-scales gently on scroll.
 */
export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-12%"]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.06]);
  const headlineY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-30%"]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col overflow-hidden pt-28 lg:pt-36 pb-12"
    >
      {/* Top status pill */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.lg, delay: 0.2, ease: EASE_OUT_EXPO }}
        className="relative z-10 px-6 lg:px-12 mb-10 lg:mb-14"
      >
        <div className="max-w-[1500px] mx-auto flex justify-center">
          <div className="glass inline-flex items-center gap-3 h-9 pr-4 pl-2 rounded-full">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-[hsl(var(--violet))] via-[hsl(var(--magenta))] to-[hsl(var(--cyan))]">
              <Sparkles className="w-3 h-3 text-white" />
            </span>
            <span className="text-[11px] tracking-[0.2em] uppercase text-foreground/85 font-medium font-mono">
              مبادرة من الناس إلى الناس
            </span>
            <span className="text-[10px] text-foreground/45 font-mono">·</span>
            <span className="text-[11px] tracking-[0.18em] uppercase text-foreground/65 font-mono">
              Gaza · 2026
            </span>
          </div>
        </div>
      </motion.div>

      {/* Headline block */}
      <motion.div
        style={{ y: headlineY, opacity: headlineOpacity }}
        className="relative z-10 px-6 lg:px-12 text-center"
      >
        <div className="max-w-[1500px] mx-auto">
          <h1
            className="font-bold"
            style={{
              fontSize: "clamp(3.25rem, 11vw, 11rem)",
              lineHeight: 0.96,
              letterSpacing: "-0.025em",
            }}
          >
            <span className="block overflow-hidden">
              <motion.span className="block text-foreground" {...slideUp(0.4)}>
                مساحة تتّسع
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span className="block text-gradient-brand" {...slideUp(0.55)}>
                لأحلامك.
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.lg, delay: 0.9, ease: EASE_OUT_EXPO }}
            className="mt-8 lg:mt-10 mx-auto max-w-2xl text-base lg:text-xl text-foreground/70 font-light leading-relaxed"
          >
            مجتمعٌ مهنيّ في قلب غزّة يحتضن المستقلّين والخرّيجين وطلبة الجامعات.
            <span className="text-foreground"> ٣٩ مقعداً</span>،
            <span className="text-foreground"> ٨٠ منتسباً</span>،
            <span className="text-gradient-brand font-medium"> مجّاناً بالكامل</span>.
          </motion.p>

          {/* CTA cluster — neon glow primary, ghost secondary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.lg, delay: 1.05, ease: EASE_OUT_EXPO }}
            className="mt-12 flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <a
              href={`${import.meta.env.BASE_URL}apply`}
              data-testid="cta-apply"
              className="group relative inline-flex items-center justify-center h-13 px-8 rounded-full font-medium text-sm tracking-[0.15em] uppercase text-white overflow-hidden transition-all duration-500 hover:scale-[1.04] font-mono"
              style={{
                background:
                  "linear-gradient(100deg, hsl(var(--violet)) 0%, hsl(var(--magenta)) 50%, hsl(var(--cyan)) 100%)",
                boxShadow:
                  "0 0 40px -5px hsl(var(--violet) / 0.6), 0 0 80px -20px hsl(var(--magenta) / 0.5)",
              }}
            >
              <span className="relative z-10 flex items-center">
                سجّل للانتساب
                <ArrowLeft className="mr-3 h-4 w-4 rtl:rotate-180 transition-transform duration-500 group-hover:-translate-x-1" />
              </span>
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(100deg, hsl(var(--cyan)) 0%, hsl(var(--violet)) 50%, hsl(var(--magenta)) 100%)",
                }}
              />
            </a>
            <a
              href={`${import.meta.env.BASE_URL}apply?type=guest`}
              className="glass inline-flex items-center justify-center h-13 px-8 rounded-full font-medium text-sm tracking-[0.15em] uppercase text-foreground/90 hover:text-white hover:scale-[1.03] transition-all duration-500 font-mono"
            >
              مقعد ضيف
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating glass photo card with gradient hairline border */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 1.2, ease: EASE_OUT_EXPO }}
        style={{ y: photoY, scale: photoScale }}
        className="relative z-10 mt-16 lg:mt-24 px-6 lg:px-12 will-change-transform"
      >
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden glass-strong p-2 lg:p-3">
            {/* Gradient halo behind the photo */}
            <div
              aria-hidden
              className="absolute -inset-10 -z-10 opacity-60 blur-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 0%, hsl(var(--violet) / 0.6) 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, hsl(var(--cyan) / 0.5) 0%, transparent 50%)",
              }}
            />
            <img
              src="/photos/IMG_8357.jpg"
              alt="منتسبو آيلاند هيفن أثناء العمل في المساحة المشتركة"
              className="w-full aspect-[16/9] object-cover rounded-2xl"
            />
            {/* Floating metric chips on the photo */}
            <div className="absolute bottom-6 right-6 lg:bottom-8 lg:right-8 flex flex-col gap-2 items-end">
              <div className="glass-strong inline-flex items-baseline gap-2 px-4 py-2 rounded-full">
                <span className="text-base font-medium text-white tabular-nums font-mono">٣٩</span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-white/70 font-mono">مقعد · seats</span>
              </div>
              <div className="glass-strong inline-flex items-baseline gap-2 px-4 py-2 rounded-full">
                <span className="text-base font-medium text-white tabular-nums font-mono">٨٠</span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-white/70 font-mono">منتسب · members</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
