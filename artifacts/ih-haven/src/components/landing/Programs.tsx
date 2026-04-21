import { motion } from "framer-motion";
import { Calendar, Users2, Sprout, Mic2 } from "lucide-react";

const programs = [
  {
    icon: <Users2 className="w-5 h-5" />,
    title: "حلقات الدراسة",
    when: "كل ثلاثاء · ٥ مساءً",
    body: "جلسات دراسة جماعية للطلاب الجامعيين وطلاب الدراسات العليا. الحضور مجاني والتسجيل مفتوح للجميع.",
  },
  {
    icon: <Mic2 className="w-5 h-5" />,
    title: "ورش المهارات الرقمية",
    when: "كل خميس · ٦ مساءً",
    body: "تصميم، كتابة محتوى، تحرير فيديو، ومبادئ البرمجة. ينظّمها متطوعون من المجتمع لكل من يريد تعلّم مهنة جديدة.",
  },
  {
    icon: <Sprout className="w-5 h-5" />,
    title: "صالون القراءة",
    when: "كل سبت · ١١ صباحاً",
    body: "جلسة شهرية نقرأ فيها كتاباً مشتركاً ونتناقش فيه. يقترح الكتاب أعضاء المجتمع بالتصويت.",
  },
  {
    icon: <Calendar className="w-5 h-5" />,
    title: "أيام الاستضافة المفتوحة",
    when: "أوّل أحد من كل شهر",
    body: "يوم نفتح فيه الأبواب لمن يفكّر في الانضمام. تعالَ، اشرب شاياً، تعرّف على المكان والناس بدون أي التزام.",
  },
];

export function Programs() {
  return (
    <section id="programs" className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-14">
          <div className="lg:col-span-7">
            <span className="inline-block text-sm font-medium text-primary tracking-wide mb-4">
              ما يحدث هنا
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 text-foreground leading-tight">
              المكان يتنفّس بأهله،<br />
              <span className="text-primary">لا بجدرانه.</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
              نظّم رواد المكان أنفسهم سلسلة من الجلسات الأسبوعية المفتوحة للجميع.
              لا رسوم، لا شروط — فقط شغف بأن نتعلّم ونعمل معاً.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {programs.map((p, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="p-7 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {p.icon}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
                    <h3 className="text-lg font-bold text-foreground">{p.title}</h3>
                    <span className="text-sm text-primary/90 font-medium">{p.when}</span>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
