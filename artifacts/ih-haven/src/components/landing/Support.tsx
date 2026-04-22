import { motion } from "framer-motion";
import { Heart, UserPlus, Share2, ArrowLeft } from "lucide-react";

const ways = [
  {
    icon: Heart,
    ar: "تبرّع",
    en: "Donate",
    sub: "كلّ مساهمة تُبقي الأبواب مفتوحة",
    body: "Island Haven مساحة مجّانيّة بالكامل، وتكاليف تشغيلها — من إنترنت وكهرباء وصيانة — يغطّيها داعمون مثلك. التبرّع مباشر وآمن عبر مبادرة من الناس إلى الناس.",
    cta: "تبرّع الآن",
    href: "https://nas2nas.org",
    primary: true,
  },
  {
    icon: UserPlus,
    ar: "انضمّ",
    en: "Join",
    sub: "إن كنت في غزّة وتنطبق عليك المعايير",
    body: "إذا كنت مستقلاً أو خرّيجاً أو طالباً في سنة التخرّج، سجّل في نموذج الانتساب لتنضمّ إلى المجتمع. أو احجز مقعد ضيف لتجرّب المساحة أوّلاً.",
    cta: "افتح النموذج",
    href: "/apply",
  },
  {
    icon: Share2,
    ar: "شارك القصّة",
    en: "Share",
    sub: "الانتشار يحمينا أكثر من الصمت",
    body: "تابعنا على وسائل التواصل، وأرسل صفحاتنا لكلّ من قد يهمّه الأمر — منتسبين محتملين، داعمين، أو إعلام يبحث عن قصص مختلفة من غزّة.",
    cta: "تابعنا على إنستغرام",
    href: "https://www.instagram.com/ih_haven",
  },
];

export function Support() {
  return (
    <section
      id="support"
      className="relative bg-background py-24 lg:py-32 overflow-hidden"
    >
      <div className="container relative mx-auto px-6 lg:px-10 max-w-[1500px]">
        {/* Headline */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            كن جزءاً من القصّة
          </div>
          <h2
            className="font-bold text-foreground"
            style={{
              fontSize: "clamp(2.25rem, 5.2vw, 4.25rem)",
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
            }}
          >
            استمرار هذا المكان
            <br />
            <span className="text-accent-gradient">يعتمد على التكافل.</span>
          </h2>
          <p className="mt-6 text-base lg:text-lg text-foreground/65 leading-relaxed">
            Island Haven ليس مشروعاً ربحيّاً. هو مجتمع يُبنى يوميّاً بأيدي
            داعميه ومنتسبيه. هذه ثلاث طرق ملموسة لتشاركنا القصّة.
          </p>
        </div>

        {/* 3-column cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {ways.map((w, i) => {
            const Icon = w.icon;
            const isPrimary = w.primary;
            return (
              <motion.a
                key={w.ar}
                href={w.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: i * 0.08 }}
                className={`group relative rounded-2xl p-8 lg:p-10 transition-all duration-500 hover:-translate-y-1 ${
                  isPrimary
                    ? "bg-primary text-primary-foreground shadow-soft-hover hover:shadow-[0_20px_60px_hsl(232_70%_30%/0.25)]"
                    : "bg-white border border-border shadow-soft hover:shadow-soft-hover hover:border-primary/25"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                    isPrimary
                      ? "bg-white/15 text-primary-foreground"
                      : "tile-soft"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div
                  className={`text-[11px] tracking-[0.15em] uppercase font-semibold mb-2 ${
                    isPrimary ? "text-primary-foreground/75" : "text-primary"
                  }`}
                >
                  {w.en}
                </div>
                <h3
                  className={`font-bold mb-3 text-2xl lg:text-3xl ${
                    isPrimary ? "text-primary-foreground" : "text-foreground"
                  }`}
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {w.ar}
                </h3>
                <p
                  className={`text-[14px] mb-3 italic ${
                    isPrimary ? "text-primary-foreground/85" : "text-foreground/55"
                  }`}
                >
                  {w.sub}
                </p>
                <p
                  className={`text-[15px] leading-relaxed mb-7 ${
                    isPrimary ? "text-primary-foreground/90" : "text-foreground/70"
                  }`}
                >
                  {w.body}
                </p>
                <div
                  className={`inline-flex items-center gap-2 font-semibold text-[14px] group-hover:gap-3 transition-all ${
                    isPrimary ? "text-primary-foreground" : "text-primary"
                  }`}
                >
                  {w.cta}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                </div>
              </motion.a>
            );
          })}
        </div>

        {/* Big donate magnet */}
        <div className="mt-14 lg:mt-16 flex flex-col items-center text-center gap-4">
          <a
            href="https://nas2nas.org"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-3 h-14 lg:h-16 px-10 lg:px-12 rounded-full bg-primary text-primary-foreground font-bold text-[15px] hover:bg-primary/90 transition-all duration-300 shadow-soft-hover hover:scale-[1.02]"
          >
            <Heart className="w-4 h-4" />
            تبرّع الآن — Nas to Nas
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
          </a>
          <p className="text-[12px] text-foreground/50 font-medium">
            تبرّع مباشر وآمن · ١٠٠٪ يصل إلى تشغيل المساحة
          </p>
        </div>
      </div>
    </section>
  );
}
