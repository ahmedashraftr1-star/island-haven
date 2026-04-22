import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";

const segments = [
  {
    no: "01",
    ar: "المستقلّون",
    en: "Freelancers",
    pct: 40,
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
    criteria: [
      "أن يكون الطالب في السنة الجامعيّة الأخيرة.",
      "امتلاك مهارة أو العمل على تطوير مهارة ذات صلة بسوق العمل.",
    ],
  },
];

export function Audience() {
  return (
    <section id="audience" className="relative bg-background py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px]">
        <EditorialHeader
          label="الفئات والمعايير"
          title={
            <>
              مَن يجد <span className="text-accent-gradient">مكانه</span> هنا؟
            </>
          }
          sub="نوزّع المقاعد على ثلاث فئات رئيسيّة بنسب واضحة، ونعتمد نظام حضور موزّعاً على أيّام وفترات مختلفة، ليستفيد العدد الأكبر دون الإخلال بجودة التجربة."
        />

        {/* Segments */}
        <div className="bg-white border border-border rounded-2xl shadow-soft overflow-hidden">
          {segments.map((seg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              className={`grid grid-cols-12 gap-4 lg:gap-10 items-baseline p-7 lg:p-10 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="col-span-2 lg:col-span-1 text-[12px] font-mono font-medium text-foreground/40 tabular-nums">
                {seg.no}
              </div>
              <div className="col-span-10 lg:col-span-3">
                <h3 className="font-bold text-foreground text-xl lg:text-2xl leading-tight">
                  {seg.ar}
                </h3>
                <div className="text-[11px] tracking-[0.1em] text-foreground/45 mt-1.5 font-medium">
                  {seg.en}
                </div>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span
                    className="text-primary font-bold tabular-nums"
                    style={{ fontSize: "clamp(1.75rem, 2.6vw, 2.25rem)", letterSpacing: "-0.02em" }}
                  >
                    {seg.pct}
                  </span>
                  <span className="text-primary font-bold text-lg">٪</span>
                </div>
                <div className="mt-3 h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: seg.pct / 100 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, delay: 0.25 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full bg-primary origin-right rounded-full"
                  />
                </div>
              </div>
              <div className="col-span-12 lg:col-span-8">
                <div className="text-[11px] tracking-[0.15em] uppercase text-foreground/45 font-semibold mb-4">
                  معايير القبول · Admission criteria
                </div>
                <ul className="space-y-2.5">
                  {seg.criteria.map((c, j) => (
                    <li key={j} className="flex gap-3 items-baseline text-foreground/75 leading-relaxed">
                      <span className="text-primary text-sm font-bold tabular-nums shrink-0 w-5">
                        {String(j + 1).padStart(2, "0")}
                      </span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
