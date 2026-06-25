import { ArrowLeft } from "lucide-react";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

/**
 * Story — "قصّتنا", told the way Apple tells a product story: real photography of
 * the place, oversized SOLID display type, and an editorial numbered ledger built
 * around the THREE STRATEGIC AXES (البنية التحتية · التطوير والابتكار · التشبيك
 * والتأثير العالميّ), hairline-divided with brand cerulean numerals. Opens from
 * the authentic origin voice; keeps the NasToNas credit + both real links and the
 * founding stats, restyled on-brand. No gradient text, no white scheme-flip cards,
 * no glass — photography and typography carry it.
 *
 * The useContentSection("story", FALLBACK) hook is preserved; both FALLBACK and
 * EN_FALLBACK now carry the authentic copy so the section renders correctly even
 * with an empty CMS.
 */

const FALLBACK = {
  label: "قصّتنا",
  titleA: "وُلدنا وسط حربٍ",
  titleAccent: "ترفض",
  titleB: "أن تُغلق طريق الموهبة الغزّية.",
  lead: "من قلب غزّة، حيث لم يَبقَ حجرٌ على حجر ولا حلمٌ بلا جرح، رفضنا أن نقف متفرّجين. آيلاند هيفن منظومة تقاوم الظرف بالعمل، وتردّ على الدمار بالبناء — وتبني قصّتها على ثلاثة محاور.",
  axesEyebrow: "الأهداف الاستراتيجية",
  axis1Title: "البنية التحتية والحلول",
  axis1Body: "بيئة عملٍ احترافيّة بمعايير عالميّة، وأدواتٌ سحابيّة وتقنيّة حديثة حتّى لا يكون المال عائقًا، وحلولٌ عمليّة لاستقبال المدفوعات الدوليّة تصل بالمستقلّ إلى عميله خارج الحدود.",
  axis2Title: "التطوير والابتكار",
  axis2Body: "تدريبٌ وتأهيلٌ مستمرّ ومُحدَّث يواكب السوق العالميّ، ومساراتُ احتضانٍ منظّمة تحوّل الفكرة إلى مشروعٍ قابلٍ للحياة، مع تجذير الذكاء الاصطناعيّ في عمل أعضائنا وثقافتهم — أوّل نواةٍ في غزّة تفعل ذلك.",
  axis3Title: "التشبيك والتأثير العالميّ",
  axis3Body: "وصلٌ حقيقيّ بفرص العمل والتدريب والاستثمار خلف الحدود، حتّى نصبح المُنفِّذ الموثوق الذي يعتمد عليه كلّ شريكٍ وداعمٍ ليصل إلى غزّة — ببرامجَ وفعاليّاتٍ وهاكاثوناتٍ على أرضنا، ونظامٍ واضحٍ لقياس الأثر يُثبت الفرق.",
  image: "/photos/IMG_8358.webp",
  creditEyebrow: "برنامج تنمويّ تابع لـ",
  creditTitle: "«من النّاس إلى النّاس»",
  creditBody: "مبادرة تضامنٍ تصل أصدقاء غزّة بمشاريعَ حقيقيّة على الأرض — لتُحدث فرقًا مباشرًا وقابلًا للقياس.",
  creditLink1: "https://nastonas.org",
  creditLink2: "https://nastonas.org/generalDonations/4/0",
  stat1V: "٢٠٢٤", stat1L: "تأسّس",
  stat2V: "٣٩", stat2L: "مقعدًا",
  stat3V: "١٠٠٪", stat3L: "مجّانيّ",
};

const EN_FALLBACK = {
  label: "Our Story",
  titleA: "Born amid a war that",
  titleAccent: "refuses",
  titleB: "to close the path of Gazan talent.",
  lead: "From the heart of Gaza — where no stone, and no dream, was left untouched — we refused to stand by. Island Haven is an ecosystem that resists circumstance with work and answers destruction with building. Our story rests on three axes.",
  axesEyebrow: "Strategic axes",
  axis1Title: "Infrastructure & Solutions",
  axis1Body: "A professional work environment built to world standards, modern cloud and tech tools so money is never a barrier, and practical international payment solutions that reach the freelancer's client beyond the borders.",
  axis2Title: "Development & Innovation",
  axis2Body: "Continuous, updated training and upskilling that meets the global market, structured incubation tracks that turn an idea into a viable venture, and AI embedded in our members' work and culture — the first nucleus in Gaza to do so.",
  axis3Title: "Networking & Global Impact",
  axis3Body: "Real connections to work, training and investment beyond the borders — becoming the trusted executor every partner and funder relies on to reach Gaza, with programs, events and hackathons on our ground, and a clear impact-measurement system that proves the difference.",
  image: "/photos/IMG_8358.webp",
  creditEyebrow: "A development programme by",
  creditTitle: "NasToNas — People to People",
  creditBody: "A solidarity initiative connecting friends of Gaza with real, ground-level projects — making a direct, measurable difference.",
  creditLink1: "https://nastonas.org",
  creditLink2: "https://nastonas.org/generalDonations/4/0",
  stat1V: "2024", stat1L: "Founded",
  stat2V: "39", stat2L: "seats",
  stat3V: "100%", stat3L: "free",
};

export function Story() {
  const { t, lang } = useLanguage();
  const cms = useContentSection("story", FALLBACK);
  const c = lang === "en" ? EN_FALLBACK : cms;

  const axes = [
    { title: c.axis1Title, body: c.axis1Body },
    { title: c.axis2Title, body: c.axis2Body },
    { title: c.axis3Title, body: c.axis3Body },
  ].filter((a) => a.title || a.body);

  const idx = (i: number) =>
    lang === "en" ? String(i + 1).padStart(2, "0") : ["٠١", "٠٢", "٠٣", "٠٤"][i];

  const stats = [
    { v: c.stat1V, l: c.stat1L },
    { v: c.stat2V, l: c.stat2L },
    { v: c.stat3V, l: c.stat3L },
  ].filter((s) => s.v || s.l);

  return (
    <section id="story" className="relative bg-background section-y overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[70%] brand-aura opacity-70" />

      <div className="container-ih relative">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-start">
          {/* Sticky photo column — the place + the origin, shown not described */}
          <Reveal as="div" className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="eyebrow mb-5">{c.label}</div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(2rem, 4.2vw, 3.5rem)", lineHeight: 1.04, letterSpacing: "-0.028em" }}
            >
              {c.titleA} <span className="text-primary">{c.titleAccent}</span> {c.titleB}
            </h2>
            <p className="t-body-lg mt-5 max-w-md text-foreground/90">{c.lead}</p>
            <div className="mt-8 overflow-hidden rounded-[20px] ring-1 ring-white/10">
              <img
                src={imageUrl(c.image)}
                alt={t({ ar: "من داخل مساحة آيلاند هيفن في غزّة", en: "Inside the Island Haven workspace in Gaza" })}
                loading="lazy"
                className="w-full aspect-[3/4] object-cover"
              />
            </div>

            {/* Founding stats — hairline rows, cerulean numerals (no white cards) */}
            {stats.length > 0 && (
              <div className="mt-8">
                {stats.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-baseline justify-between gap-4 border-t border-border-strong py-4 last:border-b"
                  >
                    <span className="t-body text-foreground/70">{s.l}</span>
                    <span className="font-display font-bold text-sand tnum leading-none text-[clamp(1.3rem,2.4vw,1.85rem)]">
                      {s.v}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Reveal>

          {/* Editorial axes ledger — numbered, hairline-divided, no cards */}
          <div className="lg:col-span-7">
            <div className="eyebrow eyebrow-sand mb-7">{c.axesEyebrow}</div>

            {axes.map((a, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-9 items-baseline border-t border-border-strong py-8 sm:py-10 first:border-t-0 first:pt-0">
                  <span className="font-display text-[clamp(1.5rem,2.4vw,2.1rem)] font-bold tnum text-sand leading-none">
                    {idx(i)}
                  </span>
                  <div>
                    <h3
                      className="font-display font-bold text-foreground"
                      style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.85rem)", letterSpacing: "-0.018em", lineHeight: 1.15 }}
                    >
                      {a.title}
                    </h3>
                    <p className="t-body-lg mt-3 max-w-xl">{a.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}

            {/* NasToNas credit + both real links, restyled on-brand */}
            <div className="mt-[clamp(2.5rem,5vw,4rem)] border-t border-border-strong pt-[clamp(2rem,4vw,3rem)]">
              <div className="eyebrow text-fg-faint mb-3">{c.creditEyebrow}</div>
              <h3
                className="font-display font-bold text-foreground"
                style={{ fontSize: "clamp(1.4rem, 2.2vw, 1.9rem)", letterSpacing: "-0.018em" }}
              >
                {c.creditTitle}
              </h3>
              {c.creditBody && <p className="t-body mt-3 max-w-xl">{c.creditBody}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                {c.creditLink1 && (
                  <a
                    href={c.creditLink1}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border-strong text-foreground text-[13px] font-semibold hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    {(c.creditLink1 || "").replace(/^https?:\/\//, "")}
                    <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                  </a>
                )}
                {c.creditLink2 && (
                  <a
                    href={c.creditLink2}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cta-fill inline-flex items-center gap-2 h-10 px-4 rounded-full text-[13px] font-semibold transition-colors"
                  >
                    {lang === "en" ? "Donate via NasToNas" : "تبرّع عبر «من النّاس إلى النّاس»"}
                    <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
