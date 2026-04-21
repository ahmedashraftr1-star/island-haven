import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

function toArabicDigits(s: string) {
  const map: Record<string, string> = {
    "0": "٠", "1": "١", "2": "٢", "3": "٣", "4": "٤",
    "5": "٥", "6": "٦", "7": "٧", "8": "٨", "9": "٩",
  };
  return s.replace(/[0-9]/g, (d) => map[d] ?? d);
}

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      if (ref.current) {
        const n = Math.round(latest).toString();
        ref.current.textContent = toArabicDigits(n) + suffix;
      }
    });
  }, [spring, suffix]);

  return <span ref={ref}>{toArabicDigits("0") + suffix}</span>;
}

const items = [
  {
    value: 39,
    suffix: "",
    label: "مقعد عمل",
    sub: "في الوقت الواحد",
  },
  {
    value: 80,
    suffix: "+",
    label: "منتسب نشط",
    sub: "أسبوعياً عبر نظام الحضور الموزّع",
  },
  {
    value: 3,
    suffix: "",
    label: "فئات مهنيّة",
    sub: "مستقلّون · خريجون · طلبة",
  },
  {
    value: 100,
    suffix: "٪",
    label: "مجاني للمنتسبين",
    sub: "بدعم من فريق من الناس إلى الناس",
  },
];

export function Impact() {
  return (
    <section className="py-20 bg-foreground text-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage:
            "radial-gradient(circle at 25% 30%, white 1px, transparent 1px), radial-gradient(circle at 75% 70%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      <div className="container relative mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center lg:text-right"
            >
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-2 leading-none" style={{ fontFamily: "Cairo, sans-serif" }}>
                <Counter value={it.value} suffix={it.suffix} />
              </div>
              <div className="text-base md:text-lg font-semibold text-background/90 mb-1">
                {it.label}
              </div>
              <div className="text-xs md:text-sm text-background/60 font-light leading-relaxed">
                {it.sub}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
