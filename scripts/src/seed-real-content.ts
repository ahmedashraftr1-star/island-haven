/**
 * Inserts the real Island Haven content (from the 2026 profile document)
 * into siteSettingsTable (the CMS) and replaces the demo programs with
 * the 5 real service tracks.
 *
 * Safe to re-run: uses ON CONFLICT DO UPDATE for settings,
 * and TRUNCATE + re-insert for programs.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run seed:content
 */
import { db, siteSettingsTable, programsTable, pool } from "@workspace/db";
import { sql } from "drizzle-orm";

async function upsertSection(key: string, value: Record<string, string>) {
  await db
    .insert(siteSettingsTable)
    .values({ key, value })
    .onConflictDoUpdate({
      target: siteSettingsTable.key,
      set: { value, updatedAt: sql`now()` },
    });
  console.log(`  ✓ content section "${key}" updated`);
}

async function seedCmsContent() {
  console.log("📝 Seeding CMS content from real profile document...");

  // ── Hero ──────────────────────────────────────────────────────────────────
  await upsertSection("hero", {
    eyebrow: "حاضنة الأعمال والمجتمع التقني الرائد في قطاع غزة",
    title1: "نهيّئك للعالم،",
    title2: "من قلب غزّة.",
    subtitle:
      "حاضنة أعمال ومجتمع تقني تأسّست من قلب قطاع غزة. نجسر الفجوة بين المواهب الغزية والعالم — بمساحات عمل احترافية، تدريب مكثّف، أرصدة سحابية، وحلول استقبال المدفوعات الدولية.",
    ctaPrimary: "انتسب الآن",
    ctaPrimaryHref: "/apply",
    ctaSecondary: "تحدّث معنا",
    ctaSecondaryHref: "https://wa.me/972567536815",
  });

  // ── About ─────────────────────────────────────────────────────────────────
  await upsertSection("about", {
    label: "من نحن",
    titleA: "حاضنة أعمال",
    titleAccent: "ومجتمع تقني",
    titleB: "— الرائد في قطاع غزة.",
    body: "Island Haven (آيلاند هيفن) هي حاضنة أعمال ومجتمع تقني، تأسّست من قلب قطاع غزة بقناعة راسخة بأن الموهبة لا تحدّها الجغرافيا، وأن الكفاءات الغزية قادرة على المنافسة عالميًا متى توفّرت لها البيئة والأدوات والاتصال الصحيح بالعالم.",
    quote:
      "«نحن لسنا مجرّد مكان للعمل — نحن جسر. جسر يهيّئ الإنسان الغزي مهنيًا وتقنيًا، ويضعه على خط المنافسة الحقيقي مع العالم.»",
    quoteAuthor: "— الملف التعريفي لآيلاند هيفن 2026",
    p1Ar: "رؤيتنا",
    p1En: "Vision",
    p1Body:
      "أن نكون نقطة الارتكاز الأولى للاقتصاد الرقمي في غزة، والوجهة التي يبدأ منها كل شاب طريقه نحو المنافسة والتفوق في السوق العالمي.",
    p2Ar: "رسالتنا",
    p2En: "Mission",
    p2Body:
      "تهيئة البيئة والأفراد في قطاع غزة مهنيًا وتقنيًا، من خلال مساحات عمل احترافية، وبرامج تدريب وتأهيل، وأدوات رقمية، وحلول مالية، وشبكة علاقات عالمية — لنجسر الفجوة بين المواهب الغزية والعالم.",
    p3Ar: "هدفنا الرئيسي",
    p3En: "Our Goal",
    p3Body:
      "تهيئة المواهب الغزية مهنيًا وتقنيًا، وربطها بفرص العمل والاستثمار العالمية، لتصل إلى مرحلة المنافسة والتفوق في سوق العمل العالمي.",
  });

  // ── Story ─────────────────────────────────────────────────────────────────
  await upsertSection("story", {
    label: "قصّتنا",
    titleA: "جسر",
    titleAccent: "حقيقيّ",
    titleB: "بين المواهب الغزية والعالم.",
    chapter: "الفصل الأوّل · المنشأ",
    lead: "وُلدت Island Haven من قناعة راسخة بأن الموهبة لا تحدّها الجغرافيا — وأن الكفاءات الغزية قادرة على المنافسة عالميًا متى توفّرت لها البيئة والأدوات والاتصال الصحيح بالعالم.",
    p1: "بدأنا بمساحة عمل مشتركة تستقبل الخريجين والمستقلين وطلاب الجامعات، وتطوّرنا تدريجيًا لنبني منظومة متكاملة تشمل التدريب والتأهيل، والأرصدة السحابية، وحلول استقبال المدفوعات، وتشبيك أعضائنا بالفرص المهنية حول العالم.",
    p2: "نحن لسنا مجرّد مكان للعمل — نحن جسر. جسر يهيّئ الإنسان الغزي مهنيًا وتقنيًا، ويضعه على خط المنافسة الحقيقي مع العالم، ويفتح أمامه الأبواب التي طالما حالت الجغرافيا والظروف بينه وبينها.",
    quote:
      "«Island Haven ليس مجرّد مساحة عمل. هو استثمار حقيقي في الإنسان الغزي — في موهبته، وطاقته، وقدرته على الوصول إلى العالم.»",
    stat1V: "2024",
    stat1L: "تأسّس",
    stat2V: "39",
    stat2L: "مقعد",
    stat3V: "100%",
    stat3L: "مجّاني",
  });

  // ── Audience (target groups) ───────────────────────────────────────────────
  await upsertSection("audience", {
    label: "من نخدم",
    titleA: "نخدم",
    titleAccent: "أربع فئات",
    titleB: "رئيسيّة من المواهب الغزية.",
    sub: "آيلاند هيفن مفتوح لكل من يمتلك الموهبة والإرادة — من الطالب الجامعي إلى صاحب المشروع الناشئ.",
    seg1Ar: "طلاب التقنية والبرمجة",
    seg1En: "Tech & Programming Students",
    seg1Pct: "25",
    seg1Tag: "University students in tech",
    seg1C1: "طالب في تخصّص تقني أو برمجي.",
    seg1C2: "رغبة في تطوير المهارات وتطبيقها على مشاريع حقيقية.",
    seg1C3: "الاستعداد للعمل ضمن بيئة مهنية منظّمة.",
    seg2Ar: "خرّيجو التخصصات التقنية",
    seg2En: "Tech Graduates",
    seg2Pct: "30",
    seg2Tag: "Recent tech graduates",
    seg2C1: "خرّيج تخصّص تقني أو هندسي.",
    seg2C2: "باحث عن بيئة عمل احترافية ومجتمع داعم.",
    seg2C3: "الاستعداد للتعلّم المستمر والمساهمة في المجتمع.",
    seg3Ar: "المستقلّون",
    seg3En: "Freelancers",
    seg3Pct: "30",
    seg3Tag: "Independent professionals",
    seg3C1: "يمارس العمل الحرّ في مجال تقني أو إبداعي.",
    seg3C2: "يحتاج بيئة عمل احترافية واتصالاً بسوق العمل العالمي.",
    seg3C3: "مستعدّ للمساهمة في دعم مجتمع الحاضنة.",
  });

  // ── Programs CMS section (homepage card text) ─────────────────────────────
  await upsertSection("programs", {
    label: "مساراتنا الخمسة",
    titleA: "منظومة متكاملة",
    titleAccent: "لتهيئتك للعالم.",
    sub: "خمسة مسارات مترابطة تُغطّي كل احتياجات المهني والمستقلّ وصاحب المشروع في غزة — من المساحة الاحترافية إلى الاتصال بالفرص العالمية.",
    sec1Ar: "مساحة العمل المشتركة",
    sec1En: "Co-working Space",
    sec1Body:
      "بيئة عمل مهنية مجهّزة بالكامل: إنترنت عالي السرعة، مقاعد مريحة، وجوّ يحفّز الإنتاجية — مفتوحة للخريجين والمستقلّين وطلاب الجامعات.",
    sec2Ar: "التدريب والفعاليات",
    sec2En: "Training & Events",
    sec2Body:
      "دورات تقنية ومهنية، ورش عمل تطبيقية، معسكرات تدريب مكثّفة وهاكاثونات — يقودها مدرّبون ومتخصّصون لرفع جاهزيّة الأعضاء لسوق العمل العالمي.",
    featureEyebrow: "Island Haven · 2026",
    featureTitle: "اتصال حقيقي بالعالم.",
    featureBody:
      "من مساحة العمل المشتركة في غزة إلى عملاء في برلين ودبي وتورنتو — آيلاند هيفن يوفّر الأرصدة السحابية وحلول المدفوعات والتشبيك الدولي لتكسر الحواجز الجغرافية.",
    featureCta: "تعرّف على المسارات",
    featureCtaHref: "/programs",
  });

  console.log("✅ CMS content updated successfully.\n");
}

async function seedRealPrograms() {
  console.log("🗂  Replacing demo programs with 5 real service tracks...");

  // Remove only demo programs (keep any that may have been manually added)
  await db.execute(sql`TRUNCATE programs RESTART IDENTITY CASCADE`);

  const week = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  await db.insert(programsTable).values([
    {
      title: "مساحة العمل المشتركة",
      summary: "بيئة عمل مهنيّة مجهّزة بالكامل في قلب غزة — إنترنت، مقاعد، وجوّ يحفّز الإنتاجيّة.",
      description:
        "مساحة عمل مشتركة (Co-working Space) تستقبل يوميًا الخريجين والمستقلّين وطلاب الجامعات. مجهّزة بإنترنت عالي السرعة، مقاعد مريحة، كهرباء مستمرة، قاعات اجتماعات، ومطبخ — كل ما تحتاجه لتعمل باحترافية.\n\nالمساحة ليست مجرّد مكتب — هي مجتمع. ستجد حولك أشخاصاً يبنون، يتعلّمون، ويتعاونون. الكثير من الشراكات والمشاريع وُلدت من جلسة عشوائية بين مقعدين في آيلاند هيفن.",
      coverUrl:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop",
      durationWeeks: 0,
      seats: 39,
      perks:
        "إنترنت ألياف ضوئية عالي السرعة\nكهرباء مستمرة\nمقاعد مريحة ومكاتب ذات تصميم مهني\nقاعات اجتماعات\nمطبخ ومشروبات\nأجواء عمل تحفيزية\nشبكة مجتمع نشط",
      tags: "Co-working, Space, Professionals, Freelancers, Graduates",
      startsAt: null,
      applyDeadline: null,
      status: "open" as const,
      sortOrder: 1,
    },
    {
      title: "الدورات التدريبية والفعاليات",
      summary: "دورات تقنية ومهنية، ورش عمل تطبيقية، هاكاثونات — يقودها متخصّصون لرفع جاهزيتك لسوق العمل العالمي.",
      description:
        "برامج تدريبية وتأهيلية مستمرة ومحدّثة تشمل دورات تقنية ومهنية، ورش عمل تطبيقية، معسكرات تدريب مكثّفة، وهاكاثونات — يقودها مدرّبون ومتخصّصون من داخل غزة وخارجها.\n\nهدف البرامج التدريبية واحد: رفع جاهزية الأعضاء لسوق العمل العالمي. لا نعلّمك النظريّات فقط — نضعك أمام تحديات حقيقية وأدوات فعليّة تحتاجها في عملك اليومي.\n\nالفعاليات مفتوحة للأعضاء وغير الأعضاء. بعضها مجاني وبعضها برسوم رمزية.",
      coverUrl:
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=600&fit=crop",
      durationWeeks: 0,
      seats: 0,
      perks:
        "دورات تقنية في البرمجة والتصميم والتسويق الرقمي\nورش عمل تطبيقية أسبوعية\nمعسكرات تدريب مكثّفة (Bootcamps)\nهاكاثونات ومسابقات\nمدرّبون من داخل غزة وخارجها\nشهادات حضور معتمدة",
      tags: "Training, Workshops, Bootcamps, Hackathons, Skills",
      startsAt: new Date(now + 2 * week),
      applyDeadline: new Date(now + 1 * week),
      status: "open" as const,
      sortOrder: 2,
    },
    {
      title: "الأرصدة السحابية",
      summary: "أرصدة سحابية مجانية على كبرى المنصات العالمية لتطوير مشاريعك ومهاراتك دون عوائق مادية.",
      description:
        "يُمكّن آيلاند هيفن أعضاءه من الحصول على أرصدة سحابية مجانية (Cloud Credits) على كبرى المنصات العالمية كـ AWS و Google Cloud و Microsoft Azure و Replit وغيرها — مع دعم تقني لاستخدامها في تطوير المشاريع والمهارات.\n\nواحدة من أكبر العوائق أمام المطوّرين الغزيين هي تكلفة الأدوات والبنية التحتية السحابية. هذا المسار يزيل تلك العائقة تمامًا — تحصل على الأدوات التي يستخدمها مطوّرو العالم، بنفس الجودة، وبدون تكلفة.",
      coverUrl:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop",
      durationWeeks: 0,
      seats: 0,
      perks:
        "أرصدة AWS للبنية التحتية السحابية\nأرصدة Google Cloud للمشاريع التقنية\nأرصدة Replit للتطوير السحابي\nدعم تقني لإعداد واستخدام المنصات\nتدريب على Cloud Architecture",
      tags: "Cloud, AWS, Google Cloud, Credits, DevOps, Infrastructure",
      startsAt: null,
      applyDeadline: null,
      status: "open" as const,
      sortOrder: 3,
    },
    {
      title: "حلول استقبال المدفوعات",
      summary: "حلول عملية لاستقبال المدفوعات الدولية — تمكّنك من العمل مع عملاء حول العالم دون عوائق مالية.",
      description:
        "واحدة من أكبر التحديات التي يواجهها المستقلّون وأصحاب المشاريع في غزة هي استقبال المدفوعات من العملاء الدوليين. يقدّم آيلاند هيفن تسهيلات وحلولاً عملية لحلّ هذه المشكلة.\n\nنعمل على توفير بدائل حقيقية وآليات موثوقة تُمكّن الأعضاء من إتمام معاملاتهم المالية الدولية وتحصيل حقوقهم من عملائهم حول العالم — دون أن تكون الجغرافيا عائقًا في طريق رزقهم.\n\nهذا المسار ليس فقط خدمة — هو حل لأحد أعقد وأكثر المشاكل تأثيرًا على الاقتصاد الرقمي الغزي.",
      coverUrl:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop",
      durationWeeks: 0,
      seats: 0,
      perks:
        "حلول استقبال مدفوعات من Payoneer وغيرها\nتوجيه لآليات التحويل الدولي\nدعم قانوني ومالي للمستقلّين\nتدريب على إدارة العلاقات مع العملاء الدوليين\nشبكة عملاء دوليين",
      tags: "Payments, Payoneer, Freelance, International, Finance",
      startsAt: null,
      applyDeadline: null,
      status: "open" as const,
      sortOrder: 4,
    },
    {
      title: "تشبيك العلاقات وربط بالفرص العالمية",
      summary: "شبكة علاقات حقيقية تربطك بفرص العمل والتدريب والاستثمار حول العالم — عبر شركاء ومرشدين دوليين.",
      description:
        "قاعدة بيانات وشبكة علاقات تربط أعضاء آيلاند هيفن بفرص العمل والتدريب والاستثمار حول العالم، عبر شركاء ومرشدين دوليين.\n\nالتشبيك ليس مجرّد تبادل بطاقات أعمال — هو بناء علاقات حقيقية مع أشخاص يؤمنون بالموهبة الغزية ويريدون المساهمة في تطويرها. شركاؤنا الدوليون يشاركون في فعاليّات، يقدّمون منحًا، ويفتحون أبواب توظيف حقيقية.\n\nمن خلال هذا المسار ستتواصل مع خبراء ومرشدين من المنطقة والعالم، وستجد فرص عمل حقيقية تناسب مهاراتك.",
      coverUrl:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=600&fit=crop",
      durationWeeks: 0,
      seats: 0,
      perks:
        "قاعدة بيانات فرص عمل دولية\nجلسات إرشاد مع خبراء من المنطقة والعالم\nفعاليات تشبيك شهرية\nشراكات مع شركات ومنظمات دولية\nبرامج منح وتمويل خارجي",
      tags: "Networking, Jobs, Mentorship, Opportunities, Global",
      startsAt: null,
      applyDeadline: null,
      status: "open" as const,
      sortOrder: 5,
    },
  ]);

  console.log("  ✓ 5 real service tracks inserted");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://ahmedashraf@localhost/ih_haven_dev";
  }
  console.log(`\n🌱 Seeding real content on ${process.env.DATABASE_URL}\n`);

  await seedCmsContent();
  await seedRealPrograms();

  console.log("\n✅ Real content seed complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ seed:content failed:", err);
  process.exit(1);
});
