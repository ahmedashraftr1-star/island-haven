import { motion } from "framer-motion";
import {
  Wifi,
  Zap,
  Armchair,
  Users,
  GraduationCap,
  Network,
} from "lucide-react";

const offerings = [
  {
    icon: <Armchair className="w-5 h-5" />,
    title: "مساحة عمل مهنيّة",
    description:
      "بيئة هادئة وحديثة بتصميم عمليّ، مكاتب مريحة وكراسٍ مناسبة لساعات طويلة من العمل أو الدراسة المركّزة.",
  },
  {
    icon: <Wifi className="w-5 h-5" />,
    title: "إنترنت مستقرّ",
    description:
      "بنية أساسية داعمة لكل احتياجات العمل عن بُعد: اجتماعات مرئية، رفع ملفات، تواصل مع العملاء دون انقطاع.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "كهرباء لا تنقطع",
    description:
      "مصادر طاقة احتياطية تضمن استمرار العمل خلال ساعات انقطاع الشبكة، مع منافذ شحن في كل مكتب.",
  },
  {
    icon: <GraduationCap className="w-5 h-5" />,
    title: "ورش تدريبية تطبيقية",
    description:
      "برامج تدريب عملية مرتبطة بسوق العمل، تُقدَّم للمنتسبين وغير المنتسبين، تُسهم في تطوير المهارات وربط المعرفة بالتطبيق.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "بيئة تشاركيّة",
    description:
      "مساحة لتبادل الخبرات بين الفئات المختلفة — مستقلّون، خريجون، طلبة — يتعلّم بعضهم من بعض كلّ يوم.",
  },
  {
    icon: <Network className="w-5 h-5" />,
    title: "فرص تشبيك حقيقية",
    description:
      "علاقات مهنية تتجاوز جدران المكان: مشاريع مشتركة، توصيات، فرص عمل، وامتدادات إلى ما بعد المساحة.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Offerings() {
  return (
    <section id="offerings" className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="max-w-2xl mb-16">
          <span className="inline-block text-sm font-medium text-primary tracking-wide mb-4">
            ما الذي نقدّمه؟
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-5 text-foreground leading-tight">
            ستّة أعمدة تصنع التجربة
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
            من البنية التحتيّة الداعمة إلى البرامج التدريبيّة وفرص التشبيك،
            بنينا Island Haven حول ما يحتاجه أي شخص ليعمل ويتعلّم وينمو
            في بيئة واحدة مستقرّة.
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
              className="group p-7 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all"
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
