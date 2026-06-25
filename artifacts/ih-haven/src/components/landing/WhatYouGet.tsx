import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

/**
 * WhatYouGet — the incubator's core promise, told the way Apple tells a product
 * story: real photography of the place, oversized solid type, and an editorial
 * numbered ledger (NOT a grid of identical icon-tile cards). Left photo column,
 * right index of what membership gives you, divided by hairlines. No gradient
 * text, no glass, no icon tiles — photography and typography carry it.
 */
export function WhatYouGet() {
  const { t, lang } = useLanguage();

  const idx = (i: number) =>
    lang === "en" ? String(i + 1).padStart(2, "0") : ["٠١", "٠٢", "٠٣", "٠٤"][i];

  const pillars = [
    {
      title: t({ ar: "مساحة عمل مجّانيّة", en: "A free workspace" }),
      body: t({
        ar: "مقعد ثابت في مساحة هادئة، بإنترنت موثوق وكهرباء — احجزه متى احتجت.",
        en: "A reliable seat in a calm space with stable internet and power — book it whenever you need.",
      }),
      href: "/book",
      cta: t({ ar: "احجز مقعدك", en: "Book a seat" }),
    },
    {
      title: t({ ar: "إرشاد من خبراء", en: "Expert mentorship" }),
      body: t({
        ar: "جلسات فرديّة مع مرشدين وروّاد أعمال ومتخصّصين — هندسةً وتصميمًا وأعمالًا.",
        en: "1:1 sessions with mentors, founders and specialists — engineering, design and business.",
      }),
      href: "/experts",
      cta: t({ ar: "تعرّف على المرشدين", en: "Meet the mentors" }),
    },
    {
      title: t({ ar: "برامج ودفعات + Demo Day", en: "Programs, cohorts & Demo Day" }),
      body: t({
        ar: "مسارات احتضان وتسريع منظّمة، تُختم بيوم عرضٍ أمام شبكة من الدّاعمين.",
        en: "Structured incubation & acceleration tracks that culminate in a Demo Day to our network.",
      }),
      href: "/programs",
      cta: t({ ar: "استكشف البرامج", en: "Explore programs" }),
    },
    {
      title: t({ ar: "شبكة ومجتمع", en: "A network & community" }),
      body: t({
        ar: "مجتمع من المستقلّين والخرّيجين والمؤسّسين — تعاون، أعمال، وفرص.",
        en: "A community of freelancers, graduates and founders — collaboration, work and opportunity.",
      }),
      href: "/members",
      cta: t({ ar: "تصفّح المجتمع", en: "Browse the community" }),
    },
  ];

  return (
    <section id="what-you-get" className="theme-light relative bg-surface-1 section-y">
      <div className="container-ih">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-start">
          {/* Photo + lead — the place, shown not described */}
          <Reveal as="div" className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="eyebrow mb-5">
              {t({ ar: "ماذا تأخذ من آيلاند", en: "What membership gives you" })}
            </div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
            >
              {t({ ar: "حاضنة كاملة — مجّانًا.", en: "A full incubator — free." })}
            </h2>
            <p className="t-body mt-5 max-w-md">
              {t({
                ar: "مساحة، إرشاد، برامج، وشبكة. كلّ ما يحتاجه صانعٌ ليبدأ ويَنمو، من قلب غزّة.",
                en: "Space, mentorship, programs and a network. Everything a maker needs to start and grow — from the heart of Gaza.",
              })}
            </p>
            <div className="mt-8 overflow-hidden rounded-[20px] ring-1 ring-border-strong shadow-soft">
              <img
                src="/photos/IMG_8347.webp"
                alt={t({ ar: "مساحة عمل آيلاند هيفن في غزّة", en: "The Island Haven workspace in Gaza" })}
                loading="lazy"
                className="w-full aspect-[5/4] object-cover saturate-[1.03]"
              />
            </div>
          </Reveal>

          {/* Editorial index — numbered ledger, hairline-divided, no cards */}
          <div className="lg:col-span-7">
            {pillars.map((p, i) => (
              <Reveal key={p.href} delay={i * 0.05}>
                <Link
                  href={p.href}
                  className="group grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-9 items-baseline border-t border-border-strong py-7 sm:py-9 first:border-t-0 first:pt-0 transition-colors hover:border-primary/40"
                  data-testid={`pillar-${p.href.slice(1)}`}
                >
                  <span className="font-display text-[clamp(1.5rem,2.4vw,2.1rem)] font-bold tabular-nums text-fg-faint group-hover:text-primary transition-colors leading-none">
                    {idx(i)}
                  </span>
                  <div>
                    <h3
                      className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
                      style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.85rem)", letterSpacing: "-0.018em", lineHeight: 1.15 }}
                    >
                      {p.title}
                    </h3>
                    <p className="t-body mt-2.5 max-w-xl">{p.body}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-primary">
                      {p.cta}
                      <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
