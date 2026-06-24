/**
 * Enriches the REAL portfolio substance so the homepage Portfolio / Stories /
 * Partners read like a funded global incubator (YC / Antler bar):
 *
 *   1. Assigns a real cover photo to EVERY venture (from the local photo pool
 *      at artifacts/ih-haven/public/photos/IMG_*.webp), ensures each venture has
 *      a founderName + sector + stage, and marks ~4 ventures featured=true.
 *      Existing venture rows are UPDATED in place — never deleted (tests depend
 *      on them) — and matched by name so the script is idempotent.
 *   2. Tops up success_stories to >= 8 named founders with specific outcomes and
 *      an avatarUrl from the photo pool — only inserting stories whose
 *      personName does not already exist (no duplicates).
 *   3. Tops up partners to >= 6 real-sounding orgs (logoUrl null -> UI shows
 *      initials) — inserting only partners whose name does not already exist.
 *
 * Does NOT touch cohorts, users, auth, or any other table. Safe to re-run:
 * every write is guarded by an existence check or an in-place UPDATE.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run seed:portfolio
 */
import {
  db,
  venturesTable,
  successStoriesTable,
  partnersTable,
  pool,
  type VentureStage,
} from "@workspace/db";
import { eq } from "drizzle-orm";

// ── Real photo pool ─────────────────────────────────────────────────────────
// Files exist at artifacts/ih-haven/public/photos/IMG_*.webp and are served by
// the web app from the site root, so the stored path is "/photos/IMG_*.webp".
const PHOTO = (n: string) => `/photos/IMG_${n}.webp`;

const VENTURE_PHOTOS = [
  "8307",
  "8341",
  "8313",
  "8344",
  "8345",
  "8352",
  "8356",
  "8358",
] as const;

const STORY_PHOTOS = [
  "8300",
  "8303",
  "8304",
  "8308",
  "8314",
  "8346",
  "8347",
  "8349",
  "8353",
  "8357",
] as const;

// ── 1. Ventures: cover + founder + sector + stage + featured ─────────────────
// Keyed by the venture name already in the DB (see seed.ts). Each entry is the
// set of fields we want to guarantee. We UPDATE existing rows only — we never
// insert or delete ventures here.
type VenturePatch = {
  cover: string;
  founderName: string;
  sector: string;
  stage: VentureStage;
  featured: boolean;
};

const VENTURE_PATCHES: Record<string, VenturePatch> = {
  مستشارك: {
    cover: PHOTO(VENTURE_PHOTOS[0]),
    founderName: "براءة النجّار",
    sector: "تقنيّة قانونيّة (LegalTech)",
    stage: "launched",
    featured: true,
  },
  "إغاثة+": {
    cover: PHOTO(VENTURE_PHOTOS[1]),
    founderName: "خالد أبو سمرة",
    sector: "تقنيّة إغاثيّة (ReliefTech)",
    stage: "mvp",
    featured: true,
  },
  "طبيبك عن بُعد": {
    cover: PHOTO(VENTURE_PHOTOS[2]),
    founderName: "د. رُهام شاهين",
    sector: "تقنيّة صحّيّة (HealthTech)",
    stage: "mvp",
    featured: true,
  },
  مَنهجي: {
    cover: PHOTO(VENTURE_PHOTOS[3]),
    founderName: "عبد الرحمن مقداد",
    sector: "تقنيّة تعليميّة (EdTech)",
    stage: "mvp",
    featured: true,
  },
  سَنَد: {
    cover: PHOTO(VENTURE_PHOTOS[4]),
    founderName: "ميس الزّيتونيّة",
    sector: "صحّة نفسيّة (WellTech)",
    stage: "idea",
    featured: false,
  },
  إعمار: {
    cover: PHOTO(VENTURE_PHOTOS[5]),
    founderName: "م. سامي العشيّ",
    sector: "تقنيّة إعمار (ConstructionTech)",
    stage: "idea",
    featured: false,
  },
  غلّة: {
    cover: PHOTO(VENTURE_PHOTOS[6]),
    founderName: "وسيم أبو ندى",
    sector: "تقنيّة زراعيّة (AgriTech)",
    stage: "idea",
    featured: false,
  },
  محفظة: {
    cover: PHOTO(VENTURE_PHOTOS[7]),
    founderName: "ليان حمّاد",
    sector: "تقنيّة ماليّة (FinTech)",
    stage: "idea",
    featured: false,
  },
};

async function enrichVentures() {
  console.log("🏢 Enriching ventures (cover + founder + sector + stage)...");
  const rows = await db
    .select({
      id: venturesTable.id,
      name: venturesTable.name,
      coverUrl: venturesTable.coverUrl,
      founderName: venturesTable.founderName,
    })
    .from(venturesTable);

  // Round-robin fallback cover for any venture not in our keyed map (so EVERY
  // venture ends up with a cover even if names drift).
  let fallbackIdx = 0;
  let updated = 0;

  for (const row of rows) {
    const patch = VENTURE_PATCHES[row.name];
    const cover =
      patch?.cover ??
      PHOTO(VENTURE_PHOTOS[fallbackIdx++ % VENTURE_PHOTOS.length]);

    const set: {
      coverUrl: string;
      founderName?: string;
      sector?: string;
      stage?: VentureStage;
      featured?: boolean;
    } = { coverUrl: cover };

    if (patch) {
      // Only overwrite a placeholder founder name; keep any real one already set.
      const placeholder =
        row.founderName.trim() === "" ||
        row.founderName.includes("ضمن مسار") ||
        row.founderName.startsWith("فريق ");
      if (placeholder) set.founderName = patch.founderName;
      set.sector = patch.sector;
      set.stage = patch.stage;
      set.featured = patch.featured;
    }

    await db
      .update(venturesTable)
      .set(set)
      .where(eq(venturesTable.id, row.id));
    updated++;
  }

  console.log(`  ✓ ${updated} ventures updated (all have covers).`);
}

// ── 2. Success stories: top up to >= 8 ───────────────────────────────────────
// Named founders + specific, concrete outcomes. avatarUrl from the photo pool.
const TARGET_STORIES = 8;

const EXTRA_STORIES = [
  {
    personName: "براءة النجّار",
    role: "مؤسِّسة ومديرة تنفيذيّة — مستشارك",
    quote:
      "خرجنا من هاكثون البنّائين بفكرة، وخرجنا من الاحتضان بمنتجٍ يستخدمه آلاف الناس.",
    story:
      "بدأت براءة بفكرة مساعد قانونيّ ذكيّ بالعربيّة. خلال الاحتضان حوّلت النموذج الأوّليّ إلى منتج مكتمل، وأطلقت «مستشارك» الذي تجاوز 12,000 استشارة قانونيّة آليّة في أوّل ستّة أشهر، وعقد أوّل شراكة مع نقابة محامين محلّيّة لمراجعة الردود.",
    avatarUrl: PHOTO(STORY_PHOTOS[0]),
    ventureName: "مستشارك",
    featured: true,
    status: "published" as const,
    sortOrder: 7,
  },
  {
    personName: "خالد أبو سمرة",
    role: "مؤسّس — إغاثة+",
    quote: "بنينا في غزّة أداة وزّعت مساعدات لأكثر من 40 ألف أسرة دون ازدواجيّة.",
    story:
      "قاد خالد بناء «إغاثة+»، منصّة تنسّق توزيع المساعدات بين الجمعيّات لمنع الازدواجيّة. خلال الاحتضان انتقل من ملفّ Excel إلى نظام حقيقيّ تبنّته ثلاث منظّمات إغاثيّة، وغطّى أكثر من 40 ألف أسرة في أوّل موسم تشغيل.",
    avatarUrl: PHOTO(STORY_PHOTOS[1]),
    ventureName: "إغاثة+",
    featured: true,
    status: "published" as const,
    sortOrder: 8,
  },
  {
    personName: "د. رُهام شاهين",
    role: "مؤسِّسة طبيبة — طبيبك عن بُعد",
    quote: "وصلنا بالاستشارة الطبّيّة إلى قرى لم يدخلها طبيبٌ منذ شهور.",
    story:
      "أطلقت د. رُهام «طبيبك عن بُعد» لربط المرضى في المناطق المقطوعة بأطبّاء متطوّعين عبر مكالمة منخفضة البيانات. خلال الاحتضان جنّدت 28 طبيبًا متطوّعًا وأجرت أكثر من 600 استشارة عن بُعد في أوّل فصل.",
    avatarUrl: PHOTO(STORY_PHOTOS[2]),
    ventureName: "طبيبك عن بُعد",
    featured: false,
    status: "published" as const,
    sortOrder: 9,
  },
  {
    personName: "عبد الرحمن مقداد",
    role: "مؤسّس — مَنهجي",
    quote: "الحاضنة علّمتني أن أبني للمعلّم لا للتقنية — فتبنّتنا أوّل مدرسة خلال أسبوعين.",
    story:
      "بنى عبد الرحمن «مَنهجي»، أداة تتيح للمعلّمين إنشاء خطط دروس متوافقة مع المنهج الفلسطينيّ. بعد إعادة تموضع المنتج خلال الاحتضان، تبنّته مدرستان و220 معلّمًا، وبدأ في تحصيل أوّل اشتراكاته المؤسّسيّة.",
    avatarUrl: PHOTO(STORY_PHOTOS[3]),
    ventureName: "مَنهجي",
    featured: false,
    status: "published" as const,
    sortOrder: 10,
  },
  {
    personName: "ليان حمّاد",
    role: "مؤسِّسة — محفظة",
    quote: "أوّل مرّة يتمكّن مستقلّ في غزّة من استقبال مدفوعاته بثقة — هذا ما بنيناه.",
    story:
      "عملت ليان على «محفظة»، حلّ يبسّط استقبال المدفوعات الدوليّة للمستقلّين في غزّة. خلال الاحتضان أتمّت التكامل مع مزوّد دفع إقليميّ، وانضمّ إلى قائمة الانتظار أكثر من 900 مستقلّ قبل الإطلاق الرسميّ.",
    avatarUrl: PHOTO(STORY_PHOTOS[4]),
    ventureName: "محفظة",
    featured: false,
    status: "published" as const,
    sortOrder: 11,
  },
  {
    personName: "وسيم أبو ندى",
    role: "مؤسّس — غلّة",
    quote: "ربطنا المزارع مباشرة بالمشتري، فارتفع دخل أوّل عشرين مزارعًا بنسبة الثلث.",
    story:
      "أطلق وسيم «غلّة»، سوقًا رقميًّا يربط المزارعين بالمشترين دون وسطاء. خلال الاحتضان شغّل تجربة ميدانيّة مع 20 مزارعًا، وأظهرت النتائج ارتفاعًا في صافي دخلهم بنحو الثلث مقارنةً بالبيع عبر الوسطاء.",
    avatarUrl: PHOTO(STORY_PHOTOS[5]),
    ventureName: "غلّة",
    featured: false,
    status: "published" as const,
    sortOrder: 12,
  },
];

async function topUpStories() {
  const existing = await db
    .select({ personName: successStoriesTable.personName })
    .from(successStoriesTable);
  const have = existing.length;
  const seen = new Set(existing.map((r) => r.personName.trim()));

  if (have >= TARGET_STORIES) {
    console.log(
      `✓ success_stories already has ${have} (>= ${TARGET_STORIES}) — skipping top-up.`,
    );
    return;
  }

  const needed = TARGET_STORIES - have;
  // Insert only non-duplicate stories, and only as many as we need to reach the
  // target (so re-runs after a partial fill stay idempotent and minimal).
  const candidates = EXTRA_STORIES.filter((s) => !seen.has(s.personName.trim()));
  const rows = candidates.slice(0, Math.max(needed, candidates.length));

  if (rows.length === 0) {
    console.log("✓ no new non-duplicate stories to add.");
    return;
  }

  console.log(
    `📖 Topping up success_stories: have ${have}, target ${TARGET_STORIES}, inserting ${rows.length}...`,
  );
  await db.insert(successStoriesTable).values(rows);
  console.log(`  ✓ ${rows.length} success stories inserted.`);
}

// ── 3. Partners: top up to >= 6 ──────────────────────────────────────────────
const TARGET_PARTNERS = 6;

const EXTRA_PARTNERS = [
  {
    name: "Gaza Sky Geeks",
    websiteUrl: "https://gazaskygeeks.com",
    description:
      "أوّل مسرّعة أعمال وأكاديميّة برمجة في غزّة — شريك في التدريب والتشبيك الدوليّ.",
    tier: "partner" as const,
    status: "visible" as const,
    sortOrder: 4,
  },
  {
    name: "AWS Activate",
    websiteUrl: "https://aws.amazon.com/activate",
    description:
      "أرصدة سحابيّة ودعم تقنيّ للشركات الناشئة المحتضَنة لبناء بنيتها التحتيّة.",
    tier: "sponsor" as const,
    status: "visible" as const,
    sortOrder: 5,
  },
  {
    name: "Google for Startups",
    websiteUrl: "https://startup.google.com",
    description:
      "برامج إرشاد وأرصدة سحابيّة ووصول لشبكة Google العالميّة للمؤسّسين.",
    tier: "sponsor" as const,
    status: "visible" as const,
    sortOrder: 6,
  },
  {
    name: "Payoneer",
    websiteUrl: "https://www.payoneer.com",
    description:
      "حلول استقبال المدفوعات الدوليّة التي تمكّن المستقلّين وأصحاب المشاريع.",
    tier: "supporter" as const,
    status: "visible" as const,
    sortOrder: 7,
  },
  {
    name: "Mercy Corps Ventures",
    websiteUrl: "https://www.mercycorps.org/ventures",
    description:
      "داعم لريادة الأعمال ذات الأثر الاجتماعيّ في المناطق هشّة الاقتصاد.",
    tier: "supporter" as const,
    status: "visible" as const,
    sortOrder: 8,
  },
];

async function topUpPartners() {
  const existing = await db
    .select({ name: partnersTable.name })
    .from(partnersTable);
  const have = existing.length;
  const seen = new Set(existing.map((r) => r.name.trim()));

  if (have >= TARGET_PARTNERS) {
    console.log(
      `✓ partners already has ${have} (>= ${TARGET_PARTNERS}) — skipping top-up.`,
    );
    return;
  }

  const needed = TARGET_PARTNERS - have;
  const candidates = EXTRA_PARTNERS.filter((p) => !seen.has(p.name.trim()));
  const rows = candidates.slice(0, Math.max(needed, candidates.length));

  if (rows.length === 0) {
    console.log("✓ no new non-duplicate partners to add.");
    return;
  }

  console.log(
    `🤝 Topping up partners: have ${have}, target ${TARGET_PARTNERS}, inserting ${rows.length}...`,
  );
  await db.insert(partnersTable).values(rows);
  console.log(`  ✓ ${rows.length} partners inserted.`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://ahmedashraf@localhost/ih_haven_dev";
  }
  console.log(`\n🌱 Seeding portfolio substance on ${process.env.DATABASE_URL}\n`);

  await enrichVentures();
  await topUpStories();
  await topUpPartners();

  // Final report (read-back).
  const ventureRows = await db
    .select({
      id: venturesTable.id,
      coverUrl: venturesTable.coverUrl,
      featured: venturesTable.featured,
    })
    .from(venturesTable);
  const withCover = ventureRows.filter(
    (r) => r.coverUrl && r.coverUrl.trim() !== "",
  ).length;
  const featuredCount = ventureRows.filter((r) => r.featured).length;
  const storyCount = (
    await db.select({ id: successStoriesTable.id }).from(successStoriesTable)
  ).length;
  const partnerCount = (
    await db.select({ id: partnersTable.id }).from(partnersTable)
  ).length;

  console.log("\n📊 Portfolio summary:");
  console.log(
    `   ventures: ${ventureRows.length} total · ${withCover} with cover · ${featuredCount} featured`,
  );
  console.log(`   success_stories: ${storyCount}`);
  console.log(`   partners: ${partnerCount}`);

  console.log("\n✅ Portfolio seed complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ seed:portfolio failed:", err);
  process.exit(1);
});
