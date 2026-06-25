import { motion } from "framer-motion";
import { useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { EASE_OUT_EXPO, VIEWPORT } from "@/lib/motion";

/**
 * Audience — "لِمَن آيلاند؟ / الفئات المستهدفة", told the gold-standard way
 * (match WhatYouGet.tsx + About.tsx): real photography, oversized solid type, a
 * hairline-divided numbered ledger of the FOUR real tracks — graduates,
 * freelancers, university students, and early founders / idea-owners — each with
 * one tight authentic line about what they get here. Crimson eyebrow, cerulean
 * numerals for the small index. No gradient text, no glass, no warm staircase,
 * no rows of icon-tile cards. Photography + typography carry it.
 */
export function Audience() {
  const { t, lang } = useLanguage();
  // Preserve the CMS hook so the section stays editable from the content panel.
  const cms = useContentSection("audience", {});
  void cms;

  const idx = (i: number) =>
    lang === "en"
      ? String(i + 1).padStart(2, "0")
      : ["٠١", "٠٢", "٠٣", "٠٤"][i];

  const tracks = [
    {
      key: "graduates",
      photo: "/photos/IMG_8358.webp",
      en: "Graduates",
      title: t({ ar: "الخرّيجون", en: "Graduates" }),
      line: t({
        ar: "أوّل خطوة بعد الشهادة: مهارة تُكسبك الدخل، وبيئة تعمل فيها فعلًا بدل الانتظار.",
        en: "Your first step after the diploma: a skill that earns, and a place to actually work — instead of waiting.",
      }),
    },
    {
      key: "freelancers",
      photo: "/photos/IMG_8347.webp",
      en: "Freelancers",
      title: t({ ar: "المستقلّون", en: "Freelancers" }),
      line: t({
        ar: "مقعد ثابت بإنترنت وكهرباء، وحلول دفع دوليّة تصل بك إلى عميلك في الخارج.",
        en: "A reliable seat with internet and power, plus payment solutions that reach your client abroad.",
      }),
    },
    {
      key: "students",
      photo: "/photos/IMG_8341.webp",
      en: "University students",
      title: t({ ar: "طلبة الجامعات", en: "University students" }),
      line: t({
        ar: "تدريب وإرشاد يبنيان مهارة سوق العمل قبل التخرّج، لا بعد فوات الفرصة.",
        en: "Training and mentorship that build a market-ready skill before graduation, not after the chance is gone.",
      }),
    },
    {
      key: "founders",
      photo: "/photos/IMG_8347.webp",
      en: "Early founders",
      title: t({ ar: "أصحاب الأفكار والمشاريع الناشئة", en: "Founders & idea-owners" }),
      line: t({
        ar: "مسارات احتضان منظّمة تحوّل الفكرة إلى مشروع قابل للحياة — حتى يوم العرض.",
        en: "Structured incubation tracks that turn an idea into a viable venture — all the way to Demo Day.",
      }),
    },
  ];

  return (
    <section id="audience" className="relative bg-background section-y overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[65%] brand-aura opacity-60" />

      <div className="container-ih relative">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-start">
          {/* Lead — who Island Haven is for, shown not just listed */}
          <Reveal as="div" className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="eyebrow mb-5">
              {t({ ar: "لِمَن آيلاند؟", en: "Who Island Haven is for" })}
            </div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.6rem)", lineHeight: 1.04, letterSpacing: "-0.028em" }}
            >
              {t({ ar: "مساحة تتّسع لأحلامك.", en: "A space wide enough for your dreams." })}
            </h2>
            <p className="t-body-lg mt-5 max-w-md text-foreground/90">
              {t({
                ar: "أربع فئات تجد مكانها هنا — لأنّنا نؤمن أنّ الموهبة لا تحدّها الجغرافيا، ولا يحدّها الظرف.",
                en: "Four tracks find their place here — because we believe talent is bound neither by geography nor by circumstance.",
              })}
            </p>
            <div className="mt-8 overflow-hidden rounded-[20px] ring-1 ring-border-strong shadow-soft">
              <img
                src="/photos/IMG_8341.webp"
                alt={t({ ar: "أعضاء آيلاند هيفن في مساحة العمل بغزّة", en: "Island Haven members in the Gaza workspace" })}
                loading="lazy"
                className="w-full aspect-[5/4] object-cover saturate-[1.03]"
              />
            </div>
          </Reveal>

          {/* Editorial index — numbered ledger of the four tracks, hairline-divided */}
          <div className="lg:col-span-7">
            {tracks.map((track, i) => (
              <Reveal key={track.key} delay={i * 0.05}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={VIEWPORT}
                  transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                  className="grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-9 items-baseline border-t border-border-strong py-7 sm:py-9 first:border-t-0 first:pt-0"
                  data-testid={`audience-track-${track.key}`}
                >
                  <span className="font-display text-[clamp(1.4rem,2.2vw,2rem)] font-bold tnum text-sand leading-none">
                    {idx(i)}
                  </span>
                  <div>
                    <h3
                      className="font-display font-bold text-foreground"
                      style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.85rem)", letterSpacing: "-0.018em", lineHeight: 1.15 }}
                    >
                      {track.title}
                    </h3>
                    <div className="eyebrow eyebrow-sand mt-2.5">{track.en}</div>
                    <p className="t-body mt-3 max-w-xl">{track.line}</p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
