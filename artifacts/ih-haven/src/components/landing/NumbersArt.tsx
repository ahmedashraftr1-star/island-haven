import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { DURATION, EASE_OUT_EXPO } from "@/lib/motion";

const stats = [
  { value: 39, suffix: "", label: "مقعد عمل", note: "في الوقت الواحد" },
  { value: 80, suffix: "", label: "منتسب نشط", note: "أسبوعيّاً، على فترات" },
  { value: 100, suffix: "%", label: "مجانيّ بالكامل", note: "بدعم من «من الناس إلى الناس»" },
];

const breakdown = [
  { value: 40, label: "Freelancers", ar: "مستقلّون", color: "violet" },
  { value: 40, label: "Graduates", ar: "خرّيجون", color: "cyan" },
  { value: 20, label: "Students", ar: "طلبة", color: "magenta" },
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
    <section className="relative py-32 lg:py-44 overflow-hidden">
      {/* Local glow accents */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[60vh] opacity-30 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--violet) / 0.4) 0%, transparent 60%)",
        }}
      />

      <div className="relative container mx-auto px-6 lg:px-12 max-w-[1500px]">
        {/* Editorial header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: DURATION.lg, ease: EASE_OUT_EXPO }}
          className="mb-20 lg:mb-28 text-center"
        >
          <div className="text-[10px] tracking-[0.45em] uppercase text-foreground/45 font-mono mb-6">
            N°02 — بالأرقام
          </div>
          <h2
            className="font-bold"
            style={{
              fontSize: "clamp(2.5rem, 6.5vw, 6rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            <span className="text-foreground">مجتمعٌ يُقاس </span>
            <span className="text-gradient-brand">بأثرٍ</span>
            <span className="text-foreground">،</span>
            <br />
            <span className="text-foreground/70">ويُحكى </span>
            <span className="text-gradient-cool">بأرقام.</span>
          </h2>
          <p className="mt-8 max-w-xl mx-auto text-base lg:text-lg text-foreground/65 font-light">
            ليست مجرّد مقاعد، بل وعدٌ بمكانٍ لكلّ من يجدّ ويُتقن.
          </p>
        </motion.div>

        {/* Three glass count-up cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: DURATION.lg, delay: i * 0.12, ease: EASE_OUT_EXPO }}
              className="glass-strong relative rounded-3xl p-10 lg:p-12 group overflow-hidden"
            >
              {/* Ambient gradient glow inside the card on hover */}
              <div
                aria-hidden
                className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                  background:
                    i === 0
                      ? "radial-gradient(circle at 0% 0%, hsl(var(--violet) / 0.18) 0%, transparent 60%)"
                      : i === 1
                      ? "radial-gradient(circle at 100% 0%, hsl(var(--cyan) / 0.18) 0%, transparent 60%)"
                      : "radial-gradient(circle at 50% 100%, hsl(var(--magenta) / 0.22) 0%, transparent 60%)",
                }}
              />

              <div className="relative">
                <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 font-mono mb-8">
                  {String(i + 1).padStart(2, "0")} / {String(stats.length).padStart(2, "0")}
                </div>
                <div
                  className={`font-medium tabular-nums leading-none mb-8 font-mono ${
                    i === 0 ? "text-gradient-brand" :
                    i === 1 ? "text-gradient-cool" :
                    "text-gradient-brand"
                  }`}
                  style={{
                    fontSize: "clamp(5rem, 13vw, 11rem)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  <CountUp to={s.value} />
                  <span>{s.suffix}</span>
                </div>
                <div className="text-xl lg:text-2xl font-medium text-foreground mb-2">
                  {s.label}
                </div>
                <p className="text-sm text-foreground/55 font-light leading-relaxed">
                  {s.note}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Composition bar — gradient segments */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: DURATION.lg, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="mt-16 lg:mt-24"
        >
          <div className="flex items-baseline justify-between mb-5">
            <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-mono">
              تركيبة المجتمع · Community composition
            </div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-mono tabular-nums">
              N=80
            </div>
          </div>
          <div className="flex h-20 lg:h-24 w-full overflow-hidden rounded-2xl glass">
            {breakdown.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ width: 0 }}
                whileInView={{ width: `${b.value}%` }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.4, delay: 0.4 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex items-center px-5 lg:px-7"
                style={{
                  background:
                    b.color === "violet"
                      ? "linear-gradient(135deg, hsl(var(--violet) / 0.85) 0%, hsl(var(--violet) / 0.55) 100%)"
                      : b.color === "cyan"
                      ? "linear-gradient(135deg, hsl(var(--cyan) / 0.85) 0%, hsl(var(--cyan) / 0.55) 100%)"
                      : "linear-gradient(135deg, hsl(var(--magenta) / 0.85) 0%, hsl(var(--magenta) / 0.55) 100%)",
                }}
              >
                <div className="text-xs lg:text-sm font-medium font-mono text-white whitespace-nowrap">
                  {b.value}% · {b.ar}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px] tracking-[0.2em] uppercase font-mono text-foreground/55">
            {breakdown.map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background:
                      b.color === "violet" ? "hsl(var(--violet))" :
                      b.color === "cyan" ? "hsl(var(--cyan))" :
                      "hsl(var(--magenta))",
                    boxShadow:
                      b.color === "violet" ? "0 0 8px hsl(var(--violet))" :
                      b.color === "cyan" ? "0 0 8px hsl(var(--cyan))" :
                      "0 0 8px hsl(var(--magenta))",
                  }}
                />
                {b.label} — {b.ar}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
