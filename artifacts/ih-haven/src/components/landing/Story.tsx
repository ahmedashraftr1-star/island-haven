import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { EASE_OUT_EXPO } from "@/lib/motion";

/**
 * Story — "محاورنا الثلاثة", the THREE STRATEGIC AXES, told the Apple way:
 * SCALE + SPACE + RESTRAINT.
 *
 * Grandeur pass: gone are the per-section eyebrow + cerulean kicker, the
 * 01/02/03 numbered ledger, the boxed sticky photo and the aura blob — all AI
 * tells. In their place a single monumental headline on the lifted surface (one
 * crimson word), the three axes as calm editorial hairline rows (a large title,
 * the work as prose), and one full-bleed photograph of the place with a slow
 * scroll parallax. Type and acres of space carry it.
 *
 * useContentSection("story", …) is fed the language-appropriate fallback, so the
 * 'story' section is CMS-overridable in BOTH languages; both FALLBACK and
 * EN_FALLBACK carry the authentic copy so it renders correctly with an empty CMS.
 */

const FALLBACK = {
  titleA: "قصّةٌ تُبنى على",
  titleAccent: "ثلاثة",
  titleB: "محاور.",
  lead: "من قلب غزّة، حيث لم يَبقَ حجرٌ على حجر ولا حلمٌ بلا جرح، رفضنا أن نقف متفرّجين. آيلاند هيفن منظومة تقاوم الظرف بالعمل، وتردّ على الدمار بالبناء — على ثلاثة محاورٍ استراتيجيّة تتكامل لتصنع الفرق.",
  axis1Title: "البنية التحتية والحلول",
  axis1Body: "بيئة عملٍ احترافيّة بمعايير عالميّة، وأدواتٌ سحابيّة وتقنيّة حديثة حتّى لا يكون المال عائقًا، وحلولٌ عمليّة لاستقبال المدفوعات الدوليّة تصل بالمستقلّ إلى عميله خارج الحدود.",
  axis2Title: "التطوير والابتكار",
  axis2Body: "تدريبٌ وتأهيلٌ مستمرّ ومُحدَّث يواكب السوق العالميّ، ومساراتُ احتضانٍ منظّمة تحوّل الفكرة إلى مشروعٍ قابلٍ للحياة، مع تجذير الذكاء الاصطناعيّ في عمل أعضائنا وثقافتهم — أوّل نواةٍ في غزّة تفعل ذلك.",
  axis3Title: "التشبيك والتأثير العالميّ",
  axis3Body: "وصلٌ حقيقيّ بفرص العمل والتدريب والاستثمار خلف الحدود، حتّى نصبح المُنفِّذ الموثوق الذي يعتمد عليه كلّ شريكٍ وداعمٍ ليصل إلى غزّة — ببرامجَ وفعاليّاتٍ وهاكاثوناتٍ على أرضنا، ونظامٍ واضحٍ لقياس الأثر يُثبت الفرق.",
  image: "/photos/IMG_8347.webp",
};

const EN_FALLBACK = {
  titleA: "A story built on",
  titleAccent: "three",
  titleB: "axes.",
  lead: "From the heart of Gaza — where no stone, and no dream, was left untouched — we refused to stand by. Island Haven is an ecosystem that resists circumstance with work and answers destruction with building, on three strategic axes that compound to make the difference.",
  axis1Title: "Infrastructure & Solutions",
  axis1Body: "A professional work environment built to world standards, modern cloud and tech tools so money is never a barrier, and practical international payment solutions that reach the freelancer's client beyond the borders.",
  axis2Title: "Development & Innovation",
  axis2Body: "Continuous, updated training and upskilling that meets the global market, structured incubation tracks that turn an idea into a viable venture, and AI embedded in our members' work and culture — the first nucleus in Gaza to do so.",
  axis3Title: "Networking & Global Impact",
  axis3Body: "Real connections to work, training and investment beyond the borders — becoming the trusted executor every partner and funder relies on to reach Gaza, with programs, events and hackathons on our ground, and a clear impact-measurement system that proves the difference.",
  image: "/photos/IMG_8347.webp",
};

export function Story() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  // CMS-overridable in BOTH languages: feed the language-appropriate fallback so
  // an admin editing the 'story' section sees changes in AR and EN alike.
  const c = useContentSection("story", lang === "en" ? EN_FALLBACK : FALLBACK);

  const photoRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: photoRef,
    offset: ["start end", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-7%", "7%"]);

  const axes = [
    { title: c.axis1Title, body: c.axis1Body },
    { title: c.axis2Title, body: c.axis2Body },
    { title: c.axis3Title, body: c.axis3Body },
  ].filter((a) => a.title || a.body);

  return (
    <section id="story" className="section-y relative bg-surface-1 overflow-hidden">
      <div className="container-ih relative">
        {/* ── Monumental header — one quiet line, one crimson word, acres of space ── */}
        <header className="max-w-4xl">
          <motion.h2
            className="font-display text-foreground"
            style={{ fontSize: "clamp(2.6rem, 7.4vw, 5.75rem)", lineHeight: "var(--lh-display)", letterSpacing: "-0.04em", fontWeight: 700 }}
          >
            {[
              c.titleA,
              <span key="accent">
                <span className="text-primary">{c.titleAccent}</span> {c.titleB}
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
          </motion.h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.42, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {c.lead}
          </motion.p>
        </header>

        {/* ── The three axes — calm editorial hairline rows. A large title, the work
             as prose, the discipline named quietly. Not a numbered ledger, not cards. ── */}
        <ul className="mt-[clamp(3.5rem,7vw,6rem)] border-t border-border-strong/60">
          {axes.map((a, i) => (
            <li key={i}>
              <Reveal delay={Math.min(i, 4) * 0.06}>
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,22rem)_1fr] items-baseline gap-x-[clamp(2rem,5vw,4rem)] gap-y-3 py-[clamp(1.75rem,3.5vw,3rem)] border-b border-border-strong/60">
                  <h3
                    className="font-display font-bold text-foreground"
                    style={{ fontSize: "clamp(1.5rem,2.8vw,2.4rem)", letterSpacing: "-0.028em", lineHeight: 1.12 }}
                  >
                    {a.title}
                  </h3>
                  <p className="t-body text-[15px] md:text-[17px] max-w-2xl">{a.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>

      {/* ── The place itself — one full-bleed photograph, slow parallax, a calm line overlaid ── */}
      <motion.div
        ref={photoRef}
        className="relative mt-[clamp(4rem,9vh,7rem)] w-full overflow-hidden"
        initial={reduce ? false : { opacity: 0 }}
        whileInView={reduce ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      >
        <div className="relative h-[clamp(20rem,52vh,34rem)]">
          <motion.img
            src={imageUrl(c.image)}
            alt={t({ ar: "مساحة عمل آيلاند هيفن في غزّة", en: "The Island Haven workspace in Gaza" })}
            loading="lazy"
            style={{ y: photoY }}
            className="absolute inset-0 h-[114%] -top-[7%] w-full object-cover object-center saturate-[1.04] will-change-transform"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, hsl(0 0% 4% / 0.92) 0%, hsl(0 0% 4% / 0.5) 45%, transparent 80%)" }}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="container-ih w-full pb-[clamp(2.5rem,6vh,4.5rem)]">
              <motion.p
                className="max-w-[22ch] text-white"
                style={{ fontSize: "clamp(1.5rem, 3.4vw, 2.6rem)", lineHeight: 1.18, letterSpacing: "-0.02em", fontWeight: 600 }}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
              >
                {t({ ar: "ثلاثة محاورٍ تتكامل لتصنع الفرق.", en: "Three axes that compound to make the difference." })}
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
