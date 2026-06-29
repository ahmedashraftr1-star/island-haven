import { Reveal } from "@/components/landing/Reveal";
import { PageShell } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";

/* ────────────────────────────────────────────────────────────────────────────
   /privacy — plain-language privacy policy for a FREE Gaza incubator platform.
   Calm editorial typography: numbered hairline sections, t-body copy, GOLD
   numerals (text-sand) + GOLD micro-labels. No legalese theatre — short, honest
   sections a founder can actually read. Bilingual, RTL-safe, reduced-motion via
   the shared Reveal.
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
    heading: { ar: "البيانات التي نجمعها", en: "Data we collect" },
    body: {
      ar: "نجمع فقط ما نحتاجه لتشغيل المنصّة وخدمتك. عند إنشاء حساب أو تقديم طلب، نجمع المعلومات التي تشاركها معنا طوعًا.",
      en: "We collect only what we need to run the platform and serve you. When you create an account or submit an application, we collect the information you choose to share with us.",
    },
    points: [
      { ar: "اسمك وبريدك الإلكترونيّ ورقم هاتفك.", en: "Your name, email address and phone number." },
      { ar: "تفاصيل مشروعك أو طلبك للبرنامج.", en: "Details of your venture or program application." },
      { ar: "بيانات استخدام أساسيّة تساعدنا على تحسين المنصّة.", en: "Basic usage data that helps us improve the platform." },
    ],
  },
  {
    heading: { ar: "كيف نستخدم بياناتك", en: "How we use it" },
    body: {
      ar: "نستخدم بياناتك لإدارة طلبك، والتواصل معك حول البرامج والفعاليّات، وربطك بالمرشدين والشركاء عند الحاجة، ولتحسين تجربتك. لا نبيع بياناتك أبدًا.",
      en: "We use your data to manage your application, communicate with you about programs and events, connect you with mentors and partners when relevant, and improve your experience. We never sell your data.",
    },
  },
  {
    heading: { ar: "مشاركة البيانات", en: "Sharing" },
    body: {
      ar: "لا نشارك بياناتك مع أطراف خارجيّة إلّا بموافقتك — مثلًا عند تقديمك لمستثمر أو شريك — أو عندما يلزمنا القانون بذلك. مزوّدو الخدمات التقنيّة لدينا ملزَمون بحماية بياناتك.",
      en: "We don't share your data with outside parties except with your consent — for example when introducing you to an investor or partner — or when the law requires it. Our technical service providers are bound to protect your data.",
    },
  },
  {
    heading: { ar: "حقوقك", en: "Your rights" },
    body: {
      ar: "بياناتك تخصّك. يمكنك في أيّ وقت أن تطلب نسخة منها، أو تصحيحها، أو حذف حسابك وكلّ ما يتعلّق به. تواصل معنا وسننفّذ طلبك خلال مدّة معقولة.",
      en: "Your data is yours. At any time you can request a copy of it, correct it, or delete your account and everything tied to it. Contact us and we'll act on your request within a reasonable time.",
    },
  },
  {
    heading: { ar: "حماية البيانات", en: "Keeping it safe" },
    body: {
      ar: "نستخدم تشفيرًا وضوابط وصول معقولة لحماية بياناتك. لا يوجد نظام آمن بنسبة مئة بالمئة، لكنّنا نتعامل مع معلوماتك بالجدّيّة التي تستحقّها.",
      en: "We use encryption and reasonable access controls to protect your data. No system is one hundred percent secure, but we treat your information with the seriousness it deserves.",
    },
  },
];

export default function Privacy() {
  const { lang, t } = useLanguage();
  const arNumerals = ["٠١", "٠٢", "٠٣", "٠٤", "٠٥", "٠٦"];

  return (
    <PageShell
      active="privacy"
      eyebrow={t({ ar: "قانونيّ", en: "Legal" })}
      title={t({ ar: "سياسة", en: "Privacy" })}
      highlight={t({ ar: "الخصوصيّة", en: "Policy" })}
      subtitle={t({
        ar: "آيلاند هيفن منصّة مجّانيّة. نجمع أقلّ ما يمكن من البيانات، ونتعامل معها باحترام.",
        en: "Island Haven is a free platform. We collect as little data as possible, and we treat it with respect.",
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

        {/* Contact for privacy questions */}
        <Reveal delay={0.06} className="mt-[clamp(2.5rem,6vw,4rem)]">
          <div className="relative overflow-hidden rounded-[clamp(1.5rem,3vw,2rem)] border border-border-strong/70 surface-2 p-[clamp(1.5rem,4vw,2.5rem)]">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-1/3 h-[150%] brand-aura opacity-50" />
            <div className="relative">
              <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-sand rtl:tracking-normal">
                {t({ ar: "أسئلة حول الخصوصيّة؟", en: "Privacy questions?" })}
              </span>
              <p className="t-body text-foreground text-[15.5px] md:text-[16.5px] mt-3 max-w-xl">
                {t({
                  ar: "إن كان لديك أيّ سؤال عن بياناتك أو هذه السياسة، اكتب لنا — نقرأ كلّ رسالة.",
                  en: "If you have any question about your data or this policy, write to us — we read every message.",
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
