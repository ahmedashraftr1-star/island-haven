import { ShieldCheck, Gift, Users, Globe2, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRosterStats } from "@/hooks/use-public-data";

type Item = { icon: LucideIcon; value: string; label: string };

const toArabicDigits = (s: string) => s.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

/**
 * TrustStrip — a compact row of credibility indicators (icon + value + label),
 * placed near a primary CTA to build trust the way the reference site does
 * ("active since X · 100% free · N members · global network"). On-brand: cerulean
 * icon chips on the dark canvas, tabular figures. Reusable + bilingual + RTL-safe.
 *
 * HONESTY: the community-members figure is the REAL live count from `/numbers`
 * (never a hardcoded/invented number). Until it loads — or if the fetch fails —
 * the numeric member item is simply omitted rather than showing a fabricated one.
 */
export function TrustStrip({ className = "" }: { className?: string }) {
  const { t, lang } = useLanguage();
  // The ONE public community figure — the real talent-roster COUNT (61), the same
  // cached /roster/stats source the hero + NumbersBand + /membership read, so this
  // strip can never contradict them. Undefined until it resolves and null on error
  // — either way the member item below stays hidden rather than showing a
  // fabricated figure (honesty rule).
  const { data } = useRosterStats();
  const members = data?.total ?? null;

  const membersValue =
    members != null && members > 0
      ? lang === "en"
        ? `${members}+`
        : `${toArabicDigits(String(members))}+`
      : null;

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
    // Real live member count only — omitted entirely until it resolves.
    ...(membersValue
      ? [
          {
            icon: Users,
            value: membersValue,
            label: t({ ar: "عضو في المجتمع", en: "Community members" }),
          },
        ]
      : []),
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
