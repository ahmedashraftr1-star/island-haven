import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { EditorialHeader } from "./EditorialHeader";
import { imageUrl, useContentSection } from "@/hooks/use-content";

const FALLBACK = {
  label: "الفعاليّات والبرامج",
  titleA: "المكان يتنفّس بأهله،",
  titleAccent: "لا بجدرانه.",
  sub: "إلى جانب المساحة المفتوحة يوميّاً، يُنظَّم Island Haven ورشاً تدريبيّة تطبيقيّة ومبادرات داخليّة، بعضها يقوده الفريق، وبعضها يقوده المنتسبون أنفسهم.",
  featureImage: "/photos/IMG_8352.webp",
  featureBadge: "فعاليّة قادمة",
  featureEyebrow: "Made in Island Haven",
  featureTitle: "صُنع في آيلاند هيفن.",
  featureBody:
    "فعاليّة جديدة نطلقها قريباً، نفتح فيها الباب أمام منتسبي المجتمع لاقتراح ما يريدون أن يصنعوه داخل المساحة.",
  chipsLabel: "نرحّب باقتراحاتكم في",
  chip1Ar: "مواقع", chip1En: "Sites",
  chip2Ar: "أدوات", chip2En: "Tools",
  chip3Ar: "تطويرات", chip3En: "Upgrades",
  chip4Ar: "تحسينات", chip4En: "Improvements",
  featureCta: "شاركنا فكرتك",
  featureCtaHref: "https://www.instagram.com/ih_haven",
  sec1Ar: "ورش تدريبيّة دوريّة", sec1En: "Weekly workshops", sec1Body: "",
  sec2Ar: "جلسات تشبيك ولقاءات مهنيّة", sec2En: "Networking nights", sec2Body: "",
};

export function Programs() {
  const c = useContentSection("programs", FALLBACK);
  const chips = [
    { ar: c.chip1Ar, en: c.chip1En },
    { ar: c.chip2Ar, en: c.chip2En },
    { ar: c.chip3Ar, en: c.chip3En },
    { ar: c.chip4Ar, en: c.chip4En },
  ].filter((x) => x.ar);
  const secondary = [
    { ar: c.sec1Ar, en: c.sec1En, body: c.sec1Body },
    { ar: c.sec2Ar, en: c.sec2En, body: c.sec2Body },
  ].filter((x) => x.ar);

  return (
    <section id="programs" className="relative bg-muted/40 py-24 lg:py-32 border-y border-border">
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px]">
        <EditorialHeader
          label={c.label}
          title={<>{c.titleA}<br /><span className="text-accent-gradient">{c.titleAccent}</span></>}
          sub={c.sub}
        />

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
                src={imageUrl(c.featureImage)}
                alt={c.featureTitle}
                className="w-full h-full min-h-[320px] lg:min-h-[480px] object-cover"
              />
              {c.featureBadge && (
                <div className="absolute top-5 right-5 inline-flex items-center gap-2 h-8 px-3 rounded-full bg-white text-primary text-[11px] font-bold tracking-wide shadow-soft">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {c.featureBadge}
                </div>
              )}
            </div>
            <div className="col-span-12 lg:col-span-7 p-8 lg:p-12">
              <div className="text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-4">
                {c.featureEyebrow}
              </div>
              <h3
                className="font-bold text-foreground leading-tight"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", letterSpacing: "-0.02em" }}
              >
                {c.featureTitle}
              </h3>
              <p className="mt-5 text-base lg:text-lg text-foreground/70 leading-relaxed max-w-xl whitespace-pre-line">
                {c.featureBody}
              </p>

              {chips.length > 0 && (
                <div className="mt-8">
                  <div className="text-[11px] tracking-[0.15em] uppercase text-foreground/45 font-semibold mb-3">
                    {c.chipsLabel}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {chips.map((p) => (
                      <div key={p.ar} className="bg-muted/60 rounded-xl px-4 py-3">
                        <div className="font-bold text-foreground text-[15px]">{p.ar}</div>
                        <div className="text-[10px] tracking-wide text-foreground/45 mt-0.5">{p.en}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {c.featureCta && (
                <a
                  href={c.featureCtaHref || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-[14px] hover:bg-primary/90 transition-all duration-300 shadow-soft hover:shadow-soft-hover hover:scale-[1.02]"
                >
                  {c.featureCta}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                </a>
              )}
            </div>
          </div>
        </motion.article>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {secondary.map((card, i) => (
            <motion.div
              key={card.ar}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className="bg-white border border-border rounded-2xl p-7 lg:p-8 shadow-soft hover:shadow-soft-hover hover:border-primary/25 transition-all duration-500 hover:-translate-y-1"
            >
              <div className="text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-3">
                {card.en}
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-3">{card.ar}</h3>
              <p className="text-[15px] text-foreground/65 leading-relaxed whitespace-pre-line">
                {card.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
