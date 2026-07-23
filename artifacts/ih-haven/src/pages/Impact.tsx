import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { Btn } from "@/components/ui/Btn";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContentSection } from "@/hooks/use-content";
import { api } from "@/lib/api";

interface Stats {
  total: number;
  types: { student: number; graduate: number; freelancer: number };
  genders: { male: number; female: number };
  topSkills: { skill: string; c: number }[];
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toAr = (s: string | number) => String(s).replace(/\d/g, (d) => AR_DIGITS[+d]);

// Bilingual page chrome — the editable CMS fallback ("pageImpact" section).
const CMS = {
  eyebrow: "أثرنا · IMPACT",
  eyebrowEn: "Our Impact · أثرنا",
  title: "أثرٌ",
  titleEn: "Impact you",
  highlight: "يُقاس",
  highlightEn: "can measure",
  subtitle:
    "لا نقول «آلاف» بلا دليل. هذه أرقام مجتمعنا الحقيقيّة، من قاعدة بياناتنا مباشرةً — مواهب غزّة التي نأخذ بيدها نحو الاقتصاد الرقميّ.",
  subtitleEn:
    "We don't claim 'thousands' without proof. These are our community's real numbers, straight from our database — the Gaza talent we're guiding into the digital economy.",
  stat1Label: "موهبة مُحتضَنة",
  stat1LabelEn: "talents incubated",
  stat2Label: "خرّيج جاهز للسوق",
  stat2LabelEn: "market-ready graduates",
  stat3Label: "مستقلّ يعمل عالميًّا",
  stat3LabelEn: "freelancers working globally",
  stat4Label: "من النساء",
  stat4LabelEn: "are women",
  skillsTitle: "أبرز المهارات",
  skillsTitleEn: "Top skills",
  verifyNote: "أرقامنا العلنيّة موقّعة تشفيريًّا — تحقّق منها بنفسك.",
  verifyNoteEn: "Our public numbers are cryptographically signed — verify them yourself.",
  verifyCta: "تحقّق",
  verifyCtaEn: "Verify",
  meetCta: "قابِل المواهب",
  meetCtaEn: "Meet the talent",
};

export default function Impact() {
  const { t, lang } = useLanguage();
  const c = useContentSection("pageImpact", CMS);
  const [stats, setStats] = useState<Stats | null>(null);
  const n = (x: number) => (lang === "ar" ? toAr(x) : String(x));

  useEffect(() => {
    document.title = t({ ar: "أثرنا — آيلاند هيفن", en: "Our Impact — Island Haven" });
  }, [lang, t]);
  useEffect(() => {
    let alive = true;
    api<Stats>("/roster/stats").then((s) => alive && setStats(s)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const womenPct = stats && stats.total ? Math.round((stats.genders.female / stats.total) * 100) : 0;
  const maxSkill = stats?.topSkills[0]?.c ?? 1;

  const bigStats: { value: string; label: { ar: string; en: string } }[] = [
    { value: stats ? n(stats.total) : "—", label: { ar: c.stat1Label, en: c.stat1LabelEn } },
    { value: stats ? n(stats.types.graduate) : "—", label: { ar: c.stat2Label, en: c.stat2LabelEn } },
    { value: stats ? n(stats.types.freelancer) : "—", label: { ar: c.stat3Label, en: c.stat3LabelEn } },
    { value: stats ? `${n(womenPct)}٪` : "—", label: { ar: c.stat4Label, en: c.stat4LabelEn } },
  ];

  return (
    <PageShell
      active="impact"
      eyebrow={t({ ar: c.eyebrow, en: c.eyebrowEn })}
      title={t({ ar: c.title, en: c.titleEn })}
      highlight={t({ ar: c.highlight, en: c.highlightEn })}
      subtitle={t({ ar: c.subtitle, en: c.subtitleEn })}
    >
      {/* Big honest stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {bigStats.map((s, i) => (
          <GlassCard key={i} className="p-5 sm:p-6">
            <div className="font-mono font-black text-sand-bright tnum leading-none" style={{ fontSize: "clamp(2rem,5vw,2.9rem)" }}>
              {s.value}
            </div>
            <div className="mt-2 text-[12px] text-fg-secondary leading-snug">{t(s.label)}</div>
          </GlassCard>
        ))}
      </div>

      {/* Top skills */}
      <section className="mt-[clamp(3rem,7vw,5rem)]" aria-labelledby="impact-skills">
        <h2 id="impact-skills" className="font-display font-bold text-foreground" style={{ fontSize: "clamp(1.4rem,3vw,2.1rem)", letterSpacing: "-0.02em" }}>
          {t({ ar: c.skillsTitle, en: c.skillsTitleEn })}
        </h2>
        <div className="mt-6 space-y-3 min-h-[16rem]">
          {(stats?.topSkills ?? []).map((sk) => (
            <div key={sk.skill} className="flex items-center gap-3">
              <div className="w-40 shrink-0 text-[12.5px] text-fg-secondary truncate sm:w-56">{sk.skill}</div>
              <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-primary/70 to-sand-bright/80"
                  style={{ width: `${Math.max(6, (sk.c / maxSkill) * 100)}%` }}
                />
              </div>
              <div className="w-8 shrink-0 text-end font-mono tabular-nums text-[12px] text-fg-faint">{n(sk.c)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Verify + CTA */}
      <div className="mt-[clamp(3rem,7vw,5rem)] flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2 text-[13.5px] text-fg-secondary">
          <ShieldCheck className="h-4 w-4 text-sand-bright" aria-hidden />
          {t({ ar: c.verifyNote, en: c.verifyNoteEn })}
        </p>
        <div className="flex gap-3">
          <Btn asChild variant="secondary" size="md"><Link href="/verify">{t({ ar: c.verifyCta, en: c.verifyCtaEn })}</Link></Btn>
          <Btn asChild variant="primary" size="md">
            <Link href="/membership">{t({ ar: c.meetCta, en: c.meetCtaEn })}<ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link>
          </Btn>
        </div>
      </div>
    </PageShell>
  );
}
