import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Phone, Sparkles } from "lucide-react";
import { useRef } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";
import { HavenMark } from "./HavenMark";

const slideUp = (delay: number) => ({
  initial: { y: "115%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: DURATION.lg, delay, ease: EASE_OUT_EXPO },
});

/**
 * Hero — Galata × Apple × human warmth.
 * Bright white background, real workspace photo fading from top, top
 * notice pill, massive confident headline with one accent-gradient word,
 * generous breathing room, single primary CTA + ghost secondary.
 */
export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-8%"]);
  const photoOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0.4]);

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* Real photo as soft backdrop, fades into white */}
      <motion.div
        style={{ y: photoY, opacity: photoOpacity }}
        className="absolute inset-x-0 top-0 h-[100vh] z-0 will-change-transform"
        aria-hidden
      >
        <img
          src="/photos/IMG_8357.jpg"
          alt=""
          className="w-full h-full object-cover object-center"
        />
        {/* Strong top-to-bottom white fade — Galata's signature move */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, hsl(0 0% 100% / 0.92) 0%, hsl(0 0% 100% / 0.82) 25%, hsl(0 0% 100% / 0.88) 60%, hsl(0 0% 100%) 92%)",
          }}
        />
      </motion.div>

      {/* Subtle indigo glow halo behind headline */}
      <div
        aria-hidden
        className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[80vw] h-[40vh] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(232 100% 70% / 0.08) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      {/* Self-drawing HavenMark monogram — the brand's signature gesture.
          Sits in the bottom-left negative space, drawing itself once the
          headline lands. Subtle, confident, never seen on a Gaza site. */}
      <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-12 z-10 pointer-events-none hidden md:flex items-end gap-3">
        <HavenMark size={72} className="text-primary" delay={1.1} />
        <div className="pb-2 leading-tight">
          <div className="text-[10px] tracking-[0.18em] uppercase text-foreground/45 font-semibold">
            Est · 2024
          </div>
          <div className="text-[12px] text-foreground/60 font-medium">
            Gaza · فلسطين
          </div>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 px-6 lg:px-12 pt-24 lg:pt-28 pb-16 lg:pb-20">
        <div className="max-w-[1500px] mx-auto w-full">
          {/* Top notice — Galata pattern */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.lg, delay: 0.15, ease: EASE_OUT_EXPO }}
            className="mb-7 lg:mb-9"
          >
            <div className="inline-flex items-center gap-2.5 h-9 px-4 rounded-full bg-primary/8 border border-primary/15">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[12px] text-foreground font-medium">
                باب التسجيل مفتوح للموسم الجديد ٢٠٢٦
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <h1
            className="font-bold text-foreground"
            style={{
              fontSize: "clamp(2.25rem, 5.2vw, 4.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
            }}
          >
            <span className="block overflow-hidden pb-2">
              <motion.span className="block" {...slideUp(0.3)}>
                مساحة عمل مجّانيّة،
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-2">
              <motion.span className="block text-accent-gradient" {...slideUp(0.45)}>
                في قلب غزّة.
              </motion.span>
            </span>
          </h1>

          {/* Sub */}
          <p className="mt-7 lg:mt-8 max-w-2xl text-base lg:text-lg text-foreground/65 font-normal leading-relaxed">
            مجتمعٌ مهنيّ يحتضن المستقلّين والخرّيجين وطلبة الجامعات.
            اعمل بجانب من يلهمك، وابنِ شبكتك المهنيّة في بيئةٍ صُمّمت للتركيز.
          </p>

          {/* CTA cluster */}
          <div className="mt-8 lg:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href={`${import.meta.env.BASE_URL}apply`}
              data-testid="cta-apply"
              className="group inline-flex items-center justify-center gap-3 h-13 lg:h-14 px-7 rounded-full bg-primary text-primary-foreground font-semibold text-[14px] tracking-[-0.005em] hover:bg-primary/90 transition-all duration-300 shadow-soft hover:shadow-soft-hover hover:scale-[1.02]"
            >
              سجّل للانتساب — مجّاناً
              <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
            </a>
            <a
              href="https://wa.me/970599000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 h-13 lg:h-14 px-7 rounded-full bg-white border border-foreground/15 text-foreground font-semibold text-[14px] hover:border-foreground/30 hover:bg-foreground/[0.02] transition-all duration-300 shadow-soft"
            >
              <Phone className="h-4 w-4" />
              تحدّث معنا
            </a>
          </div>

          {/* Trust strip — three quick proof points, like Galata's feature row */}
          <div className="mt-10 lg:mt-14 grid grid-cols-4 gap-x-6 lg:gap-x-10 max-w-3xl">
            {[
              { v: "٣٩", l: "مقعد عمل" },
              { v: "٨٠+", l: "منتسب نشط" },
              { v: "١٠٠٪", l: "مجّانيّ" },
              { v: "٢٠٢٤", l: "تأسّس" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl lg:text-3xl font-bold text-foreground tabular-nums">
                  {s.v}
                </div>
                <div className="text-[13px] text-foreground/55 mt-1 font-medium">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
