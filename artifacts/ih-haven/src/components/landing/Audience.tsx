import { motion, useReducedMotion } from "framer-motion";
import { useContentSection, imageUrl } from "@/hooks/use-content";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { FREELANCERS } from "@/data/freelancers";
import { CinematicMedia } from "@/components/landing/CinematicMedia";

/**
 * Audience — "لِمَن آيلاند؟". Apple-clean DARK cinematic layout: the monumental
 * headline + eyebrow live inside a full-bleed cinematic photo band (image and
 * headline read as ONE moment), a quiet talent-proof strip carries the "talent
 * has no borders" claim in real figures, then the four real tracks flow below
 * as a premium dark bento. Type + one image carry it at the page's big-bold power.
 */
export function Audience() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  // Preserve the CMS hook so the section stays editable from the content panel.
  const cms = useContentSection("audience", {});
  void cms;

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

  // Talent-proof figures — the "talent has no borders" claim, answered in real
  // numbers so the section is never a heading over a void.
  const proof = [
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
  ];

  const freelancerCount = new Intl.NumberFormat(lang === "en" ? "en-US" : "ar-EG").format(FREELANCERS.length);

  return (
    <section id="audience" className="relative bg-[#060608] text-white border-t border-white/[0.06]">
      {/* Header band — the monumental headline + eyebrow live ON the photograph,
          so image and content read as one cinematic moment. */}
      <CinematicMedia
        as="div"
        src={imageUrl("/photos/IMG_8300.webp")}
        scrim="medium"
        sideScrim
        aria-label={t({ ar: "من يستفيد من آيلاند هيفن", en: "Who Island Haven is for" })}
      >
        <div className="container-ih" style={{ paddingBlock: "clamp(5rem, 13vh, 9rem)" }}>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 26 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
            className="max-w-3xl"
          >
            <p className="eyebrow eyebrow-sand mb-5">{t({ ar: "من يستفيد", en: "Who it's for" })}</p>
            <h2
              className="font-display text-white"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)", fontWeight: 900, lineHeight: 0.98, letterSpacing: "-0.05em" }}
            >
              {t({ ar: "مكانٌ لكلّ ", en: "A place for every " })}
              <span className="text-primary">{t({ ar: "موهبة.", en: "talent." })}</span>
            </h2>
            <p className="mt-6 max-w-xl text-[clamp(1rem,1.5vw,1.2rem)] leading-relaxed text-white/70">
              {t({
                ar: "الموهبة لا تحدّها الجغرافيا، ولا يحدّها الظرف. أربع فئات تجد مكانها هنا.",
                en: "Talent is bound neither by geography nor by circumstance. Four tracks find their place here.",
              })}
            </p>

            {/* Freelancer quick-stat — a compact bridge to the marketplace, on the photo. */}
            <Link
              href="/freelancers"
              className="group mt-9 inline-flex items-center gap-4 rounded-[16px] border border-white/15 bg-white/[0.06] px-5 py-4 backdrop-blur-sm transition-colors hover:border-primary/45 hover:bg-white/[0.09]"
            >
              <span className="font-mono font-black text-sand-bright tnum leading-none" style={{ fontSize: "2rem" }}>
                {freelancerCount}
              </span>
              <span className="text-start">
                <span className="block text-[13px] font-medium text-white/60">
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
      </CinematicMedia>

      {/* Body — talent-proof strip + the four-track bento, on the deep-dark canvas. */}
      <div className="container-ih" style={{ paddingBlock: "clamp(3.5rem, 8vh, 6rem)" }}>
        {/* Talent-proof rows — real figures behind the "no borders" claim. */}
        <div className="border-t border-white/12">
          {proof.map((row, i) => (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: EASE_OUT_EXPO }}
              className="grid grid-cols-12 gap-4 sm:gap-6 py-8 sm:py-10 border-b border-white/12 items-start"
            >
              <div className="col-span-3 sm:col-span-2">
                <span
                  className="font-mono font-black text-sand-bright tnum leading-none"
                  style={{ fontSize: "clamp(1.6rem,2.6vw,2.4rem)" }}
                >
                  {lang === "en" ? row.num.en : row.num.ar}
                </span>
              </div>
              <div className="col-span-9 sm:col-span-3">
                <p className="font-display font-bold text-white leading-snug" style={{ fontSize: "clamp(1.1rem,2vw,1.4rem)" }}>
                  {row.title}
                </p>
              </div>
              <div className="col-span-12 sm:col-span-7">
                <p className="text-[15px] leading-relaxed text-white/60">{row.desc}</p>
              </div>
            </motion.div>
          ))}
          <div className="py-8 sm:py-10 flex flex-wrap gap-3 items-center justify-end">
            <Link
              href="/members"
              className="rounded-full border border-white/15 px-5 py-2.5 text-[14px] font-medium text-white/85 hover:border-primary/50 hover:text-white transition-colors"
            >
              {t({ ar: "استعرض المجتمع ←", en: "Explore the community →" })}
            </Link>
            <Link href="/jobs" className="cta-fill rounded-full px-5 py-2.5 text-[14px] font-semibold">
              {t({ ar: "لوحة الفرص", en: "Job board" })}
            </Link>
          </div>
        </div>

        {/* The four tracks as a premium dark bento — ghost figure, tag, title,
            line, and a destination per category. Roomy, aligned, restrained. */}
        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tracks.map((track, i) => {
            const m = bentoMeta[i];
            return (
              <motion.div
                key={track.key}
                data-testid={`audience-track-${track.key}`}
                initial={reduce ? false : { opacity: 0, y: 22 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: EASE_OUT_EXPO }}
                whileHover={reduce ? undefined : { y: -5 }}
                className={`group relative flex flex-col gap-4 overflow-hidden rounded-[20px] border bg-white/[0.04] p-7 lg:p-8 transition-colors duration-200 motion-reduce:transition-none ${
                  m.accent
                    ? "border-primary/30 hover:border-primary/55 hover:bg-primary/[0.05]"
                    : "border-white/12 hover:border-white/25 hover:bg-white/[0.06]"
                }`}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-2 end-4 select-none font-mono leading-none tnum text-white/15 motion-reduce:hidden"
                  style={{ fontSize: "5rem" }}
                >
                  {m.num}
                </span>
                <p
                  className={`relative z-[1] font-mono text-[10px] tracking-[0.2em] uppercase ${
                    m.accent ? "text-primary" : m.gold ? "text-sand-bright" : "text-white/45"
                  }`}
                >
                  {m.tag}
                </p>
                <h3 className="relative z-[1] font-display font-bold text-white text-[clamp(1.15rem,2vw,1.4rem)] leading-snug">
                  {track.title}
                </h3>
                <p className="relative z-[1] text-[14px] leading-relaxed text-white/60">{track.line}</p>
                <Link
                  href={m.href}
                  className={`relative z-[1] mt-auto inline-flex items-center gap-1.5 self-start pt-3 text-[12.5px] font-semibold transition-colors motion-reduce:transition-none hover:text-white ${
                    m.accent ? "text-primary" : m.gold ? "text-sand-bright" : "text-white/70"
                  }`}
                  aria-label={m.cta}
                >
                  {m.cta}
                  <ArrowLeft className="h-3 w-3 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
