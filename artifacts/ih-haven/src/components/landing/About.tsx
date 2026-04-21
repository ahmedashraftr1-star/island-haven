import { motion } from "framer-motion";

export function About() {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto lg:mx-0 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="/images/tea-notebook.png" 
                alt="دفتر وكوب شاي في مساحة العمل" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              مكان لالتقاط الأنفاس
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed font-light">
              <p>
                لم يكن الهدف مجرد توفير مقاعد وطاولات، بل كان توفير الشعور بالكرامة. في وقت فقد فيه الكثيرون مساحاتهم الشخصية، جاء "ملاذ" ليكون غرفة جلوس مجتمعية.
              </p>
              <p>
                الجدران هنا خرسانية، والمكاتب من الخشب البسيط، لكن الضوء الذي يدخل من النوافذ العالية وصوت الأوراق وتقليب الصفحات يعيد بناء الروح قبل أي شيء آخر.
              </p>
              <p>
                هنا يجتمع الطلاب لإكمال دراستهم، والمستقلون للعودة إلى أعمالهم، والأصدقاء لشرب الشاي وتذكر ما يعنيه أن تجلس في مكان آمن ولو لساعات قليلة.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
