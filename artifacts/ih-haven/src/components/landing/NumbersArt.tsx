import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";

const stats = [
  { value: 39, suffix: "", label: "مقعد عمل", note: "في الوقت الواحد" },
  { value: 80, suffix: "", label: "منتسب نشط", note: "أسبوعيّاً، على فترات" },
  { value: 100, suffix: "%", label: "مجّانيّ بالكامل", note: "بدعم من «من الناس إلى الناس»" },
];

const breakdown = [
  { value: 40, label: "Freelancers", ar: "مستقلّون" },
  { value: 40, label: "Graduates", ar: "خرّيجون" },
  { value: 20, label: "Students", ar: "طلبة" },
];

function CountUp({ to, duration = 1.6 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString("ar-EG"));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, to, duration, mv]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function NumbersArt() {
  return (
    <section className="relative bg-muted/40 py-24 lg:py-32 border-y border-border">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
          className="text-center max-w-3xl mx-auto mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            مجتمعنا بالأرقام
          </div>
          <h2
            className="font-bold text-foreground"
            style={{
              fontSize: "clamp(2.25rem, 5.2vw, 4.25rem)",
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
            }}
          >
            مجتمعٌ يُقاس بأثرٍ،
            <br />
            <span className="text-accent-gradient">ويُحكى بأرقام.</span>
          </h2>
          <p className="mt-6 text-base lg:text-lg text-foreground/65 font-normal leading-relaxed">
            ليست مجرّد مقاعد، بل وعدٌ بمكانٍ لكلّ من يجدّ ويُتقن.
          </p>
        </motion.div>

        {/* Three stat cards — clean, white, calm */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: DURATION.lg, delay: i * 0.08, ease: EASE_OUT_EXPO }}
              className="bg-white border border-border rounded-2xl p-8 lg:p-10 shadow-soft"
            >
              <div className="text-[11px] tracking-[0.1em] font-mono text-foreground/40 mb-6 tabular-nums">
                {String(i + 1).padStart(2, "0")} / {String(stats.length).padStart(2, "0")}
              </div>
              <div
                className="font-bold text-foreground tabular-nums leading-none mb-6"
                style={{
                  fontSize: "clamp(3.75rem, 7vw, 5.5rem)",
                  letterSpacing: "-0.04em",
                }}
              >
                <CountUp to={s.value} />
                <span className="text-primary">{s.suffix}</span>
              </div>
              <div className="text-lg lg:text-xl font-bold text-foreground mb-1.5">
                {s.label}
              </div>
              <p className="text-[14px] text-foreground/60 leading-relaxed">
                {s.note}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Composition bar — soft indigo segments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: DURATION.lg, delay: 0.15, ease: EASE_OUT_EXPO }}
          className="mt-14 lg:mt-20 bg-white border border-border rounded-2xl p-6 lg:p-8 shadow-soft"
        >
          <div className="flex items-baseline justify-between mb-5">
            <div className="text-[12px] text-foreground/65 font-medium">
              تركيبة المجتمع
            </div>
            <div className="text-[11px] tracking-[0.1em] font-mono text-foreground/45 tabular-nums">
              N=80
            </div>
          </div>
          <div className="flex h-14 lg:h-16 w-full overflow-hidden rounded-xl bg-muted">
            {breakdown.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ width: 0 }}
                whileInView={{ width: `${b.value}%` }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.2, delay: 0.3 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex items-center px-4 lg:px-6"
                style={{
                  background:
                    i === 0
                      ? "hsl(354 70% 52%)"
                      : i === 1
                      ? "hsl(354 70% 62%)"
                      : "hsl(354 70% 75%)",
                }}
              >
                <div className="text-xs lg:text-sm font-bold text-white whitespace-nowrap tabular-nums">
                  {b.value}٪ · {b.ar}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-foreground/60">
            {breakdown.map((b, i) => (
              <div key={b.label} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background:
                      i === 0
                        ? "hsl(354 70% 52%)"
                        : i === 1
                        ? "hsl(354 70% 62%)"
                        : "hsl(354 70% 75%)",
                  }}
                />
                {b.ar} · {b.label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
