import { motion } from "framer-motion";
import { Eye, Target, HeartHandshake } from "lucide-react";

const pillars = [
  {
    icon: <Eye className="w-5 h-5" />,
    title: "رؤيتنا",
    body: "أن نُسهم في بناء مجتمع مهني قادر، يمتلك الأدوات والمهارات التي تمكّنه من الاندماج الفعّال في سوق العمل، وبناء مستقبل مستدام قائم على المعرفة والخبرة والتعاون.",
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "رسالتنا",
    body: "تمكين الطلاب والخريجين والمستقلّين عبر توفير مجتمع داعم، ومساحة عمل آمنة، وبرامج تدريب عملية، وفرص تشبيك حقيقية، تُقارب الواقع وتستجيب لحاجاته.",
  },
  {
    icon: <HeartHandshake className="w-5 h-5" />,
    title: "لماذا مجتمع؟",
    body: "لأن العمل الفردي في بيئات غير مستقرّة يُرهق أكثر مما يُنتج. ولأن الكثير من الطاقات الشابّة لديها الرغبة والقدرة، لكنها تفتقد المكان والدعم والتوجيه.",
  },
];

export function About() {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1 lg:sticky lg:top-24"
          >
            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/images/tea-notebook.png"
                alt="دفتر مفتوح وكوب شاي على طاولة عمل"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
              <div className="absolute bottom-4 right-4 left-4 bg-background/85 backdrop-blur-sm rounded-xl p-4 border border-border">
                <p className="text-sm text-foreground leading-relaxed">
                  &ldquo;Island Haven ليس مجرّد مساحة عمل، بل مجتمع مهنيّ حيّ، يقوم على
                  الشراكة وتبادل الخبرات وبناء المسارات المهنية خطوةً خطوة.&rdquo;
                </p>
                <p className="text-xs text-muted-foreground mt-2">— من الملف التعريفي الرسمي</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <span className="inline-block text-sm font-medium text-primary tracking-wide mb-4">
              من نحن
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground leading-tight">
              مساحة نجاة مهنيّة،<br />
              <span className="text-primary">قبل أن تكون مكاناً للعمل.</span>
            </h2>

            <div className="space-y-5 text-base md:text-lg text-muted-foreground leading-relaxed font-light">
              <p>
                في واقعٍ تتكاثر فيه التحديات وتضيق فيه المساحات الآمنة للتعلّم والعمل،
                وُلد مجتمع <span className="font-medium text-foreground">Island Haven</span>
                {" "}كفكرة بسيطة في جوهرها، عميقة في أثرها: أن يجد الإنسان مكاناً يحتضن
                طاقته، ويحترم وقته، ويؤمن بقدرته على النمو، مهما كانت الظروف.
              </p>
              <p>
                نعم هو مكان للعمل، لكنه قبل ذلك مساحة للالتقاء، وللتعلّم، ولبناء
                الثقة بالنفس وبالطريق. مساحة احترافية بروحٍ إنسانية هادئة.
              </p>
            </div>

            <div className="mt-10 space-y-5">
              {pillars.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex gap-4 border-r-2 border-primary/40 pr-5"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    {p.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1">{p.title}</h3>
                    <p className="text-muted-foreground font-light leading-relaxed">{p.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
