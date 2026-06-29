import { Reveal } from "@/components/landing/Reveal";
import { PageShell } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";

/* ────────────────────────────────────────────────────────────────────────────
   /terms — plain-language terms of use for a FREE Gaza incubator platform.
   Same calm editorial register as /privacy: numbered hairline sections, GOLD
   numerals + micro-labels (text-sand), t-body copy, one RED accent on the
   contact email. Short, fair, readable — acceptable use, accounts, content,
   liability, contact. Bilingual, RTL-safe, reduced-motion via Reveal.
   ──────────────────────────────────────────────────────────────────────────── */

const CONTACT_EMAIL = "island-haven@nastonas.org";
const LAST_UPDATED = { ar: "آخر تحديث: حزيران ٢٠٢٦", en: "Last updated: June 2026" };

interface LegalSection {
  heading: { ar: string; en: string };
  body: { ar: string; en: string };
  points?: { ar: string; en: string }[];
}

const SECTIONS: LegalSection[] = [
  {
    heading: { ar: "قبول الشروط", en: "Accepting these terms" },
    body: {
      ar: "باستخدامك منصّة آيلاند هيفن، فأنت توافق على هذه الشروط. إن لم توافق عليها، فالرجاء عدم استخدام المنصّة. خدماتنا مجّانيّة، ونقدّمها بحسن نيّة لدعم روّاد الأعمال في غزّة.",
      en: "By using the Island Haven platform, you agree to these terms. If you don't agree, please don't use the platform. Our services are free, offered in good faith to support founders in Gaza.",
    },
  },
  {
    heading: { ar: "حسابك", en: "Your account" },
    body: {
      ar: "أنت مسؤول عن دقّة المعلومات التي تقدّمها وعن الحفاظ على سرّيّة حسابك. حساب واحد لكلّ شخص، وعليك إبلاغنا فورًا إن لاحظت أيّ استخدام غير مصرّح به.",
      en: "You're responsible for the accuracy of the information you provide and for keeping your account secure. One account per person, and you should tell us right away if you notice any unauthorized use.",
    },
  },
  {
    heading: { ar: "الاستخدام المقبول", en: "Acceptable use" },
    body: {
      ar: "نطلب منك استخدام المنصّة باحترام وأمانة. عند استخدامك لها، أنت توافق على ألّا:",
      en: "We ask you to use the platform with respect and honesty. By using it, you agree not to:",
    },
    points: [
      { ar: "تنشر محتوًى غير قانونيّ أو مسيء أو مضلِّل.", en: "Post unlawful, abusive or misleading content." },
      { ar: "تنتحل شخصيّة غيرك أو تقدّم معلومات كاذبة.", en: "Impersonate others or provide false information." },
      { ar: "تحاول اختراق المنصّة أو الإضرار بها أو بمستخدميها.", en: "Attempt to hack, harm or disrupt the platform or its users." },
    ],
  },
  {
    heading: { ar: "المحتوى والملكيّة", en: "Content & ownership" },
    body: {
      ar: "تبقى ملكيّة مشروعك وأفكارك لك بالكامل. تمنحنا فقط إذنًا محدودًا لعرض ما تشاركه علنًا داخل المنصّة (مثل ملفّ مشروعك) بغرض تشغيل الخدمة وإبرازك أمام الشبكة.",
      en: "Your venture and ideas remain entirely yours. You grant us only a limited permission to display what you choose to share publicly on the platform (such as your venture profile) for the purpose of running the service and showcasing you to the network.",
    },
  },
  {
    heading: { ar: "حدود المسؤوليّة", en: "Liability" },
    body: {
      ar: "نقدّم المنصّة كما هي، ونبذل جهدنا لإبقائها متاحة ومفيدة. لا نضمن نتائج محدّدة (كالحصول على تمويل)، ولا نتحمّل مسؤوليّة القرارات التي تتّخذها بناءً على المحتوى أو الروابط الخارجيّة.",
      en: "We provide the platform as-is, and we do our best to keep it available and useful. We don't guarantee specific outcomes (such as securing funding), and we're not liable for decisions you make based on content or external links.",
    },
  },
  {
    heading: { ar: "تعديل الشروط أو إنهاء الحساب", en: "Changes & termination" },
    body: {
      ar: "قد نحدّث هذه الشروط من حين لآخر، وسننشر أيّ تغييرات هنا. يمكنك إنهاء حسابك متى شئت، ويحقّ لنا تعليق الحسابات التي تخالف هذه الشروط.",
      en: "We may update these terms from time to time, and we'll post any changes here. You can close your account whenever you like, and we may suspend accounts that violate these terms.",
    },
  },
];

export default function Terms() {
  const { lang, t } = useLanguage();
  const arNumerals = ["٠١", "٠٢", "٠٣", "٠٤", "٠٥", "٠٦"];

  return (
    <PageShell
      active="terms"
      eyebrow={t({ ar: "قانونيّ", en: "Legal" })}
      title={t({ ar: "شروط", en: "Terms of" })}
      highlight={t({ ar: "الاستخدام", en: "Use" })}
      subtitle={t({
        ar: "شروط واضحة وعادلة لاستخدام منصّة مجّانيّة بُنيت لخدمة روّاد غزّة.",
        en: "Clear, fair terms for using a free platform built to serve Gaza's founders.",
      })}
    >
      <div className="max-w-3xl">
        <Reveal>
          <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-sand rtl:tracking-normal">
            {t(LAST_UPDATED)}
          </span>
        </Reveal>

        <div className="mt-[clamp(2.5rem,6vw,4rem)] border-t border-border-strong/60">
          {SECTIONS.map((s, i) => (
            <Reveal key={i} delay={Math.min(i, 5) * 0.05}>
              <section className="grid grid-cols-[auto_1fr] gap-x-[clamp(1.25rem,4vw,2.5rem)] items-baseline border-b border-border-strong/60 py-[clamp(1.75rem,4vw,3rem)]">
                <span
                  className="font-display font-black text-sand tnum leading-none"
                  style={{ fontSize: "clamp(1.3rem, 2.6vw, 2rem)", letterSpacing: "-0.02em" }}
                >
                  {lang === "en" ? String(i + 1).padStart(2, "0") : arNumerals[i]}
                </span>
                <div className="min-w-0">
                  <h2
                    className="font-display font-bold text-foreground"
                    style={{ fontSize: "clamp(1.2rem, 2.4vw, 1.7rem)", letterSpacing: "-0.02em", lineHeight: 1.2 }}
                  >
                    {t(s.heading)}
                  </h2>
                  <p className="t-body text-[15px] md:text-[16.5px] mt-3.5 max-w-2xl">
                    {t(s.body)}
                  </p>
                  {s.points && (
                    <ul className="mt-4 space-y-2.5">
                      {s.points.map((pt, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <span
                            aria-hidden
                            className="mt-[0.7em] w-1.5 h-1.5 rounded-full bg-sand shrink-0"
                          />
                          <span className="t-body text-[14.5px] md:text-[15.5px]">
                            {t(pt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </Reveal>
          ))}
        </div>

        {/* Contact for terms questions */}
        <Reveal delay={0.06} className="mt-[clamp(2.5rem,6vw,4rem)]">
          <div className="relative overflow-hidden rounded-[clamp(1.5rem,3vw,2rem)] border border-border-strong/70 surface-2 p-[clamp(1.5rem,4vw,2.5rem)]">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-1/3 h-[150%] brand-aura opacity-50" />
            <div className="relative">
              <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-sand rtl:tracking-normal">
                {t({ ar: "سؤال حول الشروط؟", en: "Questions about these terms?" })}
              </span>
              <p className="t-body text-foreground text-[15.5px] md:text-[16.5px] mt-3 max-w-xl">
                {t({
                  ar: "إن لم يكن شيء واضحًا، اسألنا. نفضّل أن نشرح لك بلغة بسيطة بدل أن نتركك في الشكّ.",
                  en: "If anything isn't clear, ask us. We'd rather explain in plain language than leave you guessing.",
                })}
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-5 inline-flex items-center gap-2 text-primary font-bold text-[15px] underline decoration-primary/40 underline-offset-[6px] hover:decoration-primary transition-colors break-all"
                dir="ltr"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
