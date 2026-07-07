import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { imageUrl } from "@/hooks/use-content";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { Reveal } from "./Reveal";

/**
 * WhatYouGet — the value-of-membership section, told at hero power: glass tiles
 * FLOATING on a vivid full-bleed Gaza photograph + an ambient lit field, the
 * same "Vision Pro" register as FeaturedMembers. A big calm headline, and each
 * value of membership (workspace, mentorship, programs, community) set as a
 * hairline-separated editorial ROW inside a single frosted `glass-panel` tile:
 * a large display title on the start, a concise description on a readable
 * measure, a small terracotta index. Depth + type carry it. Terracotta is the
 * sole accent. All data / i18n / routes / testids kept.
 */
export function WhatYouGet() {
  const { t } = useLanguage();

  // A calm, roomy list of what membership gives — set as editorial rows.
  const gives = [
    {
      stat: "٦",
      title: t({ ar: "مساحة عمل مجّانيّة", en: "A free workspace" }),
      body: t({
        ar: "مقعد ثابت في مساحة هادئة، بإنترنت موثوق وكهرباء — احجزه متى احتجت.",
        en: "A reliable seat in a calm space with stable internet and power — book it whenever you need.",
      }),
      href: "/book",
    },
    {
      title: t({ ar: "إرشاد من خبراء", en: "Expert mentorship" }),
      body: t({
        ar: "جلسات فرديّة مع مرشدين وروّاد أعمال ومتخصّصين — هندسةً وتصميمًا وأعمالًا.",
        en: "1:1 sessions with mentors, founders and specialists — engineering, design and business.",
      }),
      href: "/experts",
    },
    {
      title: t({ ar: "برامج ودفعات + Demo Day", en: "Programs, cohorts & Demo Day" }),
      body: t({
        ar: "مسارات احتضان وتسريع منظّمة، تُختم بيوم عرضٍ أمام شبكة من الدّاعمين.",
        en: "Structured incubation & acceleration tracks that culminate in a Demo Day to our network.",
      }),
      href: "/programs",
    },
    {
      accent: true,
      title: t({ ar: "شبكة ومجتمع", en: "A network & community" }),
      body: t({
        ar: "مجتمع من المستقلّين والخرّيجين والمؤسّسين — تعاون، أعمال، وفرص.",
        en: "A community of freelancers, graduates and founders — collaboration, work and opportunity.",
      }),
      href: "/members",
    },
  ];

  return (
    <CinematicMedia
      as="section"
      id="what-you-get"
      src={imageUrl("/photos/IMG_8314.webp")}
      scrim="medium"
      sideScrim={false}
      className="relative overflow-hidden border-t border-white/[0.06]"
      aria-label={t({ ar: "ما تحصل عليه", en: "What you get" })}
    >
      {/* Ambient lit-space field so the photo reads as depth, not flat black. */}
      <div aria-hidden className="glass-ambient pointer-events-none absolute inset-0" />

      <div className="container-ih section-y relative">
        {/* Header — calm eyebrow, one monumental line, roomy sub. Split so the
            headline never sits beside an empty half on wide screens. */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7" distance={22}>
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary rtl:tracking-[0.12em]">
              {t({ ar: "ما تحصل عليه", en: "What you get" })}
            </p>
            <h2
              className="font-display text-white"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
                fontWeight: 900,
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
              }}
            >
              {t({ ar: "حاضنة كاملة. ", en: "A full incubator. " })}
              <span className="text-primary">{t({ ar: "مجّانًا.", en: "Free." })}</span>
            </h2>
          </Reveal>

          <Reveal className="lg:col-span-5" distance={22} delay={0.08}>
            <p className="max-w-xl text-[1.0625rem] leading-[1.7] text-white/75 lg:text-[1.2rem]">
              {t({
                ar: "مساحة، إرشاد، برامج، وشبكة — كلّ ما يحتاجه صانعٌ ليبدأ ويَنمو، من قلب غزّة.",
                en: "Space, mentorship, programs and a network — everything a maker needs to start and grow, from the heart of Gaza.",
              })}
            </p>
            <Link
              href="/programs"
              className="group mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-primary transition-all duration-200 hover:gap-3 motion-reduce:transition-none"
            >
              {t({ ar: "اعرف أكثر", en: "Learn more" })}
              <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
            </Link>
          </Reveal>
        </div>

        {/* Editorial value list — the whole rows list FLOATS inside one frosted
            glass tile on the vivid photo. Each membership value on its own
            hairline-separated row: terracotta index + large display title on the
            start, a concise description on a readable measure. Routes + testids kept. */}
        <Reveal
          distance={20}
          amount={0.2}
          className="mt-[clamp(3rem,7vh,5.5rem)] glass-panel px-[clamp(1.25rem,4vw,3.25rem)] py-[clamp(0.75rem,2.5vh,1.75rem)] shadow-[0_44px_100px_-40px_hsl(0_0%_0%/0.8)]"
        >
          {gives.map((g, i) => (
            <Link
              key={g.href}
              href={g.href}
              data-testid={`pillar-${g.href.slice(1)}`}
              className={`group grid grid-cols-1 items-baseline gap-x-10 gap-y-4 py-[clamp(1.75rem,4vh,3rem)] transition-[border-color] duration-300 hover:border-primary/40 motion-reduce:transition-none md:grid-cols-12 ${
                i > 0 ? "border-t border-white/10" : ""
              }`}
            >
              {/* Index + title */}
              <div className="flex items-baseline gap-4 md:col-span-6 lg:col-span-5">
                <span
                  className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-primary"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3
                  className="font-display font-bold text-white leading-[1.05] transition-[color,transform] duration-300 group-hover:text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 motion-reduce:transition-none"
                  style={{
                    fontSize: "clamp(1.4rem, 2.4vw, 2rem)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {g.title}
                </h3>
              </div>

              {/* Description on a readable measure */}
              <div className="md:col-span-6 lg:col-span-6 lg:col-start-6">
                <p className="max-w-[52ch] text-[15px] leading-relaxed text-white/70 lg:text-[1.0625rem]">
                  {g.body}
                </p>
                {g.stat && (
                  <div className="mt-3 inline-flex items-baseline gap-2">
                    <span className="font-mono text-xl font-bold tabular-nums text-primary">{g.stat}</span>
                    <span className="text-[13px] text-white/55">{t({ ar: "مقاعد متاحة", en: "seats available" })}</span>
                  </div>
                )}
              </div>

              {/* Hairline tick — a quiet directional cue, no medallion */}
              <div className="hidden items-center justify-end lg:col-span-1 lg:flex">
                <ArrowLeft
                  className="h-4 w-4 text-white/55 transition-all duration-300 rtl:rotate-180 group-hover:-translate-x-1 group-hover:text-primary rtl:group-hover:translate-x-1 motion-reduce:transition-none"
                  aria-hidden
                />
              </div>
            </Link>
          ))}
        </Reveal>
      </div>
    </CinematicMedia>
  );
}
