import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Lightbulb, Users2, Rocket, Trophy } from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { Btn } from "@/components/ui/Btn";
import { useLanguage } from "@/contexts/LanguageContext";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toAr = (s: string | number) => String(s).replace(/\d/g, (d) => AR_DIGITS[+d]);

export default function Hackathon() {
  const { t, lang } = useLanguage();
  const n = (x: number) => (lang === "ar" ? toAr(x) : String(x));

  useEffect(() => {
    document.title = t({ ar: "الهاكاثون — آيلاند هيفن", en: "Hackathon — Island Haven" });
  }, [lang, t]);

  const steps: { Icon: typeof Lightbulb; title: { ar: string; en: string }; body: { ar: string; en: string } }[] = [
    { Icon: Lightbulb, title: { ar: "الفكرة", en: "Ideate" }, body: { ar: "تحدٍّ واقعيّ من شركائنا — تبدأ من مشكلة حقيقيّة، لا من ورقة بيضاء.", en: "A real challenge from our partners — you start from a genuine problem, not a blank page." } },
    { Icon: Users2, title: { ar: "الفريق", en: "Team up" }, body: { ar: "فرقٌ من مواهب آيلاند هيفن: مطوّرون، مصمّمون، ومحلّلو بيانات جنبًا إلى جنب.", en: "Teams from Island Haven's talent: developers, designers and data analysts side by side." } },
    { Icon: Rocket, title: { ar: "البناء", en: "Build" }, body: { ar: "أيّامٌ مكثّفة مع إرشاد مباشر من خبرائنا — من الفكرة إلى نموذج يعمل.", en: "Intense days with hands-on mentorship from our experts — from idea to a working prototype." } },
    { Icon: Trophy, title: { ar: "العرض", en: "Pitch" }, body: { ar: "يوم عرضٍ أمام شبكة الدّاعمين والمستثمرين — أفضل الفرق تُفتح لها أبواب.", en: "A demo day before our network of backers and investors — doors open for the best teams." } },
  ];

  return (
    <PageShell
      active="hackathon"
      eyebrow={t({ ar: "هاكاثون · HACKATHON", en: "Hackathon · هاكاثون" })}
      title={t({ ar: "تُبنى الأفكار", en: "Ideas built" })}
      highlight={t({ ar: "في أيّام", en: "in days" })}
      subtitle={t({
        ar: "هاكاثون آيلاند هيفن: تحدٍّ واقعيّ، فرقٌ من مواهب غزّة، إرشادٌ مباشر، ثمّ يوم عرضٍ أمام شبكة الدّاعمين. من الفكرة إلى الأثر في أيّام معدودة.",
        en: "The Island Haven hackathon: a real-world challenge, teams of Gaza talent, hands-on mentorship, then a demo day before our network of backers. From idea to impact in a handful of days.",
      })}
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
          {t({ ar: "الدورة القادمة قيد الإعداد", en: "The next edition is in the works" })}
        </h2>
        <p className="mt-3 max-w-2xl text-[14.5px] text-fg-secondary leading-relaxed">
          {t({
            ar: "نُعلن مواعيد الهاكاثون القادم وتحدّياته عبر قنواتنا. سجّل اهتمامك الآن لتكون أوّل من يعرف — وانضمّ إلى مجتمع المواهب استعدادًا.",
            en: "We announce the next hackathon's dates and challenges through our channels. Register your interest now to be the first to know — and join the talent community to get ready.",
          })}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Btn asChild variant="primary" size="md">
            <Link href="/apply">{t({ ar: "قدّم على الحاضنة", en: "Apply to the incubator" })}<ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link>
          </Btn>
          <Btn asChild variant="secondary" size="md"><Link href="/membership">{t({ ar: "قابِل المواهب", en: "Meet the talent" })}</Link></Btn>
        </div>
      </div>
    </PageShell>
  );
}
