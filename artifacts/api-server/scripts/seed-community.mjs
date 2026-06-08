// Seed the community layer so /members, /works, /gallery and the live /numbers
// counters are full and credible. Registers members (varied roles), fills their
// profiles, publishes portfolio works (covers drawn from the real /photos set),
// enrolls some in courses, and adds a few bookings + applications so every
// statistic on the "بالأرقام" page reflects real rows.
//
//   node scripts/seed-community.mjs

const BASE = process.env.SEED_API ?? "http://localhost:3001/api";
const PHOTOS = [
  "8300", "8303", "8304", "8307", "8308", "8313", "8314", "8341", "8344",
  "8345", "8346", "8347", "8349", "8352", "8353", "8356", "8357", "8358",
].map((n) => `/photos/IMG_${n}.webp`);
let photoIx = 0;
const nextPhoto = () => PHOTOS[photoIx++ % PHOTOS.length];

async function api(path, { method = "GET", token, body } = {}) {
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

const MEMBERS = [
  {
    fullName: "محمود العفّ", role: "freelancer", jobTitle: "مطوّر واجهات أماميّة",
    skills: "React، TypeScript، Tailwind، تطوير الويب",
    bio: "مطوّر واجهات شغوف ببناء تجارب سريعة وأنيقة. أعمل مع مشاريع ناشئة لتحويل تصاميمها إلى منتجات حيّة.",
    works: [
      { title: "لوحة تحكّم لمتجر إلكترونيّ", summary: "واجهة إدارة مبيعات ومخزون لحظيّة.", tags: "React، لوحة تحكّم، تجارة" },
      { title: "موقع تعريفيّ لمبادرة محليّة", summary: "هويّة رقميّة سريعة ومتجاوبة.", tags: "ويب، تصميم" },
    ],
  },
  {
    fullName: "آية أبو ندى", role: "graduate", jobTitle: "مصمّمة هويّة بصريّة",
    skills: "Figma، تصميم الهويّة، Illustrator، علامة تجاريّة",
    bio: "مصمّمة جرافيك أبني هويّات بصريّة تحكي قصص أصحابها. خرّيجة تصميم وأعمل بشغف على المشاريع المجتمعيّة.",
    works: [
      { title: "هويّة بصريّة لمبادرة إغاثيّة", summary: "شعار ونظام بصريّ متكامل.", tags: "هوية، شعار، براندينغ" },
    ],
  },
  {
    fullName: "كريم مقداد", role: "student", jobTitle: "مطوّر تطبيقات موبايل",
    skills: "Flutter، Dart، تصميم تطبيقات",
    bio: "طالب هندسة برمجيّات في السنة الأخيرة، أحبّ بناء تطبيقات تحلّ مشاكل يوميّة لأهل غزّة.",
    works: [
      { title: "تطبيق توصيل أدوية", summary: "يربط الصيدليّات بالمرضى وقت الأزمات.", tags: "Flutter، صحّة، موبايل" },
    ],
  },
  {
    fullName: "سارة الحلبي", role: "freelancer", jobTitle: "كاتبة محتوى ومسوّقة رقميّة",
    skills: "كتابة المحتوى، SEO، إدارة حملات، سوشال ميديا",
    bio: "أساعد المشاريع على إيصال رسالتها بكلمات تؤثّر وتبيع. خبرة في بناء حضور رقميّ من الصفر.",
    works: [
      { title: "حملة محتوى لمشروع ناشئ", summary: "استراتيجيّة محتوى رفعت التفاعل ٣ أضعاف.", tags: "تسويق، محتوى" },
    ],
  },
  {
    fullName: "أنس صبّاح", role: "graduate", jobTitle: "مطوّر خلفيّات (Backend)",
    skills: "Node.js، PostgreSQL، APIs، بنية الخوادم",
    bio: "مهندس برمجيّات أبني أنظمة موثوقة قابلة للتوسّع. خرّيج علوم حاسوب أعمل على البنية الخلفيّة للمشاريع.",
    works: [
      { title: "واجهة برمجيّة لإدارة المخزون", summary: "API آمنة وسريعة لمتاجر متعدّدة.", tags: "Node، API، Backend" },
      { title: "نظام مصادقة موحّد", summary: "تسجيل دخول آمن لعدّة تطبيقات.", tags: "أمان، Backend" },
    ],
  },
  {
    fullName: "ليان شاهين", role: "student", jobTitle: "مصمّمة تجربة مستخدم",
    skills: "UX، أبحاث المستخدم، Figma، النماذج الأوّليّة",
    bio: "طالبة تصميم تفاعليّ، أؤمن أنّ التصميم الجيّد يبدأ من الإصغاء للمستخدم.",
    works: [
      { title: "إعادة تصميم تطبيق حجز", summary: "رحلة حجز أبسط رفعت الإكمال ٤٠٪.", tags: "UX، تصميم، أبحاث" },
    ],
  },
  {
    fullName: "عمر زقّوت", role: "freelancer", jobTitle: "مهندس بيانات",
    skills: "Python، تحليل البيانات، لوحات المعلومات، SQL",
    bio: "أحوّل البيانات إلى قرارات. أبني لوحات تحليلات تساعد المنظّمات على فهم أثرها.",
    works: [
      { title: "لوحة تحليلات لمنظّمة إغاثة", summary: "تتبّع توزيع المساعدات لحظيًّا.", tags: "بيانات، تحليلات، Python" },
    ],
  },
  {
    fullName: "هلا أبو شاويش", role: "graduate", jobTitle: "مطوّرة Full-stack",
    skills: "React، Node.js، TypeScript، تطوير المنتجات",
    bio: "مطوّرة متكاملة أحبّ بناء المنتج من أوّله لآخره. خرّيجة حديثة شاركت في هاكثون البنّائين.",
    works: [
      { title: "منصّة تعلّم مصغّرة", summary: "دروس قصيرة تعمل حتّى مع ضعف الإنترنت.", tags: "تعليم، React، منتج" },
    ],
  },
];

async function main() {
  console.log("Seeding community…\n");
  const tokens = [];

  console.log("› Members + profiles + works");
  for (const m of MEMBERS) {
    const email = `member.${tokens.length + 1}@islandhaven.ps`;
    const reg = await api("/auth/register", {
      method: "POST",
      body: { email, password: "IslandHaven#2026", fullName: m.fullName, role: m.role },
    });
    if (!reg.ok) {
      console.log(`  ✗ register ${m.fullName} → ${reg.status} ${reg.j.error ?? ""}`);
      continue;
    }
    const token = reg.j.token;
    tokens.push(token);
    await api("/auth/me", {
      method: "PATCH",
      token,
      body: {
        bio: m.bio,
        jobTitle: m.jobTitle,
        skills: m.skills,
      },
    });
    for (const w of m.works) {
      const wr = await api("/works", {
        method: "POST",
        token,
        body: {
          title: w.title,
          summary: w.summary,
          description: `${w.summary} عمل أُنجز ضمن مجتمع آيلاند هيفن.`,
          coverUrl: nextPhoto(),
          galleryUrls: [nextPhoto()],
          tags: w.tags,
        },
      });
      if (!wr.ok) console.log(`    ✗ work "${w.title}" → ${wr.status}`);
    }
    console.log(`  ✓ ${m.fullName} (${m.role}) + ${m.works.length} عمل`);
  }

  // Enroll the first few members into open courses.
  console.log("\n› Enrollments");
  const courses = (await api("/courses")).j.courses ?? [];
  const open = courses.filter((c) => c.status === "open").slice(0, 3);
  let enrolls = 0;
  for (let i = 0; i < tokens.length && i < 5; i++) {
    const course = open[i % Math.max(open.length, 1)];
    if (!course) break;
    const r = await api(`/courses/${course.id}/enroll`, { method: "POST", token: tokens[i] });
    if (r.ok) enrolls++;
  }
  console.log(`  ✓ ${enrolls} تسجيل في الدورات`);

  // A couple of seat bookings (public). Pick the next non-Friday days.
  console.log("\n› Bookings");
  function nextDays(count) {
    const out = [];
    const d = new Date();
    while (out.length < count) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 5) out.push(new Date(d)); // skip Friday
    }
    return out.map((x) => x.toISOString().slice(0, 10));
  }
  const days = nextDays(2);
  const bookings = [
    { fullName: "زائر تجريبيّ ١", phone: "0599000001", email: "v1@example.com", visitDate: days[0], timeSlot: "morning", purpose: "work", attendees: 2, notes: "" },
    { fullName: "زائر تجريبيّ ٢", phone: "0599000002", email: "v2@example.com", visitDate: days[1], timeSlot: "afternoon", purpose: "study", attendees: 1, notes: "" },
  ];
  let bk = 0;
  for (const b of bookings) {
    const r = await api("/bookings", { method: "POST", body: b });
    if (r.ok) bk++;
    else console.log(`  ✗ booking → ${r.status} ${r.j.error ?? ""}`);
  }
  console.log(`  ✓ ${bk} حجز مقعد`);

  // A few membership applications.
  console.log("\n› Applications");
  const apps = [
    { fullName: "متقدّم ١", email: "a1@example.com", phone: "0599100001", category: "graduate", bio: "خرّيج هندسة برمجيّات أبحث عن مساحة لإطلاق مشروعي." },
    { fullName: "متقدّم ٢", email: "a2@example.com", phone: "0599100002", category: "freelancer", bio: "مصمّمة مستقلّة أرغب بالانضمام لمجتمع آيلاند." },
  ];
  let ap = 0;
  for (const a of apps) {
    const r = await api("/applications", { method: "POST", body: a });
    if (r.ok) ap++;
    else console.log(`  ✗ application → ${r.status} ${r.j.error ?? ""}`);
  }
  console.log(`  ✓ ${ap} طلب انتساب`);

  console.log("\n✅ Community seed complete.");
  const n = (await api("/numbers")).j.numbers;
  console.log("Live /numbers →", JSON.stringify(n));
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
