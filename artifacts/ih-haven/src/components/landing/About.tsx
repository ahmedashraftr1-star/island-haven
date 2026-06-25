import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

/**
 * About — "من نحن", told in the brand's own voice (from the official profile):
 * born in Gaza during the war, refusing to stand by. Editorial Apple-grade
 * language — real photography, oversized solid type, hairline-divided vision &
 * mission, brand cerulean numerals on the deep-navy canvas. No gradient text,
 * no white scheme-flip cards, no glass. Photography + typography carry it.
 */
export function About() {
  const { t, lang } = useLanguage();

  const idx = (i: number) =>
    lang === "en" ? String(i + 1).padStart(2, "0") : ["٠١", "٠٢"][i];

  const narrative = [
    t({
      ar: "عامان من الدمار المتواصل أفقدا الشباب الغزّي ما يحتاجه أيّ إنسان ليعمل ويبني مستقبله: لا إنترنت كافٍ، ولا كهرباء منتظمة، ولا مكان هادئ للتفكير والإنتاج. الحرب لم تدمّر البنية التحتية فحسب، بل كادت أن تدمّر الأمل في أن يكون للموهبة الغزّية مكان في هذا العالم.",
      en: "Two years of relentless destruction stripped Gaza's youth of what anyone needs to work and build a future: no reliable internet, no steady power, no quiet place to think and create. The war didn't just destroy infrastructure — it nearly destroyed the hope that Gazan talent could have a place in this world.",
    }),
    t({
      ar: "من هذا الواقع وُلدت آيلاند هيفن — منظومة تقاوم الظرف بالعمل، وتردّ على الدمار بالبناء، وتقول لكلّ شابّ وشابّة في غزّة: موهبتك لم تُدمَّر، وطريقك لم يُغلَق.",
      en: "From that reality, Island Haven was born — an ecosystem that resists circumstance with work, answers destruction with building, and tells every young person in Gaza: your talent wasn't destroyed, and your path isn't closed.",
    }),
    t({
      ar: "بدأنا بمساحة عمل مشتركة تستقبل الخرّيجين والمستقلّين والطلبة، وتطوّرنا لنبني منظومة متكاملة: تدريبًا وتأهيلًا، أرصدةً سحابيّة، حلولًا لاستقبال المدفوعات الدوليّة، وتشبيكًا بفرصٍ مهنيّة حول العالم — مع توظيف الذكاء الاصطناعيّ في خدمة أعضائنا.",
      en: "We began with a shared workspace for graduates, freelancers and students, and grew into a full ecosystem: training and upskilling, cloud credits, international payment solutions, and real connections to opportunities worldwide — putting AI to work in our members' service.",
    }),
  ];

  const pillars = [
    {
      ar: "رؤيتنا",
      en: "Vision",
      body: t({
        ar: "أن نكون نقطة الارتكاز الأولى للاقتصاد الرقميّ في غزّة، والوجهة التي يبدأ منها كلّ شابّ طريقه نحو المنافسة والتفوّق في السوق العالميّ.",
        en: "To be the first anchor point of Gaza's digital economy — the place every young person's path toward global competition and excellence begins.",
      }),
    },
    {
      ar: "رسالتنا",
      en: "Mission",
      body: t({
        ar: "أن نُعيد للإنسان الغزّي ما سرقته منه الحرب: بيئةً يعمل فيها، ومهارةً تحمله، وعالمًا يصل إليه — حتى تُذكر غزّة في سوق العمل الدوليّ لا بالشفقة، بل بالكفاءة والتفوّق.",
        en: "To return to the people of Gaza what war stole: a place to work, a skill to carry them, and a world to reach — until Gaza is named in the global market not with pity, but for competence and excellence.",
      }),
    },
  ];

  const goal = [
    { v: lang === "en" ? "1,000" : "١٬٠٠٠", l: t({ ar: "كفاءة غزّية", en: "Gazan talents" }) },
    { v: lang === "en" ? "3" : "٣", l: t({ ar: "سنوات", en: "years" }) },
    { v: lang === "en" ? "100%" : "١٠٠٪", l: t({ ar: "مجّانًا", en: "free" }) },
  ];

  return (
    <section id="about" className="relative bg-background section-y overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[70%] brand-aura opacity-70" />

      <div className="container-ih relative">
        {/* Lead — the place + the origin, shown not described */}
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-start">
          <Reveal as="div" className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="eyebrow mb-5">{t({ ar: "من نحن", en: "About Island Haven" })}</div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.6rem)", lineHeight: 1.04, letterSpacing: "-0.028em" }}
            >
              {t({ ar: "وُلدنا في قلب غزّة.", en: "Born in the heart of Gaza." })}
            </h2>
            <p className="t-body-lg mt-5 max-w-md text-foreground/90">
              {t({
                ar: "لم تولد آيلاند هيفن في مكتبٍ مريح، ولا في ظروفٍ مثالية — بل وسط حربٍ لم تُبقِ حجرًا على حجر، ولا حلمًا بلا جرح. لكنّنا رفضنا أن نقف متفرّجين.",
                en: "Island Haven wasn't born in a comfortable office or ideal conditions — but amid a war that left no stone, and no dream, untouched. We refused to stand by.",
              })}
            </p>
            <div className="mt-8 overflow-hidden rounded-[20px] ring-1 ring-white/10">
              <img
                src="/photos/IMG_8358.webp"
                alt={t({ ar: "من داخل مساحة آيلاند هيفن في غزّة", en: "Inside the Island Haven workspace in Gaza" })}
                loading="lazy"
                className="w-full aspect-[5/4] object-cover"
              />
            </div>
          </Reveal>

          {/* The narrative + the bridge pull-quote */}
          <div className="lg:col-span-7">
            <div className="space-y-6 text-[clamp(1.05rem,1.5vw,1.2rem)] leading-[1.85] text-fg-secondary">
              {narrative.map((p, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <p>{p}</p>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1}>
              <blockquote className="mt-10 border-s-2 border-primary ps-6">
                <p
                  className="font-display font-bold text-foreground"
                  style={{ fontSize: "clamp(1.4rem, 2.4vw, 2rem)", lineHeight: 1.25, letterSpacing: "-0.02em" }}
                >
                  {t({
                    ar: "نحن لسنا مجرّد مكانٍ للعمل — نحن جسرٌ يهيّئ الإنسان الغزّي ليقف على خطّ المنافسة الحقيقيّ مع العالم.",
                    en: "We're not just a place to work — we're a bridge that prepares Gaza's people to compete, for real, with the world.",
                  })}
                </p>
              </blockquote>
            </Reveal>
          </div>
        </div>

        {/* The goal — one bold, honest target */}
        <Reveal>
          <div className="mt-[clamp(3.5rem,7vw,6.5rem)] border-t border-border-strong pt-[clamp(2.5rem,5vw,4rem)]">
            <div className="eyebrow eyebrow-sand mb-7">{t({ ar: "هدفنا", en: "Our goal" })}</div>
            <div className="grid sm:grid-cols-3 gap-x-8 gap-y-10">
              {goal.map((g, i) => (
                <div key={i}>
                  <div
                    className="font-display font-extrabold text-sand tnum leading-none"
                    style={{ fontSize: "clamp(2.6rem, 5vw, 4.2rem)", letterSpacing: "-0.03em" }}
                  >
                    {g.v}
                  </div>
                  <div className="t-body mt-3 text-foreground/80">{g.l}</div>
                </div>
              ))}
            </div>
            <p className="t-body-lg mt-9 max-w-2xl">
              {t({
                ar: "نردم الفجوة التي خلّفتها الحرب بتأهيل ألف كفاءة غزّية خلال ثلاث سنوات، ونعيد وصلها بالاقتصاد الرقميّ العالميّ — حتى تصل إلى مرحلة المنافسة والتفوّق.",
                en: "We close the gap the war left by qualifying a thousand Gazan talents within three years, and reconnecting them to the global digital economy — until they reach real competition and excellence.",
              })}
            </p>
          </div>
        </Reveal>

        {/* Vision & Mission — hairline editorial ledger */}
        <div className="mt-[clamp(3rem,6vw,5rem)]">
          {pillars.map((p, i) => (
            <Reveal key={p.en} delay={i * 0.05}>
              <div className="grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-9 items-baseline border-t border-border-strong py-8 sm:py-10 last:border-b">
                <span className="font-display text-[clamp(1.4rem,2.2vw,2rem)] font-bold tnum text-fg-faint leading-none">
                  {idx(i)}
                </span>
                <div className="grid lg:grid-cols-[14rem_1fr] gap-x-10 gap-y-3 items-baseline">
                  <div>
                    <h3
                      className="font-display font-bold text-foreground"
                      style={{ fontSize: "clamp(1.3rem, 2vw, 1.75rem)", letterSpacing: "-0.018em" }}
                    >
                      {p.ar}
                    </h3>
                    <div className="eyebrow mt-2">{p.en}</div>
                  </div>
                  <p className="t-body-lg max-w-2xl">{p.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Closing — the brand's belief, set large */}
        <Reveal>
          <p
            className="mt-[clamp(3.5rem,7vw,6rem)] font-display font-extrabold text-foreground max-w-4xl"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3.2rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}
          >
            {t({ ar: "نؤمن أنّ الموهبة لا تحدّها الجغرافيا.", en: "We believe talent is not bound by geography." })}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
