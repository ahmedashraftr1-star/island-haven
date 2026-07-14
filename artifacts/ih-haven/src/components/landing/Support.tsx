import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * Support — "التكافل", told the Apple way: SCALE + SPACE + RESTRAINT. Island
 * Haven is a FREE nonprofit, kept open by the people who stand with it.
 *
 * Grandeur pass: gone are the per-section eyebrow, the crimson aura blob, the
 * inverted white statement card with its blurred crimson bloom (glassmorphism +
 * medallion tells) and the two glass secondary cards — all AI tells. In their
 * place a single monumental headline on the dark canvas (one crimson word), the
 * donate ask carried by ONE confident filled CTA, and the three ways to stand
 * with us as calm editorial hairline rows. Closes on the real brand belief, set
 * large over one full-bleed photograph of the place. From the people, for the
 * people. The donate / apply / Instagram links + testids + CMS are preserved.
 */

// AR is the CMS-overridable source of truth (useContentSection).
const FALLBACK = {
  image: "/photos/IMG_8358.webp",
  donateCta: "تبرّع الآن",
  donateHref: "https://nastonas.org/generalDonations/4/0",
  donateNote: "nastonas.org",
  sec1Href: "/apply",
  sec2Href: "https://www.instagram.com/ih_haven",
};

export function Support() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const c = useContentSection("support", FALLBACK);

  const photoRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: photoRef,
    offset: ["start end", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-7%", "7%"]);

  // Three calm ways to stand with us — a name, what it does, a quiet action.
  // Rendered as editorial hairline rows, not glass cards.
  const ways = [
    {
      en: "Apply",
      ar: "انتسب",
      title: t({ ar: "انضمّ للمجتمع", en: "Join the community" }),
      body: t({
        ar: "خرّيج، مستقلّ، طالب، أو صاحب فكرة؟ افتح النموذج واحجز مكانك في المساحة.",
        en: "Graduate, freelancer, student or idea-owner? Open the form and claim your place in the space.",
      }),
      cta: t({ ar: "افتح النموذج", en: "Open the form" }),
      href: c.sec1Href,
      testid: "support-secondary-0",
    },
    {
      en: "Instagram",
      ar: "إنستغرام",
      title: t({ ar: "شارك القصّة", en: "Share the story" }),
      body: t({
        ar: "تابعنا على إنستغرام، وانقل قصّة آيلاند هيفن إلى من قد يصنع الفرق.",
        en: "Follow us on Instagram and carry the Island Haven story to someone who can make a difference.",
      }),
      cta: t({ ar: "تابعنا @ih_haven", en: "Follow @ih_haven" }),
      href: c.sec2Href,
      testid: "support-secondary-1",
    },
  ];

  return (
    <section id="support" className="relative bg-background overflow-hidden" style={{ paddingBlock: "clamp(6rem, 14vh, 11rem)" }}>
      <div className="container-ih relative">
        {/* ── Monumental header — one quiet line, one crimson word, acres of space ── */}
        <header className="max-w-4xl">
          <motion.h2
            className="font-display text-foreground"
            style={{ fontSize: "clamp(2.6rem, 7.4vw, 5.75rem)", lineHeight: 1.0, letterSpacing: "-0.04em", fontWeight: 700 }}
          >
            {[
              t({ ar: "استمرار هذا المكان", en: "This place stays" }),
              t({ ar: "يقوم على", en: "open through" }),
              <span key="accent" className="text-primary">{t({ ar: "التكافل.", en: "solidarity." })}</span>,
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
          </motion.h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.42, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {t({
              ar: "آيلاند هيفن ليست مشروعًا ربحيًّا. تكاليف تشغيل المساحة — من إنترنت وكهرباء وصيانة — يغطّيها داعمون مثلك، وكلّ مساهمة تُبقي الأبواب مفتوحة أمام كفاءات غزّة.",
              en: "Island Haven isn't a for-profit venture. The running costs — internet, power and maintenance — are covered by supporters like you, and every contribution keeps the doors open for Gaza's talents.",
            })}
          </motion.p>
        </header>

        {/* ── The donate ask — carried by ONE confident line + filled CTA, no card ── */}
        <Reveal delay={0.05}>
          <div className="mt-[clamp(3.5rem,7vw,6rem)] border-t border-border-strong/60 pt-[clamp(2.5rem,5vw,4rem)]">
            <p
              className="font-display font-bold text-foreground max-w-3xl"
              style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.75rem)", lineHeight: 1.18, letterSpacing: "-0.028em" }}
            >
              {t({ ar: "كلّ مساهمة تُبقي الأبواب مفتوحة.", en: "Every gift keeps the doors open." })}
            </p>
            <p className="t-body text-[15px] md:text-[17px] mt-5 max-w-xl">
              {t({
                ar: "تبرّعك يموّل المقاعد والإنترنت والكهرباء والإرشاد — لتبقى الحاضنة مجّانيّة لكلّ موهبة غزّيّة. عبر مبادرة «من النّاس إلى النّاس».",
                en: "Your gift funds the seats, the internet, the power and the mentorship — so the incubator stays free for every Gazan talent. Through the People-to-People initiative.",
              })}
            </p>
            <div className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-center gap-x-6 gap-y-4">
              <a
                href={c.donateHref || "#"}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="support-donate"
                className="cta-fill group inline-flex items-center justify-center gap-3 h-14 px-9 rounded-full font-bold text-[14px] shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
              >
                {lang === "en" ? "Donate now" : c.donateCta}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </a>
              {c.donateNote && (
                <span className="tnum t-caption text-fg-secondary">{c.donateNote}</span>
              )}
            </div>
          </div>
        </Reveal>

        {/* ── More ways to stand with us — calm editorial hairline rows, not cards ── */}
        <ul className="mt-[clamp(3.5rem,7vw,6rem)] border-t border-border-strong/60">
          {ways.map((w, i) => {
            const external = w.href?.startsWith("http");
            return (
              <li key={w.en}>
                <Reveal delay={Math.min(i, 4) * 0.06}>
                  <a
                    href={w.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    data-testid={w.testid}
                    className="group grid grid-cols-1 md:grid-cols-[minmax(0,18rem)_1fr_auto] items-baseline gap-x-[clamp(2rem,4vw,3rem)] gap-y-2 py-[clamp(1.75rem,3.5vw,3rem)] border-b border-border-strong/60 transition-colors hover:border-border-strong"
                  >
                    <span
                      className="font-display font-bold text-foreground group-hover:text-primary transition-colors"
                      style={{ fontSize: "clamp(1.4rem,2.4vw,2rem)", letterSpacing: "-0.025em", lineHeight: 1.12 }}
                    >
                      {w.title}
                    </span>
                    <p className="t-body text-[15px] md:text-[16px] max-w-xl">{w.body}</p>
                    <span className="inline-flex items-center gap-2 t-caption text-fg-secondary whitespace-nowrap group-hover:text-foreground transition-colors">
                      {w.cta}
                      {external ? (
                        <ExternalLink className="w-3.5 h-3.5 text-fg-faint group-hover:text-primary transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                      ) : (
                        <ArrowLeft className="w-3.5 h-3.5 text-fg-faint rtl:rotate-180 transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:text-primary group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                      )}
                    </span>
                  </a>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── The brand belief — set large over one full-bleed photograph, slow parallax ── */}
      <motion.div
        ref={photoRef}
        className="relative mt-[clamp(4.5rem,10vh,8rem)] w-full overflow-hidden"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={reduce ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      >
        <div className="relative h-[clamp(22rem,58vh,38rem)]">
          <motion.img
            src={imageUrl(c.image)}
            alt={t({ ar: "مجتمع آيلاند هيفن في غزّة", en: "The Island Haven community in Gaza" })}
            loading="lazy"
            style={{ y: photoY }}
            className="absolute inset-0 h-[114%] -top-[7%] w-full object-cover object-center saturate-[1.04] will-change-transform"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, hsl(0 0% 4% / 0.94) 0%, hsl(0 0% 4% / 0.55) 48%, hsl(0 0% 4% / 0.2) 100%)" }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="container-ih w-full pb-[clamp(2.5rem,7vh,5rem)]">
              <motion.p
                className="max-w-[20ch] font-display text-white"
                style={{ fontSize: "clamp(1.8rem, 4.4vw, 3.6rem)", lineHeight: 1.1, letterSpacing: "-0.03em", fontWeight: 700 }}
                initial={reduce ? false : { opacity: 0, y: 22 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
              >
                {t({ ar: "نؤمن أنّ الموهبة لا تحدّها الجغرافيا.", en: "We believe talent is not bound by geography." })}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
