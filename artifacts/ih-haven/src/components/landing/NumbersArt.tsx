import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";

const stats = [
  { value: 39, suffix: "", label: "مقعد عمل", note: "في الوقت الواحد" },
  { value: 80, suffix: "", label: "منتسب نشط", note: "أسبوعيّاً، على فترات" },
  { value: 100, suffix: "%", label: "مجانيّ", note: "بدعم من «من الناس إلى الناس»" },
];

const breakdown = [
  { value: 40, label: "Freelancers", ar: "مستقلّون" },
  { value: 40, label: "Graduates", ar: "خريجون" },
  { value: 20, label: "Students", ar: "طلبة" },
];

function CountUp({ to, duration = 1.6 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString("ar-EG"));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [inView, to, duration, mv]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function NumbersArt() {
  return (
    <section className="relative py-32 lg:py-44 bg-background overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px]">
        {/* Editorial header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
          className="mb-20 lg:mb-28 grid grid-cols-12 gap-6 lg:gap-12 items-end"
        >
          <div className="col-span-12 lg:col-span-7">
            <div className="text-[10px] tracking-[0.45em] uppercase text-primary font-mono mb-5">
              N°02 — بالأرقام
            </div>
            <h2
              className="font-bold text-foreground"
              style={{
                fontSize: "clamp(2.25rem, 6vw, 5.5rem)",
                lineHeight: 1.04,
                letterSpacing: "-0.015em",
              }}
            >
              مجتمعٌ يُقاس
              <br />
              <span className="text-foreground/40">بأثرٍ،</span>
              <span className="text-foreground"> ويُحكى </span>
              <span className="text-primary">بأرقام.</span>
            </h2>
          </div>
          <p className="col-span-12 lg:col-span-4 lg:col-start-9 text-base lg:text-lg text-foreground/70 font-light leading-relaxed">
            ليست مجرّد مقاعد، بل وعدٌ بمكانٍ لكلّ من يجدّ ويُتقن.
          </p>
        </motion.div>

        {/* Three massive count-ups */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-foreground/12 border-y border-foreground/12">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: DURATION.lg, delay: i * 0.1, ease: EASE_OUT_EXPO }}
              className="bg-background p-10 lg:p-14"
            >
              <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 font-mono mb-6">
                {String(i + 1).padStart(2, "0")} / {String(stats.length).padStart(2, "0")}
              </div>
              <div
                className="font-medium text-foreground tabular-nums leading-none mb-6 font-mono"
                style={{
                  fontSize: "clamp(5rem, 13vw, 11rem)",
                  letterSpacing: "-0.04em",
                }}
              >
                <CountUp to={s.value} />
                <span className="text-primary">{s.suffix}</span>
              </div>
              <div className="text-xl lg:text-2xl font-medium text-foreground mb-2">
                {s.label}
              </div>
              <p className="text-sm text-foreground/55 font-light leading-relaxed">
                {s.note}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Breakdown bar — donor-friendly composition view */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: DURATION.lg, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="mt-20 lg:mt-28"
        >
          <div className="flex items-baseline justify-between mb-6">
            <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 font-mono">
              Community composition · تركيبة المجتمع
            </div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 font-mono">
              N=80
            </div>
          </div>
          <div className="flex h-16 lg:h-20 w-full overflow-hidden border border-foreground/15">
            {breakdown.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ width: 0 }}
                whileInView={{ width: `${b.value}%` }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 1.4, delay: 0.4 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className={`relative flex items-center px-4 lg:px-6 ${
                  i === 0 ? "bg-foreground text-background" :
                  i === 1 ? "bg-primary text-background" :
                  "bg-foreground/10 text-foreground"
                }`}
              >
                <div className="text-xs lg:text-sm font-medium font-mono whitespace-nowrap">
                  {b.value}% · {b.ar}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
