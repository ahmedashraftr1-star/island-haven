import { motion } from "framer-motion";
import { Sparkles, Globe, Wrench, Settings2, TrendingUp, ArrowLeft } from "lucide-react";

const upcoming = {
  badge: "فعالية قادمة",
  title: "صُنع في آيلاند هيفن",
  subtitle: "Made in Island Haven",
  description:
    "فعاليّة جديدة نطلقها قريباً، نفتح فيها الباب أمام منتسبي المجتمع لاقتراح ما يريدون أن يصنعوه داخل المساحة. كلّ فكرة تُبنى من أصحابها، وتُنفَّذ معهم — لأن المكان يصير أجمل حين يصنعه أهله.",
  pillars: [
    { icon: <Globe className="w-4 h-4" />, label: "مواقع" },
    { icon: <Wrench className="w-4 h-4" />, label: "أدوات" },
    { icon: <TrendingUp className="w-4 h-4" />, label: "تطويرات" },
    { icon: <Settings2 className="w-4 h-4" />, label: "تحسينات" },
  ],
};

export function Programs() {
  return (
    <section id="programs" className="py-24 bg-secondary/10 border-y border-border/50">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
          <div className="lg:col-span-7">
            <span className="inline-block text-sm font-medium text-primary tracking-wide mb-4">
              ما يحدث هنا
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 text-foreground leading-tight">
              المكان يتنفّس بأهله،<br />
              <span className="text-primary">لا بجدرانه.</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
              إلى جانب المساحة المفتوحة يومياً، يُنظَّم Island Haven ورشاً تدريبيّة
              تطبيقيّة ومبادرات داخليّة، بعضها يقوده الفريق، وبعضها يقوده المنتسبون
              أنفسهم.
            </p>
          </div>
        </div>

        <motion.article
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 md:p-12"
        >
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-20 -translate-y-20"></div>

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                {upcoming.badge}
              </div>
              <h3 className="text-2xl md:text-4xl font-bold text-foreground mb-2 leading-tight">
                {upcoming.title}
              </h3>
              <div dir="ltr" className="text-sm text-muted-foreground mb-6 font-light tracking-wide">
                {upcoming.subtitle}
              </div>
              <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed mb-7">
                {upcoming.description}
              </p>

              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
                نرحّب باقتراحاتكم في
              </div>
              <div className="flex flex-wrap gap-2">
                {upcoming.pillars.map((p, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-secondary/30 text-foreground text-sm font-medium border border-border"
                  >
                    {p.icon}
                    {p.label}
                  </span>
                ))}
              </div>

              <a
                href="https://www.instagram.com/ih_haven"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-8 text-primary font-medium hover:underline"
              >
                شاركنا فكرتك عبر إنستغرام
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </a>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img
                  src="/images/reading.png"
                  alt="مساحة عمل في Island Haven"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </motion.article>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-7 rounded-2xl bg-card border border-border">
            <h4 className="text-lg font-bold text-foreground mb-2">ورش تدريبيّة دوريّة</h4>
            <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed">
              برامج عمليّة في مهارات سوق العمل، يقدّمها الفريق ومتطوّعون من المجتمع،
              مفتوحة للمنتسبين وغير المنتسبين على حدّ سواء.
            </p>
          </div>
          <div className="p-7 rounded-2xl bg-card border border-border">
            <h4 className="text-lg font-bold text-foreground mb-2">جلسات تشبيك ولقاءات مهنيّة</h4>
            <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed">
              لقاءات شهريّة تجمع المستقلّين والخريجين والطلبة لتبادل الخبرات،
              وعرض مشاريع، وفتح أبواب التعاون بين أعضاء المجتمع.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
