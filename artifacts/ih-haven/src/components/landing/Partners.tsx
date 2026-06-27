import { ExternalLink } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * Partners — the ecosystem behind every member, told HONESTLY (not a logo wall).
 *
 * The key integrity move: we cleanly SEPARATE two groups so no claim is inflated.
 *   • BACKERS & PARTNERS — real organisational relationships (NasToNas, Gaza Sky
 *     Geeks, Mercy Corps Ventures) who actually back / partner with us.
 *   • TOOLS & CREDITS WE UNLOCK — programs and platforms we help members access
 *     (Replit, AWS Activate, Google for Startups, Payoneer, Freelancer). These
 *     are NOT called "partners"; they're real value we open the door to.
 *
 * Each entry shows what it actually UNLOCKS — cloud credits, payments, market,
 * acceleration — so a Gazan founder sees value, not vanity. On-brand (cerulean
 * monograms + crimson accents on the deep-navy canvas). No fake logos, no
 * overstated partnerships.
 */

type Cat = "backing" | "training" | "cloud" | "payments" | "market" | "funding";
type Group = "partner" | "tool";

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
  group: Group;
  ar: string;
  en: string;
}

// Real backers & partners — actual organisational relationships.
const PARTNERS: Node[] = [
  {
    name: "NasToNas",
    url: "nastonas.org",
    cat: "backing",
    group: "partner",
    ar: "المبادرة التي تحتضن آيلاند هيفن وتربطه بأصدقاء غزّة حول العالم.",
    en: "The initiative that backs Island Haven and connects it to Gaza's friends worldwide.",
  },
  {
    name: "Gaza Sky Geeks",
    url: "gazaskygeeks.com",
    cat: "training",
    group: "partner",
    ar: "تدريب برمجيّ وتشبيك دوليّ لمجتمع التقنية في غزّة.",
    en: "Code training and global networking for Gaza's tech community.",
  },
  {
    name: "Mercy Corps Ventures",
    url: "mercycorps.org/ventures",
    cat: "funding",
    group: "partner",
    ar: "داعم لريادة الأعمال ذات الأثر في الاقتصادات الهشّة.",
    en: "Backing impact entrepreneurship in fragile economies.",
  },
];

// Tools & credits we help members UNLOCK — programs we open the door to, NOT
// organisational partners. Framed honestly so claims stay defensible.
const TOOLS: Node[] = [
  {
    name: "Replit",
    url: "replit.com",
    cat: "cloud",
    group: "tool",
    ar: "بيئة تطوير سحابيّة كاملة تعمل من المتصفّح — بلا قيود الجهاز.",
    en: "A full cloud dev environment in the browser — no hardware limits.",
  },
  {
    name: "AWS Activate",
    url: "aws.amazon.com/activate",
    cat: "cloud",
    group: "tool",
    ar: "أرصدة سحابيّة ودعم تقنيّ لبناء البنية التحتيّة للمشاريع الناشئة.",
    en: "Cloud credits and technical support to build venture infrastructure.",
  },
  {
    name: "Google for Startups",
    url: "startup.google.com",
    cat: "cloud",
    group: "tool",
    ar: "إرشاد وأرصدة ووصول لشبكة Google العالميّة للمؤسّسين.",
    en: "Mentorship, credits and access to Google's global founder network.",
  },
  {
    name: "Payoneer",
    url: "payoneer.com",
    cat: "payments",
    group: "tool",
    ar: "استقبال المدفوعات الدوليّة — يصل المستقلّ الغزّي بعميله في العالم.",
    en: "International payments — connecting Gaza's freelancers to clients worldwide.",
  },
  {
    name: "Freelancer",
    url: "freelancer.com",
    cat: "market",
    group: "tool",
    ar: "أكبر سوق عمل حرّ في العالم — فرص حقيقيّة عابرة للحدود لأعضائنا.",
    en: "The world's largest freelance marketplace — real, cross-border work for our members.",
  },
];

const NETWORK: Node[] = [...PARTNERS, ...TOOLS];

export function Partners() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <section id="partners" className="relative bg-background section-y overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[55%] brand-aura opacity-60" />

      <div className="container-ih relative">
        <Reveal as="header" className="max-w-2xl mb-[clamp(2rem,4vw,3.25rem)]">
          <div className="eyebrow mb-4">{t({ ar: "الداعمون وما نفتحه لك", en: "Backers & what we unlock" })}</div>
          <h2 className="t-h2">
            {t({ ar: "الشبكة التي تقف خلف كلّ عضو.", en: "The network behind every member." })}
          </h2>
          <p className="t-body mt-4 max-w-xl">
            {t({
              ar: "نفصل بصدق بين أمرَين: جهاتٌ تدعمنا وتشاركنا فعلًا، وأدواتٌ وأرصدةٌ نفتح لك بابها. لا شعارات مبالَغ بها — قيمةٌ حقيقيّة فقط.",
              en: "We honestly separate two things: organisations that actually back and partner with us, and the tools & credits we open the door to. No overstated logos — just real value.",
            })}
          </p>
        </Reveal>

        {/* Value framing — honest split: real backers vs. $ in tools we unlock */}
        <Reveal className="mb-[clamp(1.75rem,3vw,2.5rem)] flex flex-wrap items-stretch gap-x-10 gap-y-5 border-y border-border-strong py-6">
          {[
            { v: lang === "en" ? String(PARTNERS.length) : "٣", l: t({ ar: "جهات داعمة وشريكة", en: "backers & partners" }) },
            { v: lang === "en" ? "$1,000s" : "آلاف $", l: t({ ar: "أدوات وأرصدة نفتحها — مجّانًا", en: "in tools & credits we unlock — free" }) },
            { v: lang === "en" ? "Worldwide" : "عالميّ", l: t({ ar: "وصول لفرص عبر الحدود", en: "cross-border opportunity" }) },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="flex flex-col"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.5, delay: 0.06 + i * 0.09, ease: EASE_OUT_EXPO }}
              style={{ willChange: "transform, opacity" }}
            >
              <motion.span
                className="font-display font-black text-sand-bright tnum leading-none origin-[0%_100%] rtl:origin-[100%_100%]"
                style={{ fontSize: "clamp(1.6rem,2.6vw,2.4rem)", letterSpacing: "-0.02em", willChange: "transform" }}
                initial={reduce ? false : { scale: 0.92 }}
                whileInView={reduce ? undefined : { scale: 1 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ duration: 0.55, delay: 0.06 + i * 0.09, ease: EASE_OUT_EXPO }}
              >
                {s.v}
              </motion.span>
              <span className="t-caption mt-2 text-fg-secondary">{s.l}</span>
            </motion.div>
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
                  className="group/chip inline-flex items-center gap-2.5 shrink-0 rounded-full border border-border-strong bg-surface-2 ps-2.5 pe-4 py-2 transition-colors duration-300 hover:border-sand/40"
                >
                  <span className="grid place-items-center h-6 w-6 rounded-full bg-sand-soft text-sand-bright text-[11px] font-black transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover/chip:scale-110">
                    {p.name.charAt(0)}
                  </span>
                  <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{p.name}</span>
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Group 1: REAL backers & partners — actual relationships ── */}
        <Reveal className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-5">
          <span className="h-px w-9 bg-primary/50 self-center" />
          <h3 className="font-display font-bold text-foreground text-[clamp(1.05rem,2vw,1.4rem)]" style={{ letterSpacing: "-0.018em" }}>
            {t({ ar: "داعمونا وشركاؤنا", en: "Our backers & partners" })}
          </h3>
          <span className="t-caption text-fg-secondary">
            {t({ ar: "جهاتٌ تدعمنا وتشاركنا فعلًا", en: "organisations that actually back & partner with us" })}
          </span>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PARTNERS.map((p, i) => (
            <PartnerCard key={p.name} p={p} i={i} t={t} />
          ))}
        </div>

        {/* ── Group 2: TOOLS & CREDITS we unlock — NOT partners ── */}
        <Reveal className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-[clamp(2.25rem,4vw,3rem)] mb-5">
          <span className="h-px w-9 bg-sand/60 self-center" />
          <h3 className="font-display font-bold text-foreground text-[clamp(1.05rem,2vw,1.4rem)]" style={{ letterSpacing: "-0.018em" }}>
            {t({ ar: "أدوات وأرصدة نفتحها لك", en: "Tools & credits we unlock for you" })}
          </h3>
          <span className="t-caption text-fg-secondary">
            {t({ ar: "برامجٌ ومنصّاتٌ نفتح لك بابها — لا شراكات", en: "programs & platforms we open the door to — not partnerships" })}
          </span>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((p, i) => (
            <PartnerCard key={p.name} p={p} i={i} t={t} />
          ))}
        </div>

        {/* CTA */}
        <Reveal delay={0.1} className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="t-caption">
            {t({ ar: "تريد أن تصبح جزءًا من الشبكة؟", en: "Want to join the network?" })}
          </p>
          <a
            href="mailto:island-haven@nastonas.org"
            className="group inline-flex items-center gap-2 px-4 h-9 rounded-full border border-border-strong text-[12.5px] font-semibold text-fg-secondary hover:border-primary/50 hover:text-primary transition-colors"
          >
            {t({ ar: "تواصل معنا", en: "Get in touch" })}
            <ExternalLink className="w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

// One ecosystem card — used for both groups (backers/partners + tools/credits).
// The group's heading above it carries the honest framing; the card shows the
// real value each entry unlocks.
function PartnerCard({
  p,
  i,
  t,
}: {
  p: Node;
  i: number;
  t: (s: { ar: string; en: string }) => string;
}) {
  return (
    <Reveal delay={Math.min(i, 6) * 0.05} className="h-full">
      <a
        href={`https://${p.url}`}
        target="_blank"
        rel="noreferrer"
        data-testid={`partner-${p.name.toLowerCase().replace(/\s+/g, "-")}`}
        className="card-base card-hover group flex h-full flex-col p-6"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid place-items-center h-11 w-11 rounded-[14px] bg-sand-soft text-sand-bright font-display font-black text-[18px] shrink-0 ring-1 ring-sand/25 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none will-change-transform group-hover:scale-[1.06] group-hover:ring-sand/45">
              {p.name.charAt(0)}
            </span>
            <span className="font-display font-bold text-foreground text-[16px] truncate group-hover:text-primary transition-colors">
              {p.name}
            </span>
          </div>
          <ExternalLink className="w-4 h-4 text-fg-faint group-hover:text-primary transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none shrink-0 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
        </div>
        <p className="t-body text-[14px] flex-1">{t({ ar: p.ar, en: p.en })}</p>
        <span className="mt-5 inline-flex items-center self-start chip-sand rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:-translate-y-0.5">
          {t(CAT[p.cat])}
        </span>
      </a>
    </Reveal>
  );
}
