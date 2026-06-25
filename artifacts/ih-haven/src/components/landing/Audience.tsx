import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO, VIEWPORT } from "@/lib/motion";

const FALLBACK = {
  label: "الفئات والمعايير",
  titleA: "مَن يجد",
  titleAccent: "مكانه",
  titleB: "هنا؟",
  sub: "نوزّع المقاعد على ثلاث فئات رئيسيّة بنسب واضحة، ونعتمد نظام حضور موزّعاً على أيّام وفترات مختلفة، ليستفيد العدد الأكبر دون الإخلال بجودة التجربة.",
  seg1Ar: "المستقلّون", seg1En: "Freelancers", seg1Pct: "40", seg1Tag: "Independent professionals", seg1Image: "/photos/IMG_8347.webp",
  seg1C1: "ممارسة فعليّة للعمل الحرّ أو المهنيّ.",
  seg1C2: "امتلاك مهارة واضحة وخبرة لا تقلّ عن ٣ سنوات.",
  seg1C3: "الاستعداد للمساهمة في دعم المجتمع عبر المتابعة أو التدريب أو مشاركة الخبرات.",
  seg2Ar: "الخرّيجون", seg2En: "Graduates", seg2Pct: "40", seg2Tag: "Recent graduates 2020 — 2025", seg2Image: "/photos/IMG_8358.webp",
  seg2C1: "أن يكون التخرّج بين عامَي ٢٠٢٠ و٢٠٢٥.",
  seg2C2: "امتلاك مهارة، أو السعي الجادّ لتعلّم مهارة مهنيّة أو تقنيّة.",
  seg2C3: "الاستعداد للتفاعل والعمل ضمن بيئة تعاونيّة.",
  seg3Ar: "الطلبة الجامعيّون", seg3En: "Students", seg3Pct: "20", seg3Tag: "Final-year university students", seg3Image: "/photos/IMG_8341.webp",
  seg3C1: "أن يكون الطالب في السنة الجامعيّة الأخيرة.",
  seg3C2: "امتلاك مهارة أو العمل على تطوير مهارة ذات صلة بسوق العمل.",
  seg3C3: "",
};

const EN_FALLBACK = {
  label: "Who Is It For?",
  titleA: "Finding",
  titleAccent: "your",
  titleB: "place here",
  sub: "We allocate seats across three main groups with clear ratios, using a distributed schedule so the maximum number of members benefit without compromising the quality of the experience.",
  seg1Ar: "Freelancers", seg1En: "Freelancers", seg1Pct: "40", seg1Tag: "Independent professionals", seg1Image: "/photos/IMG_8347.webp",
  seg1C1: "Active freelance or professional practice.",
  seg1C2: "A clear, demonstrable skill set with at least 3 years of experience.",
  seg1C3: "Willingness to contribute to the community through follow-up, training, or knowledge sharing.",
  seg2Ar: "Graduates", seg2En: "Graduates", seg2Pct: "40", seg2Tag: "Recent graduates 2020 — 2025", seg2Image: "/photos/IMG_8358.webp",
  seg2C1: "Graduated between 2020 and 2025.",
  seg2C2: "Possessing a skill or actively pursuing a professional or technical skill.",
  seg2C3: "Willingness to engage and work within a collaborative environment.",
  seg3Ar: "Students", seg3En: "Students", seg3Pct: "20", seg3Tag: "Final-year university students", seg3Image: "/photos/IMG_8341.webp",
  seg3C1: "Currently in the final year of university.",
  seg3C2: "Possessing a skill or actively developing a market-relevant one.",
  seg3C3: "",
};

// Seat-allocation bar uses the brand red staircase (warm → soft) so the data
// reads as one family; the cool accent-2 is reserved for the live/data glint.
const BAR_FILL = ["hsl(354 82% 58%)", "hsl(354 74% 66%)", "hsl(354 60% 78%)"];

export function Audience() {
  const { lang } = useLanguage();
  const cms = useContentSection("audience", FALLBACK);
  const c = lang === "en" ? EN_FALLBACK : cms;
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
    <section id="audience" className="relative bg-background section-y overflow-hidden">
      <div className="container-ih">
        <EditorialHeader
          label={c.label}
          title={<>{c.titleA} <span className="text-accent-gradient">{c.titleAccent}</span> {c.titleB}</>}
          sub={c.sub}
        />

        {/* ── Seat-allocation bar — flagship data band on a lifted surface ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="surface-1 rounded-[20px] p-6 lg:p-8 mb-[clamp(2.5rem,5vw,4rem)]"
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex items-center gap-2 eyebrow !text-accent-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-2 animate-pulse" />
              {lang === "en" ? "Seat allocation" : "توزيع المقاعد"}
            </span>
            <span className="flex-1 hairline" />
            <span className="eyebrow !text-muted-foreground tnum">
              {lang === "en" ? "100%" : "٪١٠٠"}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-surface-3 overflow-hidden flex">
            {segments.map((s, i) => (
              <motion.div
                key={s.no}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.42, delay: 0.15 + i * 0.12, ease: EASE_OUT_EXPO }}
                style={{
                  width: `${s.pct}%`,
                  background: BAR_FILL[i] ?? BAR_FILL[2],
                  transformOrigin: lang === "en" ? "left" : "right",
                }}
                className={i > 0 ? "border-r-2 border-surface-1" : ""}
              />
            ))}
          </div>
          <div className="mt-5 flex flex-wrap justify-between gap-x-6 gap-y-2 t-caption tnum">
            {segments.map((s, i) => (
              <div key={s.no} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: BAR_FILL[i] ?? BAR_FILL[2] }} />
                <span className="text-foreground font-bold">{lang === "en" ? `${s.pct}%` : `${s.pct}٪`}</span>
                <span className="text-muted-foreground">{lang === "en" ? s.en : s.ar}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-12 lg:space-y-16">
          {segments.map((seg, i) => {
            const reverse = i % 2 === 1;
            return (
              <motion.article
                key={seg.no}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                className="grid grid-cols-12 gap-6 lg:gap-12 items-center group"
              >
                <div className={`col-span-12 lg:col-span-5 ${reverse ? "lg:order-2" : "lg:order-1"}`}>
                  <div className="relative rounded-[20px] overflow-hidden card-base">
                    <img
                      src={seg.photo}
                      alt={seg.ar}
                      loading="lazy"
                      className="w-full aspect-[5/4] object-cover transition-transform duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none" />
                    <div className="absolute top-5 left-5 right-5 flex items-start justify-between text-white">
                      <div className="eyebrow !text-white/80">
                        {seg.tag}
                      </div>
                      <div className="t-caption font-mono font-semibold tnum text-white/70">
                        / {seg.no}
                      </div>
                    </div>
                    <div className="absolute bottom-6 left-6 text-white">
                      <div className="eyebrow !text-white/75 mb-1.5">
                        {seg.en}
                      </div>
                      <div className="t-h3 !text-white !font-bold leading-none" style={{ fontSize: "clamp(1.5rem, 2.2vw, 2rem)" }}>
                        {seg.ar}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`col-span-12 lg:col-span-7 ${reverse ? "lg:order-1" : "lg:order-2"}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="t-caption font-mono font-semibold text-fg-faint tnum">
                      {seg.no}
                    </span>
                    <span className="h-px w-12 bg-border-strong" />
                    <span className="eyebrow">
                      {lang === "en" ? "Audience" : "فئة"}
                    </span>
                  </div>

                  <div
                    dir="ltr"
                    className="flex items-baseline gap-2 mb-3 t-display !text-foreground tnum"
                  >
                    <span>{seg.pct}</span>
                    <span className="text-primary text-[0.5em]">%</span>
                    <span className="text-muted-foreground text-[0.32em] font-semibold ms-3 lg:ms-5">{lang === "en" ? "of seats" : "من المقاعد"}</span>
                  </div>

                  <h3 className="t-h2 !text-foreground mb-7">
                    {seg.ar}
                  </h3>

                  <div className="eyebrow !text-muted-foreground mb-4">
                    {lang === "en" ? "Admission criteria" : "معايير القبول"}
                  </div>
                  <ul className="space-y-0 max-w-xl">
                    {seg.criteria.map((cc, j) => (
                      <li
                        key={j}
                        className="flex gap-4 items-baseline text-fg-secondary border-t border-border pt-3.5 pb-3.5 last:pb-0"
                      >
                        <span className="text-primary t-caption font-bold tnum shrink-0 w-6">
                          {String(j + 1).padStart(2, "0")}
                        </span>
                        <span className="t-body">{cc}</span>
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
