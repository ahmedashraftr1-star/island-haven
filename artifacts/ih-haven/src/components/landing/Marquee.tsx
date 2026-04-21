import { motion } from "framer-motion";

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

function Strip({ reverse = false }: { reverse?: boolean }) {
  return (
    <motion.div
      className="flex gap-12 whitespace-nowrap shrink-0"
      animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
    >
      {[...Array(2)].map((_, copy) => (
        <div key={copy} className="flex gap-12 items-center shrink-0">
          {words.map((w, i) => (
            <div key={`${copy}-${i}`} className="flex items-center gap-12 shrink-0">
              <span
                className="text-5xl md:text-7xl font-black tracking-tight"
                style={{ fontFamily: "Cairo, sans-serif" }}
              >
                {w}
              </span>
              <span className="text-primary text-4xl md:text-6xl">✦</span>
            </div>
          ))}
        </div>
      ))}
    </motion.div>
  );
}

export function Marquee() {
  return (
    <section className="py-10 md:py-14 bg-background border-y border-foreground/10 overflow-hidden">
      <div className="overflow-hidden">
        <Strip />
      </div>
    </section>
  );
}
