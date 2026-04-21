import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";
import { MagneticButton } from "./MagneticButton";

const pillars = ["مواقع", "أدوات", "تطويرات", "تحسينات"];
const pillarsEn = ["Sites", "Tools", "Upgrades", "Improvements"];

export function Programs() {
  return (
    <section id="programs" className="relative bg-background py-24 lg:py-32 border-t border-foreground/10">
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
        <EditorialHeader
          no="09"
          label="ما يحدث هنا"
          meta={<>Programs<br />& events</>}
          title={
            <>
              المكان يتنفّس بأهله،
              <br />
              <span className="text-primary italic">لا بجدرانه.</span>
            </>
          }
          sub="إلى جانب المساحة المفتوحة يوميّاً، يُنظَّم Island Haven ورشاً تدريبيّة تطبيقيّة ومبادرات داخليّة، بعضها يقوده الفريق، وبعضها يقوده المنتسبون أنفسهم."
        />

        {/* Hero feature: Made in Island Haven */}
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9 }}
          className="grid grid-cols-12 gap-6 lg:gap-10 mb-16 lg:mb-20"
        >
          <div className="col-span-12 lg:col-span-5 relative">
            <img
              src="/photos/IMG_8352.jpg"
              alt="جلسة عمل لمنتسبي آيلاند هيفن خلال فعالية صُنع في آيلاند هيفن"
              className="w-full aspect-[4/5] object-cover grayscale-[10%]"
            />
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] tracking-[0.3em] uppercase font-bold px-3 py-2">
              فعالية قادمة · Upcoming
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7">
            <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-bold mb-4">
              Feature N°09A
            </div>
            <h3
              className="font-extrabold text-foreground leading-[1.12]"
              style={{
                fontSize: "clamp(2.25rem, 5vw, 4.5rem)",
              }}
            >
              صُنع في
              <br />
              <span className="text-primary italic">آيلاند هيفن.</span>
            </h3>
            <div
              dir="ltr"
              className="mt-3 text-sm tracking-[0.3em] uppercase text-foreground/55 font-bold"
            >
              Made in Island Haven
            </div>
            <p className="mt-7 text-base lg:text-lg text-foreground/75 font-light leading-relaxed max-w-xl">
              فعاليّة جديدة نطلقها قريباً، نفتح فيها الباب أمام منتسبي المجتمع لاقتراح
              ما يريدون أن يصنعوه داخل المساحة. كلّ فكرة تُبنى من أصحابها، وتُنفَّذ معهم —
              لأنّ المكان يصير أجمل حين يصنعه أهله.
            </p>

            <div className="mt-10">
              <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-bold mb-4">
                نرحّب باقتراحاتكم في
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-foreground/12">
                {pillars.map((p, i) => (
                  <div
                    key={p}
                    className={`py-5 ${
                      i < pillars.length - 1 ? "sm:border-l border-foreground/12" : ""
                    } border-b sm:border-b-0`}
                  >
                    <div
                      className="font-bold text-foreground"
                      style={{ fontSize: "clamp(1.1rem, 1.6vw, 1.5rem)" }}
                    >
                      {p}
                    </div>
                    <div className="text-[10px] tracking-[0.3em] uppercase text-foreground/45 mt-1">
                      {pillarsEn[i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <MagneticButton
                href="https://www.instagram.com/ih_haven"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="inline-flex items-center justify-center h-12 px-7 border border-foreground text-foreground font-bold text-xs tracking-[0.25em] uppercase hover:bg-foreground hover:text-background transition-colors">
                  شاركنا فكرتك
                </span>
              </MagneticButton>
            </div>
          </div>
        </motion.article>

        {/* Two secondary programs as hairline rows */}
        <div className="border-t border-foreground/12">
          <div className="grid grid-cols-12 gap-4 lg:gap-10 items-baseline py-9 lg:py-11 border-b border-foreground/12">
            <div className="col-span-2 lg:col-span-1 text-[11px] tracking-[0.3em] font-bold text-foreground/45">
              09B
            </div>
            <div className="col-span-10 lg:col-span-4">
              <h3
                className="font-bold text-foreground leading-tight"
                style={{ fontSize: "clamp(1.4rem, 2.2vw, 2rem)" }}
              >
                ورش تدريبيّة دوريّة
              </h3>
              <div className="text-[10px] tracking-[0.3em] uppercase text-foreground/45 mt-2">
                Weekly workshops
              </div>
            </div>
            <p className="col-span-12 lg:col-span-7 text-foreground/75 font-light leading-relaxed">
              برامج عمليّة في مهارات سوق العمل، يقدّمها الفريق ومتطوّعون من المجتمع،
              مفتوحة للمنتسبين وغير المنتسبين على حدّ سواء.
            </p>
          </div>
          <div className="grid grid-cols-12 gap-4 lg:gap-10 items-baseline py-9 lg:py-11 border-b border-foreground/12">
            <div className="col-span-2 lg:col-span-1 text-[11px] tracking-[0.3em] font-bold text-foreground/45">
              09C
            </div>
            <div className="col-span-10 lg:col-span-4">
              <h3
                className="font-bold text-foreground leading-tight"
                style={{ fontSize: "clamp(1.4rem, 2.2vw, 2rem)" }}
              >
                جلسات تشبيك ولقاءات مهنيّة
              </h3>
              <div className="text-[10px] tracking-[0.3em] uppercase text-foreground/45 mt-2">
                Networking nights
              </div>
            </div>
            <p className="col-span-12 lg:col-span-7 text-foreground/75 font-light leading-relaxed">
              لقاءات شهريّة تجمع المستقلّين والخريجين والطلبة لتبادل الخبرات،
              وعرض مشاريع، وفتح أبواب التعاون بين أعضاء المجتمع.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
