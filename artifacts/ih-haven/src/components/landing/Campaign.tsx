import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { imageUrl } from "@/hooks/use-content";
import { TrustStrip } from "./TrustStrip";
import { CinematicMedia } from "./CinematicMedia";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * Campaign — the new-branch ask, told the Apple way on a DARK cinematic stage.
 * The monumental crimson headline + the campaign pitch + the live status + the
 * donate CTA all live ON a single full-bleed campaign photograph (CinematicMedia,
 * heavy scrim, directional side-scrim). Below, on the same dark canvas, the four
 * real contribution tiers de-densify into airy premium cards — hairline-ruled,
 * white labels, muted detail, a gold amount-line — and the credibility strip sits
 * calmly beneath. Type, air and one photograph carry the grandeur. No serif.
 */

// The four contribution tiers — real campaign data, rendered as airy premium cards.
const TIERS = [
  {
    id: "power",
    ar: "أسبوع كهرباء",
    en: "A week of power",
    amountAr: "من ٣٥ $",
    amountEn: "From $35",
    noteAr: "تشغيل المكاتب والإنترنت لأسبوع كامل في المساحة.",
    noteEn: "Keeps the offices and internet running for a full week.",
  },
  {
    id: "bandwidth",
    ar: "شهر إنترنت",
    en: "A month of bandwidth",
    amountAr: "من ٨٠ $",
    amountEn: "From $80",
    noteAr: "اتّصال ثابت يصل المنتسبين بالعالم وفرص العمل.",
    noteEn: "Stable connection linking our members to the world and work opportunities.",
  },
  {
    id: "seat",
    ar: "مقعد لمنتسب",
    en: "A seat for a member",
    amountAr: "من ١٥٠ $",
    amountEn: "From $150",
    noteAr: "كرسي ومكتب جديد يحتضن طاقة شابّة لشهور قادمة.",
    noteEn: "A new chair and desk that will hold young talent for months to come.",
  },
  {
    id: "branch",
    ar: "ركن في الفرع",
    en: "A corner in the new branch",
    amountAr: "من ٥٠٠ $",
    amountEn: "From $500",
    noteAr: "مساحة كاملة باسمك تُفتح أمام جيلٍ جديد من غزّة.",
    noteEn: "A whole space in your name, opened for a new generation from Gaza.",
  },
] as const;

// Live progress — real campaign data, surfaced as a quiet premium bar.
const RAISED = 8400;
const GOAL = 20000;
const PROGRESS = Math.round((RAISED / GOAL) * 100);

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

export function Campaign() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <section
      id="campaign"
      className="relative bg-[#060608] text-white overflow-hidden"
      data-testid="campaign-band"
    >
      {/* ── The monumental ask, staged on a full-bleed campaign photograph. The
           headline, the pitch, the live status and the donate CTA all live ON
           the photo — heavy scrim keeps type razor-crisp, side-scrim anchors the
           start-aligned column. ── */}
      <CinematicMedia
        src={imageUrl("/photos/IMG_8300.webp")}
        alt={t({ ar: "مساحة آيلاند هيفن في غزّة", en: "Island Haven workspace in Gaza" })}
        scrim="heavy"
        sideScrim
        data-testid="campaign"
        aria-label={t({ ar: "حملة الفرع الجديد", en: "New branch campaign" })}
        className="min-h-[clamp(38rem,92vh,54rem)] flex items-end"
      >
        <div className="container-ih w-full pt-[clamp(7rem,20vh,12rem)] pb-[clamp(3.5rem,9vh,6rem)]">
          <div className="max-w-3xl">
            {/* Live status — a quiet confident line, no chip pill. */}
            <motion.div
              className="flex items-center gap-2.5"
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent-2/60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-2" />
              </span>
              <span className="t-caption text-white/70">
                {t({ ar: "حملة الفرع الجديد · مفتوحة الآن", en: "New branch campaign · Open now" })}
              </span>
            </motion.div>

            <h2
              className="mt-6 font-display text-white"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
                fontWeight: 900,
                lineHeight: 0.98,
                letterSpacing: "-0.05em",
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
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.85, delay: 0.34, ease: EASE_OUT_EXPO }}
              className="mt-7 max-w-xl text-white/75"
              style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.3rem)", lineHeight: 1.6 }}
            >
              {t({
                ar: "بعد أن أصبح آيلاند هيفن مساحةً مهنيّةً حقيقيّة تحتضن الطلاب والخرّيجين والمستقلّين، نفتح اليوم فرعاً جديداً يوسّع هذا الأثر. لسنا نطلب رقماً — نفتح الباب لأن تصير جزءاً من المكان بأيّ قدرٍ تستطيع، وكلّ مساهمةٍ تُترجَم مباشرةً إلى أثرٍ ملموس.",
                en: "After Island Haven became a real professional space for students, graduates, and freelancers, we're now opening a new branch to widen that impact. We're not asking for a number — we're opening the door for you to become part of this place, in whatever way you can, where every contribution translates directly into tangible impact.",
              })}
            </motion.p>

            {/* Live progress — a quiet premium meter, real numbers. */}
            <motion.div
              className="mt-9 max-w-md"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, delay: 0.42, ease: EASE_OUT_EXPO }}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-display font-black text-sand-bright" style={{ fontSize: "clamp(1.5rem,3vw,2rem)", letterSpacing: "-0.03em" }}>
                  {fmt(RAISED)}
                </span>
                <span className="t-caption text-white/55">
                  {t({ ar: `من هدف ${fmt(GOAL)}`, en: `of ${fmt(GOAL)} goal` })}
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-white/12 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-sand-bright"
                  initial={reduce ? { width: `${PROGRESS}%` } : { width: 0 }}
                  whileInView={{ width: `${PROGRESS}%` }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: reduce ? 0 : 1.1, delay: 0.5, ease: EASE_OUT_EXPO }}
                />
              </div>
            </motion.div>

            <motion.div
              className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, delay: 0.5, ease: EASE_OUT_EXPO }}
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
                className="group inline-flex items-center gap-2 text-[14px] font-semibold text-white/80 hover:text-white transition-colors"
              >
                {t({ ar: "التفاصيل على nastonas.org", en: "Details on nastonas.org" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </a>
            </motion.div>
          </div>
        </div>
      </CinematicMedia>

      {/* ── What a contribution unlocks — de-densified into airy premium cards on
           the dark canvas. Gold amount-line, white label, muted detail. ── */}
      <div className="container-ih relative" style={{ paddingBlock: "clamp(4.5rem, 10vh, 8rem)" }}>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="t-caption text-white/55"
        >
          {t({ ar: "ماذا تُحدِث مساهمتك", en: "What your contribution unlocks" })}
        </motion.p>

        <ul className="mt-[clamp(2rem,4vw,3rem)] grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, i) => (
            <li key={tier.id}>
              <motion.div
                data-testid={`campaign-tier-${tier.id}`}
                className="group h-full flex flex-col rounded-[20px] border border-white/12 bg-white/[0.04] p-[clamp(1.5rem,2.5vw,2rem)] transition-[border-color,background-color,transform] duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06] will-change-transform"
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.8, delay: Math.min(i, 4) * 0.08, ease: EASE_OUT_EXPO }}
              >
                <span
                  className="font-display font-black text-sand-bright"
                  style={{ fontSize: "clamp(1.3rem, 2vw, 1.6rem)", letterSpacing: "-0.03em" }}
                >
                  {t({ ar: tier.amountAr, en: tier.amountEn })}
                </span>
                <h3
                  className="mt-4 font-display font-bold text-white"
                  style={{ fontSize: "clamp(1.15rem, 1.6vw, 1.35rem)", letterSpacing: "-0.02em", lineHeight: 1.2 }}
                >
                  {t({ ar: tier.ar, en: tier.en })}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/60">
                  {t({ ar: tier.noteAr, en: tier.noteEn })}
                </p>
              </motion.div>
            </li>
          ))}
        </ul>

        {/* ── Credibility near the ask — calm, hairline-ruled on dark ── */}
        <TrustStrip className="mt-[clamp(3.5rem,7vh,5.5rem)] pt-[clamp(2rem,4vh,3rem)] border-t border-white/12" />
      </div>
    </section>
  );
}
