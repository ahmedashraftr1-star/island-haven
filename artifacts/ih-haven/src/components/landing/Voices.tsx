import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const voices = [
  {
    quote:
      "في واقعٍ تتكاثر فيه التحديات وتضيق فيه المساحات الآمنة للتعلّم والعمل، وُلد Island Haven كفكرة بسيطة في جوهرها، عميقة في أثرها.",
    source: "من الملف التعريفي للمجتمع",
  },
  {
    quote:
      "نعم هو مكان للعمل، لكنه قبل ذلك مساحة للالتقاء، وللتعلّم، ولبناء الثقة بالنفس وبالطريق.",
    source: "رؤية Island Haven",
  },
  {
    quote:
      "محاولة جادّة لبناء شيء مستدام في مكان يفتقر إلى الاستقرار، واستثمار حقيقي في الإنسان قبل أيّ شيء آخر.",
    source: "كلمة فريق التأسيس",
  },
];

export function Voices() {
  return (
    <section className="py-24 bg-secondary/10 border-y border-border/50">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="max-w-2xl mb-14">
          <span className="inline-block text-sm font-medium text-primary tracking-wide mb-4">
            بكلماتنا
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground leading-tight">
            هكذا نُعرّف أنفسنا
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
            مقتطفات من الملفّ التعريفيّ الرسميّ لـ Island Haven،
            تعكس روح المكان قبل تفاصيله.
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
                <div className="text-xs text-muted-foreground">{v.source}</div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
