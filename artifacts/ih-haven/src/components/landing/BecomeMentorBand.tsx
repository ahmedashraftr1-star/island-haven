import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

/**
 * BecomeMentorBand — a confident statement band in the canonical house style
 * (NumbersBand / WhatYouGet / About): a large full-bleed Gaza photograph with a
 * dark gradient for legibility on one column, and on the other an oversized SOLID
 * font-display headline with a single crimson accent word, a tight authentic
 * lead (expert founders & mentors worldwide give 1:1 mentorship — talent is not
 * bound by geography), a quiet hairline ledger in cerulean numerals, and one
 * decisive .cta-fill CTA. Start-aligned, asymmetric, on-brand depth.
 * No icon tile, no glass, no gradient text, no scheme-flip cards.
 */
export function BecomeMentorBand() {
  const { lang, t } = useLanguage();

  const idx = (i: number) =>
    lang === "en" ? String(i + 1).padStart(2, "0") : ["٠١", "٠٢", "٠٣"][i];

  const ledger = [
    {
      title: t({ ar: "جلسة واحدة تكفي", en: "One session is enough" }),
      body: t({
        ar: "وقتك أنت — جلسة فرديّة واحدة منك قد تُغيّر مسار حياةٍ كاملة.",
        en: "Your schedule — a single 1:1 session from you can change the course of a life.",
      }),
    },
    {
      title: t({ ar: "خبرتك، لا جغرافيتك", en: "Your expertise, not your geography" }),
      body: t({
        ar: "تُرشد عن بُعد من أيّ مكان في العالم — لأنّ الموهبة لا تحدّها الحدود.",
        en: "Mentor remotely from anywhere — because talent is not bound by borders.",
      }),
    },
    {
      title: t({ ar: "أثر يتجاوز الحدود", en: "Impact beyond the borders" }),
      body: t({
        ar: "تربط كفاءة غزّيّة بالاقتصاد الرقميّ العالميّ — أثرٌ حقيقيّ، مجّانًا تمامًا.",
        en: "You connect Gazan talent to the global digital economy — real impact, entirely free.",
      }),
    },
  ];

  return (
    <section className="relative bg-surface-1 section-y overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[60%] brand-aura opacity-60" />

      <div className="container-ih relative">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-center">
          {/* Statement — start-aligned, oversized solid type, one crimson accent */}
          <Reveal as="div" className="lg:col-span-7 lg:order-1">
            <div className="flex items-center gap-3 mb-5">
              <span aria-hidden className="h-px w-9 bg-primary/50" />
              <span className="eyebrow">{t({ ar: "كُن جزءًا من القصّة", en: "Be part of the story" })}</span>
            </div>

            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(2rem, 4.4vw, 3.6rem)", lineHeight: 1.04, letterSpacing: "-0.028em" }}
            >
              {t({ ar: "أرشِد موهبةً ", en: "Mentor talent " })}
              <span className="text-primary">{t({ ar: "لا تحدّها الجغرافيا", en: "the world hasn't met yet" })}</span>
              {t({ ar: ".", en: "." })}
            </h2>

            <p className="t-body-lg mt-5 max-w-xl">
              {t({
                ar: "خبراء ومؤسّسون ومتخصّصون من حول العالم — شاركوا جيلًا غزّيًّا شابًّا ما تعلّمتموه عبر جلسات إرشادٍ فرديّة. جلسة واحدة منكم قد تفتح بابًا كانت الحرب قد أغلقته.",
                en: "Expert founders, mentors and specialists worldwide — share what you've learned with a young Gazan generation through 1:1 mentorship. One session from you can open a door the war had closed.",
              })}
            </p>

            {/* Quiet hairline ledger — cerulean data numerals, no cards */}
            <div className="mt-9 border-t border-border-strong">
              {ledger.map((item, i) => (
                <div
                  key={item.title}
                  className="grid grid-cols-[auto_1fr] gap-x-5 sm:gap-x-7 items-baseline border-b border-border py-5"
                >
                  <span className="font-display text-[15px] font-bold tnum text-sand leading-none">
                    {idx(i)}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold text-foreground">{item.title}</h3>
                    <p className="t-body mt-1.5 max-w-lg">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/become-mentor?ref=home-banner"
              className="group mt-9 inline-flex items-center gap-2.5 h-12 px-7 rounded-full cta-fill font-bold text-[14px]"
              data-testid="cta-become-mentor"
            >
              {t({ ar: "سجّل كمرشد", en: "Become a mentor" })}
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
            </Link>
          </Reveal>

          {/* Photo — the place and its people, shown large with a dark gradient */}
          <Reveal as="div" delay={0.08} className="lg:col-span-5 lg:order-2">
            <div className="relative overflow-hidden rounded-[20px] ring-1 ring-white/10 shadow-soft">
              <img
                src="/photos/IMG_8352.webp"
                alt={t({ ar: "مرشدون ومنتسبون في آيلاند هيفن بغزّة", en: "Mentors and members at Island Haven in Gaza" })}
                loading="lazy"
                className="w-full h-[clamp(380px,52vw,560px)] object-cover object-center saturate-[1.04]"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/85 via-[#0A0E1A]/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 lg:p-7">
                <div className="text-[11px] tracking-[0.2em] uppercase text-white/80 font-semibold mb-1.5">
                  {t({ ar: "من داخل المساحة", en: "Inside the space" })}
                </div>
                <div className="font-display font-bold text-white text-[clamp(1.05rem,1.9vw,1.5rem)]">
                  {t({ ar: "موهبة تنتظر من يأخذ بيدها", en: "Talent waiting for a hand to guide it" })}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
