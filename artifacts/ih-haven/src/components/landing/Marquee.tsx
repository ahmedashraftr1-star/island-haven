import { motion, useReducedMotion } from "framer-motion";

const words = [
  "مساحة تتّسع لأحلامك",
  "Island Haven",
  "مجتمع مهنيّ",
  "غزّة · فلسطين",
  "من الناس إلى الناس",
  "بيئة آمنة للعمل",
  "تشبيك حقيقيّ",
  "تدريب تطبيقيّ",
];

function Strip({ reverse = false, outline = false }: { reverse?: boolean; outline?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="flex gap-12 whitespace-nowrap shrink-0 will-change-transform"
      animate={reduce ? undefined : { x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
    >
      {[...Array(2)].map((_, copy) => (
        <div key={copy} className="flex gap-12 items-center shrink-0" aria-hidden={copy > 0 ? "true" : undefined}>
          {words.map((w, i) => (
            <div key={`${copy}-${i}`} className="flex items-center gap-12 shrink-0">
              <span
                className={`font-display text-5xl md:text-7xl font-extrabold tracking-tight ${
                  outline
                    ? "text-transparent [-webkit-text-stroke:1px_hsl(210_20%_97%_/_0.28)]"
                    : "text-foreground/90"
                }`}
              >
                {w}
              </span>
              <span className="text-primary text-4xl md:text-6xl" aria-hidden>
                ✦
              </span>
            </div>
          ))}
        </div>
      ))}
    </motion.div>
  );
}

export function Marquee() {
  return (
    <section
      className="relative py-10 md:py-16 bg-background border-y border-border overflow-hidden"
      aria-label="Island Haven"
    >
      {/* edge fade masks — let the strips dissolve into the canvas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-40 z-10 bg-gradient-to-r from-background to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-40 z-10 bg-gradient-to-l from-background to-transparent"
      />

      <div className="overflow-hidden">
        <Strip />
      </div>
      <div className="overflow-hidden mt-3 md:mt-5 opacity-90">
        <Strip reverse outline />
      </div>
    </section>
  );
}
