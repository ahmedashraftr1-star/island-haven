import { motion } from "framer-motion";
import { Heart, UserPlus, Share2, ArrowLeft } from "lucide-react";

const secondary = [
  {
    icon: UserPlus,
    ar: "انضمّ للمجتمع",
    en: "Apply",
    body: "إذا كنت في غزّة وتنطبق عليك المعايير، سجّل في نموذج الانتساب.",
    cta: "افتح النموذج",
    href: "/apply",
  },
  {
    icon: Share2,
    ar: "شارك القصّة",
    en: "Share",
    body: "تابعنا على وسائل التواصل، وأرسل صفحاتنا لكلّ من قد يهمّه الأمر.",
    cta: "تابعنا",
    href: "https://www.instagram.com/ih_haven",
  },
];

export function Support() {
  return (
    <section
      id="support"
      className="relative bg-[#0A0E1A] text-white py-28 lg:py-40 overflow-hidden"
    >
      {/* Cinematic photo backdrop */}
      <div aria-hidden className="absolute inset-0 opacity-[0.22] pointer-events-none">
        <img
          src={`${import.meta.env.BASE_URL}photos/IMG_8358.jpg`}
          alt=""
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,14,26,0.92) 0%, rgba(10,14,26,0.65) 50%, rgba(10,14,26,0.98) 100%)",
          }}
        />
      </div>

      {/* Indigo glow halo bottom-right */}
      <div
        aria-hidden
        className="absolute bottom-0 right-0 w-[60vw] h-[60vh] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(232 100% 65% / 0.22) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />

      <div className="container relative mx-auto px-6 lg:px-12 max-w-[1500px]">
        {/* Editorial eyebrow */}
        <div className="flex items-center gap-3 mb-10 lg:mb-14">
          <span className="h-[1px] w-10 bg-white/40" />
          <span className="text-[11px] tracking-[0.22em] uppercase text-white/75 font-semibold">
            Stand with us · كن معنا
          </span>
        </div>

        {/* Massive headline */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-bold text-white max-w-[1100px]"
          style={{
            fontSize: "clamp(2.5rem, 6.5vw, 6rem)",
            lineHeight: 0.99,
            letterSpacing: "-0.035em",
          }}
        >
          استمرار هذا المكان
          <br />
          يعتمد على{" "}
          <span className="text-accent-gradient">التكافل.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mt-8 lg:mt-10 max-w-2xl text-lg lg:text-xl text-white/75 leading-relaxed"
        >
          Island Haven ليس مشروعاً ربحيّاً. هو مجتمع يُبنى يوميّاً
          بأيدي داعميه ومنتسبيه — وكلّ مساهمة تُبقي الأبواب مفتوحة.
        </motion.p>

        {/* Hero donate card + secondary */}
        <div className="mt-16 lg:mt-24 grid grid-cols-12 gap-5 lg:gap-7">
          {/* PRIMARY DONATE — full bleed white card, dramatic */}
          <motion.a
            href="https://nas2nas.org"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="group col-span-12 lg:col-span-7 relative bg-white text-[#0A0E1A] rounded-3xl p-10 lg:p-14 overflow-hidden hover:scale-[1.01] transition-transform duration-700 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]"
          >
            {/* Indigo accent corner */}
            <div
              aria-hidden
              className="absolute -top-20 -left-20 w-[280px] h-[280px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(232 100% 65% / 0.18) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center">
                  <Heart className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-primary font-semibold">
                    Donate · تبرّع
                  </div>
                  <div className="text-[12px] text-foreground/55 font-medium mt-0.5">
                    عبر مبادرة من الناس إلى الناس
                  </div>
                </div>
              </div>

              <h3
                className="font-bold text-foreground mb-5"
                style={{
                  fontSize: "clamp(1.75rem, 3.5vw, 3rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.025em",
                }}
              >
                كلّ مساهمة تُبقي
                <br />
                الأبواب مفتوحة.
              </h3>
              <p className="text-base lg:text-lg text-foreground/65 leading-relaxed max-w-lg mb-10">
                تكاليف تشغيل المساحة — من إنترنت وكهرباء وصيانة — يغطّيها
                داعمون مثلك. تبرّع مباشر وآمن، يصل ١٠٠٪ إلى التشغيل.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center justify-center gap-3 h-14 px-8 rounded-full bg-primary text-primary-foreground font-bold text-[14px] group-hover:bg-primary/90 transition-all duration-300 shadow-soft">
                  تبرّع الآن
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
                </span>
                <span className="text-[12px] text-foreground/45 font-medium">
                  nas2nas.org
                </span>
              </div>
            </div>
          </motion.a>

          {/* SECONDARY ACTIONS */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-5 lg:gap-7">
            {secondary.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.a
                  key={s.ar}
                  href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.08 }}
                  className="group flex-1 relative bg-white/[0.04] backdrop-blur-md border border-white/15 rounded-3xl p-8 lg:p-10 hover:bg-white/[0.08] hover:border-white/25 transition-all duration-500"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 text-white flex items-center justify-center">
                      <Icon className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    <div className="text-[10px] tracking-[0.18em] uppercase text-white/55 font-semibold">
                      {s.en}
                    </div>
                  </div>
                  <h4 className="font-bold text-white text-2xl lg:text-[26px] mb-2.5 tracking-tight">
                    {s.ar}
                  </h4>
                  <p className="text-[14px] text-white/65 leading-relaxed mb-5">
                    {s.body}
                  </p>
                  <div className="inline-flex items-center gap-2 text-white font-semibold text-[13px] group-hover:gap-3 transition-all">
                    {s.cta}
                    <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                  </div>
                </motion.a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
