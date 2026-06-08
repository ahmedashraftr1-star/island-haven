/**
 * Seeds the local dev database with rich, professional Arabic content
 * for Island Haven (آيلاند هيفن) — a Gaza-based incubator.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... pnpm --filter @workspace/scripts run seed
 */
import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  worksTable,
  dailyPostsTable,
  coursesTable,
  applicationsTable,
  siteSettingsTable,
  expertProfilesTable,
  programsTable,
  programApplicationsTable,
  venturesTable,
  partnersTable,
  successStoriesTable,
  mentorshipSessionsTable,
  pool,
} from "@workspace/db";
import { sql } from "drizzle-orm";

async function clear() {
  console.log("🧹 Clearing existing data...");
  await db.execute(sql`TRUNCATE
    mentorship_sessions,
    program_applications,
    programs,
    success_stories,
    partners,
    ventures,
    expert_profiles,
    works,
    daily_posts,
    courses,
    applications,
    site_settings,
    users
    RESTART IDENTITY CASCADE`);
}

async function seedUsers() {
  console.log("👥 Seeding users...");
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const members = [
    {
      email: "lina@island-haven.test",
      fullName: "لينا أبو شريف",
      role: "freelancer" as const,
      jobTitle: "مصمّمة منتجات رقميّة",
      bio: "صمّمت تجارب لأكثر من 30 شركة ناشئة في المنطقة. شغفي بناء واجهات تحترم وقت المستخدم وتُحدث أثرًا قابلًا للقياس.",
      skills: "UI Design, UX Research, Figma, Webflow, Design Systems",
      phone: "+970 599 100 200",
      portfolioUrl: "https://lina.design",
      linkedinUrl: "https://linkedin.com/in/lina-ash",
      behanceUrl: "https://behance.net/lina",
      githubUrl: "",
      avatarUrl: "https://i.pravatar.cc/300?img=47",
    },
    {
      email: "yousef@island-haven.test",
      fullName: "يوسف القاضي",
      role: "graduate" as const,
      jobTitle: "مهندس برمجيّات Full-Stack",
      bio: "خرّيج هندسة حاسوب من الجامعة الإسلاميّة. أبني تطبيقات ويب وأنظمة سحابيّة بـ TypeScript و Go و PostgreSQL.",
      skills: "TypeScript, React, Node.js, Go, PostgreSQL, AWS",
      phone: "+970 599 211 311",
      portfolioUrl: "https://yousef.dev",
      linkedinUrl: "https://linkedin.com/in/yousef-q",
      githubUrl: "https://github.com/yousefq",
      behanceUrl: "",
      avatarUrl: "https://i.pravatar.cc/300?img=12",
    },
    {
      email: "salma@island-haven.test",
      fullName: "سلمى عاشور",
      role: "freelancer" as const,
      jobTitle: "كاتبة محتوى وصانعة قصص",
      bio: "أكتب لعلامات تجاريّة في الخليج وأوروبا. أؤمن أن الكلمة الواحدة تُعيد تشكيل قرارات الشّراء.",
      skills: "Content Strategy, Copywriting, Brand Voice, SEO",
      phone: "+970 599 322 410",
      portfolioUrl: "https://salma.ink",
      linkedinUrl: "https://linkedin.com/in/salma-ashour",
      behanceUrl: "",
      githubUrl: "",
      avatarUrl: "https://i.pravatar.cc/300?img=49",
    },
    {
      email: "ahmad@island-haven.test",
      fullName: "أحمد المصري",
      role: "student" as const,
      jobTitle: "طالب ذكاء اصطناعيّ",
      bio: "طالب ماجستير، أبني نماذج لمعالجة اللّغة العربيّة. شاركت في 3 مسابقات Kaggle.",
      skills: "Python, PyTorch, NLP, Arabic NLP, Data Engineering",
      phone: "+970 599 432 514",
      portfolioUrl: "",
      linkedinUrl: "https://linkedin.com/in/ahmad-m",
      githubUrl: "https://github.com/ahmadm",
      behanceUrl: "",
      avatarUrl: "https://i.pravatar.cc/300?img=33",
    },
    {
      email: "noor@island-haven.test",
      fullName: "نور الفرّا",
      role: "freelancer" as const,
      jobTitle: "مديرة منتج",
      bio: "أعمل مع فرق موزّعة بين دبي وبرلين. خبرة 6 سنوات في إطلاق منتجات SaaS من الصفر إلى أوّل 1000 مستخدم.",
      skills: "Product Strategy, Discovery, Roadmaps, Analytics, OKRs",
      phone: "+970 599 555 100",
      portfolioUrl: "https://noor.product",
      linkedinUrl: "https://linkedin.com/in/noor-farra",
      behanceUrl: "",
      githubUrl: "",
      avatarUrl: "https://i.pravatar.cc/300?img=44",
    },
    {
      email: "mohammed@island-haven.test",
      fullName: "محمّد شعبان",
      role: "graduate" as const,
      jobTitle: "مطوّر تطبيقات هاتف",
      bio: "صمّمت وطوّرت 7 تطبيقات على iOS و Android، مجموع تنزيلاتها 200 ألف.",
      skills: "Swift, Kotlin, React Native, Expo, Firebase",
      phone: "+970 599 661 720",
      portfolioUrl: "https://msha3ban.app",
      linkedinUrl: "https://linkedin.com/in/msha3ban",
      githubUrl: "https://github.com/msha3ban",
      behanceUrl: "",
      avatarUrl: "https://i.pravatar.cc/300?img=11",
    },
    {
      email: "rana@island-haven.test",
      fullName: "رنا التايه",
      role: "freelancer" as const,
      jobTitle: "محلّلة بيانات",
      bio: "أحوّل البيانات إلى قرارات. شاركت في بناء dashboards لـ 3 منظّمات دوليّة.",
      skills: "SQL, Python, Looker, Tableau, dbt",
      phone: "+970 599 770 830",
      portfolioUrl: "",
      linkedinUrl: "https://linkedin.com/in/rana-data",
      behanceUrl: "",
      githubUrl: "https://github.com/ranat",
      avatarUrl: "https://i.pravatar.cc/300?img=45",
    },
    {
      email: "khaled@island-haven.test",
      fullName: "خالد أبو ناصر",
      role: "freelancer" as const,
      jobTitle: "مصمّم هويّات بصريّة",
      bio: "أبني هويّات تُحكى — لا تُصمَّم فقط. عملت مع 50+ علامة تجاريّة محلّيّة وعربيّة.",
      skills: "Branding, Logo Design, Typography, Illustrator, After Effects",
      phone: "+970 599 880 940",
      portfolioUrl: "https://khaled.studio",
      linkedinUrl: "https://linkedin.com/in/khaledn",
      behanceUrl: "https://behance.net/khaledn",
      githubUrl: "",
      avatarUrl: "https://i.pravatar.cc/300?img=15",
    },
    // Experts (admin-assigned role)
    {
      email: "dr.ibrahim@island-haven.test",
      fullName: "د. إبراهيم الشّوّا",
      role: "expert" as const,
      jobTitle: "خبير ريادة أعمال",
      bio: "خبير ريادة أعمال بخبرة 18 عامًا. مؤسّس شركتين، استثمرت إحداهما 4M$ ثمّ بِيعت.",
      skills: "Fundraising, GTM, Pitch, Strategy",
      phone: "+970 599 991 050",
      portfolioUrl: "",
      linkedinUrl: "https://linkedin.com/in/dribrahim",
      behanceUrl: "",
      githubUrl: "",
      avatarUrl: "https://i.pravatar.cc/300?img=68",
    },
    {
      email: "dina@island-haven.test",
      fullName: "دينا عمر",
      role: "expert" as const,
      jobTitle: "مستشارة منتجات SaaS",
      bio: "قادت بناء 4 منتجات SaaS وصلت لـ ARR > 5M$. مدرّبة في برنامج Y Combinator MENA.",
      skills: "Product Management, Growth, SaaS Metrics, Retention",
      phone: "+970 599 102 161",
      portfolioUrl: "https://dina.product",
      linkedinUrl: "https://linkedin.com/in/dina-omar",
      behanceUrl: "",
      githubUrl: "",
      avatarUrl: "https://i.pravatar.cc/300?img=48",
    },
    {
      email: "tarek@island-haven.test",
      fullName: "م. طارق حمدان",
      role: "expert" as const,
      jobTitle: "مستشار تقنيّ ومعماريّ سحابيّ",
      bio: "مهندس برمجيّات أوّل سابق في AWS. أساعد الفرق التقنيّة على البناء بسرعة بدون ديون تقنيّة.",
      skills: "Cloud Architecture, DevOps, Scalability, Engineering Management",
      phone: "+970 599 213 272",
      portfolioUrl: "https://tarek.tech",
      linkedinUrl: "https://linkedin.com/in/tarekh",
      behanceUrl: "",
      githubUrl: "https://github.com/tarekh",
      avatarUrl: "https://i.pravatar.cc/300?img=51",
    },
  ];

  const inserted = await db
    .insert(usersTable)
    .values(
      members.map((m) => ({
        ...m,
        passwordHash: hash("Password123!"),
        status: "active" as const,
      })),
    )
    .returning({ id: usersTable.id, role: usersTable.role });

  return inserted;
}

async function seedExperts(users: Array<{ id: number; role: string }>) {
  console.log("🎓 Seeding expert profiles...");
  const experts = users.filter((u) => u.role === "expert");
  await db.insert(expertProfilesTable).values([
    {
      userId: experts[0]!.id,
      headline: "أحوّل الأفكار إلى عمليّات استثمار قابلة للإغلاق",
      expertise: "Fundraising, Pitch Decks, Cap Table, Investor Relations",
      bio: "18 سنة في عالم الشركات الناشئة، 2 exits، عضو مجلس استشاريّ في 11 شركة.",
      yearsExperience: 18,
      languages: "العربيّة, English, Français",
      sessionMinutes: 60,
      availabilityNote: "أيّام الأحد والثلاثاء، 6-9 مساءً بتوقيت غزّة.",
      acceptingSessions: true,
      featured: true,
      sortOrder: 1,
      linkedinUrl: "https://linkedin.com/in/dribrahim",
      websiteUrl: "",
      status: "active" as const,
    },
    {
      userId: experts[1]!.id,
      headline: "نبني منتجات SaaS تُحبّ — ثم نوسّعها",
      expertise: "Product Discovery, Growth, North-Star Metric, Retention",
      bio: "قدت ثلاث فرق منتج، شحنّا 50+ ميزة في عامين، حقّقنا نمو ARR من 200K إلى 5M.",
      yearsExperience: 10,
      languages: "العربيّة, English",
      sessionMinutes: 45,
      availabilityNote: "أيّام الإثنين والأربعاء.",
      acceptingSessions: true,
      featured: true,
      sortOrder: 2,
      linkedinUrl: "https://linkedin.com/in/dina-omar",
      websiteUrl: "https://dina.product",
      status: "active" as const,
    },
    {
      userId: experts[2]!.id,
      headline: "هندسة بُنية تحتيّة تَصمد عند النمو",
      expertise: "Cloud, DevOps, System Design, Engineering Leadership",
      bio: "مهندس برمجيّات أوّل سابق في AWS، خبرة 12 سنة في تصميم أنظمة بحجم ملايين الطلبات.",
      yearsExperience: 12,
      languages: "العربيّة, English",
      sessionMinutes: 60,
      availabilityNote: "نهاية كلّ أسبوع.",
      acceptingSessions: true,
      featured: false,
      sortOrder: 3,
      linkedinUrl: "https://linkedin.com/in/tarekh",
      websiteUrl: "https://tarek.tech",
      status: "active" as const,
    },
  ]);
}

async function seedDaily() {
  console.log("📰 Seeding daily posts (news/tips/stories)...");
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  await db.insert(dailyPostsTable).values([
    {
      type: "news",
      title: "إطلاق برنامج الحاضنة الصيفيّ 2026 — التقديم مفتوح",
      body:
        "أعلنت آيلاند هيفن عن فتح باب التقديم لبرنامجها الصيفيّ — 12 أسبوعًا من الإرشاد المكثّف، رأس مال أوّليّ 5,000$ لكلّ فريق، وفرصة عرض المنتج أمام صندوقَيْن استثماريّين من الإمارات.\n\nالتقديم مفتوح حتى 15 يوليو. الفرق المختارة ستُعلَن في 1 أغسطس.",
      coverUrl:
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=600&fit=crop",
      publishedAt: new Date(now - 1 * day),
    },
    {
      type: "news",
      title: "شراكة جديدة مع صندوق Flat6Labs لتمويل المرحلة الأولى",
      body:
        "وقّعت آيلاند هيفن مذكرة تفاهم مع صندوق Flat6Labs لاستثمار 25,000$ في كل شركة من خرّيجي البرنامج. الشراكة تتضمّن أيضًا 6 أشهر إرشاد من فريق الصندوق.",
      coverUrl:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&h=600&fit=crop",
      publishedAt: new Date(now - 3 * day),
    },
    {
      type: "story",
      title: "قصّة: كيف خرجت شركة Sahla من غزّة لتخدم 80,000 عميل",
      body:
        "بدأت Sahla كفكرة بسيطة — تطبيق يُسهّل دفع فواتير الخدمات لكبار السن. خلال 18 شهرًا داخل آيلاند هيفن، وصلت لـ 80 ألف مستخدم نشِط وأغلقت جولة Pre-Seed بقيمة 300,000$.",
      coverUrl:
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=600&fit=crop",
      publishedAt: new Date(now - 5 * day),
    },
    {
      type: "tip",
      title: "نصيحة الأسبوع: ابدأ بـ 10 محادثات مستخدم قبل أيّ سطر كود",
      body:
        "تجنّب فخّ بناء منتج لم يطلبه أحد. خصّص أوّل أسبوعين لإجراء 10 مقابلات نوعيّة. اسأل عن المشكلة، لا عن الحلّ.",
      coverUrl:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop",
      publishedAt: new Date(now - 7 * day),
    },
    {
      type: "quote",
      title: "اقتباس: \"الفكرة بدون تنفيذ هي هلوسة\"",
      body: "— توماس إديسون\n\nخصّص ساعتين يوميًّا للتنفيذ، حتى لو لم تكن المهمّة \"مثاليّة\".",
      coverUrl:
        "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&h=600&fit=crop",
      publishedAt: new Date(now - 9 * day),
    },
    {
      type: "news",
      title: "افتتاح قاعة العمل الجماعيّ الجديدة — 24 مقعدًا إضافيًّا",
      body:
        "افتُتحت قاعة \"النّخيل\" بطاقة استيعابيّة 24 مقعدًا، إنترنت ضوئيّ بسرعة 1Gbps، وشاشة عرض 75 بوصة. الحجز عبر التطبيق.",
      coverUrl:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop",
      publishedAt: new Date(now - 11 * day),
    },
    {
      type: "story",
      title: "من خرّيج إلى مؤسّس: رحلة محمّد شعبان مع MazadX",
      body:
        "بدأ محمّد كمتدرّب في برنامجنا قبل عامين. اليوم، تطبيقه MazadX يخدم 12,000 مستخدم نشِط في 3 دول، وأغلق جولة استثمار 150,000$.",
      coverUrl:
        "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1200&h=600&fit=crop",
      publishedAt: new Date(now - 14 * day),
    },
  ]);
}

async function seedCourses() {
  console.log("📚 Seeding courses & workshops...");
  const week = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  await db.insert(coursesTable).values([
    {
      type: "course",
      title: "أساسيّات بناء MVP في 4 أسابيع",
      summary: "ابنِ نموذجك الأوّليّ بأقلّ تكلفة وأسرع وقت.",
      description:
        "كورس عمليّ مكثّف يأخذك من فكرة على ورق إلى نسخة قابلة للاختبار مع مستخدمين حقيقيّين. 4 جلسات أسبوعيّة + 4 جلسات إرشاد فرديّة.",
      instructor: "دينا عمر",
      coverUrl:
        "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=500&fit=crop",
      location: "آيلاند هيفن — قاعة النّخيل",
      startsAt: new Date(now + 1 * week),
      endsAt: new Date(now + 5 * week),
      capacity: 20,
      status: "open" as const,
    },
    {
      type: "workshop",
      title: "ورشة: كيف تكتب Pitch Deck يُغلق جولات",
      summary: "تشريح 20 deck حقيقيّ أغلق رؤوس أموال.",
      description:
        "ورشة 4 ساعات نُشرّح فيها deckات شركات أغلقت جولات Pre-Seed و Seed. ستخرج بـ outline جاهز لـ deckك الخاصّ.",
      instructor: "د. إبراهيم الشّوّا",
      coverUrl:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop",
      location: "آيلاند هيفن — قاعة البحر",
      startsAt: new Date(now + 2 * week),
      endsAt: new Date(now + 2 * week + 4 * 60 * 60 * 1000),
      capacity: 30,
      status: "open" as const,
    },
    {
      type: "course",
      title: "هندسة الأنظمة السّحابيّة — من الصفر إلى الإنتاج",
      summary: "ابنِ بنية تحتيّة تَصمد عند 10x نمو.",
      description:
        "8 أسابيع، 16 جلسة، مشروع نهائيّ نشره فعليًّا على AWS. تعرّف على Terraform، Kubernetes، CI/CD، والمراقبة.",
      instructor: "م. طارق حمدان",
      coverUrl:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=500&fit=crop",
      location: "أونلاين",
      startsAt: new Date(now + 3 * week),
      endsAt: new Date(now + 11 * week),
      capacity: 25,
      status: "open" as const,
    },
    {
      type: "workshop",
      title: "ورشة: محادثات المستخدم — الدّليل العمليّ",
      summary: "تعلّم كيف تستخرج الأفكار الحقيقيّة من 10 محادثات.",
      description:
        "ورشة يوم كامل، تطبيق فعليّ مع زملاء، خروج بـ playbook خاصّ بك لإجراء مقابلات اكتشاف.",
      instructor: "نور الفرّا",
      coverUrl:
        "https://images.unsplash.com/photo-1573164713619-24c711fe7878?w=800&h=500&fit=crop",
      location: "آيلاند هيفن — القاعة الرّئيسيّة",
      startsAt: new Date(now + 4 * week),
      endsAt: new Date(now + 4 * week + 8 * 60 * 60 * 1000),
      capacity: 15,
      status: "open" as const,
    },
    {
      type: "course",
      title: "تطوير تطبيقات Mobile حديثة — React Native + Expo",
      summary: "أَطلِق تطبيقًا فعليًّا على App Store و Play Store.",
      description:
        "6 أسابيع. ابدأ من الصفر وانتهِ بتطبيق منشور على المتاجر. يتضمّن دفع داخل التطبيق، إشعارات Push، وتحليلات.",
      instructor: "محمّد شعبان",
      coverUrl:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=500&fit=crop",
      location: "هجين — قاعة + أونلاين",
      startsAt: new Date(now + 5 * week),
      endsAt: new Date(now + 11 * week),
      capacity: 18,
      status: "open" as const,
    },
    {
      type: "course",
      title: "كتابة محتوى يَبيع — Copywriting للمنتجات الرّقميّة",
      summary: "من الـ Landing Page إلى رسائل الـ Onboarding.",
      description:
        "5 جلسات أسبوعيّة. ستكتب لأكثر من 3 منتجات حقيقيّة وستحصل على feedback من مدرّبة بخبرة 8 سنوات.",
      instructor: "سلمى عاشور",
      coverUrl:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=500&fit=crop",
      location: "أونلاين",
      startsAt: new Date(now + 6 * week),
      endsAt: new Date(now + 11 * week),
      capacity: 20,
      status: "open" as const,
    },
  ]);
}

async function seedWorks(users: Array<{ id: number; role: string }>) {
  console.log("🎨 Seeding works (portfolio)...");
  const members = users.filter((u) => u.role !== "expert");
  await db.insert(worksTable).values([
    {
      userId: members[0]!.id,
      title: "Najma — تطبيق إدارة الفعاليّات",
      summary: "تجربة مستخدم كاملة لمنصّة فعاليّات في 6 دول عربيّة.",
      description:
        "صمّمت تجربة 32 شاشة، نظام تصميم مكوّن من 80 component، وأُطلِق التطبيق في مارس بـ 4,000 تنزيل في أوّل أسبوع.",
      coverUrl:
        "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=800&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=1200&h=800&fit=crop",
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=800&fit=crop",
      ],
      videoUrl: "",
      link: "https://najma.app",
      tags: "UI Design, Product, Case Study",
      status: "featured" as const,
    },
    {
      userId: members[1]!.id,
      title: "Sahla — منصّة دفع فواتير لكبار السن",
      summary: "Backend بُنِيَ بـ Go و PostgreSQL، يخدم 80,000 مستخدم.",
      description:
        "بنيت البنية التحتيّة كاملة: API بـ Go، قاعدة بيانات على Supabase، وتكامل مع 4 مزوّدي خدمات. وقت الاستجابة < 200ms.",
      coverUrl:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=800&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=800&fit=crop",
      ],
      videoUrl: "",
      link: "https://sahla.ps",
      tags: "Backend, Go, Fintech",
      status: "featured" as const,
    },
    {
      userId: members[2]!.id,
      title: "إعادة كتابة موقع Tasnif بالكامل",
      summary: "زيادة التحويل 38% بعد إعادة الكتابة.",
      description:
        "أعدت كتابة 12 صفحة لاندينج وسلسلة إيميلات onboarding. النّتيجة: تحويل من زائر لعميل ارتفع من 1.8% إلى 2.5%.",
      coverUrl:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&h=800&fit=crop",
      galleryUrls: [],
      videoUrl: "",
      link: "https://tasnif.com",
      tags: "Copywriting, Conversion, Case Study",
      status: "visible" as const,
    },
    {
      userId: members[3]!.id,
      title: "نموذج NLP لتلخيص النصوص العربيّة",
      summary: "Fine-tuned model based on AraBERT. ROUGE-1 = 41.",
      description:
        "بحث جامعيّ نُشر في NeurIPS Workshop 2025. الكود مفتوح المصدر على GitHub.",
      coverUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop",
      galleryUrls: [],
      videoUrl: "",
      link: "https://github.com/ahmadm/araSum",
      tags: "AI, NLP, Research",
      status: "visible" as const,
    },
    {
      userId: members[4]!.id,
      title: "إطلاق منتج SaaS من الصفر — Pulse",
      summary: "من 0 إلى 1,200 مستخدم نشط في 9 أسابيع.",
      description:
        "قدت كلّ شيء: استراتيجيّة الإطلاق، التسعير، content marketing، شراكات. وصلنا لـ MRR قدره 8,000$ خلال أوّل 3 أشهر.",
      coverUrl:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop",
      galleryUrls: [],
      videoUrl: "",
      link: "https://usepulse.app",
      tags: "Product, Growth, SaaS",
      status: "featured" as const,
    },
    {
      userId: members[5]!.id,
      title: "MazadX — تطبيق مزادات اللحظة الأخيرة",
      summary: "12,000 مستخدم نشط، 3 دول.",
      description:
        "صمّمت وطوّرت تطبيق iOS و Android بـ React Native + Expo. يعتمد على Firebase Realtime DB لمزادات لحظيّة.",
      coverUrl:
        "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&h=800&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=800&fit=crop",
      ],
      videoUrl: "",
      link: "https://mazadx.com",
      tags: "Mobile, React Native, Marketplace",
      status: "featured" as const,
    },
    {
      userId: members[6]!.id,
      title: "Dashboard لمؤشّرات منظّمات إنسانيّة",
      summary: "بناء 14 dashboard لـ UNRWA + ICRC.",
      description:
        "حوّلت بيانات خام من 8 مصادر إلى dashboards تفاعليّة على Looker Studio. تستخدمها فِرَق العمليّات لاتّخاذ قرارات يوميّة.",
      coverUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop",
      galleryUrls: [],
      videoUrl: "",
      link: "",
      tags: "Data, Analytics, Dashboards",
      status: "visible" as const,
    },
    {
      userId: members[7]!.id,
      title: "هويّة بصريّة كاملة لـ Mishwar",
      summary: "علامة تجاريّة من اللوغو إلى Brand Book.",
      description:
        "صمّمت اللوغو، نظام الألوان، الـ typography، 30 أيقونة، وكتاب الهويّة (52 صفحة). الفريق يعتمدها الآن في كلّ مادّة.",
      coverUrl:
        "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=1200&h=800&fit=crop",
      galleryUrls: [
        "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=800&fit=crop",
      ],
      videoUrl: "",
      link: "https://mishwar.app",
      tags: "Branding, Logo, Identity",
      status: "featured" as const,
    },
  ]);
}

async function seedPrograms() {
  console.log("🚀 Seeding incubation programs...");
  const week = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  await db.insert(programsTable).values([
    {
      title: "حاضنة آيلاند الصيفيّة — Cohort 02",
      summary: "12 أسبوعًا، إرشاد مكثّف، رأس مال أوّليّ 5,000$.",
      description:
        "برنامج مكثّف للفِرَق التي وصلت إلى مرحلة MVP وتسعى للوصول إلى Product-Market Fit. يتضمّن البرنامج 12 أسبوعًا من الإرشاد، 4 جلسات مع شركاء استثماريّين، و Demo Day أمام 30 صندوقًا من المنطقة.",
      coverUrl:
        "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=600&fit=crop",
      durationWeeks: 12,
      seats: 8,
      perks:
        "رأس مال أوّليّ 5,000$ لكلّ فريق\nمكتب مجّاني لمدّة 12 شهرًا\n100+ ساعة إرشاد فرديّ\nDemo Day أمام صناديق استثماريّة\nاعتمادات سحابيّة بقيمة 10,000$\nخدمات قانونيّة ومحاسبيّة مجّانيّة",
      tags: "MVP, Pre-Seed, B2C, B2B",
      startsAt: new Date(now + 3 * week),
      applyDeadline: new Date(now + 2 * week),
      status: "open" as const,
      sortOrder: 1,
    },
    {
      title: "مسرّع AI — للفِرَق العاملة على الذكاء الاصطناعيّ",
      summary: "8 أسابيع متخصّصة، إرشاد من خبراء AI من المنطقة والعالم.",
      description:
        "مسرّع متخصّص للفِرَق التي تبني منتجات تعتمد على AI/ML. شراكة مع Hugging Face و OpenAI للوصول إلى نماذج وموارد مخصّصة.",
      coverUrl:
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=600&fit=crop",
      durationWeeks: 8,
      seats: 6,
      perks:
        "اعتمادات OpenAI بقيمة 5,000$\nاشتراك Hugging Face Pro سنويّ\nإرشاد من باحثين في Google DeepMind\nGPU compute بقيمة 3,000$",
      tags: "AI, ML, NLP, Computer Vision",
      startsAt: new Date(now + 6 * week),
      applyDeadline: new Date(now + 5 * week),
      status: "open" as const,
      sortOrder: 2,
    },
    {
      title: "برنامج Founders First — للمؤسّسين قبل الفكرة",
      summary: "6 أسابيع لاكتشاف مشكلة تستحقّ الحلّ.",
      description:
        "للأفراد الذين يريدون البدء لكنّهم لم يصلوا إلى الفكرة بعد. ستخرج بـ idea validated، فريق، وخطّة تنفيذ.",
      durationWeeks: 6,
      seats: 12,
      perks:
        "ورشة عمل أسبوعيّة\nتطبيق منهجيّة Customer Discovery\nمطابقة مع شركاء مؤسّسين محتملين\nدخول مجّانيّ لباقي برامج الحاضنة",
      tags: "Discovery, Validation, Co-founder Matching",
      startsAt: new Date(now + 8 * week),
      applyDeadline: new Date(now + 7 * week),
      status: "open" as const,
      sortOrder: 3,
    },
  ]);
}

async function seedVentures() {
  console.log("💼 Seeding ventures (showcase)...");
  await db.insert(venturesTable).values([
    {
      name: "Sahla",
      tagline: "ادفع فواتيرك بصوتك",
      description:
        "تطبيق يُمكّن كبار السنّ من دفع فواتير الكهرباء والماء والإنترنت عبر أوامر صوتيّة بسيطة. 80,000 مستخدم نشط في 3 دول.",
      logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=sahla",
      coverUrl:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop",
      websiteUrl: "https://sahla.ps",
      founderName: "يوسف القاضي",
      sector: "Fintech",
      stage: "scaling" as const,
      foundedYear: 2024,
      teamSize: 7,
      featured: true,
      status: "published" as const,
      sortOrder: 1,
    },
    {
      name: "MazadX",
      tagline: "مزادات لحظيّة لمستلزمات اللحظة الأخيرة",
      description:
        "منصّة مزادات في الوقت الفعليّ لمنتجات وخدمات اللّحظة الأخيرة. توسّعت من غزّة لتخدم الأردن ومصر.",
      logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=mazadx",
      coverUrl:
        "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&h=600&fit=crop",
      websiteUrl: "https://mazadx.com",
      founderName: "محمّد شعبان",
      sector: "Marketplace",
      stage: "launched" as const,
      foundedYear: 2025,
      teamSize: 4,
      featured: true,
      status: "published" as const,
      sortOrder: 2,
    },
    {
      name: "Najma",
      tagline: "أُدِر فعاليّاتك من شاشة واحدة",
      description:
        "أداة شاملة لمنظّمي الفعاليّات: تذاكر، حضور، تواصل، تحليلات. تستخدمها 200+ فعاليّة شهريًّا.",
      logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=najma",
      coverUrl:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=600&fit=crop",
      websiteUrl: "https://najma.app",
      founderName: "لينا أبو شريف",
      sector: "Events Tech",
      stage: "launched" as const,
      foundedYear: 2025,
      teamSize: 5,
      featured: true,
      status: "published" as const,
      sortOrder: 3,
    },
    {
      name: "Pulse",
      tagline: "نبض فريقك التقنيّ في لوحة واحدة",
      description:
        "SaaS لقياس صحّة فِرَق الهندسة: deployments، incidents، حمل العمل، رفاهيّة الفريق.",
      logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=pulse",
      coverUrl:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop",
      websiteUrl: "https://usepulse.app",
      founderName: "نور الفرّا",
      sector: "DevTools",
      stage: "mvp" as const,
      foundedYear: 2026,
      teamSize: 3,
      featured: false,
      status: "published" as const,
      sortOrder: 4,
    },
    {
      name: "araSum",
      tagline: "ذكاء اصطناعيّ يفهم العربيّة",
      description:
        "API لتلخيص وتصنيف النصوص العربيّة بدقّة 91%. تستخدمه 12 منصّة محتوى في المنطقة.",
      logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=arasum",
      coverUrl:
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=600&fit=crop",
      websiteUrl: "https://arasum.ai",
      founderName: "أحمد المصري",
      sector: "AI / NLP",
      stage: "idea" as const,
      foundedYear: 2026,
      teamSize: 2,
      featured: false,
      status: "published" as const,
      sortOrder: 5,
    },
  ]);
}

async function seedPartners() {
  console.log("🤝 Seeding partners...");
  await db.insert(partnersTable).values([
    {
      name: "Flat6Labs",
      logoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=F6L&backgroundColor=0e7c86",
      websiteUrl: "https://flat6labs.com",
      description: "أكبر مسرّع إقليميّ في الشرق الأوسط — شريك التمويل الأساسيّ.",
      tier: "sponsor" as const,
      status: "visible" as const,
      sortOrder: 1,
    },
    {
      name: "AWS",
      logoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=AWS&backgroundColor=ff9900",
      websiteUrl: "https://aws.amazon.com/activate",
      description: "اعتمادات سحابيّة بقيمة 10,000$ لكلّ فريق من خرّيجي البرنامج.",
      tier: "sponsor" as const,
      status: "visible" as const,
      sortOrder: 2,
    },
    {
      name: "Google for Startups",
      logoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=G4S&backgroundColor=4285f4",
      websiteUrl: "https://startup.google.com",
      description: "إرشاد ومنح Google Cloud بقيمة 5,000$.",
      tier: "partner" as const,
      status: "visible" as const,
      sortOrder: 3,
    },
    {
      name: "من النّاس إلى النّاس",
      logoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=MNN&backgroundColor=d8344f",
      websiteUrl: "",
      description: "المؤسّس الأصليّ للمساحة والدّاعم الرئيسيّ لرسالتها.",
      tier: "sponsor" as const,
      status: "visible" as const,
      sortOrder: 4,
    },
    {
      name: "OpenAI Startups",
      logoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=AI&backgroundColor=10a37f",
      websiteUrl: "https://openai.com/forstartups",
      description: "اعتمادات GPT-4 وأدوات AI للفِرَق المتخصّصة.",
      tier: "partner" as const,
      status: "visible" as const,
      sortOrder: 5,
    },
    {
      name: "Stripe",
      logoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=S&backgroundColor=635bff",
      websiteUrl: "https://stripe.com/atlas",
      description: "تأسيس الشركات وقبول المدفوعات الدوليّة.",
      tier: "supporter" as const,
      status: "visible" as const,
      sortOrder: 6,
    },
  ]);
}

async function seedStories() {
  console.log("⭐ Seeding success stories...");
  await db.insert(successStoriesTable).values([
    {
      personName: "يوسف القاضي",
      role: "مؤسّس Sahla",
      quote:
        "آيلاند هيفن لم تكن مجرّد مساحة — كانت العائلة الّتي وقفت معي حين شككت في الفكرة بأكملها. اليوم نخدم 80 ألف مستخدم.",
      story:
        "دخلت إلى آيلاند هيفن بفكرة بسيطة وخوف كبير. خلال 18 شهرًا، ساعدني فريق الإرشاد على التحقّق من الفكرة، بناء MVP، إغلاق Pre-Seed بقيمة 300 ألف دولار، وتوظيف 6 أشخاص.",
      avatarUrl: "https://i.pravatar.cc/300?img=12",
      coverUrl:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop",
      ventureName: "Sahla",
      featured: true,
      status: "published" as const,
      sortOrder: 1,
    },
    {
      personName: "لينا أبو شريف",
      role: "مؤسّسة Najma",
      quote:
        "أصدق ما حصلت عليه هنا: شبكة من الأشخاص الذين يؤمنون بإمكاناتي قبل أن أؤمن أنا بها.",
      story:
        "صمّمت Najma خلال 3 أشهر فقط، بدعم من إرشاد التصميم والمنتج. الآن تُستخدم في 200+ فعاليّة شهريًّا.",
      avatarUrl: "https://i.pravatar.cc/300?img=47",
      coverUrl:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=600&fit=crop",
      ventureName: "Najma",
      featured: true,
      status: "published" as const,
      sortOrder: 2,
    },
    {
      personName: "محمّد شعبان",
      role: "مؤسّس MazadX",
      quote:
        "من متدرّب إلى مؤسّس في 24 شهرًا — هذه ليست صدفة، هذا منهج آيلاند هيفن.",
      story:
        "بدأت متدرّبًا في برنامج Founders First. اليوم تطبيقي MazadX يخدم 12,000 مستخدم في 3 دول، وأغلقت جولة 150 ألف دولار.",
      avatarUrl: "https://i.pravatar.cc/300?img=11",
      coverUrl:
        "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&h=600&fit=crop",
      ventureName: "MazadX",
      featured: true,
      status: "published" as const,
      sortOrder: 3,
    },
    {
      personName: "نور الفرّا",
      role: "مؤسّسة Pulse",
      quote:
        "لم أكن أعرف أنّي أستطيع أن أبني SaaS من غزّة لعملاء في برلين ودبي — حتى دخلت آيلاند هيفن.",
      story:
        "في 9 أسابيع، انتقلت من فكرة على ورق إلى 1,200 مستخدم نشط و MRR قدره 8,000 دولار.",
      avatarUrl: "https://i.pravatar.cc/300?img=44",
      ventureName: "Pulse",
      featured: false,
      status: "published" as const,
      sortOrder: 4,
    },
  ]);
}

async function seedApplications() {
  console.log("📝 Seeding sample applications...");
  await db.insert(applicationsTable).values([
    {
      fullName: "ريم سعيد",
      email: "reem.s@example.com",
      phone: "+970 599 123 456",
      category: "freelancer",
      bio: "مصوّرة فوتوغرافيّة بـ 6 سنوات خبرة. أحتاج مساحة هادئة للتحرير وإدارة المشاريع.",
      status: "new",
    },
    {
      fullName: "كريم عبد العزيز",
      email: "kareem.a@example.com",
      phone: "+970 599 234 567",
      category: "graduate",
      bio: "خرّيج هندسة برمجيّات حديثًا. أبحث عن بيئة محفّزة لبناء أوّل startup مع شريك مؤسّس.",
      status: "reviewing",
    },
    {
      fullName: "هبة الزّعتر",
      email: "heba.z@example.com",
      phone: "+970 599 345 678",
      category: "student",
      bio: "طالبة سنة رابعة تسويق رقميّ. أعمل مع 3 عملاء freelance وأحتاج بيئة احترافيّة.",
      status: "accepted",
    },
  ]);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      "postgresql://ahmedashraf@localhost/ih_haven_dev";
  }
  console.log(`🌱 Seeding ${process.env.DATABASE_URL}\n`);

  await clear();
  const users = await seedUsers();
  await seedExperts(users);
  await seedDaily();
  await seedCourses();
  await seedWorks(users);
  await seedPrograms();
  await seedVentures();
  await seedPartners();
  await seedStories();
  await seedApplications();

  console.log("\n✅ Seeding complete!");
  console.log("\nLogin: any seeded user with password: Password123!");
  console.log("Admin login: username 'ahmedashraf' password 'ahmedadmin$$'");

  await pool.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
