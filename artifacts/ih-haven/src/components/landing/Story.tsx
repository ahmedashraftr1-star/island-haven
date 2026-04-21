import { motion } from "framer-motion";

export function Story() {
  return (
    <section id="story" className="py-24 bg-background overflow-hidden relative">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              بدعم من "من الناس إلى الناس"
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed font-light">
              <p>
                لم يكن "ملاذ" ليرى النور لولا إيمان مبادرة "من الناس إلى الناس" بأهمية المساحات الآمنة. هي مبادرة تطوعية تأسست على مبدأ التكافل المباشر، بعيداً عن التعقيدات المؤسسية.
              </p>
              <p>
                نحن نؤمن أن التعافي يبدأ عندما يجد الإنسان مكاناً يشعر فيه بانتمائه، مكاناً يستطيع فيه أن يمسك قلماً، أو يفتح حاسوباً، ويقول لنفسه: "أنا قادر على البدء من جديد".
              </p>
              <div className="pt-4">
                <a 
                  href="https://nastonas.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary font-bold hover:underline"
                >
                  تعرف أكثر على مبادرة من الناس إلى الناس
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="aspect-video lg:aspect-square rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="/images/reading.png" 
                alt="شاب يقرأ بجانب النباتات" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
