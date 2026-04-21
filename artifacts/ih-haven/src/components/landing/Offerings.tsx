import { motion } from "framer-motion";
import { Wifi, Zap, Coffee, Users, BookOpen, MapPin } from "lucide-react";

const offerings = [
  {
    icon: <Wifi className="w-6 h-6" />,
    title: "إنترنت مستقر",
    description: "اتصال دائم بالإنترنت يتيح للشباب العودة لأعمالهم والتواصل مع العالم."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "طاقة مستمرة",
    description: "محطات شحن لتشغيل الحواسيب والهواتف طوال ساعات العمل."
  },
  {
    icon: <Coffee className="w-6 h-6" />,
    title: "ركن الشاي والقهوة",
    description: "تفاصيل صغيرة تصنع الفارق، زاوية دافئة لاستراحة قصيرة."
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "مساحة مجتمعية",
    description: "بيئة داعمة تجمع المبدعين والطلاب وتكسر حاجز العزلة."
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "مناطق للدراسة",
    description: "طاولات عمل هادئة تتيح التركيز والإنتاجية."
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "موقع آمن",
    description: "ملاذ حقيقي وسط الركام، يمنح شعوراً بالاستقرار المفقود."
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function Offerings() {
  return (
    <section className="py-24 bg-secondary/5 border-y border-border/50">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">أشياء صغيرة تعني الكثير</h2>
          <p className="text-lg text-muted-foreground font-light">
            في الظروف الصعبة، تصبح البديهيات كماليات. نحن نحاول توفير الأساسيات التي تجعل العمل والإبداع ممكناً.
          </p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {offerings.map((offering, index) => (
            <motion.div 
              key={index}
              variants={item}
              className="p-8 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors shadow-sm"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                {offering.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{offering.title}</h3>
              <p className="text-muted-foreground font-light leading-relaxed">
                {offering.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
