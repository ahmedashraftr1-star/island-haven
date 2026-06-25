import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * BecomeMentorBand — editorial, photo-forward band in the approved WhatYouGet /
 * About house style. Real Gaza imagery on one column; an oversized SOLID headline
 * with a single crimson accent word, a lead in the authentic brand voice, and a
 * quiet hairline ledger (cerulean data numerals) of what mentoring is — plus one
 * decisive crimson CTA. Ties to the "Networking & Global Impact" axis: talent is
 * not bound by geography. Start-aligned, asymmetric.
 * No gradient text, no glass, no icon-tile grid, no pill row.
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
    <section
      className="relative section-y-compact overflow-hidden bg-surface-1"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="container-ih">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-center">
          {/* Photo — the place and its people, shown not described */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5"
          >
            <div className="overflow-hidden rounded-[20px] ring-1 ring-white/10">
              <img
                src={`${import.meta.env.BASE_URL}photos/IMG_8352.webp`}
                alt={t({ ar: "مرشدون ومنتسبون في آيلاند هيفن بغزّة", en: "Mentors and members at Island Haven in Gaza" })}
                loading="lazy"
                className="w-full aspect-[5/4] object-cover saturate-[1.04]"
              />
            </div>
          </motion.div>

          {/* Lead + ledger + CTA — start-aligned, oversized solid type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="lg:col-span-7"
          >
            <div className="eyebrow eyebrow-sand mb-5">
              {t({ ar: "كُن جزءًا من القصّة", en: "Be part of the story" })}
            </div>

            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(1.9rem, 3.8vw, 3.2rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
            >
              {t({ ar: "أرشِد موهبةً ", en: "Mentor talent " })}
              <span className="text-primary">{t({ ar: "لا تحدّها الجغرافيا", en: "the world hasn't met yet" })}</span>
              {t({ ar: ".", en: "." })}
            </h2>

            <p className="t-body mt-5 max-w-xl">
              {t({
                ar: "خبراء ومؤسّسون ومتخصّصون من حول العالم — شاركوا جيلًا غزّيًّا شابًّا ما تعلّمتموه. جلسة إرشادٍ فرديّة واحدة منكم قد تفتح بابًا كانت الحرب قد أغلقته.",
                en: "Experts, founders and specialists worldwide — share what you've learned with a young Gazan generation. One 1:1 mentoring session from you can open a door the war had closed.",
              })}
            </p>

            {/* Quiet hairline ledger — cerulean data numerals, no cards */}
            <div className="mt-8 border-t border-border-strong">
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
              className="group mt-9 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full cta-fill font-bold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]"
              data-testid="cta-become-mentor"
              onClick={() => console.log("[analytics] become-mentor cta clicked", { ref: "home-banner" })}
            >
              {t({ ar: "سجّل كمرشد", en: "Become a mentor" })}
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
