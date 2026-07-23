import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Btn } from "@/components/ui/Btn";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { TOTAL_SEATS } from "@/components/booking/hall-plan";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { Reveal } from "./Reveal";
import { SpotlightOverlay } from "@/components/ui/SpotlightCard";

/**
 * WhatYouGet — the value-of-membership section, told at hero power: glass tiles
 * FLOATING on a vivid full-bleed Gaza photograph + an ambient lit field, the
 * same "Vision Pro" register as FeaturedMembers. A strong calm headline, and the
 * four values of membership (workspace, mentorship, programs, community) set as
 * clean editorial ROWS inside a single frosted `glass-panel` tile: a terracotta
 * index numeral, a large display title, a concise description on a readable
 * measure, and a quiet directional cue — impeccable alignment, generous
 * whitespace, a refined terracotta hover. Terracotta is the sole accent.
 * All data / i18n / routes / testids kept.
 */

// AR is the CMS-overridable source of truth (useContentSection); English keeps
// its literal via the parallel …En keys. Defaults below are byte-verbatim copies
// of the previous hardcoded copy, so an un-edited site renders exactly as before.
const FALLBACK = {
  eyebrow: "ما تحصل عليه · غزّة",
  eyebrowEn: "What you get · Gaza",
  headlineA: "حاضنة كاملة. ",
  headlineAEn: "A full incubator. ",
  headlineAccent: "مجّانًا.",
  headlineAccentEn: "Free.",
  sub: "مساحة، إرشاد، برامج، وشبكة — كلّ ما يحتاجه صانعٌ ليبدأ ويَنمو، من قلب غزّة.",
  subEn: "Space, mentorship, programs and a network — everything a maker needs to start and grow, from the heart of Gaza.",
  learnMore: "اعرف أكثر",
  learnMoreEn: "Learn more",
  seatsLabel: "مقعدًا في المساحة",
  seatsLabelEn: "seats in the space",
  item0Title: "مساحة عمل مجّانيّة",
  item0TitleEn: "A free workspace",
  item0Body: "مقعد ثابت في مساحة هادئة، بإنترنت موثوق وكهرباء — احجزه متى احتجت.",
  item0BodyEn: "A reliable seat in a calm space with stable internet and power — book it whenever you need.",
  item1Title: "إرشاد من خبراء",
  item1TitleEn: "Expert mentorship",
  item1Body: "جلسات فرديّة مع مرشدين وروّاد أعمال ومتخصّصين — هندسةً وتصميمًا وأعمالًا.",
  item1BodyEn: "1:1 sessions with mentors, founders and specialists — engineering, design and business.",
  item2Title: "برامج ودفعات + Demo Day",
  item2TitleEn: "Programs, cohorts & Demo Day",
  item2Body: "مسارات احتضان وتسريع منظّمة، تُختم بيوم عرضٍ أمام شبكة من الدّاعمين.",
  item2BodyEn: "Structured incubation & acceleration tracks that culminate in a Demo Day to our network.",
  item3Title: "شبكة ومجتمع",
  item3TitleEn: "A network & community",
  item3Body: "مجتمع من المستقلّين والخرّيجين والمؤسّسين — تعاون، أعمال، وفرص.",
  item3BodyEn: "A community of freelancers, graduates and founders — collaboration, work and opportunity.",
};

export function WhatYouGet() {
  const { t, lang } = useLanguage();
  const c = useContentSection("whatYouGet", FALLBACK);
  // Seats figure = the hall's fixed CAPACITY, read from the ONE shared hall-plan
  // (38 seats) that the SeatsBoard floor plan and the /book map also use.
  // Deliberately CAPACITY, not live availability, so it can never contradict the
  // SeatsBoard's "N free" on the same page. Rendered through the locale numeral
  // formatter (Western in EN, Arabic-Indic in AR).
  const totalSeats = TOTAL_SEATS;
  const fmtNum = (v: number) => v.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
  // Two-digit editorial row index — Arabic-Indic in AR (matching ActMarker /
  // ApplyProcess), Western in EN. No stray Western digit in the Arabic page.
  const rowIndex = (i: number) => {
    const two = String(i + 1).padStart(2, "0");
    return lang === "ar" ? two.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]) : two;
  };

  // A calm, roomy list of what membership gives — set as editorial rows.
  const gives = [
    {
      showSeats: true,
      title: t({ ar: c.item0Title, en: c.item0TitleEn }),
      body: t({
        ar: c.item0Body,
        en: c.item0BodyEn,
      }),
      href: "/book",
    },
    {
      title: t({ ar: c.item1Title, en: c.item1TitleEn }),
      body: t({
        ar: c.item1Body,
        en: c.item1BodyEn,
      }),
      href: "/experts",
    },
    {
      title: t({ ar: c.item2Title, en: c.item2TitleEn }),
      body: t({
        ar: c.item2Body,
        en: c.item2BodyEn,
      }),
      href: "/programs",
    },
    {
      accent: true,
      title: t({ ar: c.item3Title, en: c.item3TitleEn }),
      body: t({
        ar: c.item3Body,
        en: c.item3BodyEn,
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
      data-rail-theme="light"
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
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden className="h-px w-9 bg-primary/70" />
              <span className="eyebrow">
                {t({ ar: c.eyebrow, en: c.eyebrowEn })}
              </span>
            </div>
            <h2
              className="font-display text-white"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
                fontWeight: 900,
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
              }}
            >
              {t({ ar: c.headlineA, en: c.headlineAEn })}
              <span className="text-primary">{t({ ar: c.headlineAccent, en: c.headlineAccentEn })}</span>
            </h2>
          </Reveal>

          <Reveal className="lg:col-span-5" distance={22} delay={0.08}>
            <p className="max-w-xl text-[1.0625rem] leading-[1.7] text-white/80 lg:text-[1.2rem]">
              {t({
                ar: c.sub,
                en: c.subEn,
              })}
            </p>
            <Btn asChild variant="ghost" className="group mt-6 hover:gap-3 text-primary-bright hover:text-primary motion-reduce:transition-none">
              <Link href="/programs">
                {t({ ar: c.learnMore, en: c.learnMoreEn })}
                <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
              </Link>
            </Btn>
          </Reveal>
        </div>

        {/* Editorial value list — the whole rows list FLOATS inside one frosted
            glass tile on the vivid photo. Each membership value on its own
            hairline-separated row: terracotta index + large display title on the
            start, a concise description on a readable measure, a quiet cue on the
            end. Generous whitespace, refined terracotta hover. Routes + testids kept. */}
        <Reveal
          distance={20}
          amount={0.2}
          className="mt-[clamp(3rem,7vh,5.5rem)] group relative glass-panel px-[clamp(1.25rem,4vw,3.5rem)] py-[clamp(0.5rem,2vh,1.25rem)] shadow-[0_44px_100px_-40px_hsl(0_0%_0%/0.8)]"
        >
          {/* Enhance the EXISTING glass (no new SVG layer): a terracotta glow warms the
              tile toward the cursor, complementing each row's own hover rule. */}
          <SpotlightOverlay radius={340} />
          {gives.map((g, i) => (
            <Link
              key={g.href}
              href={g.href}
              data-testid={`pillar-${g.href.slice(1)}`}
              className={`group relative grid grid-cols-1 items-baseline gap-x-10 gap-y-4 py-[clamp(1.75rem,4.5vh,3.25rem)] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608] motion-reduce:transition-none md:grid-cols-12 ${
                i > 0 ? "border-t border-white/10" : ""
              }`}
            >
              {/* Terracotta hover rail on the logical-start edge — a quiet accent
                  that grows on hover, giving the row weight without a medallion. */}
              <span
                aria-hidden
                className="absolute inset-y-6 start-0 w-[2px] origin-top scale-y-0 rounded-full bg-primary transition-transform duration-300 ease-out group-hover:scale-y-100 motion-reduce:transition-none"
              />

              {/* Index + title */}
              <div className="flex items-baseline gap-4 md:col-span-6 lg:col-span-5">
                <span
                  className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-primary transition-opacity duration-300 group-hover:opacity-100 opacity-80 motion-reduce:transition-none"
                  aria-hidden
                >
                  {rowIndex(i)}
                </span>
                <h3
                  className="font-display font-bold text-white leading-[1.05] transition-[color,transform] duration-300 group-hover:text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 motion-reduce:transition-none"
                  style={{
                    fontSize: "clamp(1.5rem, 2.6vw, 2.15rem)",
                    letterSpacing: "-0.025em",
                  }}
                >
                  {g.title}
                </h3>
              </div>

              {/* Description on a readable measure */}
              <div className="md:col-span-6 lg:col-span-6 lg:col-start-6">
                <p className="max-w-[52ch] text-[15px] leading-[1.65] text-white/80 transition-colors duration-300 group-hover:text-white/90 lg:text-[1.0625rem] motion-reduce:transition-none">
                  {g.body}
                </p>
                {g.showSeats && (
                  <div className="mt-3.5 inline-flex items-baseline gap-2">
                    <span className="font-mono text-xl font-bold tabular-nums text-primary">{fmtNum(totalSeats)}</span>
                    <span className="text-[13px] text-white/65">{t({ ar: c.seatsLabel, en: c.seatsLabelEn })}</span>
                  </div>
                )}
              </div>

              {/* Hairline tick — a quiet directional cue, no medallion */}
              <div className="hidden items-center justify-end lg:col-span-1 lg:flex">
                <ArrowLeft
                  className="h-4 w-4 text-white/45 transition-all duration-300 rtl:rotate-180 group-hover:-translate-x-1 group-hover:text-primary rtl:group-hover:translate-x-1 motion-reduce:transition-none"
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
