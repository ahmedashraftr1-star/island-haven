import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { About as AboutHero } from "@/components/landing/About";
import { Story } from "@/components/landing/Story";
import { Support } from "@/components/landing/Support";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage } from "@/contexts/LanguageContext";

/* ────────────────────────────────────────────────────────────────────────────
   /about — a real, structured, credible About page in the brand's dark editorial
   language. Not a stack of three landing blocks: a hero (war-born narrative) →
   Vision & Mission as bold statements → the three strategic axes (Story) →
   values/principles → a since-2024 milestone timeline → backers (NasToNas + Gaza
   Sky Geeks) → team teaser → closing belief + apply CTA (Support). Every section
   shares one dark editorial system: solid oversized type, one crimson accent
   word, cerulean numerals, hairline ledgers — no gradient text, no glass.
   ──────────────────────────────────────────────────────────────────────────── */

/** Vision & Mission — two bold, oversized statements, hairline-divided. */
function VisionMission() {
  const { t, lang } = useLanguage();

  const pillars = [
    {
      idxAr: "٠١",
      en: "Vision",
      ar: "رؤيتنا",
      statement: t({
        ar: "أن نكون نقطة الارتكاز الأولى للاقتصاد الرقميّ في غزّة.",
        en: "To be the first anchor point of Gaza's digital economy.",
      }),
      body: t({
        ar: "الوجهة التي يبدأ منها كلّ شابّ وشابّة طريقهم نحو المنافسة والتفوّق في السوق العالميّ — لا بالشفقة، بل بالكفاءة.",
        en: "The place every young person's path toward global competition and excellence begins — known not for pity, but for competence.",
      }),
    },
    {
      idxAr: "٠٢",
      en: "Mission",
      ar: "رسالتنا",
      statement: t({
        ar: "أن نُعيد للإنسان الغزّي ما سرقته منه الحرب.",
        en: "To return to the people of Gaza what war stole.",
      }),
      body: t({
        ar: "بيئةً يعمل فيها، ومهارةً تحمله، وعالمًا يصل إليه — حتى تُذكر غزّة في سوق العمل الدوليّ بالكفاءة والتفوّق.",
        en: "A place to work, a skill to carry them, and a world to reach — until Gaza is named in the global market for its competence and excellence.",
      }),
    },
  ];

  return (
    <section id="vision-mission" className="relative bg-background section-y overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[55%] brand-aura opacity-60" />
      <div className="container-ih relative">
        <Reveal>
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="eyebrow">{t({ ar: "ما نسعى إليه", en: "What we're for" })}</span>
          </div>
        </Reveal>

        <div>
          {pillars.map((p, i) => (
            <Reveal key={p.en} delay={i * 0.06}>
              <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,4rem)] gap-y-5 items-start border-t border-border-strong py-[clamp(2.25rem,5vw,3.5rem)] last:border-b">
                <div className="lg:col-span-4 flex items-baseline gap-5">
                  <span className="font-display font-bold tnum text-fg-faint leading-none text-[clamp(1.5rem,2.4vw,2.1rem)]">
                    {lang === "en" ? String(i + 1).padStart(2, "0") : p.idxAr}
                  </span>
                  <div>
                    <h2
                      className="font-display font-bold text-foreground"
                      style={{ fontSize: "clamp(1.4rem, 2.2vw, 2rem)", letterSpacing: "-0.02em" }}
                    >
                      {p.ar}
                    </h2>
                    <div className="eyebrow mt-2">{p.en}</div>
                  </div>
                </div>
                <div className="lg:col-span-8">
                  <p
                    className="font-display font-extrabold text-foreground"
                    style={{ fontSize: "clamp(1.5rem, 3vw, 2.6rem)", lineHeight: 1.12, letterSpacing: "-0.025em" }}
                  >
                    {p.statement}
                  </p>
                  <p className="t-body-lg mt-5 max-w-2xl">{p.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Values / principles — a numbered editorial ledger of how we work. */
function Values() {
  const { t, lang } = useLanguage();

  const values = [
    {
      ar: "مجّانًا، دائمًا",
      en: "Free, always",
      body: t({
        ar: "كلّ ما نقدّمه — المساحة والإرشاد والبرامج — مجّانيّ بالكامل. المال لا يجب أن يقف يومًا بين موهبةٍ غزّيّة وطريقها.",
        en: "Everything we offer — space, mentorship, programs — is entirely free. Money should never stand between a Gazan talent and their path.",
      }),
    },
    {
      ar: "الكفاءة لا الشفقة",
      en: "Competence, not pity",
      body: t({
        ar: "نبني ليُذكر اسم غزّة في السوق العالميّ احترامًا لكفاءته، لا تعاطفًا مع جرحه. نقيس الأثر بالأرقام، لا بالشعارات.",
        en: "We build so Gaza is named in the global market out of respect for its competence, not sympathy for its wound. We measure impact in numbers, not slogans.",
      }),
    },
    {
      ar: "العمل ردًّا على الدمار",
      en: "Work answers destruction",
      body: t({
        ar: "وُلدنا وسط الحرب، ورفضنا أن نقف متفرّجين. نقاوم الظرف بالبناء يومًا بيوم، ونفتح بابًا كلّما أُغلق آخر.",
        en: "Born amid the war, we refused to stand by. We resist circumstance with building, day by day — opening a door each time another is closed.",
      }),
    },
    {
      ar: "وصلٌ بالعالم",
      en: "Connected to the world",
      body: t({
        ar: "نؤمن أنّ الموهبة لا تحدّها الجغرافيا. نصل أعضاءنا بفرص العمل والتدريب والاستثمار خلف الحدود، ونكون المُنفِّذ الموثوق لكلّ شريك.",
        en: "We believe talent is not bound by geography. We connect our members to work, training and investment beyond the borders, and act as the trusted executor for every partner.",
      }),
    },
  ];

  const idx = (i: number) =>
    lang === "en" ? String(i + 1).padStart(2, "0") : ["٠١", "٠٢", "٠٣", "٠٤"][i];

  return (
    <section id="values" className="relative bg-surface-1 section-y overflow-hidden">
      <div className="container-ih relative">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-10 items-start">
          <Reveal as="div" className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="flex items-center gap-3 mb-5">
              <span aria-hidden className="h-px w-9 bg-primary/50" />
              <span className="eyebrow">{t({ ar: "مبادئنا", en: "Our principles" })}</span>
            </div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(2rem, 3.6vw, 3rem)", lineHeight: 1.06, letterSpacing: "-0.028em" }}
            >
              {t({ ar: "ما نقف ", en: "What we " })}
              <span className="text-primary">{t({ ar: "عليه.", en: "stand for." })}</span>
            </h2>
            <p className="t-body mt-5 max-w-sm">
              {t({
                ar: "أربعة مبادئ تحكم كلّ قرارٍ نتّخذه، وكلّ بابٍ نفتحه أمام كفاءات غزّة.",
                en: "Four principles govern every decision we make, and every door we open for Gaza's talents.",
              })}
            </p>
          </Reveal>

          <div className="lg:col-span-8">
            {values.map((v, i) => (
              <Reveal key={v.en} delay={i * 0.05}>
                <div className="grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-9 items-baseline border-t border-border-strong py-7 sm:py-9 first:border-t-0 first:pt-0 last:border-b">
                  <span className="font-display text-[clamp(1.4rem,2.2vw,2rem)] font-bold tnum text-fg-faint leading-none">
                    {idx(i)}
                  </span>
                  <div>
                    <h3
                      className="font-display font-bold text-foreground"
                      style={{ fontSize: "clamp(1.25rem, 2vw, 1.7rem)", letterSpacing: "-0.018em", lineHeight: 1.18 }}
                    >
                      {v.ar}
                    </h3>
                    <div className="eyebrow eyebrow-sand mt-2">{v.en}</div>
                    <p className="t-body mt-3 max-w-xl">{v.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Timeline — the since-2024 milestone ledger, evergreen + honest. */
function Timeline() {
  const { t, lang } = useLanguage();

  const milestones = [
    {
      year: lang === "en" ? "2024" : "٢٠٢٤",
      ar: "وُلدت آيلاند هيفن",
      en: "Island Haven is born",
      body: t({
        ar: "وسط الحرب، ومن قلب غزّة، تتأسّس آيلاند هيفن بمساحة عملٍ مشتركة تستقبل الخرّيجين والمستقلّين والطلبة — أوّل ردٍّ على الدمار بالبناء.",
        en: "Amid the war, and from the heart of Gaza, Island Haven is founded as a shared workspace for graduates, freelancers and students — the first answer to destruction with building.",
      }),
    },
    {
      year: lang === "en" ? "2024" : "٢٠٢٤",
      ar: "بدعمٍ من «من النّاس إلى النّاس»",
      en: "Backed by NasToNas",
      body: t({
        ar: "تحتضن مبادرة «من النّاس إلى النّاس» (NasToNas) المنظومة كبرنامجٍ تنمويّ — لتبقى مجّانيّة بالكامل، مدعومةً من أصدقاء غزّة حول العالم.",
        en: "The NasToNas (People to People) initiative adopts the ecosystem as a development program — keeping it entirely free, backed by friends of Gaza worldwide.",
      }),
    },
    {
      year: lang === "en" ? "Now" : "الآن",
      ar: "الدفعة الأولى تَبني",
      en: "The first cohort builds",
      body: t({
        ar: "تنطلق المنظومة المتكاملة: تدريبٌ وتأهيل، أرصدةٌ سحابيّة، حلولٌ للمدفوعات الدوليّة، وإرشادٌ فرديّ — والدفعة الأولى تكتب سطورها الأولى اليوم.",
        en: "The full ecosystem comes alive: training, cloud credits, international payment solutions and 1:1 mentorship — and the first cohort is writing its opening lines today.",
      }),
    },
    {
      year: lang === "en" ? "Next" : "قادم",
      ar: "نحو يوم العرض",
      en: "Toward Demo Day",
      body: t({
        ar: "تُختم مسارات الاحتضان بيوم عرضٍ (Demo Day) أمام شبكةٍ من الدّاعمين والمستثمرين — حيث تلتقي الموهبة الغزّية بالعالم وجهًا لوجه.",
        en: "Incubation tracks culminate in a Demo Day before a network of supporters and investors — where Gazan talent meets the world, face to face.",
      }),
    },
  ];

  return (
    <section id="timeline" className="relative bg-background section-y overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[45%] brand-aura opacity-50" />
      <div className="container-ih relative">
        <Reveal>
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="eyebrow">{t({ ar: "مسيرتنا", en: "Our journey" })}</span>
          </div>
          <h2
            className="font-display font-extrabold text-foreground max-w-3xl"
            style={{ fontSize: "clamp(2rem, 4.4vw, 3.4rem)", lineHeight: 1.05, letterSpacing: "-0.028em" }}
          >
            {t({ ar: "من فكرةٍ وسط الحرب، إلى ", en: "From an idea amid war, to a " })}
            <span className="text-primary">{t({ ar: "حاضنةٍ تَبني.", en: "building incubator." })}</span>
          </h2>
        </Reveal>

        <div className="mt-[clamp(2.5rem,5vw,4rem)]">
          {milestones.map((m, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="group grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,4rem)] gap-y-3 items-start border-t border-border-strong py-8 sm:py-10 last:border-b">
                <div className="lg:col-span-3 flex items-center gap-4">
                  <span aria-hidden className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sand ring-4 ring-sand/15" />
                  </span>
                  <span
                    className="font-display font-extrabold text-sand tnum leading-none"
                    style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", letterSpacing: "-0.02em" }}
                  >
                    {m.year}
                  </span>
                </div>
                <div className="lg:col-span-9">
                  <h3
                    className="font-display font-bold text-foreground"
                    style={{ fontSize: "clamp(1.3rem, 2.1vw, 1.8rem)", letterSpacing: "-0.018em", lineHeight: 1.18 }}
                  >
                    {m.ar}
                  </h3>
                  <div className="eyebrow eyebrow-sand mt-2">{m.en}</div>
                  <p className="t-body-lg mt-4 max-w-2xl">{m.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Backers — NasToNas (parent) + Gaza Sky Geeks (ecosystem), hairline-edged. */
function Backers() {
  const { t, lang } = useLanguage();

  const backers = [
    {
      en: "Parent program",
      eyebrowAr: "البرنامج الأمّ",
      name: t({ ar: "«من النّاس إلى النّاس»", en: "NasToNas — People to People" }),
      body: t({
        ar: "مبادرة تضامنٍ تصل أصدقاء غزّة بمشاريعَ حقيقيّة على الأرض. آيلاند هيفن برنامجٌ تنمويّ تابعٌ لها — وبدعمها تبقى الحاضنة مجّانيّة بالكامل.",
        en: "A solidarity initiative connecting friends of Gaza with real, ground-level projects. Island Haven is one of its development programs — and through its support the incubator stays entirely free.",
      }),
      href: "https://nastonas.org",
      hrefLabel: "nastonas.org",
      primary: true,
    },
    {
      en: "Ecosystem partner",
      eyebrowAr: "شريكٌ في المنظومة",
      name: t({ ar: "Gaza Sky Geeks", en: "Gaza Sky Geeks" }),
      body: t({
        ar: "أوّل وأعرق مسرّعةٍ تقنيّة في فلسطين، رائدةٌ في تأهيل المواهب الرقميّة الغزّية وربطها بالسوق العالميّ — نتشارك معها هدف اقتصادٍ رقميّ ينهض من غزّة.",
        en: "Palestine's first and longest-running tech accelerator, a pioneer in upskilling Gazan digital talent and connecting it to the global market — we share its goal of a digital economy rising from Gaza.",
      }),
      href: "https://gazaskygeeks.com",
      hrefLabel: "gazaskygeeks.com",
      primary: false,
    },
  ];

  return (
    <section id="backers" className="relative bg-surface-1 section-y overflow-hidden">
      <div className="container-ih relative">
        <Reveal>
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="eyebrow">{t({ ar: "من يقف خلفنا", en: "Who backs us" })}</span>
          </div>
          <h2
            className="font-display font-extrabold text-foreground max-w-3xl"
            style={{ fontSize: "clamp(2rem, 4.4vw, 3.4rem)", lineHeight: 1.05, letterSpacing: "-0.028em" }}
          >
            {t({ ar: "لا نبني ", en: "We don't build " })}
            <span className="text-primary">{t({ ar: "وحدنا.", en: "alone." })}</span>
          </h2>
          <p className="t-body-lg mt-5 max-w-2xl">
            {t({
              ar: "تقف خلف آيلاند هيفن منظومةٌ من الداعمين والشركاء الذين يؤمنون أنّ موهبة غزّة تستحقّ مكانًا في الاقتصاد الرقميّ العالميّ.",
              en: "Behind Island Haven stands an ecosystem of supporters and partners who believe Gaza's talent deserves a place in the global digital economy.",
            })}
          </p>
        </Reveal>

        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid md:grid-cols-2 gap-5 lg:gap-7">
          {backers.map((b, i) => (
            <Reveal key={b.en} delay={i * 0.06} className="h-full">
              <a
                href={b.href}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`about-backer-${i}`}
                className="card-base card-hover group flex h-full flex-col p-8 lg:p-10"
              >
                <div className={`eyebrow mb-6 ${b.primary ? "" : "eyebrow-sand"}`}>
                  {lang === "en" ? b.en : b.eyebrowAr}
                </div>
                <h3
                  className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
                  style={{ fontSize: "clamp(1.4rem, 2.2vw, 1.95rem)", letterSpacing: "-0.018em", lineHeight: 1.15 }}
                >
                  {b.name}
                </h3>
                <p className="t-body mt-4 mb-7">{b.body}</p>
                <span className="mt-auto inline-flex items-center gap-2 text-[13px] font-semibold text-primary tnum">
                  {b.hrefLabel}
                  <ArrowLeft className="w-4 h-4 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Team teaser — a large photo + invitation linking to /team. */
function TeamTeaser() {
  const { t, lang } = useLanguage();

  return (
    <section id="team-teaser" className="relative bg-background section-y overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[45%] brand-aura opacity-50" />
      <div className="container-ih relative">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-center">
          <Reveal as="div" className="lg:col-span-6">
            <div className="flex items-center gap-3 mb-5">
              <span aria-hidden className="h-px w-9 bg-primary/50" />
              <span className="eyebrow">{t({ ar: "الفريق", en: "The team" })}</span>
            </div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(2rem, 4.2vw, 3.3rem)", lineHeight: 1.05, letterSpacing: "-0.028em" }}
            >
              {t({ ar: "أناسٌ يقفون خلف كلّ ", en: "People standing behind every " })}
              <span className="text-primary">{t({ ar: "موهبة.", en: "talent." })}</span>
            </h2>
            <p className="t-body-lg mt-5 max-w-xl">
              {t({
                ar: "قيادةٌ ومرشدون ومستشارون من غزّة والعالم، يبنون الحاضنة ويرسمون رؤيتها، ويقفون خلف كلّ رائدٍ في رحلته — من الفكرة إلى المنافسة.",
                en: "Leadership, mentors and advisors from Gaza and around the world — building the incubator, shaping its vision, and standing behind every founder from idea to competition.",
              })}
            </p>
            <Reveal as="div" delay={0.08} className="mt-9">
              <Link
                href="/team"
                data-testid="about-team-link"
                className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
              >
                {t({ ar: "تعرّف على الفريق", en: "Meet the team" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </Reveal>

          {/* The people of the place — large photo with dark legibility gradient */}
          <Reveal as="div" delay={0.1} className="lg:col-span-6">
            <div className="group relative overflow-hidden rounded-[20px] ring-1 ring-white/10 shadow-soft">
              <img
                src="/photos/IMG_8352.webp"
                alt={t({ ar: "فريق ومجتمع آيلاند هيفن في غزّة", en: "The Island Haven team and community in Gaza" })}
                loading="lazy"
                className="w-full h-[clamp(320px,42vw,460px)] object-cover object-center saturate-[1.04] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none will-change-transform group-hover:scale-[1.04]"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/85 via-[#0A0E1A]/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
                <div className="text-[11px] tracking-[0.2em] uppercase text-white/80 font-semibold mb-1.5 rtl:tracking-normal">
                  {t({ ar: "من داخل المساحة", en: "Inside the space" })}
                </div>
                <div className="font-display font-bold text-white text-[clamp(1.1rem,2vw,1.6rem)]">
                  {t({ ar: "اليد التي تأخذ بيد الموهبة", en: "The hands that guide the talent" })}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function About() {
  const { lang, t } = useLanguage();

  useEffect(() => {
    document.title = t({ ar: "من نحن — آيلاند هيفن", en: "About Us — Island Haven" });
  }, [lang, t]);

  return (
    <div className="min-h-screen bg-background font-sans antialiased relative">
      <ScrollProgress />
      <Header />
      <div className="relative z-10 pt-20">
        {/* 1 · Hero — the war-born narrative + the 3-year goal */}
        <AboutHero />
        {/* 2 · Vision & Mission — bold statements */}
        <VisionMission />
        {/* 3 · The three strategic axes */}
        <Story />
        {/* 4 · Values / principles */}
        <Values />
        {/* 5 · Since-2024 milestone timeline */}
        <Timeline />
        {/* 6 · Backers — NasToNas + Gaza Sky Geeks */}
        <Backers />
        {/* 7 · Team teaser → /team */}
        <TeamTeaser />
        {/* 8 · Closing belief + stand-with-us / apply CTA */}
        <Support />
      </div>
      <Footer />
    </div>
  );
}
