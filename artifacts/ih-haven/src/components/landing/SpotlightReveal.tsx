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
      className="relative bg-[#06080F] text-white overflow-hidden py-32 lg:py-40"
    >
      {/* Ambient depth — faint brand nebula so the ink panel breathes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 40%, hsl(354 78% 56% / 0.07) 0%, transparent 70%)",
        }}
      />

      {/* meta */}
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl mb-16 lg:mb-24 flex items-end justify-between gap-6 flex-wrap relative z-10">
        <div>
          <div className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold mb-3">
            [ N°11 — البيان ]
          </div>
          <div
            className="font-bold text-white/90 leading-tight"
            style={{
              fontSize: "clamp(1.25rem, 2.4vw, 2rem)",
            }}
          >
            أربعة بياناتٍ نقف خلفها.
            <span className="hidden md:inline text-white/55 font-light"> — مرّر مؤشّرك ليُضاء أحدها.</span>
          </div>
        </div>
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 font-bold">
          Spotlight · Move your cursor
        </div>
      </div>

      {/* the manifesto — readable at rest, intensified on cursor */}
      <div className="container mx-auto px-6 lg:px-10 max-w-6xl relative">
        {/* base layer: numbered statements always visible at calm 55% opacity */}
        <div
          className="select-none relative z-[1]"
          style={{
            fontWeight: 800,
            lineHeight: 1.15,
            fontSize: "clamp(1.5rem, 4.2vw, 3.75rem)",
            color: "rgba(255,255,255,0.55)",
          }}
        >
          {lines.map((l, i) => (
            <div
              key={i}
              className="grid grid-cols-[auto_1fr] gap-x-6 lg:gap-x-10 items-baseline mb-6 lg:mb-8 border-t border-white/10 pt-5 lg:pt-7"
            >
              <span
                className="text-[10px] tracking-[0.4em] font-bold text-primary/80 pt-3"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>{renderHighlighted(l)}</div>
            </div>
          ))}
        </div>

        {/* spotlight overlay — intensifies the same text under cursor (desktop only) */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none hidden md:block"
          style={{
            WebkitMaskImage: active
              ? mask
              : "radial-gradient(circle 0px at 50% 50%, black, transparent)",
            maskImage: active
              ? mask
              : "radial-gradient(circle 0px at 50% 50%, black, transparent)",
            transition: "all 0.18s ease",
          }}
        >
          <div
            className="select-none"
            style={{
              fontWeight: 800,
              lineHeight: 1.15,
              fontSize: "clamp(1.5rem, 4.2vw, 3.75rem)",
              color: "rgb(255,255,255)",
            }}
          >
            {lines.map((l, i) => (
              <div
                key={i}
                className="grid grid-cols-[auto_1fr] gap-x-6 lg:gap-x-10 items-baseline mb-6 lg:mb-8 border-t border-transparent pt-5 lg:pt-7"
              >
                <span
                  className="text-[10px] tracking-[0.4em] font-bold text-primary pt-3"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>{renderHighlighted(l)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* cursor focus glow */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute rounded-full hidden md:block"
          animate={{ opacity: active ? 1 : 0 }}
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            translateX: "-50%",
            translateY: "-50%",
            width: size * 0.14,
            height: size * 0.14,
            background:
              "radial-gradient(circle, hsl(354 78% 56% / 0.55) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* signature */}
      <div className="container mx-auto px-6 lg:px-10 max-w-6xl mt-20 lg:mt-32 flex items-center justify-between text-[11px] tracking-[0.3em] uppercase font-bold text-white/55 relative z-10">
        <span>— Island Haven Manifesto · 2024</span>
        <span className="hidden md:inline">N°11 · 04 statements</span>
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
