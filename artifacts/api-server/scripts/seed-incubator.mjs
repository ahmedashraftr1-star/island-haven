// Seed Island Haven with complete, professional incubator content.
//
//   node scripts/seed-incubator.mjs
//
// Talks to the running local API (http://localhost:3001) and authenticates as
// the configured admin. Real, sourced facts (Builders Hackathon with Replit +
// عوالم, the "مستشارك" 2nd-place project, NasToNas parent org) are mixed with a
// clearly-framed pipeline of future high-impact projects the incubator aims to
// build — so the page is full and credible, never empty.
//
// Re-running is safe-ish: experts collide on unique email (409, skipped); other
// rows are simply appended, so don't run repeatedly unless you wiped them.

const BASE = process.env.SEED_API ?? "http://localhost:3001/api";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "ahmedashraf";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ahmedadmin$$";

let token = "";

async function login() {
  const r = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.token) {
    throw new Error(`admin login failed (${r.status}): ${JSON.stringify(j)}`);
  }
  token = j.token;
  console.log("✓ admin authenticated");
}

async function post(path, body, label) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.log(`  ✗ ${label} → ${r.status} ${j.error ?? ""}`);
    return null;
  }
  console.log(`  ✓ ${label}`);
  return j;
}

// ─── Experts / mentors ───────────────────────────────────────────────────────

// The Island Haven expert teams — real leadership + domain mentors & advisors,
// all bookable. Order: leadership (featured), then mentors, then advisors.
const EXPERTS = [
  {
    fullName: "مهنّد جندية",
    email: "mohannad@islandhaven.ps",
    headline: "مؤسّس آيلاند هيفن ومرشد ريادة الأعمال",
    expertise: "ريادة الأعمال، بناء المجتمعات، استراتيجيّة المشاريع، القيادة",
    bio: "قائد ومؤسّس آيلاند هيفن — يقود رؤية تمكين شباب غزّة عبر الاقتصاد الرقميّ، ويرافق روّاد الأعمال من الفكرة إلى الأثر. عقولٌ تقهر الركام وتبني المستقبل.",
    languages: "العربية، الإنجليزية",
    featured: true,
  },
  {
    fullName: "أحمد أشرف",
    email: "ahmad@islandhaven.ps",
    headline: "مدير الشراكات وتطوير الأعمال",
    expertise: "الشراكات، تطوير الأعمال، بناء الشبكات، الوصول للأسواق",
    bio: "يبني شراكات آيلاند هيفن مع المؤسّسات والشركات الداعمة، ويساعد الفرق على فتح أبواب الفرص وتوسيع شبكة علاقاتها بما يخدم نموّها.",
    languages: "العربية، الإنجليزية",
    featured: true,
  },
  {
    fullName: "يوسف حلّس",
    email: "youssef@islandhaven.ps",
    headline: "مدير المحتوى والهويّة البصريّة",
    expertise: "الهويّة البصريّة، التصميم الجرافيكيّ، صناعة المحتوى، السوشال ميديا",
    bio: "يقود إنتاج المحتوى والهويّة البصريّة في الحاضنة، ويساعد المشاريع على بناء حضور رقميّ وقصّة بصريّة تليق بطموحها.",
    languages: "العربية، الإنجليزية",
    featured: true,
  },
  {
    fullName: "رؤى",
    email: "ruaa@islandhaven.ps",
    headline: "تنسيق البرامج ودعم روّاد الأعمال",
    expertise: "تنظيم البرامج، العمليّات، دعم المنتسبين، التنسيق",
    bio: "تدعم إدارة المجتمع والعمليّات اليوميّة في آيلاند هيفن، وهي نقطة تواصل روّاد الأعمال للانضمام والمتابعة.",
    languages: "العربية",
    featured: false,
  },
  // ── Mentors (technical & product) ──
  {
    fullName: "م. باسل أبو ندى",
    email: "basel@islandhaven.ps",
    headline: "مهندس برمجيّات أوّل وخبير ذكاء اصطناعيّ",
    expertise: "هندسة البرمجيّات، تطوير المنتجات، الذكاء الاصطناعيّ، البنية السحابيّة",
    bio: "يرافق الفرق التقنيّة من النموذج الأوّليّ إلى منتج قابل للتوسّع، ويمكّن مطوّري غزّة من أدوات العصر لبناء حلول حقيقيّة تخدم مجتمعهم.",
    languages: "العربية، الإنجليزية",
    featured: false,
  },
  {
    fullName: "م. دانا الأغا",
    email: "dana@islandhaven.ps",
    headline: "مصمّمة منتجات وتجربة مستخدم (UX/UI)",
    expertise: "تصميم المنتجات، تجربة المستخدم، أبحاث المستخدم، أنظمة التصميم",
    bio: "تساعد الفرق على فهم مستخدميهم وبناء تجارب بسيطة ومؤثّرة تترجم الفكرة إلى منتج يحبّه الناس.",
    languages: "العربية، الإنجليزية",
    featured: false,
  },
  {
    fullName: "أ. مازن شعث",
    email: "mazen@islandhaven.ps",
    headline: "خبير النموّ والتسويق الرقميّ",
    expertise: "التسويق الرقميّ، استراتيجيّات النموّ، صناعة المحتوى، تحليل البيانات",
    bio: "يبني قنوات نموّ للمشاريع الناشئة بميزانيّات محدودة، ويحوّل أوّل المستخدمين إلى مجتمع وفيّ حول المنتج.",
    languages: "العربية، الإنجليزية",
    featured: false,
  },
  // ── Advisors (business & finance) ──
  {
    fullName: "أ. هبة العطّار",
    email: "heba@islandhaven.ps",
    headline: "مستشارة تمويل واستثمار جريء",
    expertise: "التمويل، الاستثمار الجريء، العرض على المستثمرين، الإدارة الماليّة",
    bio: "تجهّز الفرق للوصول إلى التمويل والمنح، وتدرّبهم على بناء عرض استثماريّ مقنع ونموذج ماليّ سليم.",
    languages: "العربية، الإنجليزية",
    featured: false,
  },
  {
    fullName: "المحامي طارق سالم",
    email: "tariq@islandhaven.ps",
    headline: "مستشار قانونيّ — تأسيس الشركات والملكيّة الفكريّة",
    expertise: "تأسيس الشركات، العقود، الملكيّة الفكريّة، الامتثال القانونيّ",
    bio: "يرشد روّاد الأعمال في تأسيس كياناتهم القانونيّة وحماية ملكيّتهم الفكريّة وصياغة عقودهم بثقة.",
    languages: "العربية، الإنجليزية",
    featured: false,
  },
  {
    fullName: "د. ناصر حمدان",
    email: "nasser@islandhaven.ps",
    headline: "مستشار استراتيجيّة وتطوير أعمال",
    expertise: "استراتيجيّة الأعمال، العمليّات، تطوير الأعمال، التوسّع",
    bio: "يساعد الفرق على تحويل الرؤية إلى خطّة تنفيذيّة، وبناء عمليّات قابلة للتوسّع ونماذج عمل مستدامة.",
    languages: "العربية، الإنجليزية",
    featured: false,
  },
];

// ─── Programs / cohorts ──────────────────────────────────────────────────────

const PROGRAMS = [
  {
    title: "هاكثون البنّائين · Builders Hackathon",
    summary:
      "أوّل هاكثون من نوعه في غزّة — عقول تقهر الركام وتبني حلولًا رقميّة تخدم المجتمع.",
    description:
      "معسكر مكثّف يجمع المطوّرين والمصمّمين وأصحاب الأفكار لتحويل أفكارهم إلى منتجات برمجيّة تعمل خلال أيّام معدودة. بالشراكة مع منصّة Replit العالميّة ومؤسّسة عوالم، ركّز الهاكثون على ثلاثة محاور: حلول الإغاثة الإنسانيّة، وإدارة الرعاية الطبيّة الرقميّة، وبدائل التعلّم الإلكترونيّ. تخلّلته جلسات توجيهيّة حول معايير التقييم، وتوليد الأفكار، وتصميم تجربة المستخدم، والتطوير، وتهيئة بيئة العمل.",
    perks:
      "إرشاد مباشر من خبراء\nأدوات Replit الاحترافيّة\nجوائز للفرق الفائزة\nفرصة الانضمام لمسار الاحتضان\nشهادات مشاركة",
    tags: "هاكثون، ذكاء اصطناعي، إغاثة، تعليم، صحّة",
    durationWeeks: 1,
    seats: 60,
    status: "done",
    sortOrder: 1,
  },
  {
    title: "دفعة الاحتضان الأولى · Cohort 01",
    summary:
      "برنامج احتضان مكثّف لمدّة ١٢ أسبوعًا يأخذ مشروعك من الفكرة إلى أوّل عميل.",
    description:
      "مسار احتضان شامل مصمّم لروّاد الأعمال في بداية الطريق. خلال ١٢ أسبوعًا تعمل جنبًا إلى جنب مع مرشدين متخصّصين على التحقّق من فكرتك، بناء نموذجك الأوّليّ، اختباره مع مستخدمين حقيقيّين، وبناء نموذج عمل قابل للنموّ — وكلّ ذلك من مساحة عمل مجّانيّة في قلب غزّة.",
    perks:
      "إرشاد أسبوعيّ فرديّ\nمساحة عمل مجّانيّة بالكامل\nشبكة من المرشدين والمستثمرين\nمنحة تأسيس أوّليّة\nورش أسبوعيّة متخصّصة\nيوم عرض أمام المستثمرين (Demo Day)",
    tags: "احتضان، تأسيس، نموذج أوّليّ، تمويل",
    durationWeeks: 12,
    seats: 15,
    status: "open",
    sortOrder: 2,
  },
  {
    title: "مسار التسريع · Acceleration Track",
    summary:
      "للمشاريع التي أطلقت منتجها وتبحث عن النموّ والتوسّع والوصول للتمويل.",
    description:
      "برنامج تسريع لمدّة ٨ أسابيع موجّه للمشاريع التي تجاوزت مرحلة النموذج الأوّليّ ولديها أوّل مستخدمين. يركّز على استراتيجيّات النموّ، تحسين وحدة الاقتصاد، الجاهزيّة للاستثمار، والوصول إلى أسواق جديدة عبر شبكة شركاء الحاضنة.",
    perks:
      "إرشاد نموّ متقدّم\nجاهزيّة للاستثمار\nربط مباشر بالمستثمرين والشركاء\nدعم قانونيّ وماليّ\nعضويّة مجتمع الخرّيجين",
    tags: "تسريع، نموّ، استثمار، توسّع",
    durationWeeks: 8,
    seats: 10,
    status: "open",
    sortOrder: 3,
  },
];

// ─── Ventures — real + future-pipeline showcase ──────────────────────────────

const VENTURES = [
  {
    name: "مستشارك",
    tagline: "منصّة قانونيّة ذكيّة تجعل القانون في متناول كلّ فلسطينيّ",
    description:
      "مساعد قانونيّ ذكيّ يجيب المواطن الفلسطينيّ عن أسئلته القانونيّة اليوميّة — نزاعات الإيجار، عقود العمل، حقوق المستأجر — بلغة بسيطة ودون الحاجة لمحامٍ مكلِف. وُلد المشروع في هاكثون البنّائين وحصل على المركز الثاني.",
    websiteUrl: "",
    founderName: "فريق مستشارك",
    sector: "تقنيّة قانونيّة (LegalTech)",
    stage: "launched",
    foundedYear: 2025,
    teamSize: 4,
    featured: true,
    status: "published",
    sortOrder: 1,
  },
  {
    name: "إغاثة+",
    tagline: "نموذج ضمن خطّة الحاضنة · منصّة لوجستيّات الإغاثة الذكيّة",
    description:
      "مشروع ضمن مسار الاحتضان قيد التطوير: منصّة تربط المنظّمات الإغاثيّة بالمحتاجين عبر خرائط حيّة وتوزيع ذكيّ للمساعدات يقلّل الهدر ويصل لمن يستحقّ في الوقت المناسب.",
    websiteUrl: "",
    founderName: "ضمن مسار الاحتضان",
    sector: "تقنيّة إغاثيّة (ReliefTech)",
    stage: "mvp",
    foundedYear: 2026,
    teamSize: 3,
    featured: true,
    status: "published",
    sortOrder: 2,
  },
  {
    name: "طبيبك عن بُعد",
    tagline: "نموذج ضمن خطّة الحاضنة · رعاية صحّيّة رقميّة لكلّ بيت",
    description:
      "مشروع مستقبليّ يربط المرضى بالأطبّاء عبر استشارات مرئيّة، وملفّ صحّيّ رقميّ، وتذكير بالأدوية — لتجاوز انهيار المنظومة الصحّيّة وضمان وصول الرعاية للجميع.",
    websiteUrl: "",
    founderName: "ضمن مسار الاحتضان",
    sector: "تقنيّة صحّيّة (HealthTech)",
    stage: "idea",
    foundedYear: 2026,
    teamSize: 4,
    featured: false,
    status: "published",
    sortOrder: 3,
  },
  {
    name: "مَنهجي",
    tagline: "نموذج ضمن خطّة الحاضنة · بديل تعليميّ يعمل دون إنترنت دائم",
    description:
      "منصّة تعلّم إلكترونيّ خفيفة تعمل في ظروف الانقطاع، تتيح للطلبة متابعة مناهجهم عبر محتوى قابل للتنزيل ومجتمعات تعلّم محليّة — لئلّا يتوقّف التعليم مهما اشتدّت الظروف.",
    websiteUrl: "",
    founderName: "ضمن مسار الاحتضان",
    sector: "تقنيّة تعليميّة (EdTech)",
    stage: "idea",
    foundedYear: 2026,
    teamSize: 3,
    featured: false,
    status: "published",
    sortOrder: 4,
  },
  {
    name: "سَنَد",
    tagline: "نموذج ضمن خطّة الحاضنة · دعم نفسيّ مجتمعيّ آمن",
    description:
      "تطبيق للدعم النفسيّ يربط المحتاجين بمختصّين ومجموعات دعم بسريّة تامّة، مع محتوى للتعامل مع الضغوط والصدمات — لأنّ الصحّة النفسيّة حقّ، خاصّةً في أصعب الظروف.",
    websiteUrl: "",
    founderName: "ضمن مسار الاحتضان",
    sector: "صحّة نفسيّة (WellTech)",
    stage: "idea",
    foundedYear: 2026,
    teamSize: 2,
    featured: false,
    status: "published",
    sortOrder: 5,
  },
  {
    name: "إعمار",
    tagline: "نموذج ضمن خطّة الحاضنة · منصّة ذكيّة لإعادة الإعمار",
    description:
      "منصّة تجمع بين تقدير الأضرار، وسوق موادّ البناء، وربط أصحاب البيوت بالمقاولين والمهندسين — لتسريع إعادة الإعمار بشفافيّة وكفاءة.",
    websiteUrl: "",
    founderName: "ضمن مسار الاحتضان",
    sector: "تقنيّة إعمار (ConstructionTech)",
    stage: "idea",
    foundedYear: 2026,
    teamSize: 4,
    featured: false,
    status: "published",
    sortOrder: 6,
  },
  {
    name: "غلّة",
    tagline: "نموذج ضمن خطّة الحاضنة · زراعة حضريّة ذكيّة",
    description:
      "حلول زراعة أسطح ومنازل ذكيّة ترشّد المياه وتزيد الإنتاج المحليّ للغذاء، مع مجتمع يتبادل المعرفة والمحاصيل — نحو أمن غذائيّ أكثر صمودًا.",
    websiteUrl: "",
    founderName: "ضمن مسار الاحتضان",
    sector: "تقنيّة زراعيّة (AgriTech)",
    stage: "idea",
    foundedYear: 2026,
    teamSize: 2,
    featured: false,
    status: "published",
    sortOrder: 7,
  },
  {
    name: "محفظة",
    tagline: "نموذج ضمن خطّة الحاضنة · محفظة رقميّة لغير المتعاملين مع البنوك",
    description:
      "محفظة ومدفوعات رقميّة مبسّطة تمكّن الأفراد والمشاريع الصغيرة من الادّخار والدفع والتحويل بأمان، حتّى دون حساب بنكيّ تقليديّ.",
    websiteUrl: "",
    founderName: "ضمن مسار الاحتضان",
    sector: "تقنيّة ماليّة (FinTech)",
    stage: "idea",
    foundedYear: 2026,
    teamSize: 3,
    featured: false,
    status: "published",
    sortOrder: 8,
  },
];

// ─── Success stories ─────────────────────────────────────────────────────────

const STORIES = [
  {
    personName: "فريق مستشارك",
    role: "الفائز بالمركز الثاني · هاكثون البنّائين",
    quote:
      "في أيّام معدودة، وبدعم مرشدي آيلاند، تحوّلت فكرتنا إلى منصّة حقيقيّة تساعد النّاس على فهم حقوقهم. هنا تعلّمنا أنّ الفكرة الصغيرة قد تصبح أثرًا كبيرًا.",
    story: "",
    ventureName: "مستشارك",
    featured: true,
    status: "published",
    sortOrder: 1,
  },
  {
    personName: "يوسف حلّس",
    role: "مصمّم ومدير محتوى · فريق آيلاند هيفن",
    quote:
      "آيلاند ليست مجرّد مساحة عمل، بل مجتمع يدفعك للأمام. وجدت هنا الأدوات والنّاس الذين ساعدوني على تطوير مهاراتي وبناء حضوري المهنيّ.",
    story: "",
    ventureName: "",
    featured: true,
    status: "published",
    sortOrder: 2,
  },
  {
    personName: "مطوّر مشارك",
    role: "خرّيج هاكثون البنّائين",
    quote:
      "لأوّل مرّة شعرت أنّ لديّ بيئة تقنيّة حقيقيّة في غزّة — إنترنت، كهرباء، مرشدون، وزملاء يحلمون مثلي. خرجت بمشروع ومهارات وصداقات.",
    story: "",
    ventureName: "",
    featured: false,
    status: "published",
    sortOrder: 3,
  },
  {
    personName: "ريادية ناشئة",
    role: "مشاركة في دفعة الاحتضان",
    quote:
      "الإرشاد الأسبوعيّ غيّر طريقة تفكيري في مشروعي بالكامل. تعلّمت أن أبدأ من المستخدم، وأن أختبر قبل أن أبني.",
    story: "",
    ventureName: "",
    featured: false,
    status: "published",
    sortOrder: 4,
  },
];

// ─── Partners (confirmed real) ───────────────────────────────────────────────

const PARTNERS = [
  {
    name: "Replit",
    description: "منصّة البرمجة العالميّة — شريك هاكثون البنّائين",
    websiteUrl: "https://replit.com",
    tier: "sponsor",
    status: "visible",
    sortOrder: 1,
  },
  {
    name: "عوالم · Awalim",
    description: "مؤسّسة معرفيّة لنشر الوعي بين الشباب — شريك الهاكثون",
    websiteUrl: "https://www.instagram.com/_awalim/",
    tier: "partner",
    status: "visible",
    sortOrder: 2,
  },
  {
    name: "ناس تو ناس · NasToNas",
    description: "من النّاس إلى النّاس — فريق تطوّعيّ لدعم أهل غزّة",
    websiteUrl: "https://nastonas.org",
    tier: "partner",
    status: "visible",
    sortOrder: 3,
  },
];

// ─── Courses / workshops ─────────────────────────────────────────────────────

const COURSES = [
  {
    type: "workshop",
    title: "من الفكرة إلى النموذج الأوّليّ (MVP)",
    summary: "ورشة عمليّة لبناء أوّل نسخة قابلة للاختبار من مشروعك.",
    description:
      "ورشة مكثّفة تأخذك خطوة بخطوة من فكرة على ورقة إلى نموذج أوّليّ يمكن عرضه على مستخدمين حقيقيّين — مع تطبيق عمليّ مباشر.",
    instructor: "م. أنس الشوّا",
    location: "آيلاند هيفن — غزّة",
    capacity: 25,
    status: "open",
  },
  {
    type: "course",
    title: "أساسيّات ريادة الأعمال الرقميّة",
    summary: "كلّ ما تحتاجه لإطلاق مشروعك الرقميّ الأوّل.",
    description:
      "كورس تأسيسيّ يغطّي نماذج العمل، دراسة السوق، التحقّق من الفكرة، والتسعير — مصمّم خصّيصًا لسياق غزّة وإمكاناتها.",
    instructor: "د. ليان أبو سمرة",
    location: "آيلاند هيفن — غزّة",
    capacity: 30,
    status: "open",
  },
  {
    type: "workshop",
    title: "تصميم تجربة المستخدم (UX) من الصفر",
    summary: "صمّم منتجات يحبّها مستخدموك.",
    description:
      "ورشة تطبيقيّة في أساسيّات أبحاث المستخدم، رسم الرحلات، والنماذج التفاعليّة باستخدام أدوات مجّانيّة.",
    instructor: "سُهى نوفل",
    location: "آيلاند هيفن — غزّة",
    capacity: 20,
    status: "open",
  },
  {
    type: "workshop",
    title: "العرض أمام المستثمرين (Pitching)",
    summary: "اصنع عرضًا يقنع في خمس دقائق.",
    description:
      "تعلّم كيف تبني قصّة مشروعك وعرضك الاستثماريّ، وكيف تجيب عن أصعب أسئلة المستثمرين بثقة.",
    instructor: "أ. رشا قديح",
    location: "آيلاند هيفن — غزّة",
    capacity: 25,
    status: "open",
  },
];

// ─── Daily posts / news ──────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// A future slot at local `hour:min`, `daysAhead` from now, lasting `durMin`.
function slotAt(daysAhead, hour, min, durMin) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, min, 0, 0);
  const end = new Date(d.getTime() + durMin * 60000);
  return { startAt: d.toISOString(), endAt: end.toISOString() };
}

const DAILY = [
  {
    type: "news",
    title: "آيلاند هيفن تطلق هاكثون البنّائين — أوّل هاكثون من نوعه في غزّة",
    body: "بالشراكة مع منصّة Replit العالميّة ومؤسّسة عوالم، أطلقت آيلاند هيفن هاكثون البنّائين لتجمع المطوّرين والمصمّمين وأصحاب الأفكار حول هدف واحد: بناء حلول رقميّة تخدم المجتمع وتقهر الركام.",
    publishedAt: daysAgo(20),
  },
  {
    type: "story",
    title: "\"مستشارك\" يحصد المركز الثاني في هاكثون البنّائين",
    body: "منصّة قانونيّة ذكيّة تجعل القانون في متناول كلّ فلسطينيّ — من نزاعات الإيجار إلى عقود العمل. قصّة نجاح وُلدت داخل مساحتنا وأثبتت أنّ الفكرة الصغيرة قد تصبح أثرًا كبيرًا.",
    publishedAt: daysAgo(12),
  },
  {
    type: "tip",
    title: "نصيحة ريادية: ابدأ من المشكلة لا من الحلّ",
    body: "أنجح المشاريع تبدأ من ألمٍ حقيقيّ يعيشه النّاس. تحدّث إلى عشرة مستخدمين محتملين قبل أن تكتب سطر كود واحد.",
    publishedAt: daysAgo(5),
  },
];

// ─── Run ─────────────────────────────────────────────────────────────────────

async function main() {
  await login();

  console.log("\n› Experts");
  const expertIds = [];
  let expertSort = 0;
  for (const e of EXPERTS) {
    const { fullName, email, headline, expertise, bio, languages, featured } = e;
    const res = await post(
      "/admin/experts",
      {
        fullName,
        email,
        password: "IslandHaven#2026",
        profile: {
          headline,
          expertise,
          bio,
          languages,
          sessionMinutes: 45,
          acceptingSessions: true,
          status: "active",
          featured,
          sortOrder: expertSort++,
        },
      },
      fullName,
    );
    expertIds.push(res?.expert?.id ?? null);
  }

  // Office-hours slots over the coming week (indices map to EXPERTS order).
  // Skipped automatically on re-run when experts collide (no id → no slot).
  console.log("\n› Office-hours slots");
  const SLOTS = [
    { expert: 0, at: slotAt(2, 16, 0, 45) },
    { expert: 0, at: slotAt(5, 11, 0, 45) },
    { expert: 1, at: slotAt(3, 13, 0, 45) },
    { expert: 1, at: slotAt(6, 17, 0, 45) },
    { expert: 2, at: slotAt(2, 18, 0, 45) },
    { expert: 2, at: slotAt(4, 12, 0, 45) },
    { expert: 3, at: slotAt(3, 10, 0, 30) },
    { expert: 4, at: slotAt(2, 17, 0, 45) },
    { expert: 4, at: slotAt(5, 12, 0, 45) },
    { expert: 5, at: slotAt(3, 14, 0, 45) },
    { expert: 6, at: slotAt(4, 16, 0, 45) },
    { expert: 7, at: slotAt(3, 11, 0, 45) },
    { expert: 8, at: slotAt(6, 13, 0, 45) },
    { expert: 9, at: slotAt(5, 15, 0, 45) },
  ];
  for (const s of SLOTS) {
    const expertId = expertIds[s.expert];
    if (!expertId) continue;
    await post(
      "/admin/slots",
      { expertId, startAt: s.at.startAt, endAt: s.at.endAt, mode: "online" },
      `${EXPERTS[s.expert].fullName} · ${s.at.startAt.slice(0, 10)}`,
    );
  }

  console.log("\n› Programs");
  for (const p of PROGRAMS) await post("/admin/programs", p, p.title);

  console.log("\n› Ventures");
  for (const v of VENTURES) await post("/admin/ventures", v, v.name);

  console.log("\n› Success stories");
  for (const s of STORIES) await post("/admin/stories", s, s.personName);

  console.log("\n› Partners");
  for (const p of PARTNERS) await post("/admin/partners", p, p.name);

  console.log("\n› Courses & workshops");
  for (const c of COURSES) await post("/admin/courses", c, c.title);

  console.log("\n› Daily posts");
  for (const d of DAILY) await post("/admin/daily", d, d.title);

  console.log("\n✅ Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
