import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

const lines = [
  "نُؤمن أنّ المعرفة لا تنتظر استقراراً.",
  "نُؤمن أنّ الفرصة لا تُمنح، بل تُصنع.",
  "نُؤمن أنّ مكاناً واحداً يكفي لأن يفتح ألف نافذة.",
  "نُؤمن أنّ غزّة تستحقّ أن تعمل، تتعلّم، وتحلم.",
];

export function SpotlightReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [active, setActive] = useState(false);
  const [size, setSize] = useState(280);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      setPos({ x, y });
      setActive(true);
    };
    const onLeave = () => setActive(false);
    const onResize = () => setSize(window.innerWidth < 768 ? 180 : 320);
    onResize();
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const mask = `radial-gradient(circle ${size}px at ${pos.x}% ${pos.y}%, black 0%, black 35%, transparent 75%)`;

  return (
    <section
      ref={ref}
      className="relative bg-foreground text-background overflow-hidden py-32 lg:py-40"
    >
      {/* meta */}
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl mb-16 lg:mb-24 flex items-end justify-between gap-6 flex-wrap relative z-10">
        <div>
          <div className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold mb-3">
            [ N°06 — البيان ]
          </div>
          <div
            className="font-bold text-background/85 leading-tight"
            style={{
              fontFamily: "Reem Kufi, sans-serif",
              fontSize: "clamp(1.25rem, 2.4vw, 2rem)",
            }}
          >
            مرّر مؤشّرك على النصّ — ليُضاء.
          </div>
        </div>
        <div className="text-[10px] tracking-[0.4em] uppercase text-background/40 font-bold">
          Spotlight · Move your cursor
        </div>
      </div>

      {/* the manifesto, dim base + bright revealed */}
      <div className="container mx-auto px-6 lg:px-10 max-w-6xl relative">
        {/* dim base */}
        <div
          aria-hidden
          className="select-none"
          style={{
            fontFamily: "Cairo, sans-serif",
            fontWeight: 900,
            lineHeight: 1.05,
            fontSize: "clamp(2rem, 6vw, 5.5rem)",
            color: "rgba(255,255,255,0.10)",
          }}
        >
          {lines.map((l, i) => (
            <div key={i} className="mb-3">
              {l}
            </div>
          ))}
        </div>

        {/* bright spotlight reveal */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none px-6 lg:px-10"
          style={{
            WebkitMaskImage: active ? mask : "radial-gradient(circle 0px at 50% 50%, black, transparent)",
            maskImage: active ? mask : "radial-gradient(circle 0px at 50% 50%, black, transparent)",
            transition: "all 0.15s ease",
          }}
        >
          <div
            className="select-none"
            style={{
              fontFamily: "Cairo, sans-serif",
              fontWeight: 900,
              lineHeight: 1.05,
              fontSize: "clamp(2rem, 6vw, 5.5rem)",
              color: "rgb(255,255,255)",
            }}
          >
            {lines.map((l, i) => (
              <div key={i} className="mb-3">
                {l.split("لا تنتظر").length > 1 ||
                l.split("لا تُمنح").length > 1 ||
                l.split("ألف نافذة").length > 1 ||
                l.split("غزّة").length > 1
                  ? renderHighlighted(l)
                  : l}
              </div>
            ))}
          </div>
        </div>

        {/* cursor inner glow */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          animate={{
            opacity: active ? 1 : 0,
          }}
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            translateX: "-50%",
            translateY: "-50%",
            width: size * 0.12,
            height: size * 0.12,
            background:
              "radial-gradient(circle, rgba(199,87,67,0.6) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* signature */}
      <div className="container mx-auto px-6 lg:px-10 max-w-6xl mt-20 lg:mt-32 flex items-center justify-between text-[11px] tracking-[0.3em] uppercase font-bold text-background/60 relative z-10">
        <span>— Island Haven Manifesto · 2024</span>
        <span className="hidden md:inline">N°06 · 04 statements</span>
      </div>
    </section>
  );
}

function renderHighlighted(line: string) {
  const tokens = ["لا تنتظر", "لا تُمنح", "ألف نافذة", "غزّة"];
  let result: (string | React.ReactNode)[] = [line];
  tokens.forEach((tok) => {
    result = result.flatMap((seg, i) => {
      if (typeof seg !== "string") return seg;
      const parts = seg.split(tok);
      if (parts.length === 1) return seg;
      const out: (string | React.ReactNode)[] = [];
      parts.forEach((p, idx) => {
        out.push(p);
        if (idx < parts.length - 1) {
          out.push(
            <span key={`${tok}-${i}-${idx}`} className="text-primary italic">
              {tok}
            </span>
          );
        }
      });
      return out;
    });
  });
  return <>{result}</>;
}
