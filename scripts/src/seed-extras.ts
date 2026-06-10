/**
 * Top-up seed: adds regular members + portfolio works on top of seed-incubator.
 * Run AFTER seed-incubator.mjs so the incubator data stays untouched.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... pnpm --filter @workspace/scripts run seed:extras
 */
import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  worksTable,
  dailyPostsTable,
  bookingsTable,
  enrollmentsTable,
  coursesTable,
  pool,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const pwHash = bcrypt.hashSync(
  process.env.SEED_USER_PASSWORD || "change-me-local",
  10,
);

const MEMBERS = [
  {
    email: "lina.farahat@example.ps",
    fullName: "لينا فرحات",
    role: "freelancer" as const,
    jobTitle: "مصمّمة منتجات رقميّة",
    bio: "أصمّم تجارب رقميّة تُحترم وقت المستخدم — صمّمت لِـ ٣٠ شركة ناشئة بين غزّة ودبي.",
    skills: "UI/UX, Figma, Design Systems, Webflow",
    portfolioUrl: "https://lina.design",
    linkedinUrl: "https://linkedin.com/in/lina-design",
    behanceUrl: "https://behance.net/lina",
    avatarUrl: "https://i.pravatar.cc/300?img=47",
  },
  {
    email: "amir.mansour@example.ps",
    fullName: "أمير منصور",
    role: "graduate" as const,
    jobTitle: "مطوّر Full-Stack",
    bio: "خرّيج هندسة برمجيّات. أبني منتجات SaaS بـ TypeScript و Postgres. شغوف بكتابة كود نظيف.",
    skills: "TypeScript, React, Node.js, Postgres, AWS",
    portfolioUrl: "https://amir.dev",
    linkedinUrl: "https://linkedin.com/in/amir-m",
    githubUrl: "https://github.com/amirm",
    avatarUrl: "https://i.pravatar.cc/300?img=12",
  },
  {
    email: "salma.nashar@example.ps",
    fullName: "سلمى الناشِر",
    role: "freelancer" as const,
    jobTitle: "كاتبة محتوى رقميّ",
    bio: "أكتب لعلامات تجاريّة في الخليج — أؤمن بأنّ الكلمة الواحدة تُغيّر قرار الشّراء.",
    skills: "Content Strategy, Copywriting, Brand Voice, SEO",
    portfolioUrl: "https://salma.ink",
    linkedinUrl: "https://linkedin.com/in/salma-n",
    avatarUrl: "https://i.pravatar.cc/300?img=49",
  },
  {
    email: "hamza.abusalama@example.ps",
    fullName: "حمزة أبو سلامة",
    role: "student" as const,
    jobTitle: "طالب ذكاء اصطناعي",
    bio: "طالب ماجستير AI في الجامعة الإسلاميّة. أبني نماذج لمعالجة اللغة العربيّة.",
    skills: "Python, PyTorch, NLP, Arabic NLP, Transformers",
    linkedinUrl: "https://linkedin.com/in/hamza-as",
    githubUrl: "https://github.com/hamzaas",
    avatarUrl: "https://i.pravatar.cc/300?img=33",
  },
  {
    email: "noor.farra@example.ps",
    fullName: "نور الفرّا",
    role: "freelancer" as const,
    jobTitle: "مديرة منتج",
    bio: "أقود فرق منتج موزّعة. ٦ سنوات في إطلاق SaaS من الصفر إلى أوّل ١٠٠٠ مستخدم.",
    skills: "Product Strategy, Discovery, Analytics, OKRs",
    portfolioUrl: "https://noor.product",
    linkedinUrl: "https://linkedin.com/in/noor-product",
    avatarUrl: "https://i.pravatar.cc/300?img=44",
  },
  {
    email: "mohammed.shaban@example.ps",
    fullName: "محمّد شعبان",
    role: "graduate" as const,
    jobTitle: "مطوّر تطبيقات هاتف",
    bio: "صمّمت وطوّرت ٧ تطبيقات على iOS و Android. تنزيلات تجاوزت ٢٠٠ ألف.",
    skills: "Swift, Kotlin, React Native, Expo, Firebase",
    portfolioUrl: "https://msha3ban.app",
    linkedinUrl: "https://linkedin.com/in/msha3ban",
    githubUrl: "https://github.com/msha3ban",
    avatarUrl: "https://i.pravatar.cc/300?img=11",
  },
  {
    email: "rana.tayeh@example.ps",
    fullName: "رنا التايه",
    role: "freelancer" as const,
    jobTitle: "محلّلة بيانات",
    bio: "أحوّل البيانات إلى قرارات. عملت مع ٣ منظّمات دوليّة لبناء dashboards حيّة.",
    skills: "SQL, Python, Looker, Tableau, dbt",
    linkedinUrl: "https://linkedin.com/in/rana-data",
    githubUrl: "https://github.com/ranat",
    avatarUrl: "https://i.pravatar.cc/300?img=45",
  },
  {
    email: "khaled.naser@example.ps",
    fullName: "خالد أبو ناصر",
    role: "freelancer" as const,
    jobTitle: "مصمّم هويّات بصريّة",
    bio: "أبني هويّات تُحكى — لا تُصمَّم فقط. عملت مع ٥٠+ علامة تجاريّة عربيّة.",
    skills: "Branding, Logo, Typography, Illustrator, Motion",
    portfolioUrl: "https://khaled.studio",
    linkedinUrl: "https://linkedin.com/in/khaledn",
    behanceUrl: "https://behance.net/khaledn",
    avatarUrl: "https://i.pravatar.cc/300?img=15",
  },
  {
    email: "yara.atallah@example.ps",
    fullName: "يارا عطا الله",
    role: "graduate" as const,
    jobTitle: "مطوّرة Frontend",
    bio: "خرّيجة علوم حاسوب. أبني واجهات سريعة وقابلة للوصول بـ React و Next.js.",
    skills: "React, Next.js, TailwindCSS, Accessibility",
    portfolioUrl: "https://yara.codes",
    linkedinUrl: "https://linkedin.com/in/yara-codes",
    githubUrl: "https://github.com/yara-codes",
    avatarUrl: "https://i.pravatar.cc/300?img=43",
  },
  {
    email: "tariq.helo@example.ps",
    fullName: "طارق حلّو",
    role: "freelancer" as const,
    jobTitle: "مصوّر ومونتير",
    bio: "أصوّر وأرَكِّب قصصًا بصريّة. ٥ سنوات خبرة في توثيق مشاريع إغاثة وأعمال.",
    skills: "Photography, Premiere Pro, After Effects, Color Grading",
    portfolioUrl: "https://tariq.media",
    linkedinUrl: "https://linkedin.com/in/tariq-h",
    avatarUrl: "https://i.pravatar.cc/300?img=14",
  },
];

const WORKS_BY_EMAIL: Record<
  string,
  Array<{
    title: string;
    summary: string;
    description: string;
    coverUrl: string;
    galleryUrls: string[];
    link?: string;
    tags: string;
    status: "visible" | "featured";
  }>
> = {
  "lina.farahat@example.ps": [
    {
      title: "Najma — تطبيق إدارة الفعاليّات",
      summary: "تجربة مستخدم كاملة لمنصّة فعاليّات في 6 دول عربيّة.",
      description:
        "صمّمت ٣٢ شاشة، نظام تصميم من ٨٠ component، وأُطلِق التطبيق بـ ٤,٠٠٠ تنزيل في الأسبوع الأوّل.",
      coverUrl:
        "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=800&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=1200&h=800&fit=crop",
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=800&fit=crop",
      ],
      link: "https://najma.app",
      tags: "UI Design, Product, Case Study",
      status: "featured",
    },
    {
      title: "نظام تصميم Tasnif",
      summary: "design system مكوّن من 120 component مع توثيق كامل.",
      description: "ساعدت فريق Tasnif على توحيد منتجاتهم الـ ٧ تحت لغة تصميم واحدة.",
      coverUrl:
        "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=1200&h=800&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=800&fit=crop",
      ],
      tags: "Design System, Documentation",
      status: "visible",
    },
  ],
  "amir.mansour@example.ps": [
    {
      title: "Sahla — منصّة دفع فواتير لكبار السن",
      summary: "Backend بـ Go و Postgres يخدم 80,000 مستخدم نشط.",
      description:
        "بنيت البنية التحتيّة كاملة: API بـ Go، DB على Supabase، تكامل مع ٤ مزوّدي خدمات. زمن استجابة < 200ms.",
      coverUrl:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=800&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=800&fit=crop",
      ],
      link: "https://sahla.ps",
      tags: "Backend, Go, Fintech",
      status: "featured",
    },
  ],
  "salma.nashar@example.ps": [
    {
      title: "إعادة كتابة موقع Tasnif بالكامل",
      summary: "زيادة تحويل 38% بعد إعادة الكتابة.",
      description: "أعدت كتابة ١٢ صفحة هبوط + سلسلة إيميلات onboarding.",
      coverUrl:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&h=800&fit=crop",
      galleryUrls: [],
      link: "https://tasnif.com",
      tags: "Copywriting, Conversion",
      status: "visible",
    },
  ],
  "hamza.abusalama@example.ps": [
    {
      title: "araSum — نموذج تلخيص نصوص عربيّة",
      summary: "Fine-tuned model based on AraBERT. ROUGE-1 = 41.",
      description: "بحث جامعيّ نُشر في NeurIPS Workshop 2025.",
      coverUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=800&fit=crop",
      ],
      link: "https://github.com/hamzaas/araSum",
      tags: "AI, NLP, Research",
      status: "featured",
    },
  ],
  "noor.farra@example.ps": [
    {
      title: "Pulse — إطلاق SaaS من الصفر إلى 1,200 مستخدم",
      summary: "من فكرة إلى MRR قدره 8,000$ في 9 أسابيع.",
      description: "قدت الإطلاق، التسعير، content marketing، الشراكات.",
      coverUrl:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop",
      ],
      link: "https://usepulse.app",
      tags: "Product, Growth, SaaS",
      status: "featured",
    },
  ],
  "mohammed.shaban@example.ps": [
    {
      title: "MazadX — تطبيق مزادات لحظيّة",
      summary: "12,000 مستخدم نشط، 3 دول.",
      description: "صمّمت وطوّرت تطبيق iOS و Android بـ React Native + Expo.",
      coverUrl:
        "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&h=800&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=800&fit=crop",
      ],
      link: "https://mazadx.com",
      tags: "Mobile, React Native, Marketplace",
      status: "featured",
    },
    {
      title: "تطبيق Mishwar — مساعد السفر الذكيّ",
      summary: "iOS app بـ 50,000 تنزيل في 6 أشهر.",
      description: "تطبيق يخطّط رحلتك بناءً على ميزانيّتك واهتماماتك.",
      coverUrl:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop",
      galleryUrls: [],
      link: "https://mishwar.app",
      tags: "iOS, Travel, AI",
      status: "visible",
    },
  ],
  "rana.tayeh@example.ps": [
    {
      title: "Dashboard لمؤشّرات منظّمات إنسانيّة",
      summary: "بناء 14 dashboard لـ UNRWA + ICRC.",
      description: "تستخدمها فِرَق العمليّات لقرارات يوميّة. دمج بيانات من ٨ مصادر.",
      coverUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop",
      ],
      tags: "Data, Analytics, Dashboards",
      status: "visible",
    },
  ],
  "khaled.naser@example.ps": [
    {
      title: "هويّة بصريّة لـ Mishwar",
      summary: "علامة كاملة: logo + colors + typography + Brand Book.",
      description: "٥٢ صفحة Brand Book يستخدمها الفريق في كلّ مادّة.",
      coverUrl:
        "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=800&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=1200&h=800&fit=crop",
        "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&h=800&fit=crop",
      ],
      link: "https://mishwar.app",
      tags: "Branding, Identity",
      status: "featured",
    },
    {
      title: "هويّة بصريّة لـ Sahla",
      summary: "logo + visual language لمنصّة فلسطينيّة.",
      description: "هويّة تحاكي البساطة والثقة المطلوبة للمنتج المصرفيّ.",
      coverUrl:
        "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&h=800&fit=crop",
      galleryUrls: [],
      tags: "Branding, Fintech",
      status: "visible",
    },
  ],
  "yara.atallah@example.ps": [
    {
      title: "موقع Najma — Next.js + Tailwind",
      summary: "Lighthouse score: 99/100 على كلّ المعايير.",
      description: "بنيت الموقع كاملًا في 3 أسابيع. أداء ممتاز، accessibility AAA.",
      coverUrl:
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=800&fit=crop",
      galleryUrls: [],
      link: "https://najma.app",
      tags: "Frontend, Next.js, Performance",
      status: "visible",
    },
  ],
  "tariq.helo@example.ps": [
    {
      title: "توثيق فيلميّ — يوم في آيلاند هيفن",
      summary: "فيلم وثائقيّ قصير عن المساحة وروّادها.",
      description: "تصوير ومونتاج ٧ دقائق تحكي قصّة منتسبين حقيقيّين.",
      coverUrl:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop",
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=800&fit=crop",
      ],
      tags: "Video, Documentary",
      status: "featured",
    },
  ],
};

async function addMembers() {
  console.log("👥 Adding members...");
  for (const m of MEMBERS) {
    const exists = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, m.email));
    if (exists.length) {
      console.log(`  ↻ ${m.fullName} already exists`);
      continue;
    }
    await db.insert(usersTable).values({
      ...m,
      passwordHash: pwHash,
      status: "active",
    });
    console.log(`  ✓ ${m.fullName}`);
  }
}

async function addWorks() {
  console.log("\n🎨 Adding portfolio works...");
  let total = 0;
  for (const [email, works] of Object.entries(WORKS_BY_EMAIL)) {
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (!user) {
      console.log(`  ✗ user not found: ${email}`);
      continue;
    }
    for (const w of works) {
      await db.insert(worksTable).values({
        userId: user.id,
        title: w.title,
        summary: w.summary,
        description: w.description,
        coverUrl: w.coverUrl,
        galleryUrls: w.galleryUrls,
        link: w.link ?? "",
        tags: w.tags,
        status: w.status,
      });
      total++;
      console.log(`  ✓ ${w.title}`);
    }
  }
  console.log(`  → ${total} works added`);
}

async function addMoreDaily() {
  console.log("\n📰 Adding extra daily posts...");
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const posts = [
    {
      type: "news" as const,
      title: "تخريج دفعة جديدة من ورشة بناء MVP",
      body:
        "احتفلنا بتخريج ١٧ مشاركًا من ورشة \"من الفكرة إلى النموذج الأوّليّ\". خرج ٤ مشاريع جاهزة للاختبار مع مستخدمين حقيقيّين، وستلتحق ٢ منها بمسار الاحتضان.",
      coverUrl:
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=600&fit=crop",
      publishedAt: new Date(now - 1 * day),
    },
    {
      type: "story" as const,
      title: "قصّة: لينا تصمّم Najma وتصل لـ 4,000 تنزيل في أسبوع",
      body:
        "لينا فرحات، إحدى منتسبات الحاضنة، صمّمت تطبيق Najma لإدارة الفعاليّات. بعد ٣ أشهر من العمل داخل آيلاند هيفن، أُطلق التطبيق وحقّق ٤,٠٠٠ تنزيل في الأسبوع الأوّل.",
      coverUrl:
        "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=600&fit=crop",
      publishedAt: new Date(now - 4 * day),
    },
    {
      type: "tip" as const,
      title: "نصيحة الأسبوع: اكتب رسالة قيمة قبل أيّ سطر كود",
      body:
        "قبل أن تكتب أيّ سطر كود، اكتب الرسالة (Value Proposition) في جملة واحدة. إذا لم تستطع شرحها لجدّتك في 30 ثانية، فالفكرة لم تنضج بعد.",
      coverUrl:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop",
      publishedAt: new Date(now - 7 * day),
    },
    {
      type: "quote" as const,
      title: "اقتباس: \"المنتج الجيّد يبدأ من ألمٍ حقيقيّ\"",
      body:
        "— من دفتر إرشاد د. ليان أبو سمرة\n\nأكثر المشاريع نجاحًا هي التي بدأت من ألم شخصيّ عاشه المؤسّس. اسأل نفسك: ما الألم الذي أنا أوّل من يفهمه؟",
      publishedAt: new Date(now - 10 * day),
    },
    {
      type: "news" as const,
      title: "آيلاند هيفن تستضيف جلسة Demo Day لـ 6 مشاريع",
      body:
        "في الأسبوع الماضي عرضت ٦ فرق من خرّيجي دفعة الاحتضان منتجاتها أمام ١٢ مستثمرًا وشريكًا. ٣ من الفرق دخلت في محادثات تمويل مباشرة.",
      coverUrl:
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=600&fit=crop",
      publishedAt: new Date(now - 14 * day),
    },
    {
      type: "tip" as const,
      title: "نصيحة: تحدّث مع ١٠ مستخدمين قبل أن تبني ميزة جديدة",
      body:
        "كلّ ميزة لم تُختبر مع مستخدمين حقيقيّين هي تخمين. خصّص أسبوعًا لـ ١٠ مكالمات قبل أن تبدأ التطوير.",
      coverUrl:
        "https://images.unsplash.com/photo-1573164713619-24c711fe7878?w=1200&h=600&fit=crop",
      publishedAt: new Date(now - 18 * day),
    },
  ];
  await db.insert(dailyPostsTable).values(posts);
  console.log(`  → ${posts.length} daily posts added`);
}

async function addBookings() {
  console.log("\n📅 Adding course enrollments...");
  const courses = await db.select({ id: coursesTable.id }).from(coursesTable);
  const users = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.status, "active"));

  if (!courses.length || !users.length) return;
  let total = 0;
  for (const c of courses) {
    const sample = users.slice(0, Math.min(5, users.length));
    for (const u of sample) {
      try {
        await db.insert(enrollmentsTable).values({
          courseId: c.id,
          userId: u.id,
          status: "confirmed",
        });
        total++;
      } catch {
        // duplicate constraint — skip
      }
    }
  }
  console.log(`  → ${total} enrollments added`);
  void bookingsTable;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      "postgresql://ahmedashraf@localhost/ih_haven_dev";
  }
  console.log(`🌱 Top-up seed on ${process.env.DATABASE_URL}\n`);

  await addMembers();
  await addWorks();
  await addMoreDaily();
  await addBookings();

  console.log("\n✅ Extras seed complete.");
  console.log(
    "Members login: use the password from SEED_USER_PASSWORD (local env).",
  );

  await pool.end();
}

main().catch((err) => {
  console.error("❌ seed:extras failed:", err);
  process.exit(1);
});
