import { motion } from "framer-motion";
import { Heart, Share2, UserPlus, ArrowLeft } from "lucide-react";

const ways = [
  {
    icon: <Heart className="w-6 h-6" />,
    title: "تبرّع",
    sub: "كلّ مساهمة تُبقي الأبواب مفتوحة",
    body: "Island Haven مساحة مجّانيّة بالكامل، وتكاليف تشغيلها — من إنترنت وكهرباء وصيانة — يغطّيها داعمون مثلك. التبرّع مباشر وآمن عبر مبادرة من الناس إلى الناس.",
    cta: "تبرّع عبر nas2nas.org",
    href: "https://nas2nas.org",
    primary: true,
  },
  {
    icon: <UserPlus className="w-6 h-6" />,
    title: "انضمّ كمنتسب",
    sub: "إن كنت في غزّة وتنطبق عليك المعايير",
    body: "إذا كنت مستقلاً أو خرّيجاً أو طالباً في سنة التخرج، سجّل في نموذج الانتساب لتنضمّ إلى المجتمع. أو احجز مقعد ضيف لتجرّب المساحة أوّلاً.",
    cta: "افتح نموذج التسجيل",
    href: "https://forms.gle/5r7dEeidxjg46m399",
    primary: false,
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    title: "شارك القصة",
    sub: "الانتشار يحمينا أكثر من الصمت",
    body: "تابعنا على وسائل التواصل، وأرسل صفحاتنا لكلّ من قد يهمّه الأمر — منتسبين محتملين، داعمين، أو إعلام يبحث عن قصص مختلفة من غزّة.",
    cta: "تابعنا على إنستغرام",
    href: "https://www.instagram.com/ih_haven",
    primary: false,
  },
];

export function Support() {
  return (
    <section id="support" className="py-28 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-15 mix-blend-overlay">
        <img src="/images/sky.png" alt="" className="w-full h-full object-cover" />
      </div>

      <div className="container relative z-10 mx-auto px-6 lg:px-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mb-14"
        >
          <span className="inline-block text-sm font-medium text-primary-foreground/80 tracking-wide mb-4">
            كيف تكون جزءاً من القصّة
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            استمرار هذا المكان<br />
            <span className="opacity-90">يعتمد على التكافل.</span>
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/85 font-light leading-relaxed max-w-2xl">
            Island Haven ليس مشروعاً ربحيّاً، ولا مكاناً يكتفي بنفسه. هو مجتمع
            يُبنى يوميّاً بأيدي داعميه ومنتسبيه. هذه ثلاث طرق ملموسة لتشاركنا القصّة.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ways.map((w, i) => (
            <motion.a
              key={i}
              href={w.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group flex flex-col p-8 rounded-2xl border transition-all backdrop-blur-sm ${
                w.primary
                  ? "bg-primary-foreground text-primary border-primary-foreground hover:shadow-2xl"
                  : "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/15"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                  w.primary ? "bg-primary text-primary-foreground" : "bg-primary-foreground/15"
                }`}
              >
                {w.icon}
              </div>
              <h3 className="text-2xl font-bold mb-1">{w.title}</h3>
              <div className={`text-sm mb-4 ${w.primary ? "text-primary/80" : "text-primary-foreground/70"}`}>
                {w.sub}
              </div>
              <p className={`text-sm font-light leading-relaxed mb-6 flex-1 ${w.primary ? "text-primary/90" : "text-primary-foreground/85"}`}>
                {w.body}
              </p>
              <span className="inline-flex items-center gap-2 font-medium">
                {w.cta}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 group-hover:-translate-x-1 transition-transform" />
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
