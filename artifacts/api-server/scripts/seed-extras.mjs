// Seed the newer pillars added in parallel: team members, cohorts, resources,
// and venture milestones — so /team, /cohorts, /resources and the venture
// milestone timeline are full and credible. Uses confirmed real facts.
//
//   node scripts/seed-extras.mjs

const BASE = process.env.SEED_API ?? "http://localhost:3001/api";
const USER = process.env.ADMIN_USERNAME ?? "ahmedashraf";
const PASS = process.env.ADMIN_PASSWORD ?? "ahmedadmin$$";
let token = "";

async function api(path, { method = "GET", body } = {}) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j };
}
const log = (label, r) =>
  console.log(`  ${r.ok ? "✓" : "✗"} ${label}${r.ok ? "" : ` → ${r.status} ${r.j.error ?? ""}`}`);

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

async function main() {
  const login = await api("/admin/login", { method: "POST", body: { username: USER, password: PASS } });
  if (!login.ok) throw new Error("admin login failed: " + JSON.stringify(login.j));
  token = login.j.token;
  console.log("✓ admin authenticated\n");

  // ── Team members ──────────────────────────────────────────────────────────
  console.log("› Team");
  const TEAM = [
    {
      fullName: "مهنّد جندية", role: "المدير ومؤسّس الحاضنة", group: "leadership", featured: true,
      bio: "قائد ومؤسّس آيلاند هيفن — يقود رؤية تمكين شباب غزّة عبر الاقتصاد الرقميّ. عقولٌ تقهر الركام وتبني المستقبل.",
    },
    {
      fullName: "أحمد أشرف", role: "مدير قسم الشراكات", group: "leadership", featured: true,
      bio: "يبني شراكات آيلاند هيفن مع المؤسّسات والشركات الداعمة ويوسّع شبكة الحاضنة.",
    },
    {
      fullName: "يوسف حلّس", role: "مدير قسم المحتوى", group: "leadership", featured: true,
      bio: "يقود إنتاج المحتوى والهويّة البصريّة والحضور الرقميّ للحاضنة.",
    },
    {
      fullName: "رؤى", role: "مساعد إداريّ للمدير", group: "leadership",
      bio: "تدعم إدارة المجتمع والعمليّات اليوميّة في آيلاند هيفن.",
    },
    {
      fullName: "د. ليان أبو سمرة", role: "مرشدة ريادة الأعمال", group: "mentors",
      bio: "ترافق روّاد الأعمال من الفكرة إلى نموذج العمل القابل للنموّ.",
    },
    {
      fullName: "م. أنس الشوّا", role: "مرشد تقنيّ — هندسة البرمجيّات والذكاء الاصطناعيّ", group: "mentors",
      bio: "يمكّن المطوّرين من بناء منتجات حقيقيّة بأدوات العصر.",
    },
    {
      fullName: "أ. رشا قديح", role: "مستشارة التمويل والاستثمار", group: "advisors",
      bio: "تجهّز الفرق للوصول إلى التمويل وبناء عرض استثماريّ مقنع.",
    },
  ];
  let sort = 0;
  for (const t of TEAM) log(t.fullName, await api("/admin/team", { method: "POST", body: { ...t, sortOrder: sort++ } }));

  // ── Resources ───────────────────────────────────────────────────────────────
  console.log("\n› Resources");
  const RESOURCES = [
    { title: "دليل بناء نموذج العمل (Business Model)", category: "guide", visibility: "public", summary: "خطوة بخطوة من الفكرة إلى نموذج عمل واضح.", tags: "نموذج العمل، ريادة", featured: true },
    { title: "قالب العرض الاستثماريّ (Pitch Deck)", category: "template", visibility: "members", summary: "قالب جاهز لعرض مشروعك أمام المستثمرين.", tags: "تمويل، عرض" },
    { title: "Replit — بيئة تطوير سحابيّة مجّانيّة", category: "tool", visibility: "public", summary: "برمجة من المتصفّح دون قيود الحدود والمعابر.", externalUrl: "https://replit.com", tags: "أدوات، برمجة" },
    { title: "دليل التحقّق من الفكرة قبل البناء", category: "guide", visibility: "public", summary: "كيف تختبر فكرتك مع مستخدمين حقيقيّين قبل كتابة أيّ كود.", tags: "تحقّق، أبحاث" },
    { title: "قالب الخطّة الماليّة المبسّطة", category: "template", visibility: "members", summary: "جدول جاهز لحساب تكاليفك وإيراداتك المتوقّعة.", tags: "ماليّة، تخطيط" },
    { title: "وصول مجّانيّ لأدوات الشركاء", category: "perk", visibility: "members", summary: "مزايا واشتراكات للمنتسبين عبر شبكة شركائنا.", tags: "مزايا، شركاء" },
  ];
  sort = 0;
  for (const r of RESOURCES) log(r.title, await api("/admin/resources", { method: "POST", body: { ...r, sortOrder: sort++ } }));

  // ── Cohorts (need a programId) ───────────────────────────────────────────────
  console.log("\n› Cohorts");
  const programs = (await api("/admin/programs")).j.programs ?? [];
  const findProg = (kw) => programs.find((p) => p.title?.includes(kw));
  const hackathon = findProg("هاكثون") ?? programs[0];
  const cohortProg = findProg("الاحتضان") ?? findProg("Cohort") ?? programs[0];
  if (hackathon) {
    log("هاكثون البنّائين ٢٠٢٥", await api("/admin/cohorts", { method: "POST", body: {
      programId: hackathon.id, name: "هاكثون البنّائين ٢٠٢٥", slug: "builders-2025",
      summary: "أوّل هاكثون من نوعه في غزّة — ١٥ فكرة ريادية بُنيت من الصفر.",
      description: "بالشراكة مع Replit وعوالم. معسكر مكثّف أنتج ١٥ فكرة ريادية عاملة، وتُوّج بمشروع «مستشارك» في المركز الثاني.",
      status: "completed", startsAt: daysFromNow(-30), endsAt: daysFromNow(-23), demoDayAt: daysFromNow(-23),
      demoDayLocation: "آيلاند هيفن — غزّة", sortOrder: 0,
    }}));
  }
  if (cohortProg) {
    log("الدفعة الأولى", await api("/admin/cohorts", { method: "POST", body: {
      programId: cohortProg.id, name: "الدفعة الأولى للاحتضان", slug: "cohort-01",
      summary: "١٢ أسبوعًا من الإرشاد المكثّف نحو أوّل عميل.",
      description: "دفعة الاحتضان الحاليّة — فرق ناشئة تعمل جنبًا إلى جنب مع مرشدين متخصّصين نحو يوم العرض.",
      status: "in_progress", startsAt: daysFromNow(-14), endsAt: daysFromNow(70), demoDayAt: daysFromNow(70),
      demoDayLocation: "آيلاند هيفن — غزّة", sortOrder: 1,
    }}));
  }

  // ── Venture milestones (for مستشارك) ─────────────────────────────────────────
  console.log("\n› Milestones (مستشارك)");
  const ventures = (await api("/ventures")).j.ventures ?? [];
  const mustasharak = ventures.find((v) => v.name?.includes("مستشارك")) ?? ventures[0];
  if (mustasharak) {
    const MS = [
      { title: "انطلاق الفكرة في هاكثون البنّائين", type: "idea", body: "فكرة منصّة قانونيّة تجعل القانون في متناول كلّ فلسطينيّ.", achievedAt: daysFromNow(-30) },
      { title: "بناء النموذج الأوّليّ خلال أيّام", type: "mvp", body: "نموذج عامل بمساعدة أدوات Replit والذكاء الاصطناعيّ.", achievedAt: daysFromNow(-26) },
      { title: "المركز الثاني في هاكثون البنّائين", type: "press", body: "تتويج المشروع بين ١٥ فكرة ريادية.", achievedAt: daysFromNow(-23) },
      { title: "أوّل مستخدمين حقيقيّين", type: "first_customer", body: "بدء استقبال أسئلة المواطنين القانونيّة.", achievedAt: daysFromNow(-10) },
    ];
    let s = 0;
    for (const m of MS) log(m.title, await api("/admin/milestones", { method: "POST", body: { ...m, ventureId: mustasharak.id, sortOrder: s++ } }));
  } else {
    console.log("  ✗ لم يُعثر على مشروع مستشارك");
  }

  console.log("\n✅ Extras seed complete.");
}

main().catch((e) => { console.error("Seed failed:", e.message); process.exit(1); });
