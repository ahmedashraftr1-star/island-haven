import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { EditorialHeader } from "./EditorialHeader";

const pillars = ["مواقع", "أدوات", "تطويرات", "تحسينات"];
const pillarsEn = ["Sites", "Tools", "Upgrades", "Improvements"];

export function Programs() {
  return (
    <section id="programs" className="relative bg-muted/40 py-24 lg:py-32 border-y border-border">
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px]">
        <EditorialHeader
          label="الفعاليّات والبرامج"
          title={
            <>
              المكان يتنفّس بأهله،
              <br />
              <span className="text-accent-gradient">لا بجدرانه.</span>
            </>
          }
          sub="إلى جانب المساحة المفتوحة يوميّاً، يُنظَّم Island Haven ورشاً تدريبيّة تطبيقيّة ومبادرات داخليّة، بعضها يقوده الفريق، وبعضها يقوده المنتسبون أنفسهم."
        />

        {/* Hero feature: Made in Island Haven */}
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="bg-white border border-border rounded-3xl shadow-soft overflow-hidden mb-6 lg:mb-7"
        >
          <div className="grid grid-cols-12 gap-0 items-stretch">
            <div className="col-span-12 lg:col-span-5 relative">
              <img
                src={`${import.meta.env.BASE_URL}photos/IMG_8352.jpg`}
                alt="جلسة عمل لمنتسبي آيلاند هيفن خلال فعالية صُنع في آيلاند هيفن"
                className="w-full h-full min-h-[320px] lg:min-h-[480px] object-cover"
              />
              <div className="absolute top-5 right-5 inline-flex items-center gap-2 h-8 px-3 rounded-full bg-white text-primary text-[11px] font-bold tracking-wide shadow-soft">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                فعاليّة قادمة
              </div>
            </div>
            <div className="col-span-12 lg:col-span-7 p-8 lg:p-12">
              <div className="text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-4">
                Made in Island Haven
              </div>
              <h3
                className="font-bold text-foreground leading-tight"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.25rem)",
                  letterSpacing: "-0.02em",
                }}
              >
                صُنع في آيلاند هيفن.
              </h3>
              <p className="mt-5 text-base lg:text-lg text-foreground/70 leading-relaxed max-w-xl">
                فعاليّة جديدة نطلقها قريباً، نفتح فيها الباب أمام منتسبي المجتمع لاقتراح
                ما يريدون أن يصنعوه داخل المساحة. كلّ فكرة تُبنى من أصحابها، وتُنفَّذ معهم —
                لأنّ المكان يصير أجمل حين يصنعه أهله.
              </p>

              <div className="mt-8">
                <div className="text-[11px] tracking-[0.15em] uppercase text-foreground/45 font-semibold mb-3">
                  نرحّب باقتراحاتكم في
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {pillars.map((p, i) => (
                    <div
                      key={p}
                      className="bg-muted/60 rounded-xl px-4 py-3"
                    >
                      <div className="font-bold text-foreground text-[15px]">
                        {p}
                      </div>
                      <div className="text-[10px] tracking-wide text-foreground/45 mt-0.5">
                        {pillarsEn[i]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="https://www.instagram.com/ih_haven"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-[14px] hover:bg-primary/90 transition-all duration-300 shadow-soft hover:shadow-soft-hover hover:scale-[1.02]"
              >
                شاركنا فكرتك
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </a>
            </div>
          </div>
        </motion.article>

        {/* Two secondary programs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {[
            {
              ar: "ورش تدريبيّة دوريّة",
              en: "Weekly workshops",
              body: "برامج عمليّة في مهارات سوق العمل، يقدّمها الفريق ومتطوّعون من المجتمع، مفتوحة للمنتسبين وغير المنتسبين على حدّ سواء.",
            },
            {
              ar: "جلسات تشبيك ولقاءات مهنيّة",
              en: "Networking nights",
              body: "لقاءات شهريّة تجمع المستقلّين والخرّيجين والطلبة لتبادل الخبرات، وعرض مشاريع، وفتح أبواب التعاون بين أعضاء المجتمع.",
            },
          ].map((c, i) => (
            <motion.div
              key={c.ar}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className="bg-white border border-border rounded-2xl p-7 lg:p-8 shadow-soft hover:shadow-soft-hover hover:border-primary/25 transition-all duration-500 hover:-translate-y-1"
            >
              <div className="text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-3">
                {c.en}
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-3">
                {c.ar}
              </h3>
              <p className="text-[15px] text-foreground/65 leading-relaxed">
                {c.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
