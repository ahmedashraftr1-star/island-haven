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

const stats = [
  { value: "٣٩", label: "Seats", ar: "مقعداً في الوقت الواحد" },
  { value: "٨٠", label: "Members", ar: "منتسباً يستفيدون أسبوعيّاً" },
  { value: "٤٠/٦٠", label: "Gender mix", ar: "تمثيل منصف للإناث والذكور" },
];

export function Audience() {
  return (
    <section id="audience" className="relative bg-background py-24 lg:py-32 border-t border-foreground/10">
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
        <EditorialHeader
          no="07"
          label="الفئات والمعايير"
          meta={<>Who fits<br />in here?</>}
          title={
            <>
              مَن يجد <span className="text-primary italic">مكانه</span> هنا؟
            </>
          }
          sub="نوزّع المقاعد على ثلاث فئات رئيسيّة بنسب واضحة، ونعتمد نظام حضور موزّعاً على أيّام وفترات مختلفة، ليستفيد العدد الأكبر دون الإخلال بجودة التجربة."
        />

        {/* Tabular stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-y border-foreground/12 mb-16">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`p-7 lg:p-9 ${
                i < stats.length - 1 ? "md:border-l border-foreground/12" : ""
              } border-b md:border-b-0 ${
                i < stats.length - 1 ? "border-foreground/12" : ""
              }`}
            >
              <div
                className="font-extrabold text-foreground leading-none"
                style={{
                  fontSize: "clamp(3rem, 6vw, 5rem)",
                }}
              >
                {s.value}
              </div>
              <div className="mt-4 text-[10px] tracking-[0.4em] uppercase text-primary font-bold">
                {s.label}
              </div>
              <div className="mt-1 text-sm text-foreground/65 font-light">
                {s.ar}
              </div>
            </div>
          ))}
        </div>

        {/* Three segments — editorial table */}
        <div>
          {segments.map((seg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="grid grid-cols-12 gap-4 lg:gap-10 items-baseline py-9 lg:py-12 border-t border-foreground/12"
            >
              <div className="col-span-2 lg:col-span-1 text-[11px] tracking-[0.3em] font-bold text-foreground/45">
                {seg.no}
              </div>
              <div className="col-span-10 lg:col-span-3">
                <h3
                  className="font-bold text-foreground leading-tight"
                  style={{
                    fontSize: "clamp(1.5rem, 2.4vw, 2.25rem)",
                  }}
                >
                  {seg.ar}
                </h3>
                <div className="text-[10px] tracking-[0.3em] uppercase text-foreground/45 mt-2">
                  {seg.en}
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span
                    className="text-primary font-extrabold"
                    style={{ fontSize: "clamp(2rem, 3vw, 2.75rem)" }}
                  >
                    {seg.pct}
                  </span>
                  <span className="text-primary font-bold text-sm tracking-wider">٪</span>
                </div>
                <div className="mt-4 h-px w-24 bg-foreground/15 relative overflow-hidden">
                  <motion.span
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: seg.pct / 100 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                    className="absolute inset-0 bg-primary origin-right"
                  />
                </div>
              </div>
              <div className="col-span-12 lg:col-span-8">
                <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-bold mb-4">
                  معايير القبول · Admission criteria
                </div>
                <ul className="space-y-3">
                  {seg.criteria.map((c, j) => (
                    <li key={j} className="flex gap-4 items-baseline text-foreground/80 leading-relaxed font-light">
                      <span className="text-primary text-xs font-bold tracking-wider shrink-0 w-6">
                        {String(j + 1).padStart(2, "0")}
                      </span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
          <div className="border-t border-foreground/12" />
        </div>
      </div>
    </section>
  );
}
