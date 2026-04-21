import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";
import { useEffect } from "react";
import { MagneticButton } from "./MagneticButton";

const EASE = [0.65, 0, 0.35, 1] as const;
const wordIn = (delay: number) => ({
  initial: { y: "110%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.7, delay, ease: EASE },
});

export function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { damping: 30, stiffness: 80, mass: 0.6 });
  const smy = useSpring(my, { damping: 30, stiffness: 80, mass: 0.6 });

  // Photo gets stronger parallax
  const px = useTransform(smx, (v) => v * 30);
  const py = useTransform(smy, (v) => v * 30);
  // Decorative asterisks gentler
  const dx = useTransform(smx, (v) => v * 12);
  const dy = useTransform(smy, (v) => v * 12);
  // Type slight float
  const tx = useTransform(smx, (v) => v * -8);
  const ty = useTransform(smy, (v) => v * -6);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      mx.set((e.clientX / w) * 2 - 1);
      my.set((e.clientY / h) * 2 - 1);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <section className="relative min-h-screen flex flex-col pt-24 overflow-hidden bg-background">
      {/* Editorial photo panel with parallax */}
      <motion.div
        className="absolute top-0 left-0 w-[44%] h-full z-0 hidden lg:block overflow-hidden"
        style={{ x: px, y: py }}
      >
        <img
          src="/photos/IMG_8357.jpg"
          alt=""
          className="w-[110%] h-[110%] -translate-x-[5%] -translate-y-[5%] object-cover grayscale-[15%] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-foreground/35 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-l from-background via-background/0 to-transparent" />
      </motion.div>

      {/* Mobile bg */}
      <div className="absolute inset-0 z-0 lg:hidden">
        <img
          src="/photos/IMG_8357.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/85" />
      </div>

      {/* Vertical hairline */}
      <div className="absolute top-0 left-[44%] w-px h-full z-0 bg-foreground/10 hidden lg:block" />

      {/* Decorative floating mark */}
      <motion.div
        aria-hidden
        className="absolute top-[18%] right-[6%] z-[1] hidden lg:block text-primary/80"
        style={{ x: dx, y: dy }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
          className="text-[120px] leading-none font-black"
        >
          ✦
        </motion.div>
      </motion.div>

      {/* Side label running vertically */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[5] hidden xl:flex flex-col items-center gap-4 text-[10px] tracking-[0.4em] uppercase text-foreground/50 font-bold">
        <div className="h-16 w-px bg-foreground/20" />
        <span style={{ writingMode: "vertical-rl" }}>EST. 2024 · GAZA</span>
        <div className="h-16 w-px bg-foreground/20" />
      </div>

      <div className="container relative z-10 mx-auto px-6 lg:px-10 max-w-7xl flex-1 flex flex-col justify-center py-12">
        {/* Top meta bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="flex items-center justify-between text-[10px] font-bold tracking-[0.4em] uppercase text-foreground/70 mb-12 lg:mb-16"
        >
          <span className="flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Gaza · Palestine
          </span>
          <span className="hidden md:inline">[ N°01 — Volume One ]</span>
          <span className="text-primary">A Nas to Nas Initiative</span>
        </motion.div>

        {/* Massive Arabic statement, kinetic */}
        <motion.div
          style={{ x: tx, y: ty }}
          className="grid grid-cols-12 gap-4 lg:gap-8 items-end"
        >
          <div className="col-span-12 lg:col-span-9 lg:col-start-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold mb-5"
            >
              — مساحة · مجتمع · مستقبل
            </motion.div>

            <h1
              className="font-black text-foreground leading-[0.86] tracking-tight"
              style={{
                fontFamily: "Cairo, sans-serif",
                fontSize: "clamp(3.5rem, 12vw, 12rem)",
              }}
            >
              <div className="overflow-hidden">
                <motion.div {...wordIn(0.2)}>مساحة</motion.div>
              </div>
              <div className="overflow-hidden">
                <motion.div
                  {...wordIn(0.35)}
                  className="text-primary italic relative inline-block"
                >
                  <motion.span
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{
                      duration: 4.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="inline-block"
                  >
                    تتّسع
                  </motion.span>
                  <motion.span
                    aria-hidden
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.0, duration: 0.7, ease: "easeInOut" }}
                    className="absolute right-0 left-0 -bottom-2 h-[6px] bg-primary origin-right"
                  />
                </motion.div>{" "}
                <motion.span
                  {...wordIn(0.5)}
                  className="inline-block text-foreground/95"
                >
                  لأحلامك.
                </motion.span>
              </div>
            </h1>

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.9, duration: 0.7 }}
              className="mt-8 flex items-center gap-5 origin-right"
            >
              <div className="h-px flex-1 bg-foreground/25 max-w-[80px]" />
              <span
                className="text-xl md:text-2xl font-bold text-foreground tracking-tight"
                style={{ fontFamily: "Cairo, sans-serif" }}
              >
                Island Haven
              </span>
              <div className="h-px flex-1 bg-foreground/25 max-w-[80px]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom row: description + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.0 }}
          className="grid grid-cols-12 gap-6 lg:gap-10 mt-10 lg:mt-16"
        >
          <div className="col-span-12 lg:col-span-5">
            <p className="text-base md:text-lg text-foreground/85 leading-relaxed font-light max-w-md">
              مجتمع مهنيّ في قلب غزّة يحتضن المستقلّين والخريجين وطلبة الجامعات.
              <span className="font-bold text-foreground"> ٣٩ مقعداً</span>،
              <span className="font-bold text-foreground"> ٨٠ منتسباً</span>،
              <span className="font-bold text-foreground"> ١٠٠٪ مجاناً</span>.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-7 flex flex-wrap gap-3 lg:justify-end items-center">
            <MagneticButton
              href="https://forms.gle/5r7dEeidxjg46m399"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <span className="inline-flex items-center justify-center h-14 px-8 bg-foreground text-background font-bold text-sm tracking-[0.2em] uppercase hover:bg-primary transition-colors">
                سجّل للانتساب
                <ArrowLeft className="mr-3 h-4 w-4 rtl:rotate-180" />
              </span>
            </MagneticButton>
            <MagneticButton
              href="https://docs.google.com/forms/d/e/1FAIpQLSfniqnKG8t7m4fmXtPum8RZpXDYIDDj5AvfAoSA4JvKKbh5kg/viewform"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="inline-flex items-center justify-center h-14 px-8 border border-foreground text-foreground font-bold text-sm tracking-[0.2em] uppercase hover:bg-foreground hover:text-background transition-colors">
                مقعد ضيف
              </span>
            </MagneticButton>
            <a
              href="#story"
              className="inline-flex items-center justify-center h-14 px-2 text-foreground font-medium text-sm tracking-[0.15em] uppercase underline-offset-8 hover:underline"
            >
              اقرأ قصّتنا ←
            </a>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3"
      >
        <span className="text-[9px] tracking-[0.5em] uppercase text-foreground/60 font-bold">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-10 bg-gradient-to-b from-foreground/60 to-transparent"
        />
      </motion.div>
    </section>
  );
}
