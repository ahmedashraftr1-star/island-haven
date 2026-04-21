import { motion } from "framer-motion";

const pillars = [
  {
    title: "الكرامة قبل كل شيء",
    body: "أن تجد كرسياً يحترم ظهرك، وطاولة تحترم وقتك، وضوءاً يحترم عينيك. هذه ليست رفاهية — هذه الحدّ الأدنى من الإنسانية.",
  },
  {
    title: "هدوء كافٍ للتفكير",
    body: "في الخارج ضجيج كثير. هنا غرفة واحدة جدرانها سميكة، نوافذها عالية، وقاعدتها بسيطة: لا أحد يرفع صوته، الجميع يعمل.",
  },
  {
    title: "مجتمع لا يطلب شيئاً",
    body: "تأتي وحدك، تجلس بجانب أناس آخرين، تتبادلون النظرات والابتسامات. لا اشتراك، لا استمارات، لا أسئلة.",
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
                  &ldquo;أول مرة أستطيع فيها أن أكمل كتابة فصل كامل من رسالتي منذ أشهر. هنا فقط استطعت أن أسمع نفسي مرة أخرى.&rdquo;
                </p>
                <p className="text-xs text-muted-foreground mt-2">— طالبة دراسات عليا، أحد روّاد المكان</p>
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
              مكان لالتقاط الأنفاس،<br />
              <span className="text-primary">والعودة إلى العمل.</span>
            </h2>

            <div className="space-y-5 text-base md:text-lg text-muted-foreground leading-relaxed font-light">
              <p>
                <span className="font-medium text-foreground">ih_haven</span> ليست مقهى، وليست مكتباً تجارياً.
                هي غرفة واحدة بسيطة في غزة، فتحناها لكل من فقد جدرانه، أو فقد قدرته على التركيز،
                أو ببساطة احتاج إلى ساعتين من الهدوء كي يتذكر أنه قادر على الإنجاز.
              </p>
              <p>
                ندير المكان بالحدّ الأدنى الممكن: مكاتب من الخشب البسيط، كراسي مستقيمة الظهر،
                نباتات قليلة على حافة النافذة، وضوء طبيعي يدخل من أعلى. الإنترنت ثابت،
                المولّد يعمل عند انقطاع الكهرباء، والشاي ساخن دائماً.
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
                  className="border-r-2 border-primary/40 pr-5"
                >
                  <h3 className="text-lg font-bold text-foreground mb-1">{p.title}</h3>
                  <p className="text-muted-foreground font-light leading-relaxed">{p.body}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
