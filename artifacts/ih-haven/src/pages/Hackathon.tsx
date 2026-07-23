import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Lightbulb, Users2, Rocket, Trophy } from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { Btn } from "@/components/ui/Btn";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContentSection } from "@/hooks/use-content";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toAr = (s: string | number) => String(s).replace(/\d/g, (d) => AR_DIGITS[+d]);

// Bilingual page chrome — the editable CMS fallback ("pageHackathon" section).
const CMS = {
  eyebrow: "هاكاثون · HACKATHON",
  eyebrowEn: "Hackathon · هاكاثون",
  title: "تُبنى الأفكار",
  titleEn: "Ideas built",
  highlight: "في أيّام",
  highlightEn: "in days",
  subtitle:
    "هاكاثون آيلاند هيفن: تحدٍّ واقعيّ، فرقٌ من مواهب غزّة، إرشادٌ مباشر، ثمّ يوم عرضٍ أمام شبكة الدّاعمين. من الفكرة إلى الأثر في أيّام معدودة.",
  subtitleEn:
    "The Island Haven hackathon: a real-world challenge, teams of Gaza talent, hands-on mentorship, then a demo day before our network of backers. From idea to impact in a handful of days.",
  step1Title: "الفكرة",
  step1TitleEn: "Ideate",
  step1Body: "تحدٍّ واقعيّ من شركائنا — تبدأ من مشكلة حقيقيّة، لا من ورقة بيضاء.",
  step1BodyEn: "A real challenge from our partners — you start from a genuine problem, not a blank page.",
  step2Title: "الفريق",
  step2TitleEn: "Team up",
  step2Body: "فرقٌ من مواهب آيلاند هيفن: مطوّرون، مصمّمون، ومحلّلو بيانات جنبًا إلى جنب.",
  step2BodyEn: "Teams from Island Haven's talent: developers, designers and data analysts side by side.",
  step3Title: "البناء",
  step3TitleEn: "Build",
  step3Body: "أيّامٌ مكثّفة مع إرشاد مباشر من خبرائنا — من الفكرة إلى نموذج يعمل.",
  step3BodyEn: "Intense days with hands-on mentorship from our experts — from idea to a working prototype.",
  step4Title: "العرض",
  step4TitleEn: "Pitch",
  step4Body: "يوم عرضٍ أمام شبكة الدّاعمين والمستثمرين — أفضل الفرق تُفتح لها أبواب.",
  step4BodyEn: "A demo day before our network of backers and investors — doors open for the best teams.",
  noteTitle: "الدورة القادمة قيد الإعداد",
  noteTitleEn: "The next edition is in the works",
  noteBody:
    "نُعلن مواعيد الهاكاثون القادم وتحدّياته عبر قنواتنا. سجّل اهتمامك الآن لتكون أوّل من يعرف — وانضمّ إلى مجتمع المواهب استعدادًا.",
  noteBodyEn:
    "We announce the next hackathon's dates and challenges through our channels. Register your interest now to be the first to know — and join the talent community to get ready.",
  applyCta: "قدّم على الحاضنة",
  applyCtaEn: "Apply to the incubator",
  meetCta: "قابِل المواهب",
  meetCtaEn: "Meet the talent",
};

export default function Hackathon() {
  const { t, lang } = useLanguage();
  const c = useContentSection("pageHackathon", CMS);
  const n = (x: number) => (lang === "ar" ? toAr(x) : String(x));

  useEffect(() => {
    document.title = t({ ar: "الهاكاثون — آيلاند هيفن", en: "Hackathon — Island Haven" });
  }, [lang, t]);

  const steps: { Icon: typeof Lightbulb; title: { ar: string; en: string }; body: { ar: string; en: string } }[] = [
    { Icon: Lightbulb, title: { ar: c.step1Title, en: c.step1TitleEn }, body: { ar: c.step1Body, en: c.step1BodyEn } },
    { Icon: Users2, title: { ar: c.step2Title, en: c.step2TitleEn }, body: { ar: c.step2Body, en: c.step2BodyEn } },
    { Icon: Rocket, title: { ar: c.step3Title, en: c.step3TitleEn }, body: { ar: c.step3Body, en: c.step3BodyEn } },
    { Icon: Trophy, title: { ar: c.step4Title, en: c.step4TitleEn }, body: { ar: c.step4Body, en: c.step4BodyEn } },
  ];

  return (
    <PageShell
      active="hackathon"
      eyebrow={t({ ar: c.eyebrow, en: c.eyebrowEn })}
      title={t({ ar: c.title, en: c.titleEn })}
      highlight={t({ ar: c.highlight, en: c.highlightEn })}
      subtitle={t({ ar: c.subtitle, en: c.subtitleEn })}
    >
      {/* The 4 movements */}
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={i}>
            <GlassCard className="h-full p-6">
              <div className="flex items-center gap-3">
                <span aria-hidden className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <s.Icon className="h-[20px] w-[20px]" strokeWidth={2} />
                </span>
                <span className="font-mono text-[13px] text-fg-faint">{n(i + 1).padStart(2, lang === "ar" ? "٠" : "0")}</span>
              </div>
              <h2 className="mt-4 text-[16px] font-bold text-foreground">{t(s.title)}</h2>
              <p className="mt-1.5 text-[13px] text-fg-secondary leading-relaxed">{t(s.body)}</p>
            </GlassCard>
          </li>
        ))}
      </ol>

      {/* Honest note + CTA */}
      <div className="mt-[clamp(3rem,7vw,5rem)] rounded-2xl border border-white/10 bg-white/[0.02] p-[clamp(1.5rem,4vw,2.5rem)]">
        <h2 className="font-display font-bold text-foreground" style={{ fontSize: "clamp(1.4rem,3vw,2rem)", letterSpacing: "-0.02em" }}>
          {t({ ar: c.noteTitle, en: c.noteTitleEn })}
        </h2>
        <p className="mt-3 max-w-2xl text-[14.5px] text-fg-secondary leading-relaxed">
          {t({ ar: c.noteBody, en: c.noteBodyEn })}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Btn asChild variant="primary" size="md">
            <Link href="/apply">{t({ ar: c.applyCta, en: c.applyCtaEn })}<ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link>
          </Btn>
          <Btn asChild variant="secondary" size="md"><Link href="/membership">{t({ ar: c.meetCta, en: c.meetCtaEn })}</Link></Btn>
        </div>
      </div>
    </PageShell>
  );
}
