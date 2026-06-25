import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Support — "التكافل", told in the brand's own voice: Island Haven is a FREE
 * nonprofit, kept open by the people who stand with it. Editorial Apple-grade
 * treatment on the deep-navy canvas — solid oversized type with a single crimson
 * accent word (no gradient text), the brand crimson aura behind it, and ONE
 * deliberate inverted statement card for the donate ask. The two secondary
 * actions (Apply + Instagram) are quiet hairline-edged cards, not glass tiles.
 * Closes on the real brand belief, set large. From the people, for the people.
 */

// AR is the CMS-overridable source of truth (useContentSection).
const FALLBACK = {
  image: "/photos/IMG_8358.webp",
  eyebrow: "كن معنا",
  donateEyebrow: "تبرّع",
  donateSub: "عبر مبادرة «من النّاس إلى النّاس»",
  donateCta: "تبرّع الآن",
  donateHref: "https://nastonas.org/generalDonations/4/0",
  donateNote: "nastonas.org",
  sec1Href: "/apply",
  sec2Href: "https://www.instagram.com/ih_haven",
};

export function Support() {
  const { t, lang } = useLanguage();
  const c = useContentSection("support", FALLBACK);

  const secondary = [
    {
      en: "Apply",
      title: t({ ar: "انضمّ للمجتمع", en: "Join the community" }),
      body: t({
        ar: "خرّيج، مستقلّ، طالب، أو صاحب فكرة؟ افتح النموذج واحجز مكانك في المساحة.",
        en: "Graduate, freelancer, student or idea-owner? Open the form and claim your place in the space.",
      }),
      cta: t({ ar: "افتح النموذج", en: "Open the form" }),
      href: c.sec1Href,
    },
    {
      en: "Instagram",
      title: t({ ar: "شارك القصّة", en: "Share the story" }),
      body: t({
        ar: "تابعنا على إنستغرام، وانقل قصّة آيلاند هيفن إلى من قد يصنع الفرق.",
        en: "Follow us on Instagram and carry the Island Haven story to someone who can make a difference.",
      }),
      cta: t({ ar: "تابعنا @ih_haven", en: "Follow @ih_haven" }),
      href: c.sec2Href,
    },
  ];

  return (
    <section id="support" className="relative bg-background section-y overflow-hidden">
      {/* Place photo — faint, behind the canvas */}
      <div aria-hidden className="absolute inset-0 opacity-[0.14] pointer-events-none">
        <img
          src={imageUrl(c.image)}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, hsl(var(--background)/0.92) 0%, hsl(var(--background)/0.7) 50%, hsl(var(--background)/0.98) 100%)",
          }}
        />
      </div>

      {/* Signature crimson aura — the one accent, blooming behind the ask */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[70%] brand-aura opacity-80" />

      <div className="container-ih relative">
        {/* Lead — solid headline, one crimson accent word */}
        <div className="max-w-4xl">
          <div className="eyebrow mb-5">{t({ ar: "كن معنا", en: "Stand with us" })}</div>
          <motion.h2
            initial={{ y: 24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(2.1rem, 4.6vw, 3.8rem)", lineHeight: 1.05, letterSpacing: "-0.03em" }}
          >
            {t({ ar: "استمرار هذا المكان يقوم على ", en: "This place stays open through " })}
            <span className="text-primary">
              {t({ ar: "التكافل.", en: "solidarity." })}
            </span>
          </motion.h2>
          <motion.p
            initial={{ y: 16, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="t-body-lg mt-6 max-w-2xl text-foreground/85"
          >
            {t({
              ar: "آيلاند هيفن ليست مشروعًا ربحيًّا. تكاليف تشغيل المساحة — من إنترنت وكهرباء وصيانة — يغطّيها داعمون مثلك، وكلّ مساهمة تُبقي الأبواب مفتوحة أمام كفاءات غزّة.",
              en: "Island Haven isn't a for-profit venture. The running costs — internet, power and maintenance — are covered by supporters like you, and every contribution keeps the doors open for Gaza's talents.",
            })}
          </motion.p>
        </div>

        <div className="mt-14 lg:mt-20 grid grid-cols-12 gap-5 lg:gap-7 items-stretch">
          {/* THE deliberate inverted statement card — the donate ask */}
          <motion.a
            href={c.donateHref || "#"}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="support-donate"
            initial={{ y: 24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="group col-span-12 lg:col-span-7 relative bg-white text-[#0A0E1A] rounded-[24px] p-10 lg:p-14 overflow-hidden transition-transform duration-300 hover:-translate-y-1 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]"
          >
            {/* Crimson bloom — aligned to the brand's single accent */}
            <div
              aria-hidden
              className="absolute -top-24 -end-24 w-[300px] h-[300px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary)/0.16) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />
            <div className="relative">
              {/* Inverted card: text must be explicit DARK (never the near-white --foreground / .t-body tokens) */}
              <div className="eyebrow mb-1" style={{ color: "hsl(var(--primary-cta))" }}>{lang === "en" ? "Donate" : c.donateEyebrow}</div>
              <div className="text-[12px] text-[#0A0E1A]/55 font-medium mb-9">
                {t({ ar: "عبر مبادرة «من النّاس إلى النّاس»", en: "Through the من النّاس إلى النّاس initiative" })}
              </div>

              <h3
                className="font-display font-extrabold text-[#0A0E1A]"
                style={{ fontSize: "clamp(1.75rem, 3.6vw, 3rem)", lineHeight: 1.06, letterSpacing: "-0.028em" }}
              >
                {t({ ar: "كلّ مساهمة تُبقي", en: "Every gift keeps" })}
                <br />
                {t({ ar: "الأبواب مفتوحة.", en: "the doors open." })}
              </h3>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#0A0E1A]/70">
                {t({
                  ar: "تبرّعك يموّل المقاعد والإنترنت والكهرباء والإرشاد — لتبقى الحاضنة مجّانيّة لكلّ موهبة غزّيّة.",
                  en: "Your gift funds the seats, the internet, the power and the mentorship — so the incubator stays free for every Gazan talent.",
                })}
              </p>

              <div className="mt-10 flex items-center gap-4 flex-wrap">
                <span className="cta-fill inline-flex items-center justify-center gap-3 h-14 px-8 rounded-full font-bold text-[14px] shadow-soft transition-all duration-300">
                  {lang === "en" ? "Donate now" : c.donateCta}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </span>
                {c.donateNote && (
                  <span className="tnum text-[12px] text-[#0A0E1A]/45 font-medium">{c.donateNote}</span>
                )}
              </div>
            </div>
          </motion.a>

          {/* Two quiet secondary actions — hairline-edged, not glass */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-5 lg:gap-7">
            {secondary.map((s, i) => {
              const external = s.href?.startsWith("http");
              return (
                <motion.a
                  key={s.en}
                  href={s.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  data-testid={`support-secondary-${i}`}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.45, delay: 0.2 + i * 0.08 }}
                  className="group flex-1 flex flex-col rounded-[24px] border border-border-strong bg-surface-1 p-8 lg:p-10 transition-colors duration-300 hover:border-primary/40"
                >
                  <div className="eyebrow eyebrow-sand mb-5">{s.en}</div>
                  <h4
                    className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
                    style={{ fontSize: "clamp(1.3rem, 2vw, 1.7rem)", letterSpacing: "-0.018em", lineHeight: 1.15 }}
                  >
                    {s.title}
                  </h4>
                  <p className="t-body mt-3 mb-6">{s.body}</p>
                  <span className="mt-auto inline-flex items-center gap-2 text-[13px] font-semibold text-primary">
                    {s.cta}
                    <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                  </span>
                </motion.a>
              );
            })}
          </div>
        </div>

        {/* Closing — the brand belief, set large */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mt-[clamp(3.5rem,7vw,6rem)] font-display font-extrabold text-foreground max-w-4xl"
          style={{ fontSize: "clamp(1.8rem, 4vw, 3.2rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}
        >
          {t({ ar: "نؤمن أنّ الموهبة لا تحدّها الجغرافيا.", en: "We believe talent is not bound by geography." })}
        </motion.p>
      </div>
    </section>
  );
}
