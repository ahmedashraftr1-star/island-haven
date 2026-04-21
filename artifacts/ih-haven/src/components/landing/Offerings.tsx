import { motion } from "framer-motion";
import {
  Wifi,
  Zap,
  Coffee,
  Users,
  BookOpen,
  Armchair,
  PencilRuler,
  Printer,
  Headphones,
} from "lucide-react";

const offerings = [
  {
    icon: <Wifi className="w-5 h-5" />,
    title: "إنترنت ثابت وسريع",
    description:
      "خطّان مستقلان عبر مزوّدين مختلفين، بسرعة كافية للاجتماعات المرئية ورفع الملفات الثقيلة دون انقطاع.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "كهرباء لا تنقطع",
    description:
      "مولّد ولوحة طاقة شمسية احتياطية تضمن استمرار العمل خلال ساعات انقطاع الشبكة، مع منافذ شحن في كل مكتب.",
  },
  {
    icon: <Armchair className="w-5 h-5" />,
    title: "ثلاثون مقعد عمل",
    description:
      "مكاتب فردية بإضاءة مكتبية خاصة، وكراسي مريحة لساعات طويلة من العمل أو الدراسة المركّزة.",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "مكتبة صغيرة",
    description:
      "قرابة ٣٠٠ كتاب بالعربية والإنجليزية في الأدب، التصميم، البرمجة، وعلم النفس. يمكن استعارتها مجاناً.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "غرفتا اجتماعات",
    description:
      "غرفتان مغلقتان بسعة ٤ و٨ أشخاص، مع شاشة عرض ولوح أبيض. مجانيتان بالحجز المسبق.",
  },
  {
    icon: <Coffee className="w-5 h-5" />,
    title: "ركن الشاي والقهوة",
    description:
      "شاي بالنعنع، قهوة عربية، ومياه باردة طوال اليوم. هذه التفاصيل الصغيرة هي ما تجعل المكان بيتاً لا مكتباً.",
  },
  {
    icon: <Printer className="w-5 h-5" />,
    title: "طباعة وتصوير",
    description:
      "طابعة بالأبيض والأسود وأخرى ملوّنة لأوراق الدراسة والوثائق الإدارية، بأسعار رمزية لتغطية تكلفة الورق.",
  },
  {
    icon: <Headphones className="w-5 h-5" />,
    title: "زاوية للمكالمات",
    description:
      "ركن معزول صوتياً للاجتماعات والمقابلات الفردية، حتى لا تُزعج الآخرين ولا يُزعجك أحد.",
  },
  {
    icon: <PencilRuler className="w-5 h-5" />,
    title: "مساحة للورش",
    description:
      "نستضيف بشكل دوري ورش عمل في الكتابة، التصميم، والمهارات الرقمية — ينظّمها أعضاء المجتمع أنفسهم.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Offerings() {
  return (
    <section id="offerings" className="py-24 bg-secondary/10 border-y border-border/50">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="max-w-2xl mb-16">
          <span className="inline-block text-sm font-medium text-primary tracking-wide mb-4">
            ما يقدّمه المكان
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-5 text-foreground leading-tight">
            أشياء صغيرة تعني الكثير
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
            في الظروف الصعبة، تتحوّل البديهيات إلى رفاهية. حاولنا أن نجمع تحت سقف واحد
            ما يحتاجه أي شخص ليعمل بهدوء — لا أكثر ولا أقل.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {offerings.map((offering, index) => (
            <motion.div
              key={index}
              variants={item}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {offering.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">{offering.title}</h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                {offering.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
