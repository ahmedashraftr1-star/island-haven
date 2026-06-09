/**
 * Seeds the new tables: job_listings, investors, newsletter_subscribers
 * and tops up success_stories if empty.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run seed:new
 */
import {
  db,
  jobListingsTable,
  investorsTable,
  newsletterSubscribersTable,
  successStoriesTable,
  pool,
} from "@workspace/db";
import { sql } from "drizzle-orm";

async function clearNew() {
  console.log("🧹 Clearing new tables...");
  await db.execute(sql`
    TRUNCATE job_listings, investors, newsletter_subscribers RESTART IDENTITY CASCADE
  `);
  // Clear success_stories only if empty (seed.ts may have already filled it)
  const existing = await db.select({ id: successStoriesTable.id }).from(successStoriesTable).limit(1);
  if (existing.length === 0) {
    console.log("  → success_stories is empty, will seed it too.");
  }
}

async function seedStories() {
  const existing = await db.select({ id: successStoriesTable.id }).from(successStoriesTable).limit(1);
  if (existing.length > 0) {
    console.log("✓ success_stories already seeded — skipping.");
    return;
  }
  console.log("📖 Seeding success stories...");
  await db.insert(successStoriesTable).values([
    {
      personName: "لينا أبو شريف",
      role: "مؤسّسة ومصمّمة رئيسيّة",
      quote: "آيلاند هيفن لم تعطِني مساحة فقط — أعطتني المنهج والمجتمع والجرأة لأطلق.",
      story: "جاءت لينا لآيلاند هيفن وهي تعمل كمستقلّة بمشاريع متفرّقة. خلال 4 أشهر من الاحتضان، حوّلت هويّتها المهنيّة إلى استوديو تصميم يخدم شركات في 6 دول عربيّة. اليوم، Lina Studio يضمّ 3 مصمّمين وعملاء بين دبي وبرلين وغزّة.",
      avatarUrl: "https://i.pravatar.cc/300?img=47",
      coverUrl: "https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=1200&h=600&fit=crop",
      ventureName: "Lina Studio",
      featured: true,
      status: "published" as const,
      sortOrder: 1,
    },
    {
      personName: "يوسف القاضي",
      role: "مؤسّس ومهندس رئيسيّ",
      quote: "بنيت Sahla في غزّة وأخدم الآن 80,000 مستخدم في 3 دول — كلّ هذا ابتدأ من مكتب في آيلاند هيفن.",
      story: "يوسف خرّيج هندسة حاسوب التحق ببرنامج الاحتضان بفكرة بسيطة: تمكين كبار السن من دفع الفواتير بصوتهم. خلال 18 شهراً داخل آيلاند، وصل إلى Product-Market Fit وأغلق جولة Pre-Seed بـ 300,000 دولار.",
      avatarUrl: "https://i.pravatar.cc/300?img=12",
      coverUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop",
      ventureName: "Sahla",
      featured: true,
      status: "published" as const,
      sortOrder: 2,
    },
    {
      personName: "محمّد شعبان",
      role: "مؤسّس MazadX",
      quote: "من متدرّب إلى مؤسّس في 24 شهراً — هذا ليس حظّاً، هذا منهج آيلاند هيفن.",
      story: "بدأ محمّد متدرّباً في برنامج Founders First. اليوم، تطبيقه MazadX للمزادات اللحظيّة يخدم 12,000 مستخدم نشط في 3 دول، وأغلق جولة استثمار بـ 150,000 دولار من مستثمرَين خليجيَّين.",
      avatarUrl: "https://i.pravatar.cc/300?img=11",
      coverUrl: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&h=600&fit=crop",
      ventureName: "MazadX",
      featured: true,
      status: "published" as const,
      sortOrder: 3,
    },
    {
      personName: "نور الفرّا",
      role: "مؤسّسة Pulse",
      quote: "لم أكن أعرف أنّي أستطيع بناء SaaS من غزّة لعملاء في برلين ودبي — حتى دخلت آيلاند هيفن.",
      story: "في 9 أسابيع فقط، انتقلت نور من فكرة على ورق إلى 1,200 مستخدم نشط و MRR قدره 8,000 دولار. الإرشاد المباشر وشبكة الحاضنة كانا الفارق الحاسم.",
      avatarUrl: "https://i.pravatar.cc/300?img=44",
      coverUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop",
      ventureName: "Pulse",
      featured: false,
      status: "published" as const,
      sortOrder: 4,
    },
    {
      personName: "سلمى عاشور",
      role: "كاتبة محتوى وصانعة علامات",
      quote: "في آيلاند هيفن تعلّمت أن الكلمات ليست مهنة — هي أداة بناء أعمال.",
      story: "بدأت سلمى بكتابة محتوى بالقطعة. بعد الانضمام لبرنامج الحاضنة، أطلقت وكالة محتوى متخصّصة في علامات SaaS العربيّة. اليوم لديها 8 عملاء ثابتين وفريق من 3 كتّاب.",
      avatarUrl: "https://i.pravatar.cc/300?img=49",
      coverUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&h=600&fit=crop",
      ventureName: "ContentArc",
      featured: false,
      status: "published" as const,
      sortOrder: 5,
    },
    {
      personName: "أحمد المصري",
      role: "باحث ذكاء اصطناعي",
      quote: "الحاضنة أعطتني ما لا تعطيه الجامعة: مجتمعاً يفهم ما تبنيه.",
      story: "أحمد طالب ماجستير حوّل بحثه الأكاديميّ في معالجة اللغة العربيّة إلى منتج API تجاري. نموذجه araSum حصل على قبول في NeurIPS Workshop وأصبح قاعدة لشركة ناشئة تقنيّة.",
      avatarUrl: "https://i.pravatar.cc/300?img=33",
      coverUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=600&fit=crop",
      ventureName: "araSum API",
      featured: false,
      status: "published" as const,
      sortOrder: 6,
    },
  ]);
  console.log("  ✓ 6 success stories seeded");
}

async function seedJobs() {
  console.log("💼 Seeding job listings...");
  await db.insert(jobListingsTable).values([
    {
      title: "مطوّر Full-Stack (React / Node.js)",
      companyName: "Sahla",
      companyLogoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=sahla&backgroundColor=0a3d62",
      location: "غزة",
      type: "full-time" as const,
      category: "tech" as const,
      description: "نبحث عن مطوّر Full-Stack لمساعدتنا في بناء ميزات جديدة لمنصّة دفع الفواتير الصوتيّة. ستعمل مع فريق صغير وسريع في بيئة Startup حقيقيّة.",
      requirements: "خبرة 2+ سنوات في React و Node.js\nمعرفة بـ PostgreSQL\nإنجليزيّ جيّد\nالقدرة على العمل بشكل مستقل",
      salaryRange: "1,200$ – 1,800$ / شهر",
      applyUrl: "https://sahla.ps/careers",
      status: "active" as const,
      featured: true,
      sortOrder: 1,
    },
    {
      title: "مصمّم/ة UI/UX",
      companyName: "MazadX",
      companyLogoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=mazadx&backgroundColor=6c2a8a",
      location: "غزة أو عن بُعد",
      type: "full-time" as const,
      category: "design" as const,
      description: "نريد مصمّماً UI/UX موهوباً لتحسين تجربة مستخدم تطبيق المزادات اللحظيّة. العمل على Figma وتنفيذ مباشر مع فريق الموبايل.",
      requirements: "إتقان Figma\nخبرة تصميم تطبيقات موبايل (iOS/Android)\nمحفظة أعمال قويّة\nفهم User Research",
      salaryRange: "900$ – 1,400$ / شهر",
      applyUrl: "https://mazadx.com/jobs",
      status: "active" as const,
      featured: true,
      sortOrder: 2,
    },
    {
      title: "مدير/ة تسويق رقميّ",
      companyName: "Pulse",
      companyLogoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=pulse&backgroundColor=27ae60",
      location: "عن بُعد",
      type: "remote" as const,
      category: "marketing" as const,
      description: "Pulse منصّة SaaS لإدارة المهام الموزّعة تبحث عن مديرة/مدير تسويق رقميّ لقيادة نموّ قاعدة المستخدمين من 1,200 إلى 5,000.",
      requirements: "خبرة في Content Marketing و SEO\nإدارة Google و Meta Ads\nتحليل بيانات (Google Analytics, Mixpanel)\nكتابة إنجليزيّة ممتازة",
      salaryRange: "800$ – 1,200$ / شهر",
      applyUrl: "https://usepulse.app/careers",
      status: "active" as const,
      featured: false,
      sortOrder: 3,
    },
    {
      title: "مهندس/ة برمجيّات Backend (Go)",
      companyName: "Sahla",
      companyLogoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=sahla&backgroundColor=0a3d62",
      location: "غزة",
      type: "full-time" as const,
      category: "tech" as const,
      description: "نوسّع فريقنا التقنيّ بمهندس backend متمكّن من Go وأنظمة التكامل مع مزوّدي الدفع والخدمات الحكوميّة.",
      requirements: "خبرة 3+ سنوات في Go\nمعرفة بـ gRPC أو REST APIs\nخبرة في التكامل مع Payment Gateways\nPostgreSQL و Redis",
      salaryRange: "1,500$ – 2,200$ / شهر",
      applyUrl: "https://sahla.ps/careers",
      status: "active" as const,
      featured: false,
      sortOrder: 4,
    },
    {
      title: "متدرّب/ة تطوير Frontend",
      companyName: "Lina Studio",
      companyLogoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=linastudio&backgroundColor=e84393",
      location: "غزة",
      type: "internship" as const,
      category: "tech" as const,
      description: "فرصة تدريبيّة في Lina Studio للراغبين في تعلّم تطوير الويب الحديث بجانب مصمّمين محترفين. ستعمل على مشاريع حقيقيّة من أوّل أسبوع.",
      requirements: "معرفة أساسيّة بـ HTML/CSS/JavaScript\nاهتمام بتقاطع التصميم والتطوير\nتفرّغ 4 أيام أسبوعيًّا",
      salaryRange: "200$ – 400$ / شهر",
      applyUrl: "https://wa.me/972599100200",
      status: "active" as const,
      featured: false,
      sortOrder: 5,
    },
    {
      title: "محاسب/ة مالية (Part-time)",
      companyName: "MazadX",
      companyLogoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=mazadx&backgroundColor=6c2a8a",
      location: "غزة",
      type: "part-time" as const,
      category: "finance" as const,
      description: "نبحث عن محاسب بارع لمتابعة المعاملات الماليّة الشهريّة، إعداد التقارير، والتعامل مع الفواتير والمدفوعات من المنصّة.",
      requirements: "شهادة محاسبة أو إدارة أعمال\nخبرة في QuickBooks أو Excel المتقدّم\nدقّة وأمانة عاليتان",
      salaryRange: "400$ – 600$ / شهر",
      applyUrl: "https://mazadx.com/jobs",
      status: "active" as const,
      featured: false,
      sortOrder: 6,
    },
    {
      title: "مهندس/ة DevOps & Cloud",
      companyName: "araSum API",
      companyLogoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=arasum&backgroundColor=2c3e50",
      location: "عن بُعد",
      type: "contract" as const,
      category: "tech" as const,
      description: "نبني بنية تحتيّة لخدمات AI تستوعب آلاف الطلبات يوميّاً. نحتاج خبيراً في AWS و Kubernetes لقيادة هذا الجانب.",
      requirements: "خبرة في AWS (ECS, Lambda, S3)\nKubernetes و Docker\nتجربة في نشر نماذج ML\nTerraform أو Pulumi",
      salaryRange: "2,000$ – 3,000$ / شهر",
      applyUrl: "https://github.com/ahmadm",
      status: "active" as const,
      featured: false,
      sortOrder: 7,
    },
    {
      title: "مندوب/ة مبيعات B2B",
      companyName: "ContentArc",
      companyLogoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=contentarc&backgroundColor=e67e22",
      location: "غزة أو عن بُعد",
      type: "full-time" as const,
      category: "sales" as const,
      description: "وكالة المحتوى العربيّ ContentArc تبحث عن مندوب مبيعات لاستهداف شركات SaaS وعلامات تجاريّة في الخليج وأوروبا.",
      requirements: "خبرة مبيعات B2B 1+ سنة\nقدرة على التواصل والتفاوض\nإنجليزيّ وعربيّ طلق\nمعرفة بسوق SaaS",
      salaryRange: "700$ + عمولة",
      applyUrl: "https://wa.me/972599322410",
      status: "active" as const,
      featured: false,
      sortOrder: 8,
    },
  ]);
  console.log("  ✓ 8 job listings seeded");
}

async function seedInvestors() {
  console.log("💰 Seeding investors...");
  await db.insert(investorsTable).values([
    {
      name: "Flat6Labs",
      logoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=F6L&backgroundColor=e84393&fontFamily=Arial&fontSize=38",
      websiteUrl: "https://flat6labs.com",
      description: "صندوق رأس مال مخاطر رائد في المنطقة العربيّة، يستثمر في شركات التكنولوجيا المبكّرة. استثمر في أكثر من 300 شركة ناشئة عبر 9 دول.",
      type: "vc" as const,
      investmentFocus: "Early-Stage, Tech, Fintech, EdTech, MENA",
      status: "visible" as const,
      sortOrder: 1,
    },
    {
      name: "د. خالد الزّياد",
      logoUrl: "https://i.pravatar.cc/300?img=68",
      websiteUrl: "",
      description: "مستثمر ملاك من الكويت، استثمر في 12 شركة ناشئة عربيّة. شريك مؤسّس في صندوق Wamda Capital سابقاً.",
      type: "angel" as const,
      investmentFocus: "FinTech, PropTech, SaaS B2B",
      status: "visible" as const,
      sortOrder: 2,
    },
    {
      name: "UNDP Palestine",
      logoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=UNDP&backgroundColor=1a5276&fontFamily=Arial&fontSize=32",
      websiteUrl: "https://www.undp.org/palestine",
      description: "برنامج الأمم المتحدة الإنمائيّ في فلسطين، يدعم مبادرات ريادة الأعمال وبناء القدرات الاقتصاديّة في غزّة والضفّة الغربيّة.",
      type: "ngo" as const,
      investmentFocus: "Economic Empowerment, Youth, Tech for Good",
      status: "visible" as const,
      sortOrder: 3,
    },
    {
      name: "سارة المنصوري",
      logoUrl: "https://i.pravatar.cc/300?img=44",
      websiteUrl: "",
      description: "رائدة أعمال إماراتيّة أسّست وباعت شركتَين في مجال SaaS. تستثمر الآن في الشركات المبكّرة بالمنطقة العربيّة.",
      type: "angel" as const,
      investmentFocus: "SaaS, Marketplace, Women-led Startups",
      status: "visible" as const,
      sortOrder: 4,
    },
    {
      name: "Oraseya Capital",
      logoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=OC&backgroundColor=117a65&fontFamily=Arial&fontSize=38",
      websiteUrl: "https://oraseya.com",
      description: "صندوق استثمار مبكّر مقرّه دبي، يركّز على الاقتصادات الناشئة والتكنولوجيا التحويليّة في المنطقة العربيّة وإفريقيا.",
      type: "vc" as const,
      investmentFocus: "Impact Tech, Emerging Markets, B2B SaaS",
      status: "visible" as const,
      sortOrder: 5,
    },
    {
      name: "GIZ فلسطين",
      logoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=GIZ&backgroundColor=935116&fontFamily=Arial&fontSize=38",
      websiteUrl: "https://www.giz.de/en/worldwide/336.html",
      description: "الوكالة الألمانيّة للتعاون الدوليّ تدعم مشاريع التطوير الاقتصاديّ في فلسطين عبر برامج تدريب ودعم مؤسسيّ.",
      type: "ngo" as const,
      investmentFocus: "SME Development, Digital Economy, Vocational Training",
      status: "visible" as const,
      sortOrder: 6,
    },
    {
      name: "م. تامر أبو عمرة",
      logoUrl: "https://i.pravatar.cc/300?img=51",
      websiteUrl: "",
      description: "مهندس برمجيّات فلسطينيّ مقيم في كندا، شارك في بناء 3 شركات ناشئة ناجحة. يؤمن بأنّ أفضل استثمار هو في المواهب الغزاويّة.",
      type: "individual" as const,
      investmentFocus: "Tech Startups, Early Stage, Gaza Founders",
      status: "visible" as const,
      sortOrder: 7,
    },
    {
      name: "MedTech Hub MENA",
      logoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=MTH&backgroundColor=7b241c&fontFamily=Arial&fontSize=32",
      websiteUrl: "https://medtechhub.org",
      description: "مركز تسريع التكنولوجيا الصحيّة في المنطقة، يستثمر ويدعم الشركات الناشئة التي تحلّ مشاكل الرعاية الصحيّة.",
      type: "corporate" as const,
      investmentFocus: "HealthTech, MedTech, Digital Health",
      status: "visible" as const,
      sortOrder: 8,
    },
  ]);
  console.log("  ✓ 8 investors seeded");
}

async function seedNewsletter() {
  console.log("📧 Seeding newsletter subscribers (demo)...");
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  await db.insert(newsletterSubscribersTable).values([
    { email: "aya.hassan@example.ps",      name: "آية حسان",       status: "active" as const, subscribedAt: new Date(now - 1 * day) },
    { email: "ibrahim.saleh@example.ps",   name: "إبراهيم صالح",    status: "active" as const, subscribedAt: new Date(now - 3 * day) },
    { email: "mona.ashraf@example.ps",     name: "منى أشرف",        status: "active" as const, subscribedAt: new Date(now - 5 * day) },
    { email: "omar.farid@example.com",     name: "عمر فريد",        status: "active" as const, subscribedAt: new Date(now - 7 * day) },
    { email: "rima.khalil@example.com",    name: "ريما خليل",       status: "active" as const, subscribedAt: new Date(now - 9 * day) },
    { email: "youssef.ali@example.ps",     name: "يوسف علي",        status: "active" as const, subscribedAt: new Date(now - 11 * day) },
    { email: "dina.nabil@example.ps",      name: "دينا نبيل",       status: "active" as const, subscribedAt: new Date(now - 14 * day) },
    { email: "karim.hassan@example.com",   name: "كريم حسان",       status: "unsubscribed" as const, subscribedAt: new Date(now - 20 * day) },
    { email: "hala.mahmoud@example.ps",    name: "هلا محمود",       status: "active" as const, subscribedAt: new Date(now - 22 * day) },
    { email: "tarek.sami@example.ps",      name: "طارق سامي",       status: "active" as const, subscribedAt: new Date(now - 25 * day) },
    { email: "lara.zaki@example.com",      name: "لارا زكي",        status: "active" as const, subscribedAt: new Date(now - 28 * day) },
    { email: "ahmed.qasim@example.ps",     name: "أحمد قاسم",       status: "active" as const, subscribedAt: new Date(now - 30 * day) },
  ]);
  console.log("  ✓ 12 newsletter subscribers seeded");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://ahmedashraf@localhost/ih_haven_dev";
  }
  console.log(`🌱 Seeding new tables on ${process.env.DATABASE_URL}\n`);

  await clearNew();
  await seedStories();
  await seedJobs();
  await seedInvestors();
  await seedNewsletter();

  console.log("\n✅ New-tables seed complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ seed:new failed:", err);
  process.exit(1);
});
