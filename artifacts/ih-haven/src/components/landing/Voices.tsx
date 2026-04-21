import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const voices = [
  {
    quote:
      "لم أكن أتخيّل أن مكاناً صغيراً مثل هذا يستطيع أن يعيد لي إيقاع حياتي. أكتب هنا، أدرس، أقابل أصدقاء جدداً. صار مكاني الثاني.",
    name: "محمد",
    role: "طالب هندسة",
  },
  {
    quote:
      "كنت على وشك أن أفقد عملي لأنني لم أملك مكاناً هادئاً للاجتماعات. هنا أستطيع أن أعقد اجتماعاتي بكرامة، والإنترنت لم يخذلني مرّة.",
    name: "ريم",
    role: "مصمّمة مستقلّة",
  },
  {
    quote:
      "أحبّ أن أتي قبل ساعة من بدء العمل. أجلس بجانب النافذة، أشرب شاياً، وأقرأ كتاباً. هذه الساعة تستحق كل أيامي.",
    name: "أحمد",
    role: "مدرّس لغة عربية",
  },
];

export function Voices() {
  return (
    <section className="py-24 bg-secondary/10 border-y border-border/50">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="max-w-2xl mb-14">
          <span className="inline-block text-sm font-medium text-primary tracking-wide mb-4">
            أصوات من المكان
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground leading-tight">
            ما يقوله رواد ih_haven
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
            هذه شهادات من طلاب ومستقلّين ومدرّسين يأتون إلينا أسبوعياً.
            تركنا لهم الكلمات كما هي.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {voices.map((v, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="p-7 rounded-2xl bg-card border border-border flex flex-col"
            >
              <Quote className="w-7 h-7 text-primary/40 mb-5 rtl:scale-x-[-1]" />
              <blockquote className="text-base text-foreground leading-relaxed font-light flex-1">
                {v.quote}
              </blockquote>
              <figcaption className="mt-6 pt-5 border-t border-border">
                <div className="text-sm font-bold text-foreground">{v.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{v.role}</div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
