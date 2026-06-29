/**
 * ventureIdentity — gives every venture a distinct visual identity DERIVED from
 * its `sector` (the schema has no color field, so we derive — no DB migration).
 *
 * Each identity is a DEEP, desaturated gradient that sits comfortably on the
 * deep-navy canvas (never garish) plus one readable accent for chips / hairlines
 * / affordances. This is the spec's "unique colour per venture" expressed within
 * the house design language — additive identity colour, not a palette overhaul.
 * Sector strings arrive in English or Arabic depending on the seed, so matching
 * is keyword-based and bilingual. Unknown sectors fall back deterministically by
 * id so a cover-less, sector-less venture still reads intentional.
 */

export interface VentureIdentity {
  key: string;
  /** Deep gradient for cover backdrops / tints behind photography. */
  gradient: string;
  /** Readable accent (on dark) for sector chips, hairlines, affordances. */
  accent: string;
  /** Soft translucent fill for chips. */
  soft: string;
}

interface IdentityDef {
  key: string;
  hue: number; // degrees — drives gradient + accent + soft from one source
  /** keyword fragments (lowercase, en + ar) that map a sector to this identity */
  match: string[];
}

// Ordered: most specific first. Hue is the single source of truth per identity.
const DEFS: IdentityDef[] = [
  { key: "legal", hue: 40, match: ["legal", "law", "قانون"] },
  // well BEFORE health: "صحّة نفسيّة (WellTech)" also contains "صحّ", so the more
  // specific mental-wellness match must win over the generic health one.
  { key: "well", hue: 322, match: ["welltech", "well", "mental", "psych", "نفسيّ", "نفس", "سند", "سَنَد"] },
  { key: "fintech", hue: 166, match: ["fintech", "fin", "pay", "مال", "محفظة", "مدفوع"] },
  { key: "health", hue: 168, match: ["health", "med", "care", "صحّ", "صح", "طبّ", "طبيب", "عن بُعد"] },
  { key: "edtech", hue: 264, match: ["edu", "ed-tech", "edtech", "learn", "تعليم", "منهج", "تعلّم"] },
  { key: "agri", hue: 138, match: ["agri", "farm", "food", "زراع", "غلّة", "غلة"] },
  { key: "relief", hue: 205, match: ["relief", "aid", "humanit", "إغاث", "اغاث", "إغاثة"] },
  { key: "construction", hue: 32, match: ["construct", "build", "إعمار", "اعمار", "بناء"] },
  { key: "marketplace", hue: 22, match: ["market", "commerce", "auction", "مزاد", "تجار", "سوق"] },
  { key: "devtools", hue: 190, match: ["dev", "devtools", "infra", "engineering", "أدوات", "برمج"] },
  { key: "ai", hue: 232, match: ["ai", "ml", "nlp", "data", "ذكاء", "اصطناع"] },
  { key: "events", hue: 308, match: ["event", "فعالي", "نجمة", "najma"] },
];

const FALLBACK_HUES = [216, 266, 28, 168, 196]; // deterministic-by-id cycle

function build(key: string, hue: number): VentureIdentity {
  // Deep gradient: two very dark stops of the hue, angled — reads as a tint, not
  // a billboard. Accent: bright-but-AA-ish on dark. Soft: faint chip fill.
  return {
    key,
    gradient: `linear-gradient(135deg, hsl(${hue} 70% 7%) 0%, hsl(${hue} 62% 12%) 55%, hsl(${(hue + 18) % 360} 55% 9%) 100%)`,
    accent: `hsl(${hue} 78% 66%)`,
    soft: `hsl(${hue} 70% 14% / 0.55)`,
  };
}

/**
 * Resolve a venture's identity from its sector text (en/ar), with a stable
 * id-based fallback so unknown/empty sectors still get a consistent colour.
 */
export function ventureIdentity(sector?: string | null, id?: number): VentureIdentity {
  const s = (sector ?? "").toLowerCase();
  if (s.trim()) {
    for (const def of DEFS) {
      if (def.match.some((m) => s.includes(m))) return build(def.key, def.hue);
    }
  }
  const hue = FALLBACK_HUES[Math.abs(id ?? 0) % FALLBACK_HUES.length];
  return build("default", hue);
}
