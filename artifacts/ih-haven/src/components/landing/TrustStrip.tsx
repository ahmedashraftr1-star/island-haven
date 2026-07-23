import { ShieldCheck, Gift, Users, Globe2, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRosterStats } from "@/hooks/use-public-data";
import { useContentSection } from "@/hooks/use-content";

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

// AR is the CMS-overridable source of truth (useContentSection); English keeps its
// literal via …En keys. Defaults below are byte-verbatim copies of the previous
// hardcoded copy. The community-members figure stays a real live number (untouched).
const FALLBACK = {
  item0Value: "تأسّست ٢٠٢٤",
  item0ValueEn: "Est. 2024",
  item0Label: "نعمل من قلب غزّة",
  item0LabelEn: "Operating from Gaza",
  item1Value: "١٠٠٪",
  item1ValueEn: "100%",
  item1Label: "مجّانًا للأعضاء",
  item1LabelEn: "Free for members",
  item2Label: "عضو في المجتمع",
  item2LabelEn: "Community members",
  item3Value: "عالميّة",
  item3ValueEn: "Global",
  item3Label: "شبكة شركاء وفرص",
  item3LabelEn: "Partners & opportunities",
};

export function TrustStrip({ className = "" }: { className?: string }) {
  const { t, lang } = useLanguage();
  const c = useContentSection("trustStrip", FALLBACK);
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
      value: lang === "en" ? c.item0ValueEn : c.item0Value,
      label: t({ ar: c.item0Label, en: c.item0LabelEn }),
    },
    {
      icon: Gift,
      value: lang === "en" ? c.item1ValueEn : c.item1Value,
      label: t({ ar: c.item1Label, en: c.item1LabelEn }),
    },
    // Real live member count only — omitted entirely until it resolves.
    ...(membersValue
      ? [
          {
            icon: Users,
            value: membersValue,
            label: t({ ar: c.item2Label, en: c.item2LabelEn }),
          },
        ]
      : []),
    {
      icon: Globe2,
      value: t({ ar: c.item3Value, en: c.item3ValueEn }),
      label: t({ ar: c.item3Label, en: c.item3LabelEn }),
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
