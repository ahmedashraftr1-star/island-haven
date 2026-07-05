import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useContentSection } from "@/hooks/use-content";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { FREELANCERS } from "@/data/freelancers";
import { SectionHeader } from "@/components/SectionHeader";

/**
 * Audience — "لِمَن آيلاند؟". Reframed for العظمة: scale, space, restraint.
 * One monumental calm headline on acres of room, a single large full-bleed
 * photograph, then the four real tracks as a quiet big-type editorial sequence
 * — no eyebrow kicker, no 01/02/03 numbered ledger, no cerulean index, no
 * medallions, no aura blob, no uniform card grid. Type and one image carry it.
 */
export function Audience() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  // Preserve the CMS hook so the section stays editable from the content panel.
  const cms = useContentSection("audience", {});
  void cms;

  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["8%", "-8%"]);

  const tracks = [
    {
      key: "graduates",
      title: t({ ar: "الخرّيجون", en: "Graduates" }),
      line: t({
        ar: "أوّل خطوة بعد الشهادة — مهارة تُكسبك الدخل، وبيئة تعمل فيها فعلًا بدل الانتظار.",
        en: "The first step after the diploma — a skill that earns, and a place to actually work instead of waiting.",
      }),
    },
    {
      key: "freelancers",
      title: t({ ar: "المستقلّون", en: "Freelancers" }),
      line: t({
        ar: "مقعدٌ ثابت بإنترنت وكهرباء، وحلول دفع دوليّة تصل بك إلى عميلك في الخارج.",
        en: "A reliable seat with internet and power, plus payment solutions that reach your client abroad.",
      }),
    },
    {
      key: "students",
      title: t({ ar: "طلبة الجامعات", en: "University students" }),
      line: t({
        ar: "تدريبٌ وإرشاد يبنيان مهارة سوق العمل قبل التخرّج، لا بعد فوات الفرصة.",
        en: "Training and mentorship that build a market-ready skill before graduation, not after the chance is gone.",
      }),
    },
    {
      key: "founders",
      title: t({ ar: "أصحاب الأفكار والمشاريع الناشئة", en: "Founders & idea-owners" }),
      line: t({
        ar: "مسارات احتضان منظّمة تحوّل الفكرة إلى مشروع قابل للحياة — حتى يوم العرض.",
        en: "Structured incubation that turns an idea into a viable venture — all the way to Demo Day.",
      }),
    },
  ];

  // Per-category bento metadata (indexed to `tracks`): a ghost figure, a mono tag,
  // and a destination — turning the editorial rows into scannable cards.
  const bentoMeta = [
    { num: "١٥", tag: "GRADUATE", href: "/members?role=graduate", cta: t({ ar: "استعرض الخرّيجين", en: "Browse graduates" }) },
    { num: "٢١", tag: "FREELANCER", href: "/freelancers", cta: t({ ar: "استعرض المواهب", en: "Browse talent" }), gold: true },
    { num: "٩", tag: "STUDENT", href: "/members?role=student", cta: t({ ar: "استعرض الطلّاب", en: "Browse students" }) },
    { num: "∞", tag: "FOUNDER", href: "/apply", cta: t({ ar: "سجّل مشروعك", en: "Register your venture" }), accent: true },
  ];

  return (
    <section
      id="audience"
      ref={ref}
      className="relative bg-background overflow-hidden border-t border-white/[0.06]"
      style={{ paddingBlock: "clamp(3.5rem, 8vh, 6rem)" }}
    >
      <div className="container-ih relative">
        {/* Split header — headline (start) + subline (opposite column). */}
        <SectionHeader
          eyebrow={t({ ar: "من يستفيد", en: "Who it's for" })}
          eyebrowEN="WHO IT'S FOR"
          headline={
            <>
              {t({ ar: "مكانٌ لكلّ ", en: "A place for every " })}
              <span className="text-primary">{t({ ar: "موهبة.", en: "talent." })}</span>
            </>
          }
          subline={t({
            ar: "الموهبة لا تحدّها الجغرافيا، ولا يحدّها الظرف. أربع فئات تجد مكانها هنا.",
            en: "Talent is bound neither by geography nor by circumstance. Four tracks find their place here.",
          })}
          className="mb-[clamp(1.6rem,2.6vw,2.4rem)]"
        />

        <div className="max-w-5xl">
          {/* Talent cross-link — a quiet, compact bridge to the freelancer marketplace */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
            className="mt-10 sm:mt-12"
          >
            <Link
              href="/freelancers"
              className="group inline-flex items-center gap-4 rounded-[14px] border border-border-strong bg-surface-2/40 px-5 py-4 transition-colors hover:border-primary/40"
            >
              <span
                className="font-mono font-black text-sand-bright tnum leading-none"
                style={{ fontSize: "1.9rem" }}
              >
                {new Intl.NumberFormat(lang === "en" ? "en-US" : "ar-EG").format(FREELANCERS.length)}
              </span>
              <span className="text-start">
                <span className="block t-caption text-fg-secondary">
                  {t({ ar: "موهبة فريلانسر في الشبكة", en: "freelancers listed" })}
                </span>
                <span className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                  {t({ ar: "استعرض المواهب", en: "Browse talent" })}
                  <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </span>
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Talent-proof rows — the "talent has no borders" claim, answered in real
            figures + prose so the section is never a heading over a void. */}
        <div className="mt-16 sm:mt-20 border-t border-border-strong">
          {[
            {
              num: { ar: "٥٧", en: "57" },
              title: t({ ar: "موهبة نشطة", en: "active talents" }),
              desc: t({
                ar: "مستقلّون وخرّيجون وطلّاب يبنون من غزّة — يعملون مع عملاء في أوروبا وأمريكا والخليج في الوقت ذاته.",
                en: "Freelancers, graduates and students building from Gaza — working with clients in Europe, the US and the Gulf at once.",
              }),
            },
            {
              num: { ar: "+٣٥٨", en: "358+" },
              title: t({ ar: "مشروع مُنجز", en: "projects delivered" }),
              desc: t({
                ar: "من SaaS إلى هويّات بصريّة وتطبيقات جوّال — كلّ رقم وراءه إنسان حقيقيّ وعميل دفع.",
                en: "From SaaS to brand identities and mobile apps — behind every number is a real person and a paying client.",
              }),
            },
            {
              num: { ar: "١٠٠٪", en: "100%" },
              title: t({ ar: "مجّانًا للمنتسب", en: "free for members" }),
              desc: t({
                ar: "مساحة عمل + إنترنت + تدريب + إرشاد + أدوات بآلاف الدولارات — كلّها مجّانًا. لأنّ الموهبة لا ثمن لها.",
                en: "Workspace + internet + training + mentorship + thousands of dollars in tools — all free. Because talent shouldn't have a price.",
              }),
            },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 sm:gap-6 py-8 sm:py-10 border-b border-border-strong items-start">
              <div className="col-span-3 sm:col-span-2">
                <span
                  className="font-mono font-black text-sand-bright tnum leading-none"
                  style={{ fontSize: "clamp(1.6rem,2.6vw,2.4rem)" }}
                >
                  {lang === "en" ? row.num.en : row.num.ar}
                </span>
              </div>
              <div className="col-span-9 sm:col-span-3">
                <p className="font-display font-bold text-foreground leading-snug" style={{ fontSize: "clamp(1.1rem,2vw,1.4rem)" }}>
                  {row.title}
                </p>
              </div>
              <div className="col-span-12 sm:col-span-7">
                <p className="t-body text-[15px] leading-relaxed">{row.desc}</p>
              </div>
            </div>
          ))}
          <div className="py-8 sm:py-10 flex flex-wrap gap-3 items-center justify-end">
            <Link
              href="/members"
              className="rounded-full border border-border-strong px-5 py-2.5 text-[14px] font-medium text-foreground hover:border-primary/50 transition-colors"
            >
              {t({ ar: "استعرض المجتمع ←", en: "Explore the community →" })}
            </Link>
            <Link href="/jobs" className="cta-fill rounded-full px-5 py-2.5 text-[14px] font-semibold">
              {t({ ar: "لوحة الفرص", en: "Job board" })}
            </Link>
          </div>
        </div>

        {/* One large, calm full-bleed photograph — restraint, not a card deck. */}
        <motion.figure
          className="relative mt-16 sm:mt-24 overflow-hidden rounded-[24px] ring-1 ring-border-strong"
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        >
          <motion.img
            src="/photos/IMG_8341.webp"
            alt={t({ ar: "أعضاء آيلاند هيفن في مساحة العمل بغزّة", en: "Island Haven members in the Gaza workspace" })}
            loading="lazy"
            style={{ y: photoY }}
            className="w-full aspect-[16/9] object-cover scale-110 will-change-transform"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/70 via-transparent to-transparent" />
        </motion.figure>

        {/* The four tracks as a scannable bento — ghost figure, tag, title, line,
            and a destination per category. */}
        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-border-strong bg-border-strong">
          {tracks.map((track, i) => {
            const m = bentoMeta[i];
            return (
              <motion.div
                key={track.key}
                data-testid={`audience-track-${track.key}`}
                className={`group relative flex flex-col gap-3 overflow-hidden p-6 lg:p-8 transition-colors duration-200 motion-reduce:transition-none ${
                  m.accent ? "bg-background hover:bg-primary/[0.04] border-e-2 border-e-primary/30" : "bg-background hover:bg-surface-2"
                }`}
                initial={reduce ? false : { opacity: 0, y: 22 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: EASE_OUT_EXPO }}
              >
                <span
                  aria-hidden
                  className={`pointer-events-none absolute top-3 start-4 select-none font-mono leading-none tnum motion-reduce:hidden ${
                    m.accent ? "text-primary/[0.07]" : m.gold ? "text-sand/[0.10]" : "text-sand/[0.06]"
                  }`}
                  style={{ fontSize: "5rem" }}
                >
                  {m.num}
                </span>
                <p
                  className={`relative z-[1] font-mono text-[10px] tracking-[0.2em] uppercase ${
                    m.accent ? "text-primary" : m.gold ? "text-sand" : "text-fg-faint"
                  }`}
                >
                  {m.tag}
                </p>
                <h3 className="relative z-[1] font-display font-bold text-foreground text-[clamp(1.1rem,2vw,1.35rem)] leading-snug">
                  {track.title}
                </h3>
                <p className="relative z-[1] t-body text-[13.5px] leading-relaxed">{track.line}</p>
                <Link
                  href={m.href}
                  className={`relative z-[1] mt-auto inline-flex items-center gap-1.5 self-start pt-2 text-[12px] font-semibold transition-colors motion-reduce:transition-none hover:text-foreground ${
                    m.accent ? "text-primary" : m.gold ? "text-sand" : "text-fg-secondary"
                  }`}
                  aria-label={m.cta}
                >
                  {m.cta}
                  <ArrowLeft className="h-3 w-3 rtl:rotate-180" aria-hidden />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
