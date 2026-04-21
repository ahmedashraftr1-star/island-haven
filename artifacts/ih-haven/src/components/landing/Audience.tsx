import { motion } from "framer-motion";
import { Briefcase, GraduationCap, BookOpenCheck } from "lucide-react";

const segments = [
  {
    icon: <Briefcase className="w-5 h-5" />,
    title: "المستقلّون (الفريلانسر)",
    pct: 40,
    criteria: [
      "ممارسة فعليّة للعمل الحرّ أو المهني.",
      "امتلاك مهارة واضحة وخبرة لا تقلّ عن ٣ سنوات.",
      "الاستعداد للمساهمة في دعم المجتمع عبر المتابعة أو التدريب أو مشاركة الخبرات.",
    ],
  },
  {
    icon: <GraduationCap className="w-5 h-5" />,
    title: "الخريجون",
    pct: 40,
    criteria: [
      "أن يكون التخرّج بين عامَي ٢٠٢٠ و٢٠٢٥.",
      "امتلاك مهارة، أو السعي الجادّ لتعلّم مهارة مهنية أو تقنية.",
      "الاستعداد للتفاعل والعمل ضمن بيئة تعاونية.",
    ],
  },
  {
    icon: <BookOpenCheck className="w-5 h-5" />,
    title: "الطلبة الجامعيّون",
    pct: 20,
    criteria: [
      "أن يكون الطالب في السنة الجامعيّة الأخيرة.",
      "امتلاك مهارة أو العمل على تطوير مهارة ذات صلة بسوق العمل.",
    ],
  },
];

const stats = [
  { value: "٣٩", label: "مقعداً في الوقت الواحد" },
  { value: "٦٤–٨٠", label: "منتسباً يستفيدون أسبوعياً" },
  { value: "٤٠٪ / ٦٠٪", label: "إناث / ذكور — تمثيل منصف" },
];

export function Audience() {
  return (
    <section id="audience" className="py-24 bg-secondary/10 border-y border-border/50">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="max-w-2xl mb-12">
          <span className="inline-block text-sm font-medium text-primary tracking-wide mb-4">
            الفئات المستهدفة ومعايير القبول
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-5 text-foreground leading-tight">
            مَن يجد مكانه هنا؟
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
            نوزّع المقاعد على ثلاث فئات رئيسية بنسب واضحة، ونعتمد نظام حضور موزّعاً على
            أيّام وفترات مختلفة، ليستفيد العدد الأكبر دون الإخلال بجودة التجربة.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl bg-card border border-border p-6 text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{s.value}</div>
              <div className="text-sm text-muted-foreground font-light">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {segments.map((seg, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="rounded-2xl bg-card border border-border p-7 flex flex-col"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {seg.icon}
                </div>
                <div className="text-2xl font-bold text-primary">{seg.pct}٪</div>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-4">{seg.title}</h3>

              <div className="mb-3 h-1.5 rounded-full bg-secondary/30 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${seg.pct}%` }}
                />
              </div>

              <div className="text-xs text-muted-foreground mb-3 mt-2 font-medium uppercase tracking-wider">
                معايير القبول
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground font-light leading-relaxed">
                {seg.criteria.map((c, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="text-primary mt-1.5 shrink-0">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
