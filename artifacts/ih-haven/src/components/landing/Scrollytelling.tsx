import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const BASE = import.meta.env.BASE_URL;

/**
 * Cinematic scrollytelling — a day at Island Haven.
 *
 * Desktop: a pinned image stage on one side; a column of dramatic
 * scene cards on the other. The active scene crossfades the photo,
 * lifts its hour to display size, and reveals a kinetic accent rail.
 * Inactive scenes recede to a near-ghost state so the eye snaps to
 * one beat at a time.
 *
 * Mobile: each scene becomes a full-bleed cinematic card — no sticky,
 * no overflow risk, just 6 self-contained film frames.
 */
type Scene = {
  hour: string;
  kicker: string;
  title: string;
  body: string;
  img: string;
  tone: string; // ambient indigo/warm/cool tint
};

const SCENES: Scene[] = [
  {
    hour: "٠٧:٤٥",
    kicker: "Opening",
    title: "البابُ يُفتح،\nوأوّل ضوءٍ يدخل.",
    body: "صباحٌ غزّيٌّ يبدأ بصوت المفتاح، ورائحة قهوة تُحضَّر لمن سيأتي. كرسيّك بانتظارك، والإنترنت لا ينقطع.",
    img: `${BASE}photos/IMG_8357.jpg`,
    tone: "from-amber-500/15",
  },
  {
    hour: "٠٩:٢٠",
    kicker: "Deep Work",
    title: "تركيزٌ بلا\nمقاطعات.",
    body: "سمّاعات، شاشة، وإضاءة طبيعيّة. هنا لا يطرق أحدٌ بابك، ولا يقطع الكهرباء عملك. الوقت لك، استثمره كاملاً.",
    img: `${BASE}photos/IMG_8347.jpg`,
    tone: "from-primary/20",
  },
  {
    hour: "١١:٠٠",
    kicker: "Collide",
    title: "ثلاثُ أفكار،\nطاولةٌ واحدة.",
    body: "تجلس بجانب مستقلٍّ يعمل لشركةٍ في برلين، وخرّيجة بدأت أوّل عقد، وطالبٍ يُتقن التصميم. شبكتُك تبدأ من فنجان قهوة.",
    img: `${BASE}photos/IMG_8341.jpg`,
    tone: "from-rose-500/15",
  },
  {
    hour: "١٣:٣٠",
    kicker: "Pause",
    title: "القهوة على حسابنا،\nوالحديثُ على حساب الجميع.",
    body: "استراحةٌ تتحوّل لورشة عصفٍ ذهنيّ، أو حوارٍ هادئ، أو ضحكةٍ تُذهب تعب الصباح. لا أحد يأكل وحده هنا.",
    img: `${BASE}photos/IMG_8358.jpg`,
    tone: "from-emerald-500/15",
  },
  {
    hour: "١٦:١٠",
    kicker: "Workshop",
    title: "عشرون مقعداً،\nسؤالٌ يُغيّر مساراً.",
    body: "ورشة تدريبيّة جديدة في الأسبوع. ضيفٌ من السوق، وقصّةٌ من قلب التجربة. تخرج وفي يدك مهارة، وفي رأسك قرار.",
    img: `${BASE}photos/IMG_8352.jpg`,
    tone: "from-primary/25",
  },
  {
    hour: "١٦:٤٥",
    kicker: "Closing",
    title: "البابُ يُغلق،\nوالرّوابطُ تبقى.",
    body: "تخرج وفي جيبك بطاقةُ تعارفٍ جديدة، وفرصةٌ كانت بالأمس بعيدة. آيلاند هيفن لا ينتهي عند الباب — يبدأ منه.",
    img: `${BASE}photos/IMG_8300.jpg`,
    tone: "from-violet-500/20",
  },
];

export function Scrollytelling() {
  const ref = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

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
      className="relative bg-[#0A0E1A] text-white"
      aria-label="جولة في يومٍ من آيلاند هيفن"
    >
      {/* Editorial intro — calm, lots of air */}
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px] pt-24 lg:pt-36 pb-14 lg:pb-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="h-[1px] w-10 bg-white/40" />
          <span className="text-[11px] tracking-[0.22em] uppercase text-white/75 font-semibold">
            A Day Inside · يومٌ في الهيفن
          </span>
        </div>
        <div className="grid grid-cols-12 gap-6 lg:gap-16">
          <div className="col-span-12 lg:col-span-8">
            <h2
              className="font-bold text-white"
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
            <div className="border-t border-white/15 pt-7 lg:pt-8">
              <p className="text-base lg:text-lg text-white/65 leading-relaxed">
                مرّر بإصبعك للأسفل، وعِش يوماً كاملاً معنا — ستّ لحظات
                حقيقيّة من داخل المساحة، تُحكى بضوءٍ وصورة.
              </p>
              <div className="mt-6 flex items-center gap-4 text-[11px] tracking-[0.18em] uppercase text-white/45 font-semibold">
                <span>06 Scenes</span>
                <span className="w-6 h-[1px] bg-white/20" />
                <span>09 — 19h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          MOBILE: 6 self-contained cinematic film cards (no sticky).
          ============================================================ */}
      <div className="lg:hidden container mx-auto px-6 max-w-[600px] pb-24 space-y-7">
        {SCENES.map((s, i) => (
          <motion.article
            key={`m-${i}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-3xl overflow-hidden shadow-soft-hover bg-black"
          >
            <img
              src={s.img}
              alt={s.title.replace(/\n/g, " ")}
              loading="lazy"
              className="w-full aspect-[3/4] object-cover opacity-75"
            />
            {/* Tint */}
            <div className={`absolute inset-0 bg-gradient-to-br ${s.tone} via-transparent to-black/85`} />
            {/* Bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/60 to-transparent" />

            {/* Top meta */}
            <div className="absolute top-5 inset-x-5 flex items-center justify-between text-white/80 text-[11px] tracking-[0.2em] uppercase font-semibold">
              <span>{s.kicker}</span>
              <span className="font-mono tabular-nums">
                {String(i + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
              </span>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 inset-x-0 p-6 text-white">
              <div
                dir="ltr"
                className="font-bold tabular-nums text-white leading-none mb-4"
                style={{ fontSize: "clamp(2.5rem, 11vw, 4rem)", letterSpacing: "-0.04em" }}
              >
                {s.hour}
              </div>
              <h3
                className="font-bold whitespace-pre-line leading-[1.1] mb-3"
                style={{ fontSize: "clamp(1.25rem, 5vw, 1.6rem)", letterSpacing: "-0.02em" }}
              >
                {s.title}
              </h3>
              <p className="text-[14px] text-white/75 leading-relaxed">{s.body}</p>
            </div>
          </motion.article>
        ))}
      </div>

      {/* ============================================================
          DESKTOP: pinned image stage + dramatic scrolling scenes.
          ============================================================ */}
      <div className="hidden lg:block container mx-auto px-6 lg:px-12 max-w-[1500px] pb-36">
        <div className="grid grid-cols-12 gap-14 relative">
          {/* PINNED VISUAL STAGE — left in LTR flow */}
          <div className="col-span-7 order-1">
            <div className="sticky top-24 h-[calc(100vh-8rem)] flex items-center">
              <div className="relative w-full aspect-[5/6] rounded-3xl overflow-hidden shadow-soft-hover bg-black">
                {/* Photos crossfade with subtle Ken Burns */}
                {SCENES.map((s, i) => (
                  <motion.img
                    key={s.img}
                    src={s.img}
                    alt={s.title.replace(/\n/g, " ")}
                    loading={i < 2 ? "eager" : "lazy"}
                    initial={false}
                    animate={{
                      opacity: i === active ? 1 : 0,
                      scale: i === active ? 1 : 1.06,
                    }}
                    transition={{
                      opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                      scale: { duration: 6, ease: [0.16, 1, 0.3, 1] },
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ))}

                {/* Per-scene ambient tint */}
                {SCENES.map((s, i) => (
                  <motion.div
                    key={`tint-${i}`}
                    initial={false}
                    animate={{ opacity: i === active ? 1 : 0 }}
                    transition={{ duration: 0.8 }}
                    className={`absolute inset-0 bg-gradient-to-br ${s.tone} via-transparent to-transparent pointer-events-none`}
                  />
                ))}

                {/* Bottom dark gradient */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                {/* Top corner mark */}
                <div className="absolute top-6 right-6 inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] tracking-[0.22em] uppercase font-semibold text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  IH · A Day Inside
                </div>

                {/* Scene meter — animates progress through 6 scenes */}
                <div className="absolute top-6 left-6 right-auto">
                  <div className="text-white/80 text-[10px] tracking-[0.2em] uppercase font-semibold mb-2">
                    Scene · مشهد
                  </div>
                  <div
                    dir="ltr"
                    className="font-bold tabular-nums text-white leading-none"
                    style={{ fontSize: "1.75rem", letterSpacing: "-0.03em" }}
                  >
                    <motion.span
                      key={active}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="inline-block"
                    >
                      {String(active + 1).padStart(2, "0")}
                    </motion.span>
                    <span className="text-white/30 mx-1">/</span>
                    <span className="text-white/45">
                      {String(SCENES.length).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {/* Bottom — kicker + huge hour caption (mirrors scene) */}
                <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between gap-4 text-white">
                  <div>
                    <motion.div
                      key={`k-${active}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-[11px] tracking-[0.22em] uppercase font-semibold opacity-80 mb-2"
                    >
                      {SCENES[active].kicker}
                    </motion.div>
                    <motion.div
                      key={`h-${active}`}
                      dir="ltr"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="font-bold tabular-nums leading-none"
                      style={{ fontSize: "clamp(2.5rem, 5vw, 3.75rem)", letterSpacing: "-0.04em" }}
                    >
                      {SCENES[active].hour}
                    </motion.div>
                  </div>
                  {/* Mini progress dots */}
                  <div className="flex flex-col gap-1.5">
                    {SCENES.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          i === active ? "w-7 bg-white" : "w-2 bg-white/35"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SCROLLING SCENES — right in LTR flow */}
          <div className="col-span-5 order-2 relative">
            {/* Vertical rail with progress fill */}
            <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-white/10">
              <motion.div
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary to-primary/60"
                style={{ height: railHeight }}
              />
            </div>

            <div className="pl-12 space-y-[60vh] py-[34vh]">
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
                    {/* Active scene rail dot — large with halo */}
                    <div className="absolute top-3 -left-[55px]">
                      <motion.div
                        animate={{ scale: isActive ? 1 : 0.55 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_0_3px_rgba(10,14,26,1)]"
                      >
                        {isActive && (
                          <motion.span
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute -inset-2.5 rounded-full bg-primary/20"
                          />
                        )}
                      </motion.div>
                    </div>

                    <motion.div
                      animate={{
                        opacity: isActive ? 1 : 0.18,
                        scale: isActive ? 1 : 0.97,
                      }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformOrigin: "left center" }}
                    >
                      {/* Kicker pill + scene number */}
                      <div className="flex items-center gap-3 mb-5">
                        <motion.span
                          animate={{
                            backgroundColor: isActive
                              ? "hsl(232 70% 52%)"
                              : "rgba(255,255,255,0.08)",
                            color: isActive ? "white" : "rgba(255,255,255,0.55)",
                          }}
                          transition={{ duration: 0.5 }}
                          className="inline-flex items-center h-6 px-2.5 rounded-md text-[10px] tracking-[0.18em] uppercase font-bold"
                        >
                          {s.kicker}
                        </motion.span>
                        <span className="text-[11px] text-white/40 font-mono tabular-nums tracking-wider">
                          {String(i + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
                        </span>
                        {/* Active accent rail */}
                        <motion.span
                          animate={{
                            scaleX: isActive ? 1 : 0,
                            opacity: isActive ? 1 : 0,
                          }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          style={{ transformOrigin: "left" }}
                          className="flex-1 h-[1px] bg-gradient-to-r from-primary to-transparent"
                        />
                      </div>

                      {/* MASSIVE display hour */}
                      <motion.div
                        dir="ltr"
                        animate={{
                          fontSize: isActive ? "clamp(3.5rem, 7vw, 5.5rem)" : "clamp(2.5rem, 5vw, 3.75rem)",
                        }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="font-bold text-white tabular-nums leading-none mb-6"
                        style={{ letterSpacing: "-0.045em" }}
                      >
                        {s.hour}
                      </motion.div>

                      {/* Title */}
                      <h3
                        className="font-bold text-white whitespace-pre-line mb-5"
                        style={{
                          fontSize: "clamp(1.6rem, 2.8vw, 2.25rem)",
                          lineHeight: 1.12,
                          letterSpacing: "-0.022em",
                        }}
                      >
                        {s.title}
                      </h3>

                      {/* Body — slightly indented with editorial rule */}
                      <p
                        className="text-[16px] lg:text-[17px] text-white/65 leading-relaxed max-w-md pr-5 border-r-2 border-white/10"
                      >
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
