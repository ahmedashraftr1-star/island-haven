import { motion } from "framer-motion";
import { MagneticButton } from "./MagneticButton";

const ways = [
  {
    no: "01",
    ar: "تبرّع",
    en: "Donate",
    sub: "كلّ مساهمة تُبقي الأبواب مفتوحة",
    body: "Island Haven مساحة مجّانيّة بالكامل، وتكاليف تشغيلها — من إنترنت وكهرباء وصيانة — يغطّيها داعمون مثلك. التبرّع مباشر وآمن عبر مبادرة من الناس إلى الناس.",
    cta: "تبرّع الآن",
    href: "https://nas2nas.org",
  },
  {
    no: "02",
    ar: "انضمّ",
    en: "Join",
    sub: "إن كنت في غزّة وتنطبق عليك المعايير",
    body: "إذا كنت مستقلاً أو خرّيجاً أو طالباً في سنة التخرّج، سجّل في نموذج الانتساب لتنضمّ إلى المجتمع. أو احجز مقعد ضيف لتجرّب المساحة أوّلاً.",
    cta: "افتح النموذج",
    href: "/apply",
  },
  {
    no: "03",
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
      className="relative bg-foreground text-background py-28 lg:py-36 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.07]">
        <img
          src="/photos/IMG_8341.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container relative mx-auto px-6 lg:px-10 max-w-7xl">
        {/* Manifesto-style headline */}
        <div className="grid grid-cols-12 gap-6 lg:gap-10 mb-16 lg:mb-24">
          <div className="col-span-12 lg:col-span-9">
            <div className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold mb-5">
              [ N°16 — كيف تكون جزءاً من القصّة ]
            </div>
            <h2
              className="font-extrabold text-background leading-[1.12] tracking-tight"
              style={{
                fontSize: "clamp(2.5rem, 7vw, 6rem)",
              }}
            >
              استمرار هذا المكان
              <br />
              <span className="text-primary italic">يعتمد على التكافل.</span>
            </h2>
            <p className="mt-8 text-lg lg:text-xl text-background/75 font-light leading-relaxed max-w-2xl">
              Island Haven ليس مشروعاً ربحيّاً، ولا مكاناً يكتفي بنفسه. هو مجتمع
              يُبنى يوميّاً بأيدي داعميه ومنتسبيه. هذه ثلاث طرق ملموسة لتشاركنا القصّة.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-3 hidden lg:flex justify-end items-end">
            <div className="text-[10px] tracking-[0.4em] uppercase text-background/50 font-bold text-right">
              Three ways
              <br />
              to keep us alive
            </div>
          </div>
        </div>

        {/* 3-column editorial table */}
        <div className="border-t border-background/20">
          {ways.map((w, i) => (
            <motion.a
              key={w.no}
              href={w.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="group grid grid-cols-12 gap-4 lg:gap-10 items-start py-10 lg:py-14 border-b border-background/20 hover:bg-primary transition-colors"
            >
              <div className="col-span-2 lg:col-span-1">
                <div className="text-[11px] tracking-[0.3em] font-bold text-background/55 group-hover:text-primary-foreground/80">
                  {w.no}
                </div>
              </div>
              <div className="col-span-10 lg:col-span-4">
                <h3
                  className="font-extrabold text-background group-hover:text-primary-foreground leading-none"
                  style={{
                    fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                  }}
                >
                  {w.ar}
                </h3>
                <div className="text-[10px] tracking-[0.4em] uppercase text-primary group-hover:text-primary-foreground mt-3 font-bold">
                  {w.en}
                </div>
                <div className="mt-4 text-sm text-background/65 group-hover:text-primary-foreground/85 font-light italic">
                  {w.sub}
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5">
                <p className="text-base lg:text-lg text-background/80 group-hover:text-primary-foreground/90 font-light leading-relaxed">
                  {w.body}
                </p>
              </div>
              <div className="col-span-12 lg:col-span-2 lg:text-right text-[11px] tracking-[0.3em] uppercase font-bold text-primary group-hover:text-primary-foreground flex items-center lg:justify-end gap-2 lg:pt-3">
                {w.cta}
                <span className="inline-block transition-transform group-hover:-translate-x-2 rtl:group-hover:translate-x-2">
                  →
                </span>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Big donate magnet at end */}
        <div className="mt-16 lg:mt-20 flex flex-col items-start gap-5">
          <MagneticButton
            href="https://nas2nas.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="inline-flex items-center justify-center h-16 px-12 bg-primary text-primary-foreground font-bold text-sm tracking-[0.3em] uppercase hover:bg-background hover:text-foreground transition-colors">
              تبرّع الآن — Nas to Nas
            </span>
          </MagneticButton>
          <p className="text-[10px] tracking-[0.4em] uppercase text-background/50 font-bold">
            Secure · مباشر وآمن · 100% to operations
          </p>
        </div>
      </div>
    </section>
  );
}
