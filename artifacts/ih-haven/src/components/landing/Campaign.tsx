import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrustStrip } from "./TrustStrip";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * Campaign — the new-branch ask, told the Apple way: SCALE + SPACE + RESTRAINT.
 * One monumental line opens it ("Help us open / the next / branch." — AR "ساهم في
 * إطلاق الفرع الجديد." — a single crimson word) on acres of dark canvas. The four
 * contribution tiers — real data —
 * are woven as calm editorial hairline rows (a name, what it unlocks), NOT a Roman-
 * numeral ledger or card deck. A single full-bleed campaign photograph closes it
 * with the live ask and the donate CTA overlaid quietly. No eyebrow kicker, no
 * numbered ledger, no medallions, no rounded media card, no aura. Type and air
 * carry the grandeur; the credibility strip sits calmly near the ask.
 */

// The four contribution tiers — real campaign data, woven as calm prose rows.
const TIERS = [
  {
    id: "power",
    ar: "أسبوع كهرباء",
    en: "A week of power",
    noteAr: "تشغيل المكاتب والإنترنت لأسبوع كامل في المساحة.",
    noteEn: "Keeps the offices and internet running for a full week.",
  },
  {
    id: "bandwidth",
    ar: "شهر إنترنت",
    en: "A month of bandwidth",
    noteAr: "اتّصال ثابت يصل المنتسبين بالعالم وفرص العمل.",
    noteEn: "Stable connection linking our members to the world and work opportunities.",
  },
  {
    id: "seat",
    ar: "مقعد لمنتسب",
    en: "A seat for a member",
    noteAr: "كرسي ومكتب جديد يحتضن طاقة شابّة لشهور قادمة.",
    noteEn: "A new chair and desk that will hold young talent for months to come.",
  },
  {
    id: "branch",
    ar: "ركن في الفرع",
    en: "A corner in the new branch",
    noteAr: "مساحة كاملة باسمك تُفتح أمام جيلٍ جديد من غزّة.",
    noteEn: "A whole space in your name, opened for a new generation from Gaza.",
  },
] as const;

export function Campaign() {
  const { t, dir } = useLanguage();
  const reduce = useReducedMotion();

  const mediaRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: mediaRef,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-8%", "8%"]);

  return (
    <section
      id="campaign"
      className="relative bg-background overflow-hidden"
      style={{ paddingBlock: "clamp(6.5rem, 16vh, 12rem)" }}
      data-testid="campaign-band"
    >
      <div className="container-ih relative">
        {/* ── The monumental ask — headline (start) balanced by its supporting
             paragraph (end) so the opposite viewport half is never a void. ── */}
        <header className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-x-[clamp(2.5rem,6vw,6rem)]">
          <h2
            className="font-display text-foreground"
            style={{
              fontSize: "clamp(1.9rem, 3.6vw, 3.1rem)",
              lineHeight: 0.99,
              letterSpacing: "-0.045em",
              fontWeight: 700,
            }}
          >
            {[
              t({ ar: "ساهم في", en: "Help us open" }),
              t({ ar: "إطلاق", en: "the next" }),
              <span key="accent" className="text-primary">
                {t({ ar: "الفرع الجديد.", en: "branch." })}
              </span>,
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
            className="mt-[clamp(1.75rem,3.5vw,2.75rem)] lg:mt-0 max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {t({
              ar: "بعد أن أصبح آيلاند هيفن مساحةً مهنيّةً حقيقيّة تحتضن الطلاب والخرّيجين والمستقلّين، نفتح اليوم فرعاً جديداً يوسّع هذا الأثر. لسنا نطلب رقماً — نفتح الباب لأن تصير جزءاً من المكان بأيّ قدرٍ تستطيع، وكلّ مساهمةٍ تُترجَم مباشرةً إلى أثرٍ ملموس.",
              en: "After Island Haven became a real professional space for students, graduates, and freelancers, we're now opening a new branch to widen that impact. We're not asking for a number — we're opening the door for you to become part of this place, in whatever way you can, where every contribution translates directly into tangible impact.",
            })}
          </motion.p>
        </header>

        {/* ── What a contribution unlocks — calm editorial hairline rows, one idea
             per line, generous air. Real tiers, no Roman ledger, no medallions. ── */}
        <div className="mt-[clamp(4rem,8vw,7rem)] max-w-4xl">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="t-caption text-fg-secondary pb-[clamp(1.25rem,2.5vw,2rem)] border-b border-border-strong"
          >
            {t({ ar: "ماذا تُحدِث مساهمتك", en: "What your contribution unlocks" })}
          </motion.p>

          <ul>
            {TIERS.map((tier, i) => (
              <li key={tier.id}>
                <motion.div
                  data-testid={`campaign-tier-${tier.id}`}
                  className="grid grid-cols-1 md:grid-cols-[minmax(0,18rem)_1fr] items-baseline gap-x-10 gap-y-2 py-[clamp(1.5rem,3vw,2.5rem)] border-b border-border-strong/60 will-change-transform"
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.8, delay: Math.min(i, 4) * 0.07, ease: EASE_OUT_EXPO }}
                >
                  <h3
                    className="font-display font-bold text-foreground"
                    style={{
                      fontSize: "clamp(1.4rem, 2.8vw, 2.1rem)",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.12,
                    }}
                  >
                    {t({ ar: tier.ar, en: tier.en })}
                  </h3>
                  <p className="t-body text-[15px] md:text-[16px] max-w-xl">
                    {t({ ar: tier.noteAr, en: tier.noteEn })}
                  </p>
                </motion.div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── One full-bleed campaign photograph — the place the ask points to. The
           live status, the year, and the donate CTA sit overlaid calmly, start-
           aligned. Real photo, real links, no rounded card, no decoration. ── */}
      <motion.div
        ref={mediaRef}
        className="relative mt-[clamp(5rem,11vh,9rem)] w-full overflow-hidden"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={reduce ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      >
        <div className="relative h-[clamp(24rem,64vh,42rem)]">
          <motion.img
            src={`${import.meta.env.BASE_URL}photos/IMG_8300.webp`}
            alt={t({ ar: "مساحة آيلاند هيفن في غزّة", en: "Island Haven workspace in Gaza" })}
            loading="lazy"
            style={{ y: imgY }}
            className="absolute inset-0 h-[118%] w-full object-cover saturate-[1.06] will-change-transform"
          />
          {/* Calm legibility wash — start-aligned, not a centered card.
              Direction-aware: the opaque 0.92 stop must sit behind the
              text-aligned edge (right in RTL, left in LTR). */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(${dir === "rtl" ? 270 : 90}deg, hsl(0 0% 4% / 0.92) 0%, hsl(0 0% 4% / 0.5) 48%, transparent 82%)`,
            }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="container-ih w-full pb-[clamp(2.5rem,6vh,5rem)]">
              {/* Live status — a quiet confident line, no chip pill, no medallion. */}
              <motion.div
                className="flex items-center gap-2.5 text-white/85"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-accent-2/60 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-2" />
                </span>
                <span className="t-caption text-white/85">
                  {t({ ar: "حملة الفرع الجديد · مفتوحة الآن", en: "New branch campaign · Open now" })}
                </span>
              </motion.div>

              <motion.p
                className="mt-5 max-w-[22ch] text-white"
                style={{
                  fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)",
                  lineHeight: 1.18,
                  letterSpacing: "-0.02em",
                  fontWeight: 600,
                }}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.85, delay: 0.1, ease: EASE_OUT_EXPO }}
              >
                {t({
                  ar: "نقطة آيلاند هيفن القادمة تُفتح في غزّة.",
                  en: "Island Haven's next point opens in Gaza.",
                })}
              </motion.p>

              <motion.div
                className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8, delay: 0.18, ease: EASE_OUT_EXPO }}
              >
                <a
                  href="https://nastonas.org/projects/relief"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="campaign-donate"
                  className="cta-fill group inline-flex items-center gap-2.5 h-14 px-9 rounded-full font-bold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)]"
                >
                  {t({ ar: "تبرّع للفرع الجديد", en: "Donate to the new branch" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </a>
                <a
                  href="https://nastonas.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="campaign-details"
                  className="group inline-flex items-center gap-2 text-[14px] font-semibold text-white/85 hover:text-white transition-colors"
                >
                  {t({ ar: "التفاصيل على nastonas.org", en: "Details on nastonas.org" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Credibility near the ask — calm, no headline needed (utility register) ── */}
      <div className="container-ih relative">
        <TrustStrip className="mt-[clamp(3rem,6vh,5rem)] pt-[clamp(2rem,4vh,3rem)] border-t border-border-strong" />
      </div>
    </section>
  );
}
