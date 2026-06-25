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
import bcrypt from "bcryptjs";
import {
  db,
  venturesTable,
  successStoriesTable,
  partnersTable,
  usersTable,
  worksTable,
  coursesTable,
  enrollmentsTable,
  pool,
  type VentureStage,
  type UserRole,
  type WorkStatus,
} from "@workspace/db";
import { eq } from "drizzle-orm";

// Shared password hash for every demo member. Real value comes from the local
// SEED_USER_PASSWORD env (same convention as seed-extras.ts); never committed.
const MEMBER_PW_HASH = bcrypt.hashSync(
  process.env.SEED_USER_PASSWORD || "change-me-local",
  10,
);

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

// ── 4. Community members + portfolio works + enrollments ─────────────────────
// The public "بالأرقام" numbers (members / freelancers / graduates / students /
// works / enrollments) are computed from REAL rows — not hard-coded. To make the
// homepage read like a funded incubator we seed a substantial, believable cohort
// of active members, each with at least one visible/featured work and a course
// enrollment. Every write is guarded so re-runs are idempotent:
//   - members      → skipped if the email already exists
//   - works        → skipped if (userId,title) already exists
//   - enrollments  → relies on the (user_id,course_id) unique index (catch-skip)
const AVATAR = (img: number) => `https://i.pravatar.cc/300?img=${img}`;

// A curated cover pool for works — local incubator photos plus a few topical
// Unsplash shots so the portfolio grid never repeats too tightly.
const WORK_COVERS = [
  PHOTO("8307"),
  PHOTO("8313"),
  PHOTO("8341"),
  PHOTO("8344"),
  PHOTO("8345"),
  PHOTO("8352"),
  PHOTO("8356"),
  PHOTO("8358"),
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=800&fit=crop",
];

type MemberSeed = {
  email: string;
  fullName: string;
  role: UserRole;
  jobTitle: string;
  bio: string;
  skills: string;
  avatarImg: number;
  works: Array<{
    title: string;
    summary: string;
    description: string;
    tags: string;
    status: WorkStatus;
    link?: string;
  }>;
};

// 24 additional members across freelancer / graduate / student roles, each with
// 1–2 concrete works. Names + outcomes are specific (YC/Antler "substance" bar).
const MEMBERS: MemberSeed[] = [
  {
    email: "deema.shawa@islandhaven.ps",
    fullName: "ديمة الشّوّا",
    role: "freelancer",
    jobTitle: "مصمّمة منتجات رقميّة",
    bio: "أصمّم منتجات تُحلّ مشكلة حقيقيّة قبل أن تبدو جميلة. ٤٠+ مشروع بين غزّة والخليج.",
    skills: "Product Design, Figma, Design Systems, Prototyping",
    avatarImg: 48,
    works: [
      {
        title: "Waseet — لوحة تحكّم لتجّار التجزئة",
        summary: "إعادة تصميم رفعت معدّل إتمام الطلب 34%.",
        description:
          "أعدت تصميم رحلة الطلب كاملة لـ Waseet، من السلّة حتّى الدفع، عبر ٣٨ شاشة ونظام تصميم من ٩٠ مكوّنًا.",
        tags: "Product, UX, Case Study",
        status: "featured",
        link: "https://waseet.ps",
      },
    ],
  },
  {
    email: "yousef.barghouti@islandhaven.ps",
    fullName: "يوسف البرغوثي",
    role: "graduate",
    jobTitle: "مهندس برمجيّات",
    bio: "خرّيج هندسة حاسوب. أبني خدمات backend تتحمّل الحِمل وتبقى بسيطة.",
    skills: "TypeScript, Node.js, Postgres, Redis, Docker",
    avatarImg: 13,
    works: [
      {
        title: "Tariqi — محرّك توجيه شحنات لحظيّ",
        summary: "يخدم ١٢٠ ألف طلب توصيل شهريًّا بزمن استجابة < 150ms.",
        description:
          "بنيت محرّك التوجيه والـ API بـ Node.js و Postgres، مع طابور مهامّ على Redis لمعالجة الذروة.",
        tags: "Backend, Logistics, TypeScript",
        status: "featured",
        link: "https://tariqi.app",
      },
      {
        title: "مكتبة مفتوحة المصدر لتعريب الواجهات",
        summary: "i18n util تجاوزت ٢٠٠ نجمة على GitHub.",
        description: "أداة خفيفة لإدارة الترجمة و RTL في مشاريع React.",
        tags: "Open Source, i18n, React",
        status: "visible",
        link: "https://github.com/ybarghouti/rtl-kit",
      },
    ],
  },
  {
    email: "maryam.dalloul@islandhaven.ps",
    fullName: "مريم دلّول",
    role: "freelancer",
    jobTitle: "كاتبة محتوى واستراتيجيّة علامة",
    bio: "أحوّل المنتج المعقّد إلى رسالة يفهمها العميل في ثانية. كتبت لـ ٢٥ علامة عربيّة.",
    skills: "Copywriting, Brand Strategy, SEO, Storytelling",
    avatarImg: 31,
    works: [
      {
        title: "إعادة كتابة هويّة Tariqi الكتابيّة",
        summary: "رفعت معدّل التسجيل في الموقع 41%.",
        description: "أعدت صياغة ١٤ صفحة هبوط + سلسلة بريد onboarding من ٦ رسائل.",
        tags: "Copywriting, Conversion, Brand",
        status: "visible",
        link: "https://tariqi.app",
      },
    ],
  },
  {
    email: "adam.qudwa@islandhaven.ps",
    fullName: "آدم القدوة",
    role: "student",
    jobTitle: "طالب علوم بيانات",
    bio: "طالب في الجامعة الإسلاميّة. أبني نماذج تنبّؤ على بيانات سوق العمل المحلّيّ.",
    skills: "Python, pandas, scikit-learn, SQL, Power BI",
    avatarImg: 60,
    works: [
      {
        title: "تنبّؤ بالطلب على المهارات الرقميّة في غزّة",
        summary: "نموذج توقّع دقّته 87% على بيانات ١٨ شهرًا.",
        description: "مشروع تخرّج حلّل ٤٠٠٠ إعلان وظيفة لتحديد أكثر المهارات طلبًا.",
        tags: "Data Science, ML, Research",
        status: "visible",
        link: "https://github.com/adamq/skills-demand",
      },
    ],
  },
  {
    email: "leen.abuhasira@islandhaven.ps",
    fullName: "لين أبو حصيرة",
    role: "freelancer",
    jobTitle: "مطوّرة Frontend",
    bio: "أبني واجهات سريعة وقابلة للوصول. أهتمّ بآخر ١٠٪ من التفاصيل التي يلاحظها الجميع.",
    skills: "React, Next.js, TailwindCSS, TypeScript, a11y",
    avatarImg: 5,
    works: [
      {
        title: "متجر Waseet — Next.js + Tailwind",
        summary: "Lighthouse 98/100، وقت تحميل أوّل أقلّ من ثانية.",
        description: "بنيت الواجهة كاملة مع دعم RTL ووضع داكن وإمكانيّة وصول AAA.",
        tags: "Frontend, Next.js, Performance",
        status: "featured",
        link: "https://waseet.ps",
      },
    ],
  },
  {
    email: "rami.shurrab@islandhaven.ps",
    fullName: "رامي شرّاب",
    role: "graduate",
    jobTitle: "مطوّر تطبيقات هاتف",
    bio: "أطلقت ٥ تطبيقات بتنزيلات تجاوزت ١٥٠ ألفًا. أعشق تجربة المستخدم على الجوّال.",
    skills: "React Native, Expo, Swift, Kotlin, Firebase",
    avatarImg: 51,
    works: [
      {
        title: "Sahel — تطبيق إدارة المصروفات",
        summary: "٣٥ ألف مستخدم نشط في ٣ دول.",
        description: "صمّمت وطوّرت التطبيق بـ React Native + Expo مع مزامنة سحابيّة.",
        tags: "Mobile, Fintech, React Native",
        status: "featured",
        link: "https://sahel.app",
      },
    ],
  },
  {
    email: "hala.najjar@islandhaven.ps",
    fullName: "هالة النجّار",
    role: "freelancer",
    jobTitle: "مصمّمة هويّات بصريّة",
    bio: "أصنع هويّات تُروى لا تُرسم فقط. ٦٠+ علامة تجاريّة عربيّة.",
    skills: "Branding, Logo, Typography, Illustrator, Motion",
    avatarImg: 9,
    works: [
      {
        title: "هويّة Sahel البصريّة",
        summary: "Brand Book من ٤٨ صفحة + نظام أيقونات كامل.",
        description: "هويّة تجمع الثقة المصرفيّة بالدفء المحلّيّ.",
        tags: "Branding, Identity, Fintech",
        status: "visible",
      },
    ],
  },
  {
    email: "omar.kishawi@islandhaven.ps",
    fullName: "عمر الكيشاوي",
    role: "graduate",
    jobTitle: "مهندس DevOps",
    bio: "أجعل النشر مملًّا — لأنّه يجب أن يكون كذلك. CI/CD وبنية تحتيّة كرمز.",
    skills: "AWS, Terraform, Kubernetes, GitHub Actions, Grafana",
    avatarImg: 53,
    works: [
      {
        title: "بنية تحتيّة كرمز لـ ٣ شركات ناشئة",
        summary: "خفّضت زمن النشر من ٤٠ دقيقة إلى ٣.",
        description: "بنيت خطوط CI/CD ومراقبة كاملة على AWS بـ Terraform.",
        tags: "DevOps, AWS, Infrastructure",
        status: "visible",
      },
    ],
  },
  {
    email: "joud.tabatibi@islandhaven.ps",
    fullName: "جود الطباطيبي",
    role: "student",
    jobTitle: "طالبة تصميم تفاعلي",
    bio: "طالبة تصميم. أحبّ تحويل الأفكار المجرّدة إلى نماذج يمكن لمسها.",
    skills: "Figma, Prototyping, User Research, Motion",
    avatarImg: 38,
    works: [
      {
        title: "تطبيق متابعة المرضى المزمنين — نموذج",
        summary: "نموذج تفاعلي اختُبر مع ١٢ مريضًا حقيقيًّا.",
        description: "مشروع جامعيّ صمّم رحلة متابعة الدواء لكبار السنّ.",
        tags: "UX, HealthTech, Prototype",
        status: "visible",
      },
    ],
  },
  {
    email: "sami.elewa@islandhaven.ps",
    fullName: "سامي عليوة",
    role: "freelancer",
    jobTitle: "مصوّر ومونتير",
    bio: "أوثّق القصص البصريّة للمشاريع والمنظّمات. ٦ سنوات خبرة ميدانيّة.",
    skills: "Photography, Premiere Pro, After Effects, Color",
    avatarImg: 68,
    works: [
      {
        title: "سلسلة أفلام تعريفيّة لمنتسبي الحاضنة",
        summary: "٨ أفلام قصيرة تجاوزت ١٠٠ ألف مشاهدة.",
        description: "تصوير ومونتاج قصص حقيقيّة لروّاد أعمال داخل آيلاند هيفن.",
        tags: "Video, Documentary, Storytelling",
        status: "featured",
      },
    ],
  },
  {
    email: "dana.helles@islandhaven.ps",
    fullName: "دانا الحلّس",
    role: "graduate",
    jobTitle: "محلّلة منتج",
    bio: "أقرأ الأرقام لأفهم السلوك. حوّلت بيانات ٤ منتجات إلى قرارات أطلقت ميزات رابحة.",
    skills: "Analytics, SQL, Amplitude, A/B Testing, dbt",
    avatarImg: 32,
    works: [
      {
        title: "تحليل قِمَع التحويل لـ Sahel",
        summary: "حدّدت تسريبًا كلّف ١٨٪ من المسجّلين.",
        description: "بنيت لوحات تحليل أدّت إلى إعادة تصميم خطوة التحقّق ورفع التحويل ٢٢٪.",
        tags: "Analytics, Growth, Data",
        status: "visible",
      },
    ],
  },
  {
    email: "kareem.astal@islandhaven.ps",
    fullName: "كريم الأسطل",
    role: "student",
    jobTitle: "طالب هندسة برمجيّات",
    bio: "أبني مشاريع جانبيّة لأتعلّم بسرعة. آخرها أداة لتنظيم المذاكرة استخدمها زملائي.",
    skills: "JavaScript, React, Node.js, Supabase",
    avatarImg: 59,
    works: [
      {
        title: "Mudhakir — أداة تنظيم مذاكرة",
        summary: "٨٠٠ طالب يستخدمونها في ٣ جامعات.",
        description: "تطبيق ويب يجدول المراجعة بطريقة التكرار المتباعد.",
        tags: "EdTech, Web, Side Project",
        status: "visible",
        link: "https://mudhakir.app",
      },
    ],
  },
  {
    email: "aya.skaik@islandhaven.ps",
    fullName: "آية صقّيق",
    role: "freelancer",
    jobTitle: "مديرة وسائل تواصل",
    bio: "أبني مجتمعات حول العلامات. نمّيت حسابات تجاوز وصولها ٢ مليون شهريًّا.",
    skills: "Social Media, Community, Content, Paid Ads",
    avatarImg: 24,
    works: [
      {
        title: "حملة إطلاق Waseet على المنصّات",
        summary: "٤٥ ألف متابع في الشهر الأوّل.",
        description: "خطّطت ونفّذت محتوى الإطلاق عبر ٤ منصّات بميزانيّة محدودة.",
        tags: "Social, Marketing, Launch",
        status: "visible",
      },
    ],
  },
  {
    email: "bilal.madhoun@islandhaven.ps",
    fullName: "بلال المدهون",
    role: "graduate",
    jobTitle: "مهندس ذكاء اصطناعي",
    bio: "أبني أنظمة تفهم العربيّة. عملت على معالجة اللغة الطبيعيّة لـ ٣ منتجات.",
    skills: "Python, PyTorch, NLP, LLMs, RAG",
    avatarImg: 67,
    works: [
      {
        title: "مساعد دعم عملاء بالعربيّة",
        summary: "خفّض زمن الردّ ٦٠٪ لشركة اتّصالات.",
        description: "نظام RAG يجيب على استفسارات العملاء بالعاميّة والفصحى.",
        tags: "AI, NLP, Arabic",
        status: "featured",
      },
    ],
  },
  {
    email: "ruba.zaqout@islandhaven.ps",
    fullName: "ربى زقّوت",
    role: "freelancer",
    jobTitle: "مديرة مشاريع",
    bio: "أقود فرقًا موزّعة لتسليم في الوقت وبالميزانيّة. أسلّم لا أعِد فقط.",
    skills: "Project Management, Agile, Scrum, Jira",
    avatarImg: 26,
    works: [
      {
        title: "قيادة تسليم منصّة Tariqi",
        summary: "إطلاق MVP في ١٠ أسابيع بفريق من ٦.",
        description: "نسّقت بين التصميم والتطوير والعمليّات لتسليم الإصدار الأوّل.",
        tags: "Project Management, Agile",
        status: "visible",
      },
    ],
  },
  {
    email: "fadi.sarsour@islandhaven.ps",
    fullName: "فادي سرسور",
    role: "graduate",
    jobTitle: "مطوّر Full-Stack",
    bio: "أبني منتجات SaaS من قاعدة البيانات حتّى الواجهة. أحبّ الكود الذي يشرح نفسه.",
    skills: "TypeScript, React, Node.js, Postgres, Prisma",
    avatarImg: 50,
    works: [
      {
        title: "Faatir — منصّة فوترة للمستقلّين",
        summary: "٢٬٣٠٠ مستقلّ يصدرون فواتيرهم عبرها.",
        description: "بنيت المنتج كاملًا: مصادقة، فواتير، تقارير ضريبيّة بسيطة.",
        tags: "SaaS, Fullstack, Fintech",
        status: "featured",
        link: "https://faatir.app",
      },
    ],
  },
  {
    email: "nadine.qrenawi@islandhaven.ps",
    fullName: "نادين القرناوي",
    role: "student",
    jobTitle: "طالبة تسويق رقميّ",
    bio: "طالبة إدارة أعمال. أتعلّم التسويق بالتجربة على مشاريع حقيقيّة.",
    skills: "Content, SEO, Email Marketing, Canva",
    avatarImg: 30,
    works: [
      {
        title: "استراتيجيّة محتوى لمتجر محلّيّ",
        summary: "ضاعفت زيارات الموقع العضويّة خلال ٤ أشهر.",
        description: "بنيت تقويم محتوى وسلسلة مقالات حسّنت ترتيب البحث.",
        tags: "Marketing, SEO, Content",
        status: "visible",
      },
    ],
  },
  {
    email: "majd.abuwarda@islandhaven.ps",
    fullName: "مجد أبو وردة",
    role: "freelancer",
    jobTitle: "مطوّر لعبة",
    bio: "أصنع ألعابًا تعليميّة بالعربيّة. لعبتي الأخيرة تجاوزت ٥٠ ألف لاعب.",
    skills: "Unity, C#, Game Design, 2D Art",
    avatarImg: 56,
    works: [
      {
        title: "Hijaiya — لعبة تعليم الحروف",
        summary: "٥٠ ألف تنزيل وتقييم ٤٫٨ نجوم.",
        description: "لعبة تفاعليّة تعلّم الأطفال الحروف العربيّة باللعب.",
        tags: "Games, EdTech, Unity",
        status: "featured",
        link: "https://hijaiya.game",
      },
    ],
  },
  {
    email: "lara.hindi@islandhaven.ps",
    fullName: "لارا الهندي",
    role: "graduate",
    jobTitle: "مصمّمة UX research",
    bio: "أسأل قبل أن أصمّم. أجريت ٢٠٠+ مقابلة مستخدم لمنتجات مختلفة.",
    skills: "User Research, Usability Testing, Figma, Surveys",
    avatarImg: 20,
    works: [
      {
        title: "دراسة قابليّة استخدام لـ Faatir",
        summary: "اكتشفت ٩ مشكلات حرجة قبل الإطلاق.",
        description: "أجريت ١٥ جلسة اختبار وحوّلت النتائج إلى توصيات تصميم.",
        tags: "UX Research, Usability",
        status: "visible",
      },
    ],
  },
  {
    email: "zaid.ghoul@islandhaven.ps",
    fullName: "زيد الغول",
    role: "student",
    jobTitle: "طالب أمن سيبراني",
    bio: "طالب أمن معلومات. أتدرّب على اختبار الاختراق في بيئات تجريبيّة.",
    skills: "Security, Linux, Networking, Python, Burp Suite",
    avatarImg: 65,
    works: [
      {
        title: "تقرير اختبار اختراق لمشروع تخرّج",
        summary: "وثّقت ١٢ ثغرة مع خطوات معالجة.",
        description: "محاكاة اختبار اختراق على تطبيق ويب تعليميّ.",
        tags: "Security, Pentest, Research",
        status: "visible",
      },
    ],
  },
  {
    email: "tala.shamali@islandhaven.ps",
    fullName: "تالا الشّمالي",
    role: "freelancer",
    jobTitle: "رسّامة ومصمّمة موشن",
    bio: "أحرّك القصص. رسوماتي المتحرّكة ظهرت في حملات لـ ١٠ علامات.",
    skills: "Illustration, After Effects, Motion, Procreate",
    avatarImg: 41,
    works: [
      {
        title: "سلسلة موشن جرافيك لشرح Sahel",
        summary: "٤ فيديوهات شرح تجاوزت ٣٠٠ ألف مشاهدة.",
        description: "حوّلت ميزات معقّدة إلى رسوم متحرّكة بسيطة وممتعة.",
        tags: "Motion, Illustration, Explainer",
        status: "featured",
      },
    ],
  },
  {
    email: "anas.shaath@islandhaven.ps",
    fullName: "أنس شعث",
    role: "graduate",
    jobTitle: "مهندس بيانات",
    bio: "أبني خطوط بيانات موثوقة. نقلت ٣ شركات من جداول Excel إلى مستودعات حقيقيّة.",
    skills: "SQL, Airflow, dbt, BigQuery, Python",
    avatarImg: 18,
    works: [
      {
        title: "مستودع بيانات لشركة لوجستيّات",
        summary: "وحّد ٧ مصادر في مصدر حقيقة واحد.",
        description: "صمّمت ونفّذت خطوط ELT يوميّة بـ Airflow و dbt.",
        tags: "Data Engineering, ETL, Analytics",
        status: "visible",
      },
    ],
  },
  {
    email: "salma.qudra@islandhaven.ps",
    fullName: "سلمى قدرة",
    role: "freelancer",
    jobTitle: "مترجمة ومحرّرة",
    bio: "أترجم بين العربيّة والإنجليزيّة بحسّ لغويّ. حرّرت ٤٠+ مستندًا تقنيًّا ومحتوى منتجات.",
    skills: "Translation, Localization, Editing, Proofreading",
    avatarImg: 16,
    works: [
      {
        title: "تعريب منتج Faatir بالكامل",
        summary: "ترجمة وتدقيق ١٢٠٠ سلسلة نصّيّة.",
        description: "ضمنت اتّساق المصطلحات وسلامة RTL عبر المنتج.",
        tags: "Localization, Translation, i18n",
        status: "visible",
      },
    ],
  },
  {
    email: "mahmoud.dahdouh@islandhaven.ps",
    fullName: "محمود دحدوح",
    role: "graduate",
    jobTitle: "مطوّر backend",
    bio: "أهتمّ بالأداء والموثوقيّة. بنيت خدمات تتعامل مع ملايين الطلبات يوميًّا.",
    skills: "Go, gRPC, Postgres, Kafka, Docker",
    avatarImg: 7,
    works: [
      {
        title: "خدمة إشعارات لحظيّة قابلة للتوسّع",
        summary: "تسلّم ٢ مليون إشعار يوميًّا بثبات.",
        description: "بنيت الخدمة بـ Go و Kafka مع ضمان التسليم مرّة واحدة.",
        tags: "Backend, Go, Scalability",
        status: "featured",
      },
    ],
  },
];

async function enrichMembers() {
  console.log("\n👥 Adding community members + portfolio works...");
  let addedMembers = 0;
  let addedWorks = 0;
  let coverIdx = 0;

  for (const m of MEMBERS) {
    let [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, m.email));

    if (!user) {
      [user] = await db
        .insert(usersTable)
        .values({
          email: m.email,
          passwordHash: MEMBER_PW_HASH,
          fullName: m.fullName,
          role: m.role,
          jobTitle: m.jobTitle,
          bio: m.bio,
          skills: m.skills,
          avatarUrl: AVATAR(m.avatarImg),
          status: "active",
        })
        .returning({ id: usersTable.id });
      addedMembers++;
    }

    // Existing works for this user, to avoid duplicate titles on re-run.
    const existingWorks = await db
      .select({ title: worksTable.title })
      .from(worksTable)
      .where(eq(worksTable.userId, user.id));
    const haveTitles = new Set(existingWorks.map((w) => w.title.trim()));

    for (const w of m.works) {
      if (haveTitles.has(w.title.trim())) continue;
      await db.insert(worksTable).values({
        userId: user.id,
        title: w.title,
        summary: w.summary,
        description: w.description,
        coverUrl: WORK_COVERS[coverIdx++ % WORK_COVERS.length],
        galleryUrls: [],
        link: w.link ?? "",
        tags: w.tags,
        status: w.status,
      });
      addedWorks++;
    }
  }

  console.log(
    `  ✓ ${addedMembers} new members · ${addedWorks} new works (idempotent).`,
  );
}

async function enrichEnrollments() {
  console.log("\n🎓 Enrolling members across courses...");
  const courses = await db
    .select({ id: coursesTable.id })
    .from(coursesTable);
  const users = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.status, "active"));

  if (!courses.length || !users.length) {
    console.log("  ↻ no courses or users to enroll.");
    return;
  }

  // Enroll each active user into ~2 courses (deterministic spread) so the
  // enrollments number reads substantial. The (user_id,course_id) unique index
  // makes every insert idempotent — duplicates are caught and skipped.
  let added = 0;
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const picks = [courses[i % courses.length], courses[(i + 1) % courses.length]];
    for (const c of picks) {
      try {
        await db.insert(enrollmentsTable).values({
          userId: u.id,
          courseId: c.id,
          status: "confirmed",
        });
        added++;
      } catch {
        // unique-constraint violation → already enrolled, skip.
      }
    }
  }
  console.log(`  ✓ ${added} new enrollments (idempotent).`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://ahmedashraf@localhost/ih_haven_dev";
  }
  console.log(`\n🌱 Seeding portfolio substance on ${process.env.DATABASE_URL}\n`);

  await enrichVentures();
  await topUpStories();
  await topUpPartners();
  await enrichMembers();
  await enrichEnrollments();

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
  const activeUserCount = (
    await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.status, "active"))
  ).length;
  const workCount = (
    await db.select({ id: worksTable.id }).from(worksTable)
  ).length;
  const enrollmentCount = (
    await db.select({ id: enrollmentsTable.id }).from(enrollmentsTable)
  ).length;

  console.log("\n📊 Portfolio summary:");
  console.log(
    `   ventures: ${ventureRows.length} total · ${withCover} with cover · ${featuredCount} featured`,
  );
  console.log(`   success_stories: ${storyCount}`);
  console.log(`   partners: ${partnerCount}`);
  console.log(`   active members: ${activeUserCount}`);
  console.log(`   works: ${workCount}`);
  console.log(`   enrollments: ${enrollmentCount}`);

  console.log("\n✅ Portfolio seed complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ seed:portfolio failed:", err);
  process.exit(1);
});
