import { ExternalLink } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { BrandMark } from "@/components/landing/BrandLogos";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * Partners — the ecosystem behind every member, told HONESTLY and now SEEN.
 *
 * The integrity move is unchanged: we cleanly SEPARATE two groups so no claim is
 * inflated — real organisational backers/partners vs. tools & credits we merely
 * open the door to. What's new is recognition: real brand marks (Google, Replit,
 * Payoneer, Freelancer) carried by a gently-moving logo marquee, the tools group
 * promoted to a premium bento card grid. Brands appear only as "tools we use /
 * unlock," monochrome and undistorted — never as overstated partnerships.
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
  featured?: boolean; // gets the wide bento tile
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
    name: "Freelancer",
    url: "freelancer.com",
    cat: "market",
    group: "tool",
    featured: true,
    ar: "أكبر سوق عمل حرّ في العالم — فرص حقيقيّة عابرة للحدود لأعضائنا.",
    en: "The world's largest freelance marketplace — real, cross-border work for our members.",
  },
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
];

const ALL = [...PARTNERS, ...TOOLS];

export function Partners() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <section id="partners" className="relative bg-[#060608] overflow-hidden border-t border-white/[0.06]" style={{ paddingBlock: "clamp(3rem, 6.5vh, 5.5rem)" }}>
      {/* Depth glow so the network sits on a lit field, not flat black. */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 80% at 78% 0%, rgba(233,74,51,0.08) 0%, transparent 58%), radial-gradient(50% 70% at 12% 100%, rgba(224,178,102,0.06) 0%, transparent 60%)" }} />
      <div className="container-ih relative">
        {/* ── Monumental header — one quiet line, one crimson word, acres of space ── */}
        <header className="max-w-4xl">
          <Reveal as="p" className="t-caption text-fg-secondary mb-[clamp(1.5rem,3vw,2.5rem)]">
            {t({ ar: "الشبكة", en: "The network" })}
          </Reveal>

          <h2
            className="font-display text-foreground"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
              lineHeight: "var(--lh-display)",
              letterSpacing: "-0.04em",
              fontWeight: 700,
            }}
          >
            {[
              t({ ar: "ما يقف خلف", en: "Behind every" }),
              t({ ar: "كلّ", en: "single" }),
              <span key="accent" className="text-primary">{t({ ar: "عضو.", en: "member." })}</span>,
            ].map((ln, i) => (
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
          </h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.42, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {t({
              ar: "نفصل بصدق بين أمرَين: جهاتٌ تدعمنا وتشاركنا فعلًا، وأدواتٌ وأرصدةٌ نفتح لك بابها. لا شعارات مبالَغ بها — قيمةٌ حقيقيّة فقط.",
              en: "We honestly separate two things: organisations that actually back and partner with us, and the tools & credits we open the door to. No overstated logos — just real value.",
            })}
          </motion.p>
        </header>

        {/* ── Logo marquee — the network in motion (real marks, calm cerulean) ── */}
        <Reveal className="mt-[clamp(2.75rem,5.5vw,4rem)]">
          <div className="relative overflow-hidden py-1.5 [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
            <div
              className="flex w-max items-center gap-3 hover:[animation-play-state:paused] motion-reduce:![animation:none] motion-reduce:flex-wrap motion-reduce:justify-center"
              style={{ animation: "ih-marquee 46s linear infinite" }}
            >
              {[...ALL, ...ALL].map((p, i) => (
                <span
                  key={`${p.name}-${i}`}
                  className="inline-flex items-center gap-2.5 shrink-0 rounded-full border border-border-strong bg-surface-2 ps-2.5 pe-4 py-2"
                >
                  <span className="grid place-items-center h-7 w-7 rounded-full bg-sand-soft text-sand-bright shrink-0">
                    <BrandMark name={p.name} variant="sm" />
                  </span>
                  <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{p.name}</span>
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ── Group 1: REAL backers & partners — actual relationships ── */}
        <div className="mt-[clamp(4rem,9vw,7.5rem)]">
          <GroupHeading
            title={t({ ar: "داعمونا وشركاؤنا", en: "Our backers & partners" })}
            note={t({ ar: "جهاتٌ تدعمنا وتشاركنا فعلًا", en: "organisations that actually back & partner with us" })}
          />
          <ul>
            {PARTNERS.map((p, i) => (
              <PartnerRow key={p.name} p={p} i={i} t={t} />
            ))}
          </ul>
        </div>

        {/* ── Group 2: TOOLS & CREDITS we unlock — a premium bento, NOT partners ── */}
        <div className="mt-[clamp(3.5rem,7vw,6rem)]">
          <GroupHeading
            title={t({ ar: "أدوات وأرصدة نفتحها لك", en: "Tools & credits we unlock for you" })}
            note={t({ ar: "برامجٌ ومنصّاتٌ نفتح لك بابها — لا شراكات", en: "programs & platforms we open the door to — not partnerships" })}
            aside={t({ ar: "أرصدةٌ بآلاف الدولارات — مجّانًا", en: "$1,000s in credits — free" })}
            asideValue={lang === "en" ? "$1,000s" : "آلاف $"}
          />
          <div className="mt-[clamp(1.5rem,3vw,2.25rem)] grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((p, i) => (
              <ToolCard key={p.name} p={p} i={i} t={t} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <Reveal delay={0.1} className="mt-[clamp(3.5rem,7vw,6rem)] flex flex-wrap items-center gap-x-4 gap-y-3">
          <p className="text-fg-secondary" style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)" }}>
            {t({ ar: "تريد أن تصبح جزءًا من الشبكة؟", en: "Want to join the network?" })}
          </p>
          <a
            href="mailto:island-haven@nastonas.org"
            className="group inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)", fontWeight: 600 }}
          >
            {t({ ar: "تواصل معنا", en: "Get in touch" })}
            <ExternalLink className="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

// Calm group heading — a name and an honest one-line note, no eyebrow rule, no
// medallion. An optional value figure sits aside for the tools group; it stays
// in the secondary foreground so cerulean is reserved for hard data only.
function GroupHeading({
  title,
  note,
  aside,
  asideValue,
}: {
  title: string;
  note: string;
  aside?: string;
  asideValue?: string;
}) {
  return (
    <Reveal className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 pb-[clamp(1.25rem,2.5vw,2rem)] border-b border-border-strong">
      <div className="max-w-2xl">
        <h3
          className="font-display font-bold text-foreground"
          style={{ fontSize: "clamp(1.4rem,2.8vw,2.1rem)", letterSpacing: "-0.025em", lineHeight: 1.1 }}
        >
          {title}
        </h3>
        <p className="t-caption text-fg-secondary mt-2">{note}</p>
      </div>
      {asideValue && (
        <div className="flex items-baseline gap-2.5">
          <span
            className="font-display font-black leading-none tnum text-fg-secondary"
            style={{ fontSize: "clamp(1.5rem,2.4vw,2.1rem)", letterSpacing: "-0.02em" }}
          >
            {asideValue}
          </span>
          <span className="t-caption text-fg-secondary max-w-[11rem]">{aside}</span>
        </div>
      )}
    </Reveal>
  );
}

// One real backer/partner — an editorial row, now led by its brand mark so the
// relationship reads at a glance. Name, the real value it brings, honest category.
function PartnerRow({
  p,
  i,
  t,
}: {
  p: Node;
  i: number;
  t: (s: { ar: string; en: string }) => string;
}) {
  return (
    <li>
      <Reveal delay={Math.min(i, 6) * 0.06}>
        <a
          href={`https://${p.url}`}
          target="_blank"
          rel="noreferrer"
          data-testid={`partner-${p.name.toLowerCase().replace(/\s+/g, "-")}`}
          className="group grid grid-cols-1 md:grid-cols-[minmax(0,19rem)_1fr_auto] items-center gap-x-8 gap-y-3 py-[clamp(1.5rem,3vw,2.5rem)] border-b border-border-strong/60 transition-colors hover:border-border-strong"
        >
          <span className="flex items-center gap-4 min-w-0">
            <span className="grid place-items-center h-12 w-12 rounded-2xl bg-sand-soft text-sand-bright shrink-0 ring-1 ring-sand/20 transition-colors group-hover:bg-sand/15">
              <BrandMark name={p.name} variant="lg" />
            </span>
            <span
              className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
              style={{ fontSize: "clamp(1.2rem,2vw,1.5rem)", letterSpacing: "-0.022em", lineHeight: 1.12 }}
            >
              {p.name}
            </span>
          </span>
          <p className="t-body text-[15px] md:text-[16px] max-w-xl">{t({ ar: p.ar, en: p.en })}</p>
          <span className="inline-flex items-center gap-2 t-caption text-fg-secondary whitespace-nowrap group-hover:text-foreground transition-colors">
            {t(CAT[p.cat])}
            <ExternalLink className="w-3.5 h-3.5 text-fg-faint group-hover:text-primary transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
          </span>
        </a>
      </Reveal>
    </li>
  );
}

// One tool/credit we unlock — a premium bento card with the real brand mark, the
// concrete value, and an honest category chip. The featured tile spans two cols.
function ToolCard({
  p,
  i,
  t,
}: {
  p: Node;
  i: number;
  t: (s: { ar: string; en: string }) => string;
}) {
  return (
    <Reveal delay={Math.min(i, 6) * 0.05} className={p.featured ? "sm:col-span-2" : ""}>
      <a
        href={`https://${p.url}`}
        target="_blank"
        rel="noreferrer"
        data-testid={`partner-${p.name.toLowerCase().replace(/\s+/g, "-")}`}
        className="card-glass card-hover group flex h-full flex-col p-6 sm:p-7"
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="grid place-items-center h-12 w-12 rounded-[14px] bg-sand-soft text-sand-bright shrink-0 ring-1 ring-sand/20 transition-colors group-hover:bg-sand/15">
              <BrandMark name={p.name} variant="lg" />
            </span>
            <span
              className="font-display font-bold text-foreground group-hover:text-primary transition-colors leading-tight"
              style={{ fontSize: p.featured ? "clamp(1.2rem,2vw,1.6rem)" : "1.0625rem", letterSpacing: "-0.02em" }}
            >
              {p.name}
            </span>
          </div>
          <ExternalLink className="w-4 h-4 text-fg-faint group-hover:text-primary transition-colors shrink-0" />
        </div>
        <p className={`t-body flex-1 ${p.featured ? "text-[15px] md:text-[17px] max-w-xl" : "text-[14px] md:text-[15px]"}`}>
          {t({ ar: p.ar, en: p.en })}
        </p>
        <span className="mt-5 inline-flex items-center self-start chip-sand rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide">
          {t(CAT[p.cat])}
        </span>
      </a>
    </Reveal>
  );
}
