import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";

const BASE = import.meta.env.BASE_URL;

const segments = [
  {
    no: "01",
    ar: "المستقلّون",
    en: "Freelancers",
    pct: 40,
    photo: `${BASE}photos/IMG_8347.jpg`,
    tag: "Independent professionals",
    criteria: [
      "ممارسة فعليّة للعمل الحرّ أو المهنيّ.",
      "امتلاك مهارة واضحة وخبرة لا تقلّ عن ٣ سنوات.",
      "الاستعداد للمساهمة في دعم المجتمع عبر المتابعة أو التدريب أو مشاركة الخبرات.",
    ],
  },
  {
    no: "02",
    ar: "الخرّيجون",
    en: "Graduates",
    pct: 40,
    photo: `${BASE}photos/IMG_8358.jpg`,
    tag: "Recent graduates 2020 — 2025",
    criteria: [
      "أن يكون التخرّج بين عامَي ٢٠٢٠ و٢٠٢٥.",
      "امتلاك مهارة، أو السعي الجادّ لتعلّم مهارة مهنيّة أو تقنيّة.",
      "الاستعداد للتفاعل والعمل ضمن بيئة تعاونيّة.",
    ],
  },
  {
    no: "03",
    ar: "الطلبة الجامعيّون",
    en: "Students",
    pct: 20,
    photo: `${BASE}photos/IMG_8341.jpg`,
    tag: "Final-year university students",
    criteria: [
      "أن يكون الطالب في السنة الجامعيّة الأخيرة.",
      "امتلاك مهارة أو العمل على تطوير مهارة ذات صلة بسوق العمل.",
    ],
  },
];

/**
 * Audience — Apple-confident segment showcase.
 *
 * Each segment is a wide editorial row: cinematic photo on one side,
 * massive percentage + criteria on the other. Photos alternate sides
 * to create rhythm. Hairline dividers, generous breathing room,
 * and a master visual percentage bar that ties the three together.
 */
export function Audience() {
  return (
    <section
      id="audience"
      className="relative bg-background py-24 lg:py-36 overflow-hidden"
    >
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px]">
        <EditorialHeader
          label="الفئات والمعايير"
          title={
            <>
              مَن يجد <span className="text-accent-gradient">مكانه</span> هنا؟
            </>
          }
          sub="نوزّع المقاعد على ثلاث فئات رئيسيّة بنسب واضحة، ونعتمد نظام حضور موزّعاً على أيّام وفترات مختلفة، ليستفيد العدد الأكبر دون الإخلال بجودة التجربة."
        />

        {/* Master allocation bar — 40 / 40 / 20 visualized as one rail */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20 lg:mb-28"
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] tracking-[0.2em] uppercase text-foreground/45 font-semibold">
              توزيع المقاعد · Seat allocation
            </span>
            <span className="flex-1 h-[1px] bg-foreground/10" />
            <span className="text-[11px] tracking-[0.18em] uppercase text-foreground/45 font-semibold tabular-nums">
              ٪١٠٠
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-foreground/5 overflow-hidden flex">
            {segments.map((s, i) => (
              <motion.div
                key={s.no}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 1.0,
                  delay: 0.15 + i * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  width: `${s.pct}%`,
                  background:
                    i === 0
                      ? "hsl(232 70% 52%)"
                      : i === 1
                      ? "hsl(232 70% 62%)"
                      : "hsl(232 60% 78%)",
                  transformOrigin: "right",
                }}
                className={i > 0 ? "border-r-2 border-background" : ""}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-between gap-4 text-[12px] text-foreground/55 font-medium tabular-nums">
            {segments.map((s) => (
              <div key={s.no} className="flex items-center gap-1.5">
                <span className="text-foreground font-bold">{s.pct}٪</span>
                <span className="text-foreground/45">· {s.ar}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Editorial segment rows — alternating photo sides */}
        <div className="space-y-24 lg:space-y-32">
          {segments.map((seg, i) => {
            const reverse = i % 2 === 1;
            return (
              <motion.article
                key={seg.no}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-12 gap-6 lg:gap-14 items-center group"
              >
                {/* Photo — cinematic editorial frame */}
                <div
                  className={`col-span-12 lg:col-span-5 ${
                    reverse ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-soft-hover">
                    <img
                      src={seg.photo}
                      alt={seg.ar}
                      loading="lazy"
                      className="w-full aspect-[4/5] object-cover transition-transform duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />
                    {/* On-photo number + tag */}
                    <div className="absolute top-5 left-5 right-5 flex items-start justify-between text-white">
                      <div className="text-[11px] tracking-[0.22em] uppercase font-semibold opacity-80">
                        {seg.tag}
                      </div>
                      <div className="text-[11px] font-mono font-semibold tabular-nums opacity-70">
                        / {seg.no}
                      </div>
                    </div>
                    <div className="absolute bottom-6 left-6 text-white">
                      <div className="text-[10px] tracking-[0.2em] uppercase font-semibold opacity-75 mb-1.5">
                        {seg.en}
                      </div>
                      <div
                        className="font-bold leading-none"
                        style={{
                          fontSize: "clamp(1.5rem, 2.2vw, 2rem)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {seg.ar}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content side */}
                <div
                  className={`col-span-12 lg:col-span-7 ${
                    reverse ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <div className="flex items-baseline gap-4 mb-7">
                    <span className="text-[11px] font-mono font-semibold text-foreground/40 tabular-nums tracking-[0.1em]">
                      {seg.no}
                    </span>
                    <span className="h-[1px] w-12 bg-foreground/15" />
                    <span className="text-[11px] tracking-[0.2em] uppercase text-primary font-semibold">
                      Audience · فئة
                    </span>
                  </div>

                  {/* MASSIVE percentage */}
                  <div
                    dir="ltr"
                    className="flex items-baseline gap-2 mb-3 font-bold text-foreground tabular-nums"
                    style={{
                      fontSize: "clamp(4.5rem, 9vw, 8rem)",
                      letterSpacing: "-0.045em",
                      lineHeight: 0.9,
                    }}
                  >
                    <span>{seg.pct}</span>
                    <span className="text-primary text-[0.5em]">%</span>
                    <span className="text-foreground/35 text-[0.4em] mr-3 lg:mr-5">
                      من المقاعد
                    </span>
                  </div>

                  <h3
                    className="font-bold text-foreground leading-[1.1] mb-7 tracking-tight"
                    style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.022em" }}
                  >
                    {seg.ar}
                  </h3>

                  {/* Criteria list — Apple-style numbered bullets */}
                  <div className="text-[11px] tracking-[0.18em] uppercase text-foreground/45 font-semibold mb-4">
                    معايير القبول · Admission criteria
                  </div>
                  <ul className="space-y-3.5 max-w-xl">
                    {seg.criteria.map((c, j) => (
                      <li
                        key={j}
                        className="flex gap-4 items-baseline text-foreground/80 leading-relaxed border-t border-foreground/8 pt-3.5"
                      >
                        <span className="text-primary text-sm font-bold tabular-nums shrink-0 w-6">
                          {String(j + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[15px] lg:text-[16px]">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
