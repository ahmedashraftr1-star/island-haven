import { motion } from "framer-motion";
import { Heart, Share2, Map, ArrowLeft } from "lucide-react";

const ways = [
  {
    icon: <Heart className="w-6 h-6" />,
    title: "تبرّع",
    sub: "كل مساهمة تُبقي الأبواب مفتوحة",
    body: "تكفّل بفاتورة الإنترنت لشهر، أو بعشرة كراسٍ جديدة، أو بإفطار شهري لأعضاء المجتمع. التبرّع مباشر وآمن عبر مبادرة من الناس إلى الناس.",
    cta: "تبرّع عبر nas2nas.org",
    href: "https://nas2nas.org",
    primary: true,
  },
  {
    icon: <Share2 className="w-6 h-6" />,
    title: "شارك القصة",
    sub: "الانتشار يحمينا أكثر من الصمت",
    body: "أرسل صفحتنا أو حسابنا على إنستغرام لأشخاص قد يهتمّون. كلّما عرف الناس عن المكان، زادت فرصته في البقاء.",
    cta: "تابعنا وشاركنا",
    href: "https://www.instagram.com/ih_haven",
    primary: false,
  },
  {
    icon: <Map className="w-6 h-6" />,
    title: "زرنا في غزة",
    sub: "الباب مفتوح",
    body: "إن كنت في غزة، تعالَ — اعمل، اشرب شاياً، تعرّف على المكان. لا تحتاج إلى موعد، ولا إلى أن تثبت لأحد شيئاً.",
    cta: "راسلنا للحصول على العنوان",
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
            كيف تدعمنا
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            استمرار هذا المكان<br />
            <span className="opacity-90">يعتمد على التكافل.</span>
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/85 font-light leading-relaxed max-w-2xl">
            ih_haven مساحة مجانية بالكامل. ما يجعلها قائمة هو دعم أناس مثلك،
            من داخل غزة وخارجها. هذه ثلاث طرق ملموسة لتكون جزءاً من قصتها.
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
