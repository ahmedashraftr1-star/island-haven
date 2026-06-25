import { ShieldCheck, Gift, Users, Globe2, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Item = { icon: LucideIcon; value: string; label: string };

/**
 * TrustStrip — a compact row of credibility indicators (icon + value + label),
 * placed near a primary CTA to build trust the way the reference site does
 * ("active since X · 100% free · N members · global network"). On-brand: cerulean
 * icon chips on the dark canvas, tabular figures. Reusable + bilingual + RTL-safe.
 */
export function TrustStrip({ className = "" }: { className?: string }) {
  const { t, lang } = useLanguage();

  const items: Item[] = [
    {
      icon: ShieldCheck,
      value: lang === "en" ? "Est. 2024" : "تأسّست ٢٠٢٤",
      label: t({ ar: "نعمل من قلب غزّة", en: "Operating from Gaza" }),
    },
    {
      icon: Gift,
      value: lang === "en" ? "100%" : "١٠٠٪",
      label: t({ ar: "مجّانًا للأعضاء", en: "Free for members" }),
    },
    {
      icon: Users,
      value: lang === "en" ? "80+" : "٨٠+",
      label: t({ ar: "عضو في المجتمع", en: "Community members" }),
    },
    {
      icon: Globe2,
      value: t({ ar: "عالميّة", en: "Global" }),
      label: t({ ar: "شبكة شركاء وفرص", en: "Partners & opportunities" }),
    },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-x-8 gap-y-5 ${className}`}>
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 border border-border-strong text-sand-bright shrink-0">
            <it.icon className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="leading-tight">
            <div className="font-display font-bold text-foreground text-[15px] tnum">{it.value}</div>
            <div className="text-caption text-muted-foreground">{it.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
