import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const BASE = import.meta.env.BASE_URL;

/**
 * Cinematic scrollytelling — a day at Island Haven.
 * Image stage is pinned on one side; text scenes scroll on the other.
 * As each scene crosses the centre, the corresponding photo crossfades in.
 */
type Scene = {
  hour: string;
  kicker: string;
  title: string;
  body: string;
  img: string;
};

const SCENES: Scene[] = [
  {
    hour: "٠٧:٤٥",
    kicker: "Opening",
    title: "البابُ يُفتح،\nوأوّل ضوءٍ يدخل.",
    body: "صباحٌ غزّيٌّ يبدأ بصوت المفتاح، ورائحة قهوة تُحضَّر لمن سيأتي. كرسيّك بانتظارك، والإنترنت لا ينقطع.",
    img: `${BASE}photos/IMG_8357.jpg`,
  },
  {
    hour: "٠٩:٢٠",
    kicker: "Deep Work",
    title: "تركيزٌ بلا\nمقاطعات.",
    body: "سمّاعات، شاشة، وإضاءة طبيعيّة. هنا لا يطرق أحدٌ بابك، ولا يقطع الكهرباء عملك. الوقت لك، استثمره كاملاً.",
    img: `${BASE}photos/IMG_8347.jpg`,
  },
  {
    hour: "١١:٠٠",
    kicker: "Collide",
    title: "ثلاثُ أفكار،\nطاولةٌ واحدة.",
    body: "تجلس بجانب مستقلٍّ يعمل لشركةٍ في برلين، وخرّيجة بدأت أوّل عقد، وطالبٍ يُتقن التصميم. شبكتُك تبدأ من فنجان قهوة.",
    img: `${BASE}photos/IMG_8341.jpg`,
  },
  {
    hour: "١٣:٣٠",
    kicker: "Pause",
    title: "القهوة على حسابنا،\nوالحديثُ على حساب الجميع.",
    body: "استراحةٌ تتحوّل لورشة عصفٍ ذهنيّ، أو حوارٍ هادئ، أو ضحكةٍ تُذهب تعب الصباح. لا أحد يأكل وحده هنا.",
    img: `${BASE}photos/IMG_8358.jpg`,
  },
  {
    hour: "١٦:١٠",
    kicker: "Workshop",
    title: "عشرون مقعداً،\nسؤالٌ يُغيّر مساراً.",
    body: "ورشة تدريبيّة جديدة في الأسبوع. ضيفٌ من السوق، وقصّةٌ من قلب التجربة. تخرج وفي يدك مهارة، وفي رأسك قرار.",
    img: `${BASE}photos/IMG_8352.jpg`,
  },
  {
    hour: "١٩:٠٠",
    kicker: "Closing",
    title: "البابُ يُغلق،\nوالرّوابطُ تبقى.",
    body: "تخرج وفي جيبك بطاقةُ تعارفٍ جديدة، وفرصةٌ كانت بالأمس بعيدة. آيلاند هيفن لا ينتهي عند الباب — يبدأ منه.",
    img: `${BASE}photos/IMG_8300.jpg`,
  },
];

export function Scrollytelling() {
  const ref = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  // Section progress for the rail bar.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const railProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 20,
    mass: 0.4,
  });
  const railHeight = useTransform(railProgress, (v) => `${v * 100}%`);

  // Decide active scene by which panel is closest to viewport centre.
  useEffect(() => {
    function onScroll() {
      const centre = window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      sceneRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const d = Math.abs(mid - centre);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={ref}
      id="day"
      className="relative bg-background"
      aria-label="جولة في يومٍ من آيلاند هيفن"
    >
      {/* Editorial intro — calm two-row layout, no overlap, lots of air */}
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px] pt-24 lg:pt-36 pb-14 lg:pb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="h-[1px] w-10 bg-primary/40" />
          <span className="text-[11px] tracking-[0.22em] uppercase text-primary font-semibold">
            A Day Inside · يومٌ في الهيفن
          </span>
        </div>
        <div className="grid grid-cols-12 gap-6 lg:gap-16">
          <div className="col-span-12 lg:col-span-8">
            <h2
              className="font-bold text-foreground"
              style={{
                fontSize: "clamp(2.5rem, 6.4vw, 5.5rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
              }}
            >
              من الباب
              <br />
              إلى الباب،{" "}
              <span className="text-accent-gradient">قصّةٌ تُروى بالساعة.</span>
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:pt-6">
            <div className="border-t border-foreground/10 pt-7 lg:pt-8">
              <p className="text-base lg:text-lg text-foreground/65 leading-relaxed">
                مرّر بإصبعك للأسفل، وعِش يوماً كاملاً معنا — ستّ لحظات
                حقيقيّة من داخل المساحة، تُحكى بضوءٍ وصورة.
              </p>
              <div className="mt-6 flex items-center gap-4 text-[11px] tracking-[0.18em] uppercase text-foreground/45 font-semibold">
                <span>06 Scenes</span>
                <span className="w-6 h-[1px] bg-foreground/20" />
                <span>09 — 19h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage */}
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px] pb-28 lg:pb-36">
        <div className="grid grid-cols-12 gap-6 lg:gap-14 relative">
          {/* Pinned visual stage — left half (LTR) */}
          <div className="col-span-12 lg:col-span-7 lg:order-1 order-2">
            <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] flex items-center">
              <div className="relative w-full aspect-[4/5] lg:aspect-[5/6] rounded-3xl overflow-hidden shadow-soft-hover bg-muted">
                {SCENES.map((s, i) => (
                  <motion.img
                    key={s.img}
                    src={s.img}
                    alt={s.title.replace(/\n/g, " ")}
                    loading={i < 2 ? "eager" : "lazy"}
                    initial={false}
                    animate={{
                      opacity: i === active ? 1 : 0,
                      scale: i === active ? 1 : 1.05,
                    }}
                    transition={{
                      opacity: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                      scale: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ))}

                {/* Bottom gradient + meta badge */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
                <div className="absolute bottom-5 lg:bottom-7 right-5 lg:right-7 left-5 lg:left-7 flex items-end justify-between gap-3 text-white">
                  <div>
                    <div className="text-[10px] tracking-[0.2em] uppercase font-semibold opacity-80 mb-1">
                      {SCENES[active].kicker} · {String(active + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
                    </div>
                    <div
                      className="font-bold tabular-nums"
                      style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: "-0.02em" }}
                    >
                      {SCENES[active].hour}
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-[11px] tracking-wide opacity-85 bg-white/15 backdrop-blur-md px-3 h-8 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    من داخل آيلاند هيفن
                  </div>
                </div>

                {/* Top-right corner mark */}
                <div className="absolute top-5 right-5 text-white/85 text-[10px] tracking-[0.2em] uppercase font-semibold">
                  IH · A Day Inside
                </div>
              </div>
            </div>
          </div>

          {/* Scrolling text scenes — right half (LTR) */}
          <div className="col-span-12 lg:col-span-5 lg:order-2 order-1 relative">
            {/* Vertical rail */}
            <div className="absolute top-0 bottom-0 right-0 lg:right-auto lg:left-0 w-[2px] bg-border hidden lg:block">
              <motion.div
                className="absolute top-0 left-0 w-full bg-primary"
                style={{ height: railHeight }}
              />
            </div>

            <div className="lg:pr-0 lg:pl-10 space-y-[55vh] py-[30vh]">
              {SCENES.map((s, i) => {
                const isActive = i === active;
                return (
                  <div
                    key={i}
                    ref={(el) => {
                      sceneRefs.current[i] = el;
                    }}
                    className="relative"
                  >
                    {/* Rail dot — desktop */}
                    <div className="hidden lg:block absolute top-2 -left-[44px]">
                      <motion.div
                        animate={{
                          scale: isActive ? 1 : 0.65,
                        }}
                        className="relative w-3 h-3 rounded-full bg-white border-2 border-primary"
                      >
                        {isActive && (
                          <motion.span
                            layoutId="scene-dot-halo"
                            className="absolute -inset-2 rounded-full bg-primary/15"
                          />
                        )}
                      </motion.div>
                    </div>

                    <motion.div
                      animate={{
                        opacity: isActive ? 1 : 0.32,
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="flex items-baseline gap-3 mb-3">
                        <span className="text-[11px] tracking-[0.18em] uppercase font-semibold text-primary">
                          {s.kicker}
                        </span>
                        <span className="text-[11px] text-foreground/45 tabular-nums">
                          {String(i + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
                        </span>
                      </div>
                      <div
                        className="font-bold text-foreground tabular-nums leading-none mb-5"
                        style={{ fontSize: "clamp(2.5rem, 5vw, 3.75rem)", letterSpacing: "-0.04em" }}
                      >
                        {s.hour}
                      </div>
                      <h3
                        className="font-bold text-foreground whitespace-pre-line mb-5"
                        style={{
                          fontSize: "clamp(1.6rem, 3vw, 2.25rem)",
                          lineHeight: 1.15,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {s.title}
                      </h3>
                      <p className="text-base lg:text-lg text-foreground/70 leading-relaxed max-w-md">
                        {s.body}
                      </p>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
