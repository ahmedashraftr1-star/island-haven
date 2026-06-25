import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

/**
 * Partners — the GLOBAL ECOSYSTEM behind every member, not a logo wall.
 *
 * Most "partners" sections show a row of logos. Ours shows the ONE thing that
 * matters to a Gazan founder: what each partner actually UNLOCKS — cloud credits,
 * international payments, a global freelance market, acceleration. A live marquee
 * gives the network a sense of motion/reach; a benefit grid grounds it in real
 * value. Brand-canonical (so it always reads complete + bilingual), on-brand
 * (cerulean monograms + crimson accents on the deep-navy canvas). No fake logos.
 */

type Cat = "backing" | "training" | "cloud" | "payments" | "market" | "funding";

const CAT: Record<Cat, { ar: string; en: string }> = {
  backing: { ar: "الجهة الداعمة", en: "Our backing" },
  training: { ar: "تدريب ومجتمع", en: "Training & community" },
  cloud: { ar: "أدوات سحابيّة", en: "Cloud & tools" },
  payments: { ar: "مدفوعات دوليّة", en: "Payments" },
  market: { ar: "سوق عمل حرّ", en: "Freelance market" },
  funding: { ar: "تمويل وأثر", en: "Funding & impact" },
};

interface Node {
  name: string;
  url: string; // hostname, no protocol
  cat: Cat;
  ar: string;
  en: string;
}

const NETWORK: Node[] = [
  {
    name: "NasToNas",
    url: "nastonas.org",
    cat: "backing",
    ar: "المبادرة التي تحتضن آيلاند هيفن وتربطه بأصدقاء غزّة حول العالم.",
    en: "The initiative that backs Island Haven and connects it to Gaza's friends worldwide.",
  },
  {
    name: "Gaza Sky Geeks",
    url: "gazaskygeeks.com",
    cat: "training",
    ar: "تدريب برمجيّ وتشبيك دوليّ لمجتمع التقنية في غزّة.",
    en: "Code training and global networking for Gaza's tech community.",
  },
  {
    name: "Replit",
    url: "replit.com",
    cat: "cloud",
    ar: "بيئة تطوير سحابيّة كاملة تعمل من المتصفّح — بلا قيود الجهاز.",
    en: "A full cloud dev environment in the browser — no hardware limits.",
  },
  {
    name: "AWS Activate",
    url: "aws.amazon.com/activate",
    cat: "cloud",
    ar: "أرصدة سحابيّة ودعم تقنيّ لبناء البنية التحتيّة للمشاريع الناشئة.",
    en: "Cloud credits and technical support to build venture infrastructure.",
  },
  {
    name: "Google for Startups",
    url: "startup.google.com",
    cat: "cloud",
    ar: "إرشاد وأرصدة ووصول لشبكة Google العالميّة للمؤسّسين.",
    en: "Mentorship, credits and access to Google's global founder network.",
  },
  {
    name: "Payoneer",
    url: "payoneer.com",
    cat: "payments",
    ar: "استقبال المدفوعات الدوليّة — يصل المستقلّ الغزّي بعميله في العالم.",
    en: "International payments — connecting Gaza's freelancers to clients worldwide.",
  },
  {
    name: "Freelancer",
    url: "freelancer.com",
    cat: "market",
    ar: "أكبر سوق عمل حرّ في العالم — فرص حقيقيّة عابرة للحدود لأعضائنا.",
    en: "The world's largest freelance marketplace — real, cross-border work for our members.",
  },
  {
    name: "Mercy Corps Ventures",
    url: "mercycorps.org/ventures",
    cat: "funding",
    ar: "داعم لريادة الأعمال ذات الأثر في الاقتصادات الهشّة.",
    en: "Backing impact entrepreneurship in fragile economies.",
  },
];

export function Partners() {
  const { t, lang } = useLanguage();

  return (
    <section id="partners" className="relative bg-background section-y overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[55%] brand-aura opacity-60" />

      <div className="container-ih relative">
        <Reveal as="header" className="max-w-2xl mb-[clamp(2rem,4vw,3.25rem)]">
          <div className="eyebrow mb-4">{t({ ar: "الشبكة العالميّة", en: "The global network" })}</div>
          <h2 className="t-h2">
            {t({ ar: "الشبكة التي تقف خلف كلّ عضو.", en: "The network behind every member." })}
          </h2>
          <p className="t-body mt-4 max-w-xl">
            {t({
              ar: "لسنا نعرض شعارات — نعرض ما تفتحه كلّ شراكة لك فعليًّا: أدوات سحابيّة، مدفوعات دوليّة، سوق عمل حرّ، وتسريع عالميّ.",
              en: "We don't show logos — we show what each partnership actually unlocks for you: cloud tools, international payments, a global freelance market, and acceleration.",
            })}
          </p>
        </Reveal>

        {/* Value framing — the killer angle: real $ in tools, unlocked free */}
        <Reveal className="mb-[clamp(1.75rem,3vw,2.5rem)] flex flex-wrap items-stretch gap-x-10 gap-y-5 border-y border-border-strong py-6">
          {[
            { v: lang === "en" ? "8" : "٨", l: t({ ar: "شركاء عالميّون", en: "Global partners" }) },
            { v: lang === "en" ? "$1,000s" : "آلاف $", l: t({ ar: "أدوات وأرصدة — مجّانًا", en: "in tools & credits — free" }) },
            { v: lang === "en" ? "Worldwide" : "عالميّ", l: t({ ar: "وصول لفرص عبر الحدود", en: "cross-border opportunity" }) },
          ].map((s, i) => (
            <div key={i} className="flex flex-col">
              <span className="font-display font-black text-sand-bright tnum leading-none" style={{ fontSize: "clamp(1.6rem,2.6vw,2.4rem)", letterSpacing: "-0.02em" }}>
                {s.v}
              </span>
              <span className="t-caption mt-2 text-fg-secondary">{s.l}</span>
            </div>
          ))}
        </Reveal>

        {/* Live marquee — the network in motion (pause on hover) */}
        <Reveal className="mb-[clamp(2.25rem,4vw,3.25rem)]">
          <div className="relative overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
            <div
              className="flex w-max gap-3 hover:[animation-play-state:paused] motion-reduce:[animation:none] motion-reduce:flex-wrap"
              style={{ animation: "ih-marquee 42s linear infinite" }}
            >
              {[...NETWORK, ...NETWORK].map((p, i) => (
                <span
                  key={`${p.name}-${i}`}
                  className="inline-flex items-center gap-2.5 shrink-0 rounded-full border border-border-strong bg-surface-2 ps-2.5 pe-4 py-2"
                >
                  <span className="grid place-items-center h-6 w-6 rounded-full bg-sand-soft text-sand-bright text-[11px] font-black">
                    {p.name.charAt(0)}
                  </span>
                  <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{p.name}</span>
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Benefit grid — what each partnership unlocks */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NETWORK.map((p, i) => (
            <Reveal key={p.name} delay={Math.min(i, 6) * 0.05} className="h-full">
              <a
                href={`https://${p.url}`}
                target="_blank"
                rel="noreferrer"
                data-testid={`partner-${p.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="card-base card-hover group flex h-full flex-col p-6"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid place-items-center h-11 w-11 rounded-[14px] bg-sand-soft text-sand-bright font-display font-black text-[18px] shrink-0 ring-1 ring-sand/25">
                      {p.name.charAt(0)}
                    </span>
                    <span className="font-display font-bold text-foreground text-[16px] truncate group-hover:text-primary transition-colors">
                      {p.name}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-fg-faint group-hover:text-primary transition-colors shrink-0" />
                </div>
                <p className="t-body text-[14px] flex-1">{t({ ar: p.ar, en: p.en })}</p>
                <span className="mt-5 inline-flex items-center self-start chip-sand rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide">
                  {t(CAT[p.cat])}
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        {/* CTA */}
        <Reveal delay={0.1} className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="t-caption">
            {t({ ar: "تريد أن تصبح جزءًا من الشبكة؟", en: "Want to join the network?" })}
          </p>
          <a
            href="mailto:island-haven@nastonas.org"
            className="inline-flex items-center gap-2 px-4 h-9 rounded-full border border-border-strong text-[12.5px] font-semibold text-fg-secondary hover:border-primary/50 hover:text-primary transition-colors"
          >
            {t({ ar: "تواصل معنا", en: "Get in touch" })}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
