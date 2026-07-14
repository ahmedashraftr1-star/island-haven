import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform, useInView } from "framer-motion";
import { Header } from "@/components/landing/Header";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { About as AboutHero } from "@/components/landing/About";
import { Story } from "@/components/landing/Story";
import { Support } from "@/components/landing/Support";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { useCountUp } from "@/hooks/use-count-up";

/* ────────────────────────────────────────────────────────────────────────────
   /about — the story, told the Apple way: SCALE + SPACE + RESTRAINT. Eight beats:
   a hero (war-born narrative) → Vision & Mission as monumental statements → the
   three strategic axes (Story) → values/principles as calm rows → a since-2024
   timeline as a quiet editorial sequence → backers as hairline rows → team teaser
   over full-bleed photography → closing belief + donate (Support). Every section
   shares the grandeur house bar: one monumental headline (font-display 700,
   ls -0.04em, lh ~1.0, ONE crimson word), acres of space, opacity+rise reveals,
   editorial hairline rows, full-bleed photography — no eyebrow kickers, no
   numbered ledgers, no medallions, no card decks, no aura blobs, no glass.
   ──────────────────────────────────────────────────────────────────────────── */

/** A monumental, opacity+rise headline — the house bar, line by line. */
function MonumentalHeading({
  lines,
  className = "",
}: {
  lines: React.ReactNode[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.h2
      className={`font-display text-foreground ${className}`}
      style={{ fontSize: "var(--t-display-hero)", lineHeight: "var(--lh-display)", letterSpacing: "-0.04em", fontWeight: 700 }}
    >
      {lines.map((ln, i) => (
        <motion.span
          key={i}
          className="block will-change-transform"
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, delay: i * 0.09, ease: EASE_OUT_EXPO }}
        >
          {ln}
        </motion.span>
      ))}
    </motion.h2>
  );
}

/** A styled pull-quote — one key sentence at display scale, a crimson rule down
    the inline-start edge, acres of vertical air. A quiet visual breath between
    the page's full-width sections. Bilingual + reduced-motion safe. */
function PullQuote({
  quote,
  attribution,
  testid,
}: {
  quote: string;
  attribution?: string;
  testid?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <section
      className="relative bg-background overflow-hidden"
      style={{ paddingBlock: "clamp(4rem, 10vh, 8rem)" }}
      data-testid={testid}
    >
      <div className="container-ih relative">
        <Reveal>
          <figure className="max-w-4xl border-s-4 border-primary ps-[clamp(1.5rem,4vw,3rem)] py-[clamp(0.5rem,2vw,1.5rem)]">
            <motion.blockquote
              className="font-display font-bold text-foreground text-balance"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.6rem)", lineHeight: 1.16, letterSpacing: "-0.028em" }}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            >
              {quote}
            </motion.blockquote>
            {attribution && (
              <figcaption className="eyebrow-sand font-mono text-sand mt-[clamp(1.25rem,2.5vw,1.75rem)]">
                {attribution}
              </figcaption>
            )}
          </figure>
        </Reveal>
      </div>
    </section>
  );
}

/** Stats bar — a horizontal band, 1px hairline top + bottom (no shadow), holding
    only REAL/defensible figures drawn from the live site: the thousand-talent
    goal, the 2024 founding, the 100%-free truth, and the live portfolio span.
    Mono numerals + tracked labels. Bilingual + RTL + reduced-motion safe. */
function StatsBar() {
  const { t, lang } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const nf = (n: number) =>
    new Intl.NumberFormat(lang === "en" ? "en-US" : "ar-EG").format(n);

  // Every figure here is already stated elsewhere on the site (the /about goal
  // block, the live /numbers + /ventures readings). No invented funding or
  // country counts — honest, defensible numbers only. The founding YEAR never
  // counts up (it's a date, not a quantity).
  const stats = [
    {
      target: 1000,
      animate: true,
      duration: 1500,
      render: (v: number) => (lang === "en" ? `${nf(v)}+` : `+${nf(v)}`),
      label: t({ ar: "كفاءة غزّية نؤهّلها", en: "Gazan talents in our goal" }),
    },
    {
      target: 2024,
      animate: false,
      duration: 0,
      render: () => (lang === "en" ? "2024" : "٢٠٢٤"),
      label: t({ ar: "عام التأسيس", en: "Founded" }),
    },
    {
      target: 100,
      animate: true,
      duration: 1200,
      render: (v: number) => (lang === "en" ? `${nf(v)}%` : `٪${nf(v)}`),
      label: t({ ar: "مجّانًا، دائمًا", en: "Free, always" }),
    },
    {
      target: 3,
      animate: true,
      duration: 800,
      render: (v: number) => nf(v),
      label: t({ ar: "سنوات لإغلاق الفجوة", en: "Years to close the gap" }),
    },
  ];

  return (
    <section
      className="relative bg-surface-1 overflow-hidden"
      data-testid="about-stats-bar"
    >
      <div className="container-ih relative" ref={ref}>
        <Reveal>
          <dl className="grid grid-cols-2 lg:grid-cols-4 border-y border-border-strong/60 divide-x divide-y lg:divide-y-0 divide-border-strong/40">
            {stats.map((s, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 py-[clamp(2rem,4vw,3.25rem)] px-[clamp(1.25rem,3vw,2.75rem)]"
                data-testid={`about-stat-${i}`}
              >
                <dt
                  className="font-display font-black text-sand tnum leading-none"
                  style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", letterSpacing: "-0.03em" }}
                >
                  <StatFigure
                    target={s.target}
                    animate={s.animate}
                    duration={s.duration}
                    render={s.render}
                    inView={inView}
                  />
                </dt>
                <dd className="font-mono text-[11px] sm:text-[12px] uppercase tracking-[0.12em] text-fg-secondary max-w-[18ch]">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

// One figure in the bar — counts 0→target on first view; a static figure (the
// founding year) simply renders its final value, never animating.
function StatFigure({
  target,
  animate,
  duration,
  render,
  inView,
}: {
  target: number;
  animate: boolean;
  duration: number;
  render: (v: number) => string;
  inView: boolean;
}) {
  const count = useCountUp(target, duration || 1200, animate && inView);
  return <>{render(animate ? count : target)}</>;
}

/** Vision & Mission — two monumental statements, hairline-divided, no numerals. */
function VisionMission() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  const pillars = [
    {
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
    <section id="vision-mission" className="section-y relative bg-background overflow-hidden">
      <div className="container-ih relative">
        <MonumentalHeading
          className="max-w-4xl"
          lines={[
            t({ ar: "ما نسعى", en: "What we" }),
            <span key="accent" className="text-primary">{t({ ar: "إليه.", en: "stand for." })}</span>,
          ]}
        />

        <ul className="mt-[clamp(3.5rem,7vw,6rem)] border-t border-border-strong/60">
          {pillars.map((p, i) => (
            <li key={p.en}>
              <Reveal delay={Math.min(i, 4) * 0.06}>
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,14rem)_1fr] items-baseline gap-x-[clamp(2rem,5vw,4rem)] gap-y-4 py-[clamp(2.25rem,5vw,4rem)] border-b border-border-strong/60">
                  <h3
                    className="font-display font-bold text-foreground"
                    style={{ fontSize: "clamp(1.5rem,2.6vw,2.1rem)", letterSpacing: "-0.025em", lineHeight: 1.12 }}
                  >
                    {p.ar}
                  </h3>
                  <div>
                    <motion.p
                      className="font-display font-bold text-foreground"
                      style={{ fontSize: "clamp(1.5rem, 3vw, 2.6rem)", lineHeight: 1.14, letterSpacing: "-0.028em" }}
                      initial={reduce ? false : { opacity: 0, y: 20 }}
                      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
                    >
                      {p.statement}
                    </motion.p>
                    <p className="t-body text-[15px] md:text-[17px] mt-5 max-w-2xl">{p.body}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Values / principles — calm editorial hairline rows, no numerals, no kickers. */
function Values() {
  const { t } = useLanguage();

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

  return (
    <section id="values" className="section-y relative bg-surface-1 overflow-hidden border-t border-border-strong/60">
      <div className="container-ih relative">
        <header className="max-w-4xl">
          <MonumentalHeading
            lines={[
              t({ ar: "أربعة مبادئ", en: "Four principles" }),
              <span key="accent">
                {t({ ar: "تحكم كلّ ", en: "behind every " })}
                <span className="text-primary">{t({ ar: "قرار.", en: "decision." })}</span>
              </span>,
            ]}
          />
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.42, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {t({
              ar: "ليست شعاراتٍ نعلّقها، بل خطوطٌ لا نتجاوزها — تُقاس بما نرفض فعله بقدر ما نفعله.",
              en: "Not slogans we hang on a wall, but lines we won't cross — measured as much by what we refuse to do as by what we do.",
            })}
          </motion.p>
        </header>

        <ul className="mt-[clamp(3.5rem,7vw,6rem)] border-t border-border-strong/60">
          {values.map((v, i) => (
            <li key={v.en}>
              <Reveal delay={Math.min(i, 6) * 0.06}>
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,18rem)_1fr] items-baseline gap-x-[clamp(2rem,5vw,4rem)] gap-y-2 py-[clamp(1.75rem,3.5vw,3rem)] border-b border-border-strong/60">
                  <h3
                    className="font-display font-bold text-foreground"
                    style={{ fontSize: "clamp(1.4rem, 2.6vw, 2.1rem)", letterSpacing: "-0.025em", lineHeight: 1.12 }}
                  >
                    {v.ar}
                  </h3>
                  <p className="t-body text-[15px] md:text-[17px] max-w-xl">{v.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Timeline — the 2023→2026 milestone ledger as a vertical crimson thread with
    red node circles, evergreen + honest where exact data is unknown. */
function Timeline() {
  const { t, lang } = useLanguage();

  const milestones = [
    {
      year: lang === "en" ? "2023" : "٢٠٢٣",
      ar: "فكرةٌ وسط الحرب",
      en: "An idea amid war",
      body: t({
        ar: "من قلب الدمار تولد الفكرة: مساحةٌ تردّ على الحرب بالبناء، وتعيد للموهبة الغزّية إنترنتها وكهرباءها ومكانها الهادئ للعمل.",
        en: "From the heart of destruction the idea is born: a place that answers war with building, returning to Gazan talent the internet, power and quiet space to work.",
      }),
    },
    {
      year: lang === "en" ? "2024" : "٢٠٢٤",
      ar: "تأسّسنا — والدفعة الأولى",
      en: "Founded — and the first cohort",
      body: t({
        ar: "تتأسّس آيلاند هيفن كمساحة عملٍ مشتركة بدعم مبادرة «من النّاس إلى النّاس» — مجّانيّةً بالكامل — وتنطلق المنظومة المتكاملة مع دفعتها الأولى.",
        en: "Island Haven is founded as a shared workspace, backed by the NasToNas initiative — entirely free — and the full ecosystem launches with its first cohort.",
      }),
    },
    {
      year: lang === "en" ? "2025" : "٢٠٢٥",
      ar: "الدفعة الثانية تَبني",
      en: "The second cohort builds",
      body: t({
        ar: "تتوسّع المنظومة: تدريبٌ وتأهيل، أرصدةٌ سحابيّة، حلولٌ للمدفوعات الدوليّة، وإرشادٌ فرديّ — ودفعةٌ جديدة تكتب سطورها نحو يوم العرض.",
        en: "The ecosystem widens: training, cloud credits, international payment solutions and 1:1 mentorship — and a new cohort writes its lines toward Demo Day.",
      }),
    },
    {
      year: lang === "en" ? "2026" : "٢٠٢٦",
      ar: "الدفعة الثالثة تُفتح",
      en: "The third cohort opens",
      body: t({
        ar: "يُفتح بابٌ جديد، ودفعةٌ ثالثة تنضمّ إلى المسيرة نحو يوم عرضٍ أمام شبكةٍ من الدّاعمين والمستثمرين — حيث تلتقي الموهبة الغزّية بالعالم وجهًا لوجه.",
        en: "A new door opens, and a third cohort joins the path toward a Demo Day before a network of supporters and investors — where Gazan talent meets the world, face to face.",
      }),
    },
  ];

  return (
    <section id="timeline" className="section-y relative bg-background overflow-hidden">
      {/* Asymmetric two-column: the heading rests sticky to one side while the
          milestones flow as a quiet vertical sequence — a deliberate break from
          the page's full-width hairline-list rhythm. */}
      <div className="container-ih relative grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-x-[clamp(3rem,7vw,7rem)] gap-y-[clamp(3rem,6vw,5rem)]">
        <div className="lg:sticky lg:top-[clamp(7rem,16vh,11rem)] self-start">
          <MonumentalHeading
            lines={[
              t({ ar: "من فكرةٍ وسط الحرب،", en: "From an idea amid war," }),
              <span key="accent">
                {t({ ar: "إلى حاضنةٍ ", en: "to a building " })}
                <span className="text-primary">{t({ ar: "تَبني.", en: "incubator." })}</span>
              </span>,
            ]}
          />
        </div>

        {/* The milestones — a single crimson thread running down the years, each
            beat marked by a small red node circle on the inline-start edge. */}
        <ol className="relative border-s border-primary/40 ps-[clamp(2rem,4.5vw,3.5rem)]">
          {milestones.map((m, i) => (
            <li key={i} className="relative pb-[clamp(2.75rem,5vw,4rem)] last:pb-0">
              <Reveal delay={Math.min(i, 6) * 0.06}>
                {/* Red node circle, centred on the timeline rule */}
                <span
                  aria-hidden
                  className="absolute start-0 top-[0.55em] h-3 w-3 -translate-x-1/2 rtl:translate-x-1/2 rounded-full bg-primary ring-4 ring-background"
                />
                <span
                  className="block font-display font-black text-sand tnum leading-none"
                  style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.9rem)", letterSpacing: "-0.025em" }}
                >
                  {m.year}
                </span>
                <h3
                  className="font-display font-bold text-foreground mt-4"
                  style={{ fontSize: "clamp(1.4rem, 2.4vw, 2rem)", letterSpacing: "-0.025em", lineHeight: 1.14 }}
                >
                  {m.ar}
                </h3>
                <p className="t-body text-[15px] md:text-[17px] mt-3.5 max-w-2xl">{m.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Backers — NasToNas (parent) + Gaza Sky Geeks (ecosystem) as hairline rows. */
function Backers() {
  const { t } = useLanguage();

  const backers = [
    {
      en: "Parent program",
      kindAr: "البرنامج الأمّ",
      kindEn: "Parent program",
      name: t({ ar: "«من النّاس إلى النّاس»", en: "NasToNas — People to People" }),
      body: t({
        ar: "مبادرة تضامنٍ تصل أصدقاء غزّة بمشاريعَ حقيقيّة على الأرض. آيلاند هيفن برنامجٌ تنمويّ تابعٌ لها — وبدعمها تبقى الحاضنة مجّانيّة بالكامل.",
        en: "A solidarity initiative connecting friends of Gaza with real, ground-level projects. Island Haven is one of its development programs — and through its support the incubator stays entirely free.",
      }),
      href: "https://nastonas.org",
      hrefLabel: "nastonas.org",
    },
    {
      en: "Ecosystem partner",
      kindAr: "شريكٌ في المنظومة",
      kindEn: "Ecosystem partner",
      name: t({ ar: "Gaza Sky Geeks", en: "Gaza Sky Geeks" }),
      body: t({
        ar: "أوّل وأعرق مسرّعةٍ تقنيّة في فلسطين، رائدةٌ في تأهيل المواهب الرقميّة الغزّية وربطها بالسوق العالميّ — نتشارك معها هدف اقتصادٍ رقميّ ينهض من غزّة.",
        en: "Palestine's first and longest-running tech accelerator, a pioneer in upskilling Gazan digital talent and connecting it to the global market — we share its goal of a digital economy rising from Gaza.",
      }),
      href: "https://gazaskygeeks.com",
      hrefLabel: "gazaskygeeks.com",
    },
  ];

  return (
    <section id="backers" className="section-y relative bg-surface-1 overflow-hidden">
      <div className="container-ih relative">
        <header className="max-w-4xl">
          <MonumentalHeading
            lines={[
              t({ ar: "لا نبني", en: "We don't build" }),
              <span key="accent" className="text-primary">{t({ ar: "وحدنا.", en: "alone." })}</span>,
            ]}
          />
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.42, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {t({
              ar: "تقف خلف آيلاند هيفن منظومةٌ من الداعمين والشركاء الذين يؤمنون أنّ موهبة غزّة تستحقّ مكانًا في الاقتصاد الرقميّ العالميّ.",
              en: "Behind Island Haven stands an ecosystem of supporters and partners who believe Gaza's talent deserves a place in the global digital economy.",
            })}
          </motion.p>
        </header>

        <ul className="mt-[clamp(3.5rem,7vw,6rem)] border-t border-border-strong/60">
          {backers.map((b, i) => (
            <li key={b.en}>
              <Reveal delay={Math.min(i, 4) * 0.06}>
                <a
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`about-backer-${i}`}
                  className="group grid grid-cols-1 md:grid-cols-[minmax(0,18rem)_1fr_auto] items-baseline gap-x-[clamp(2rem,4vw,3rem)] gap-y-2 py-[clamp(2rem,4vw,3.25rem)] border-b border-border-strong/60 transition-colors hover:border-border-strong"
                >
                  <div>
                    <span
                      className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
                      style={{ fontSize: "clamp(1.4rem,2.4vw,2rem)", letterSpacing: "-0.025em", lineHeight: 1.12 }}
                    >
                      {b.name}
                    </span>
                    <p className="t-caption text-fg-secondary mt-2">{t({ ar: b.kindAr, en: b.kindEn })}</p>
                  </div>
                  <p className="t-body text-[15px] md:text-[16px] max-w-xl">{b.body}</p>
                  <span className="inline-flex items-center gap-2 t-caption text-fg-secondary whitespace-nowrap group-hover:text-foreground transition-colors tnum">
                    {b.hrefLabel}
                    <ExternalLink className="w-3.5 h-3.5 text-fg-faint group-hover:text-primary transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                  </span>
                </a>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Team teaser — a monumental invitation over one full-bleed photo, linking to /team. */
function TeamTeaser() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const photoRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: photoRef,
    offset: ["start end", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-7%", "7%"]);

  return (
    <section id="team-teaser" className="section-y relative bg-background overflow-hidden">
      <div className="container-ih relative">
        <header className="max-w-4xl">
          <MonumentalHeading
            lines={[
              t({ ar: "أناسٌ يقفون خلف", en: "People behind" }),
              <span key="accent">
                {t({ ar: "كلّ ", en: "every " })}
                <span className="text-primary">{t({ ar: "موهبة.", en: "talent." })}</span>
              </span>,
            ]}
          />
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.42, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {t({
              ar: "قيادةٌ ومرشدون ومستشارون من غزّة والعالم، يبنون الحاضنة ويرسمون رؤيتها، ويقفون خلف كلّ رائدٍ في رحلته — من الفكرة إلى المنافسة.",
              en: "Leadership, mentors and advisors from Gaza and around the world — building the incubator, shaping its vision, and standing behind every founder from idea to competition.",
            })}
          </motion.p>
          <Reveal delay={0.08} className="mt-[clamp(2rem,4vw,3rem)]">
            <Link
              href="/team"
              data-testid="about-team-link"
              className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t({ ar: "تعرّف على الفريق", en: "Meet the team" })}
              <ArrowLeft className="w-4 h-4 ltr:rotate-180 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </header>
      </div>

      {/* The people of the place — one full-bleed photograph, slow parallax, a calm line overlaid. */}
      <motion.div
        ref={photoRef}
        className="relative mt-[clamp(4rem,9vh,7rem)] w-full overflow-hidden"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={reduce ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      >
        <div className="relative h-[clamp(20rem,52vh,34rem)]">
          <motion.img
            src="/photos/IMG_8352.webp"
            alt={t({ ar: "فريق ومجتمع آيلاند هيفن في غزّة", en: "The Island Haven team and community in Gaza" })}
            loading="lazy"
            style={{ y: photoY }}
            className="absolute inset-0 h-[114%] -top-[7%] w-full object-cover object-center saturate-[1.04] will-change-transform"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, hsl(0 0% 4% / 0.92) 0%, hsl(0 0% 4% / 0.5) 45%, transparent 80%)" }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="container-ih w-full pb-[clamp(2.5rem,6vh,4.5rem)]">
              <motion.p
                className="max-w-[22ch] text-white"
                style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)", lineHeight: 1.18, letterSpacing: "-0.02em", fontWeight: 600 }}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
              >
                {t({ ar: "اليد التي تأخذ بيد الموهبة.", en: "The hands that guide the talent." })}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
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
        {/* 3 · Stats bar — real, defensible figures only */}
        <StatsBar />
        {/* 4 · Pull-quote — the founding belief, at scale */}
        <PullQuote
          testid="about-pullquote-1"
          quote={t({
            ar: "وُلدنا وسط الحرب، ورفضنا أن نقف متفرّجين — نقاوم الظرف بالبناء، ونفتح بابًا كلّما أُغلق آخر.",
            en: "Born amid the war, we refused to stand by — we resist circumstance with building, opening a door each time another is closed.",
          })}
          attribution={t({ ar: "مبدأ التأسيس · آيلاند هيفن", en: "Founding principle · Island Haven" })}
        />
        {/* 5 · The three strategic axes */}
        <Story />
        {/* 6 · Values / principles */}
        <Values />
        {/* 7 · 2023→2026 milestone timeline */}
        <Timeline />
        {/* 8 · Backers — NasToNas + Gaza Sky Geeks */}
        <Backers />
        {/* 9 · Pull-quote — competence, not pity */}
        <PullQuote
          testid="about-pullquote-2"
          quote={t({
            ar: "نبني ليُذكر اسم غزّة في السوق العالميّ احترامًا لكفاءته، لا تعاطفًا مع جرحه.",
            en: "We build so Gaza is named in the global market out of respect for its competence, not sympathy for its wound.",
          })}
        />
        {/* 10 · Team teaser → /team */}
        <TeamTeaser />
        {/* 11 · Closing belief + stand-with-us / apply CTA */}
        <Support />
      </div>
      <Footer />
    </div>
  );
}
