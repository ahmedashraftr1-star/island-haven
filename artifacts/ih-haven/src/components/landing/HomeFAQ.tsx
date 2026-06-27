import { useState } from "react";
import { Link } from "wouter";
import { Plus, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

type QA = {
  id: string;
  q: { ar: string; en: string };
  a: { ar: string; en: string };
};

/**
 * HomeFAQ — the homepage's six honest answers, told in the YC light-editorial
 * register: a Fraunces serif header with a single italic crimson accent word,
 * then start-aligned, hairline-divided accordion rows on the warm-white canvas.
 * Each row is a real <button> (aria-expanded / aria-controls) and the panel
 * opens with a grid-template-rows 0fr→1fr transition (not height) so it animates
 * smoothly with zero layout jank; the marker rotates 45° into an ×. No cards, no
 * glass, no gradient text — just type, hairlines and crimson. RTL-safe.
 */
export function HomeFAQ() {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState<string | null>("free");

  const idx = (i: number) =>
    lang === "en"
      ? String(i + 1).padStart(2, "0")
      : ["٠١", "٠٢", "٠٣", "٠٤", "٠٥", "٠٦"][i];

  const faqs: QA[] = [
    {
      id: "free",
      q: { ar: "هل آيلاند مجّاني فعلًا؟", en: "Is Island Haven really free?" },
      a: {
        ar: "نعم، مجّانيّ بالكامل — لا رسوم ولا حصّة من مشروعك. آيلاند حاضنة مدعومة من NasToNas وشركاء عالميّين (Replit وAWS وPayoneer وGoogle for Startups)، ومهمّتنا أن نعيد وصل المواهب الغزّيّة بالاقتصاد الرقميّ، لا أن نربح منها.",
        en: "Yes — completely free. No fees, and no equity in your work. Island Haven is an incubator backed by NasToNas and global partners (Replit, AWS, Payoneer, Google for Startups). Our mission is to reconnect Gazan talent to the digital economy, not to profit from it.",
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
    <section id="home-faq" className="relative bg-background section-y">
      <div className="container-ih">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-start">
          {/* Header — editorial serif, italic crimson accent */}
          <Reveal as="div" className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-9 bg-primary/50" />
              <span className="text-[11px] tracking-[0.22em] uppercase text-primary font-bold rtl:tracking-normal">
                {t({ ar: "أسئلة شائعة", en: "Frequently asked" })}
              </span>
            </div>
            <h2
              className="font-editorial text-foreground"
              style={{
                fontSize: "clamp(1.9rem, 4.2vw, 3.2rem)",
                lineHeight: 1.06,
                letterSpacing: "-0.02em",
                fontWeight: 600,
              }}
            >
              {t({ ar: "كلّ ما تريد ", en: "Everything you'd " })}
              <span className="italic text-primary">
                {t({ ar: "أن تعرفه.", en: "want to know." })}
              </span>
            </h2>
            <p className="t-body mt-5 max-w-sm">
              {t({
                ar: "إجاباتٌ صريحة عن آيلاند هيفن. لم تجد سؤالك؟ راسلنا مباشرةً على واتساب.",
                en: "Honest answers about Island Haven. Don't see your question? Message us directly on WhatsApp.",
              })}
            </p>
            <a
              href="https://wa.me/972567536815"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="faq-whatsapp"
              className="group mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-primary"
            >
              {t({ ar: "تواصل عبر واتساب", en: "Talk to us on WhatsApp" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </a>
          </Reveal>

          {/* Accordion — hairline-divided rows, grid-rows 0fr→1fr open */}
          <div className="lg:col-span-8">
            {faqs.map((f, i) => {
              const isOpen = open === f.id;
              const panelId = `faq-panel-${f.id}`;
              const btnId = `faq-btn-${f.id}`;
              return (
                <Reveal key={f.id} delay={i * 0.04}>
                  <div
                    className="border-t border-border-strong first:border-t-0"
                    data-testid={`faq-item-${f.id}`}
                  >
                    <h3>
                      <button
                        id={btnId}
                        type="button"
                        onClick={() => setOpen(isOpen ? null : f.id)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        data-testid={`faq-trigger-${f.id}`}
                        className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-x-5 sm:gap-x-7 w-full text-start py-7 sm:py-8"
                      >
                        <span className="font-editorial text-[clamp(1rem,1.6vw,1.25rem)] font-semibold tabular-nums text-fg-faint group-hover:text-primary transition-colors leading-none pt-1">
                          {idx(i)}
                        </span>
                        <span
                          className={`font-editorial transition-colors ${
                            isOpen
                              ? "text-primary"
                              : "text-foreground group-hover:text-primary"
                          }`}
                          style={{
                            fontSize: "clamp(1.15rem, 2vw, 1.6rem)",
                            letterSpacing: "-0.018em",
                            lineHeight: 1.2,
                            fontWeight: 600,
                          }}
                        >
                          {t(f.q)}
                        </span>
                        <span
                          aria-hidden
                          className={`mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
                            isOpen
                              ? "rotate-45 border-primary/40 text-primary bg-primary-soft"
                              : "border-border-strong text-fg-faint group-hover:border-primary/40 group-hover:text-primary"
                          }`}
                        >
                          <Plus className="h-4 w-4" strokeWidth={2.25} />
                        </span>
                      </button>
                    </h3>

                    {/* Animated panel: grid 0fr→1fr (no height), GPU-friendly */}
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <p
                          className={`t-body grid-cols-[auto_1fr] sm:grid grid gap-x-5 sm:gap-x-7 pb-8 max-w-2xl transition-opacity duration-300 ${
                            isOpen ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          <span aria-hidden className="hidden sm:block" />
                          <span className="leading-relaxed">{t(f.a)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}

            {/* Closing CTA row — apply */}
            <Reveal delay={0.1}>
              <div className="border-t border-border-strong pt-8 mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                <p className="t-body max-w-md">
                  {t({
                    ar: "جاهز للبدء؟ التقديم مجّانيّ ولا يأخذ سوى دقائق.",
                    en: "Ready to start? Applying is free and takes only a few minutes.",
                  })}
                </p>
                <Link
                  href="/apply"
                  data-testid="faq-apply"
                  className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {t({ ar: "قدّم الآن", en: "Apply now" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
