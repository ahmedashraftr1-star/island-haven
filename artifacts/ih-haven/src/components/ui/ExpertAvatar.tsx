import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { imageUrl } from "@/hooks/use-content";
import { cn } from "@/lib/utils";

/**
 * Initials for the avatar fallback — first letters of the first two meaningful
 * name words, skipping single-letter honorifics ("م.", "أ.", "د."). Derived from
 * the name the API returns, never stored — so it holds for any mentor/member.
 */
// Honorific titles to skip when picking initials, so "المحامي طارق سالم" reads
// "طس" (the person), not "اط" (the title). Compared after stripping dots/commas
// and lowercasing, covering both Arabic and English prefixes.
const HONORIFICS = new Set([
  "المحامي", "المحامية", "الدكتور", "الدكتورة", "دكتور", "دكتورة", "المهندس",
  "المهندسة", "مهندس", "مهندسة", "الأستاذ", "الأستاذة", "أستاذ", "أستاذة",
  "الشيخ", "الحاج", "الحاجة", "السيد", "السيدة", "الآنسة", "الكابتن", "الرائد",
  "د", "دة", "م", "أ", "أ.د", "أست",
  "dr", "mr", "mrs", "ms", "miss", "mx", "eng", "engineer", "prof", "professor",
  "sheikh", "sir", "madam", "capt", "captain", "adv", "advocate",
]);

function isHonorific(word: string): boolean {
  const clean = word.replace(/[.،،]/g, "").toLowerCase();
  return clean.length === 0 || HONORIFICS.has(clean);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  // Drop honorific titles + single-letter tokens, then take the first two real
  // name words. Fall back to any length>1 words, then the raw parts, so a name
  // that is ALL titles/initials still yields something.
  const named = parts.filter(
    (w) => !isHonorific(w) && w.replace(/\./g, "").length > 1,
  );
  const withLen = parts.filter((w) => w.replace(/\./g, "").length > 1);
  return (named.length ? named : withLen.length ? withLen : parts)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("");
}

export type ExpertAvatarSize = "sm" | "md" | "lg";

const SIZES: Record<ExpertAvatarSize, { box: string; text: string; dot: string }> = {
  sm: { box: "h-10 w-10", text: "text-[13px]", dot: "h-2.5 w-2.5" },
  md: { box: "h-14 w-14", text: "text-[1.1rem]", dot: "h-3 w-3" },
  lg: { box: "h-24 w-24", text: "text-[1.6rem]", dot: "h-3.5 w-3.5" },
};

/**
 * ExpertAvatar — the ONE avatar treatment for mentors/experts everywhere
 * (homepage ExpertsBand, the /experts chip strip, and the /experts grid).
 *
 * Shows the real photo in a gold-ringed glass circle when `avatarUrl` is present,
 * and otherwise a graceful gold-on-glass **two-letter** initials fallback. Built
 * on the Radix Avatar primitive, so a broken photo URL also degrades to the same
 * fallback rather than a broken-image glyph. An optional availability dot
 * (terracotta = accepting, muted = waitlist) uses the brand accent — never the
 * off-brand green that some surfaces used before.
 *
 * RTL-safe (logical `end`), honest (no invented photos), and animation-free of
 * its own — hover/scale effects belong to the surrounding card, not here.
 */
export function ExpertAvatar({
  name,
  avatarUrl,
  size = "md",
  accepting,
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: ExpertAvatarSize;
  /** When defined, renders an availability dot (accepting → terracotta). */
  accepting?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  const src = avatarUrl ? imageUrl(avatarUrl) : "";
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <Avatar
        className={cn(
          s.box,
          "ring-1 ring-[hsl(38_80%_60%/0.4)] shadow-[0_10px_26px_-14px_hsl(0_0%_0%/0.7)]",
        )}
      >
        {src ? (
          <AvatarImage
            src={src}
            alt={name}
            loading="lazy"
            decoding="async"
            className="object-cover"
          />
        ) : null}
        <AvatarFallback
          className={cn(
            "bg-white/[0.04] font-display font-black leading-none text-sand-bright",
            s.text,
          )}
        >
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      {accepting !== undefined && (
        <span
          aria-hidden
          className={cn(
            "absolute bottom-0 end-0 rounded-full ring-2 ring-[#0b0a09]",
            s.dot,
            accepting ? "bg-primary" : "bg-white/35",
          )}
        />
      )}
    </span>
  );
}
