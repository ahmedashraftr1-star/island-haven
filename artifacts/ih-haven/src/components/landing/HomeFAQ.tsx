import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

type QA = {
  id: string;
  q: { ar: string; en: string };
  a: { ar: string; en: string };
};

/**
 * HomeFAQ — the homepage's honest answers, told the Apple way: SCALE + SPACE +
 * RESTRAINT. One monumental headline on the dark canvas (a single crimson word),
 * then the questions as calm, hairline-divided editorial rows — no eyebrow rule,
 * no 01/02/03 ledger, no circular medallion marker, no cards or glass. Each row is
 * a real <button> (aria-expanded / aria-controls) and the panel opens with a
 * grid-template-rows 0fr→1fr transition (not height) so it animates smoothly with
 * zero layout jank; a single thin marker line rotates into a × on open. RTL-safe.
 */
export function HomeFAQ() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<string | null>("free");

  const faqs: QA[] = [
    {
      id: "free",
      q: { ar: "هل آيلاند مجّاني فعلًا؟", en: "Is Island Haven really free?" },
      a: {
        ar: "نعم، مجّانيّ بالكامل — لا رسوم ولا حصّة من مشروعك. آيلاند حاضنة مدعومة من NasToNas وGaza Sky Geeks، ونفتح لك أدواتٍ وأرصدةً عالميّة (Replit وAWS Activate وGoogle for Startups وPayoneer وFreelancer). مهمّتنا أن نعيد وصل المواهب الغزّيّة بالاقتصاد الرقميّ، لا أن نربح منها.",
        en: "Yes — completely free. No fees, and no equity in your work. Island Haven is an incubator backed by NasToNas and Gaza Sky Geeks, and we unlock global tools & credits for you (Replit, AWS Activate, Google for Startups, Payoneer, Freelancer). Our mission is to reconnect Gazan talent to the digital economy, not to profit from it.",
      },
    },
    {
      id: "who",
      q: { ar: "مَن يحقّ له التقديم؟", en: "Who can apply?" },
      a: {
        ar: "كلّ موهبة رقميّة في غزّة — مطوّرون، مصمّمون، مستقلّون، طلّاب جامعات، ومؤسّسون في بداية الطريق. نؤمن أنّ الموهبة لا تحدّها الجغرافيا؛ ما يهمّنا هو جدّيّتك واستعدادك للعمل، لا شهادتك ولا خبرتك السابقة.",
        en: "Any digital talent in Gaza — developers, designers, freelancers, university students and early-stage founders. We believe talent isn't bound by geography; what matters is your seriousness and readiness to work, not your degree or past résumé.",
      },
    },
    {
      id: "member",
      q: { ar: "ماذا أحصل عليه كعضو؟", en: "What do I get as a member?" },
      a: {
        ar: "مساحة عمل مجهّزة بإنترنت وكهرباء موثوقَين، أرصدة سحابيّة وأدوات، حلول دفع دوليّة، تدريب مستمرّ ومسارات احتضان منظّمة، إرشاد فرديّ من خبراء، وشبكة حقيقيّة من الفرص والشركاء تتجاوز الحدود.",
        en: "An equipped workspace with reliable internet and power, cloud credits and tools, international payment solutions, continuous training and structured incubation tracks, 1:1 expert mentorship, and a real network of opportunities and partners that reaches beyond borders.",
      },
    },
    {
      id: "cohorts",
      q: {
        ar: "ما هي الدفعات ويوم العرض (Demo Day)؟",
        en: "What are cohorts and Demo Day?",
      },
      a: {
        ar: "الدفعة مجموعة من الأعضاء تسير معًا في مسار احتضان منظّم خلال فترة محدّدة. يُختم المسار بيوم العرض — Demo Day — حيث تقدّم مشروعك أمام شبكة من المرشدين والشركاء والداعمين، وهو بوّابتك لفرص العمل والتدريب والاستثمار.",
        en: "A cohort is a group of members who move together through a structured incubation track over a set period. The track culminates in a Demo Day, where you present your work to a network of mentors, partners and supporters — your gateway to work, training and investment.",
      },
    },
    {
      id: "space",
      q: {
        ar: "أين تقع المساحة وما أوقاتها؟",
        en: "Where is the space, and what are its hours?",
      },
      a: {
        ar: "مساحتنا في قلب غزّة، مهيّأة للعمل المركّز بمقاعد ثابتة وإنترنت وكهرباء. تحجز مقعدك عبر صفحة الحجز، ويمكنك دائمًا التواصل معنا على واتساب لمعرفة الأوقات المتاحة وتنسيق زيارتك.",
        en: "Our space is in the heart of Gaza, set up for focused work with stable seats, internet and power. You reserve a seat through the booking page, and you can always reach us on WhatsApp to check available hours and arrange your visit.",
      },
    },
    {
      id: "apply",
      q: { ar: "كيف أقدّم؟", en: "How do I apply?" },
      a: {
        ar: "التقديم بسيط ومجّاني: املأ نموذج الانضمام عبر صفحة «قدّم الآن»، ويتواصل معك فريقنا. تفضّل أن تتحدّث إلينا أوّلًا؟ احجز مكالمة أو راسلنا مباشرةً على واتساب — مساحة تتّسع لأحلامك.",
        en: "It's simple and free: fill in the join form on the Apply page and our team will reach out. Prefer to talk first? Book a call or message us directly on WhatsApp — a space wide enough for your dreams.",
      },
    },
  ];

  return (
    <section
      id="home-faq"
      className="relative bg-background overflow-hidden"
      style={{ paddingBlock: "clamp(6rem, 14vh, 11rem)" }}
      data-testid="home-faq"
    >
      <div className="container-ih relative">
        {/* ── Monumental header — one calm line, one crimson word, acres of space ── */}
        <header className="max-w-[20ch]">
          <motion.h2
            className="font-display text-foreground"
            style={{
              fontSize: "clamp(1.9rem, 3.6vw, 3.1rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.04em",
              fontWeight: 700,
            }}
          >
            {[
              t({ ar: "كلّ ما تريد", en: "Everything" }),
              <span key="accent" className="text-primary">
                {t({ ar: "أن تعرفه.", en: "you'd want to know." })}
              </span>,
            ].map((ln, i) => (
              <motion.span
                key={i}
                className="block will-change-transform"
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.85, delay: i * 0.1, ease: EASE_OUT_EXPO }}
              >
                {ln}
              </motion.span>
            ))}
          </motion.h2>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.85, delay: 0.36, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(1.75rem,3.5vw,2.75rem)] max-w-2xl text-fg-secondary"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
          >
            {t({
              ar: "إجاباتٌ صريحة عن آيلاند هيفن. لم تجد سؤالك؟ راسلنا مباشرةً على واتساب.",
              en: "Honest answers about Island Haven. Don't see your question? Message us directly on WhatsApp.",
            })}
          </motion.p>
        </header>

        {/* ── The questions — calm, hairline-divided editorial rows. No numbered
             ledger, no medallion marker, no cards. Type and air carry it. ── */}
        <div className="mt-[clamp(4rem,9vh,7.5rem)]">
          {faqs.map((f, i) => {
            const isOpen = open === f.id;
            const panelId = `faq-panel-${f.id}`;
            const btnId = `faq-btn-${f.id}`;
            return (
              <motion.div
                key={f.id}
                data-testid={`faq-item-${f.id}`}
                className="border-t border-border-strong/60 first:border-t-0 will-change-transform"
                initial={reduce ? false : { opacity: 0, y: 22 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.8, delay: Math.min(i, 5) * 0.05, ease: EASE_OUT_EXPO }}
              >
                <h3>
                  <button
                    id={btnId}
                    type="button"
                    onClick={() => setOpen(isOpen ? null : f.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    data-testid={`faq-trigger-${f.id}`}
                    className="group grid grid-cols-[1fr_auto] items-baseline gap-x-[clamp(1.5rem,4vw,3rem)] w-full text-start py-[clamp(1.75rem,4vh,2.75rem)]"
                  >
                    <span
                      className={`font-display transition-colors duration-300 ${
                        isOpen
                          ? "text-primary"
                          : "text-foreground group-hover:text-primary"
                      }`}
                      style={{
                        fontSize: "clamp(1.4rem, 3vw, 2.25rem)",
                        letterSpacing: "-0.025em",
                        lineHeight: 1.12,
                        fontWeight: 600,
                      }}
                    >
                      {t(f.q)}
                    </span>
                    {/* Thin + → × marker — two hairlines, no circular medallion. */}
                    <span
                      aria-hidden
                      className="relative mt-2 inline-flex h-5 w-5 shrink-0 self-start translate-y-1"
                    >
                      <span
                        className={`absolute top-1/2 left-0 h-px w-full -translate-y-1/2 transition-colors duration-300 ${
                          isOpen ? "bg-primary" : "bg-fg-faint group-hover:bg-primary"
                        }`}
                      />
                      <span
                        className={`absolute top-1/2 left-0 h-px w-full -translate-y-1/2 transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          isOpen
                            ? "rotate-0 bg-primary"
                            : "rotate-90 bg-fg-faint group-hover:bg-primary"
                        }`}
                      />
                    </span>
                  </button>
                </h3>

                {/* Animated panel: grid 0fr→1fr (no height), GPU-friendly. */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p
                      className={`max-w-2xl text-fg-secondary pb-[clamp(1.75rem,4vh,2.75rem)] transition-opacity duration-300 ${
                        isOpen ? "opacity-100" : "opacity-0"
                      }`}
                      style={{ fontSize: "clamp(1.0625rem, 1.6vw, 1.3rem)", lineHeight: 1.65 }}
                    >
                      {t(f.a)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Closing line — a calm confident invitation, generous space, no card. ── */}
        <motion.div
          className="mt-[clamp(3.5rem,7vh,6rem)] flex flex-wrap items-center gap-x-[clamp(2rem,5vw,4rem)] gap-y-6 will-change-transform"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
        >
          <p
            className="text-foreground max-w-md"
            style={{ fontSize: "clamp(1.25rem, 2.4vw, 1.75rem)", letterSpacing: "-0.02em", lineHeight: 1.25, fontWeight: 600 }}
          >
            {t({
              ar: "جاهز للبدء؟ التقديم مجّانيّ ولا يأخذ سوى دقائق.",
              en: "Ready to start? Applying is free and takes only a few minutes.",
            })}
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link
              href="/apply"
              data-testid="faq-apply"
              className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t({ ar: "قدّم الآن", en: "Apply now" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
            <a
              href="https://wa.me/972567536815"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="faq-whatsapp"
              className="group inline-flex items-center gap-2 text-[14px] font-semibold text-fg-secondary hover:text-foreground transition-colors"
            >
              {t({ ar: "تواصل عبر واتساب", en: "Talk to us on WhatsApp" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
