import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";
import { imageUrl, useContentSection } from "@/hooks/use-content";

const FALLBACK = {
  label: "الفئات والمعايير",
  titleA: "مَن يجد",
  titleAccent: "مكانه",
  titleB: "هنا؟",
  sub: "نوزّع المقاعد على ثلاث فئات رئيسيّة بنسب واضحة، ونعتمد نظام حضور موزّعاً على أيّام وفترات مختلفة، ليستفيد العدد الأكبر دون الإخلال بجودة التجربة.",
  seg1Ar: "المستقلّون", seg1En: "Freelancers", seg1Pct: "40", seg1Tag: "Independent professionals", seg1Image: "/photos/IMG_8347.jpg",
  seg1C1: "ممارسة فعليّة للعمل الحرّ أو المهنيّ.",
  seg1C2: "امتلاك مهارة واضحة وخبرة لا تقلّ عن ٣ سنوات.",
  seg1C3: "الاستعداد للمساهمة في دعم المجتمع عبر المتابعة أو التدريب أو مشاركة الخبرات.",
  seg2Ar: "الخرّيجون", seg2En: "Graduates", seg2Pct: "40", seg2Tag: "Recent graduates 2020 — 2025", seg2Image: "/photos/IMG_8358.jpg",
  seg2C1: "أن يكون التخرّج بين عامَي ٢٠٢٠ و٢٠٢٥.",
  seg2C2: "امتلاك مهارة، أو السعي الجادّ لتعلّم مهارة مهنيّة أو تقنيّة.",
  seg2C3: "الاستعداد للتفاعل والعمل ضمن بيئة تعاونيّة.",
  seg3Ar: "الطلبة الجامعيّون", seg3En: "Students", seg3Pct: "20", seg3Tag: "Final-year university students", seg3Image: "/photos/IMG_8341.jpg",
  seg3C1: "أن يكون الطالب في السنة الجامعيّة الأخيرة.",
  seg3C2: "امتلاك مهارة أو العمل على تطوير مهارة ذات صلة بسوق العمل.",
  seg3C3: "",
};

export function Audience() {
  const c = useContentSection("audience", FALLBACK);
  const segments = [
    {
      no: "01", ar: c.seg1Ar, en: c.seg1En, pct: Number(c.seg1Pct) || 0,
      photo: imageUrl(c.seg1Image), tag: c.seg1Tag,
      criteria: [c.seg1C1, c.seg1C2, c.seg1C3].filter(Boolean),
    },
    {
      no: "02", ar: c.seg2Ar, en: c.seg2En, pct: Number(c.seg2Pct) || 0,
      photo: imageUrl(c.seg2Image), tag: c.seg2Tag,
      criteria: [c.seg2C1, c.seg2C2, c.seg2C3].filter(Boolean),
    },
    {
      no: "03", ar: c.seg3Ar, en: c.seg3En, pct: Number(c.seg3Pct) || 0,
      photo: imageUrl(c.seg3Image), tag: c.seg3Tag,
      criteria: [c.seg3C1, c.seg3C2, c.seg3C3].filter(Boolean),
    },
  ];

  return (
    <section id="audience" className="relative bg-background py-24 lg:py-36 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px]">
        <EditorialHeader
          label={c.label}
          title={<>{c.titleA} <span className="text-accent-gradient">{c.titleAccent}</span> {c.titleB}</>}
          sub={c.sub}
        />

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
                transition={{ duration: 1.0, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  width: `${s.pct}%`,
                  background:
                    i === 0 ? "hsl(232 70% 52%)" : i === 1 ? "hsl(232 70% 62%)" : "hsl(232 60% 78%)",
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
                <div className={`col-span-12 lg:col-span-5 ${reverse ? "lg:order-2" : "lg:order-1"}`}>
                  <div className="relative rounded-2xl overflow-hidden shadow-soft-hover">
                    <img
                      src={seg.photo}
                      alt={seg.ar}
                      loading="lazy"
                      className="w-full aspect-[4/5] object-cover transition-transform duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />
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
                      <div className="font-bold leading-none" style={{ fontSize: "clamp(1.5rem, 2.2vw, 2rem)", letterSpacing: "-0.02em" }}>
                        {seg.ar}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`col-span-12 lg:col-span-7 ${reverse ? "lg:order-1" : "lg:order-2"}`}>
                  <div className="flex items-baseline gap-4 mb-7">
                    <span className="text-[11px] font-mono font-semibold text-foreground/40 tabular-nums tracking-[0.1em]">
                      {seg.no}
                    </span>
                    <span className="h-[1px] w-12 bg-foreground/15" />
                    <span className="text-[11px] tracking-[0.2em] uppercase text-primary font-semibold">
                      Audience · فئة
                    </span>
                  </div>

                  <div
                    dir="ltr"
                    className="flex items-baseline gap-2 mb-3 font-bold text-foreground tabular-nums"
                    style={{ fontSize: "clamp(4.5rem, 9vw, 8rem)", letterSpacing: "-0.045em", lineHeight: 0.9 }}
                  >
                    <span>{seg.pct}</span>
                    <span className="text-primary text-[0.5em]">%</span>
                    <span className="text-foreground/35 text-[0.4em] mr-3 lg:mr-5">من المقاعد</span>
                  </div>

                  <h3
                    className="font-bold text-foreground leading-[1.1] mb-7 tracking-tight"
                    style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", letterSpacing: "-0.022em" }}
                  >
                    {seg.ar}
                  </h3>

                  <div className="text-[11px] tracking-[0.18em] uppercase text-foreground/45 font-semibold mb-4">
                    معايير القبول · Admission criteria
                  </div>
                  <ul className="space-y-3.5 max-w-xl">
                    {seg.criteria.map((cc, j) => (
                      <li
                        key={j}
                        className="flex gap-4 items-baseline text-foreground/80 leading-relaxed border-t border-foreground/8 pt-3.5"
                      >
                        <span className="text-primary text-sm font-bold tabular-nums shrink-0 w-6">
                          {String(j + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[15px] lg:text-[16px]">{cc}</span>
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
