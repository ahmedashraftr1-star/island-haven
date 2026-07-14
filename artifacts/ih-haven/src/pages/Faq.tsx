import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { PageShell } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { I18N } from "@/lib/i18n";

type Bi = { ar: string; en: string };
type QA = { id: string; q: Bi; a: Bi };
type Category = { id: string; label: Bi; lede: Bi; items: QA[] };

/**
 * Faq — the standalone, "we've thought of everything" FAQ, brought to the house
 * bar shipped sitewide (Statement / Partners): a monumental calm header, acres
 * of space, and content told as large hairline-divided rows — never card decks,
 * medallions, eyebrows-on-everything, or 01/02/03 ledgers.
 *
 * The category index is a quiet hairline table of contents — names only, a single
 * crimson tick on the active chapter (no numbers, no pills, no chrome). Each
 * question is a calm editorial accordion row: a real <button> with aria-expanded /
 * aria-controls, a panel that opens via a grid-template-rows 0fr→1fr transition
 * (no height, GPU-friendly, zero layout jank), and a bare chevron that rotates
 * 180°. The first category reuses the homepage's six honest answers as the lead
 * chapter. Truthful, on-brand, Arabic-first and RTL-safe.
 */

/* ─────────────────────────────────────────────────────────────────────────
   The knowledge base — 7 chapters, 28 honest bilingual Q&As.
   Chapter 1 = the homepage's six (verbatim), then the deep coverage:
   eligibility/apply · cost & equity · the space · programs & Demo Day ·
   after the program · logistics (remote, hardware, privacy, who's welcome).
   ───────────────────────────────────────────────────────────────────────── */
const CATEGORIES: Category[] = [
  {
    id: "basics",
    label: { ar: "الأساسيّات", en: "The essentials" },
    lede: {
      ar: "أكثر ستّة أسئلة نسمعها — بإجابات صريحة، بلا تجميل.",
      en: "The six questions we hear most — answered honestly, no gloss.",
    },
    items: [
      {
        id: "free",
        q: { ar: "هل آيلاند مجّاني فعلًا؟", en: "Is Island Haven really free?" },
        a: {
          ar: "نعم، مجّانيّ بالكامل — لا رسوم ولا حصّة من مشروعك. آيلاند حاضنة مدعومة من NasToNas وGaza Sky Geeks، ونفتح لك أدواتٍ وأرصدةً عالميّة (Replit وAWS Activate وGoogle for Startups وPayoneer وFreelancer). مهمّتنا أن نعيد وصل المواهب الغزّيّة بالاقتصاد الرقميّ، لا أن نربح منها.",
          en: "Yes — completely free. No fees, and no equity in your work. Island Haven is an incubator backed by NasToNas and Gaza Sky Geeks, and we unlock global tools & credits for you (Replit, AWS Activate, Google for Startups, Payoneer, Freelancer). Our mission is to reconnect Gazan talent to the digital economy, not to profit from it.",
        },
      },
      {
        id: "who",
        q: { ar: "مَن يحقّ له التقديم؟", en: "Who can apply?" },
        a: {
          ar: "كلّ موهبة رقميّة في غزّة — مطوّرون، مصمّمون، مستقلّون، طلّاب جامعات، ومؤسّسون في بداية الطريق. نؤمن أنّ الموهبة لا تحدّها الجغرافيا؛ ما يهمّنا هو جدّيّتك واستعدادك للعمل، لا شهادتك ولا خبرتك السابقة.",
          en: "Any digital talent in Gaza — developers, designers, freelancers, university students and early-stage founders. We believe talent isn't bound by geography; what matters is your seriousness and readiness to work, not your degree or past résumé.",
        },
      },
      {
        id: "member",
        q: { ar: "ماذا أحصل عليه كعضو؟", en: "What do I get as a member?" },
        a: {
          ar: "مساحة عمل مجهّزة بإنترنت وكهرباء موثوقَين، أرصدة سحابيّة وأدوات، حلول دفع دوليّة، تدريب مستمرّ ومسارات احتضان منظّمة، إرشاد فرديّ من خبراء، وشبكة حقيقيّة من الفرص والشركاء تتجاوز الحدود.",
          en: "An equipped workspace with reliable internet and power, cloud credits and tools, international payment solutions, continuous training and structured incubation tracks, 1:1 expert mentorship, and a real network of opportunities and partners that reaches beyond borders.",
        },
      },
      {
        id: "cohorts",
        q: { ar: "ما هي الدفعات ويوم العرض (Demo Day)؟", en: "What are cohorts and Demo Day?" },
        a: {
          ar: "الدفعة مجموعة من الأعضاء تسير معًا في مسار احتضان منظّم خلال فترة محدّدة. يُختم المسار بيوم العرض — Demo Day — حيث تقدّم مشروعك أمام شبكة من المرشدين والشركاء والداعمين، وهو بوّابتك لفرص العمل والتدريب والاستثمار.",
          en: "A cohort is a group of members who move together through a structured incubation track over a set period. The track culminates in a Demo Day, where you present your work to a network of mentors, partners and supporters — your gateway to work, training and investment.",
        },
      },
      {
        id: "space",
        q: { ar: "أين تقع المساحة وما أوقاتها؟", en: "Where is the space, and what are its hours?" },
        a: {
          ar: "مساحتنا في قلب غزّة، مهيّأة للعمل المركّز بمقاعد ثابتة وإنترنت وكهرباء. تحجز مقعدك عبر صفحة الحجز، ويمكنك دائمًا التواصل معنا على واتساب لمعرفة الأوقات المتاحة وتنسيق زيارتك.",
          en: "Our space is in the heart of Gaza, set up for focused work with stable seats, internet and power. You reserve a seat through the booking page, and you can always reach us on WhatsApp to check available hours and arrange your visit.",
        },
      },
      {
        id: "apply",
        q: { ar: "كيف أقدّم؟", en: "How do I apply?" },
        a: {
          ar: "التقديم بسيط ومجّاني: املأ نموذج الانضمام عبر صفحة «قدّم الآن»، ويتواصل معك فريقنا. تفضّل أن تتحدّث إلينا أوّلًا؟ احجز مكالمة أو راسلنا مباشرةً على واتساب — مساحة تتّسع لأحلامك.",
          en: "It's simple and free: fill in the join form on the Apply page and our team will reach out. Prefer to talk first? Book a call or message us directly on WhatsApp — a space wide enough for your dreams.",
        },
      },
    ],
  },
  {
    id: "eligibility",
    label: { ar: "الأهليّة والتقديم", en: "Eligibility & applying" },
    lede: {
      ar: "مَن نقبل، كيف نقرّر، وكم يستغرق الأمر — كلّ ما يخصّ بوّابة الدخول.",
      en: "Who we take, how we decide, and how long it takes — everything about the front door.",
    },
    items: [
      {
        id: "requirements",
        q: { ar: "هل أحتاج شهادة جامعيّة أو خبرة سابقة؟", en: "Do I need a degree or prior experience?" },
        a: {
          ar: "لا. لا نطلب شهادة ولا سنوات خبرة. نبحث عن موهبة حقيقيّة، استعدادٍ للتعلّم، والتزامٍ بإنجاز العمل. كثيرٌ من أقوى أعضائنا تعلّموا ذاتيًّا أو ما زالوا طلّابًا — المعيار هو ما تستطيع بناءه، لا ما هو مكتوب على ورقة.",
          en: "No. We don't require a diploma or years of experience. We look for real talent, a willingness to learn, and the commitment to finish what you start. Many of our strongest members are self-taught or still students — the bar is what you can build, not what's printed on a certificate.",
        },
      },
      {
        id: "english",
        q: { ar: "هل يجب أن أتقن الإنجليزيّة؟", en: "Do I need to speak fluent English?" },
        a: {
          ar: "مفيدةٌ لكنّها ليست شرطًا للقبول. كلّ التواصل الداخليّ والتدريب متاحٌ بالعربيّة، ونساعدك على تطوير إنجليزيّتك المهنيّة لأنّها تفتح أبواب العمل الدوليّ. ابدأ بما لديك؛ نبني الباقي معًا.",
          en: "It helps, but it isn't a requirement to be accepted. All internal communication and training is available in Arabic, and we help you grow your professional English because it opens doors to international work. Start with what you have; we build the rest together.",
        },
      },
      {
        id: "process",
        q: { ar: "كيف تسير عمليّة التقديم خطوةً بخطوة؟", en: "What does the application process look like, step by step?" },
        a: {
          ar: "أربع خطوات واضحة: تملأ نموذج التقديم عبر صفحة «قدّم الآن»، تمرّ بمراجعة أوّليّة ومقابلة قصيرة، ثمّ تنضمّ إلى دفعة من المؤسّسين والمستقلّين، وتختم رحلتك بيوم العرض أمام شبكتنا. للتفاصيل الكاملة راجع صفحة «كيف تنضمّ».",
          en: "Four clear steps: you fill in the application on the Apply page, go through a short review and interview, join a cohort of founders and freelancers, then finish with a Demo Day in front of our network. For the full walkthrough, see the “How to join” page.",
        },
      },
      {
        id: "timeline",
        q: { ar: "كم يستغرق الردّ على طلبي؟", en: "How long until I hear back?" },
        a: {
          ar: "نراجع الطلبات أوّلًا بأوّل، وعادةً يصلك ردٌّ أوّليّ خلال أيّام قليلة من التقديم، ثمّ قرارٌ بعد المقابلة القصيرة. إن طال الانتظار، راسلنا على واتساب وسنتحقّق من حالة طلبك مباشرةً.",
          en: "We review applications on a rolling basis, and you'll usually get a first reply within a few days of applying, then a decision after the short interview. If it's taking longer, message us on WhatsApp and we'll check your status directly.",
        },
      },
      {
        id: "cadence",
        q: { ar: "متى تُفتح دورات القبول؟", en: "When do you open admissions?" },
        a: {
          ar: "التقديم مفتوحٌ على مدار العام، ونستقبل دفعاتٍ جديدة على فترات. سجّل من صفحة «قدّم الآن» وسيصلك إشعارٌ فور توفّر مقعدٍ في الدفعة القادمة.",
          en: "Applications are open year-round, and we take in new cohorts in waves. Register on the Apply page and we'll notify you the moment a seat opens in the next cohort.",
        },
      },
      {
        id: "reapply",
        q: { ar: "إن لم أُقبل، هل أستطيع التقديم مجدّدًا؟", en: "If I'm not accepted, can I apply again?" },
        a: {
          ar: "بالتأكيد. رفض دفعةٍ واحدة ليس بابًا مغلقًا — نشجّعك على التطوّر ثمّ العودة. وكثيرٌ من فعالياتنا وورشنا مفتوحةٌ للجميع، فابقَ على تواصل وطوّر مهاراتك حتّى الدفعة التالية.",
          en: "Absolutely. A no for one cohort isn't a closed door — we encourage you to grow and come back. Many of our events and workshops are open to everyone too, so stay connected and keep building until the next round.",
        },
      },
    ],
  },
  {
    id: "cost",
    label: { ar: "التكلفة والملكيّة", en: "Cost & equity" },
    lede: {
      ar: "مجّانيّ، بلا حصّة، بلا شروطٍ خفيّة — وهذا كيف يُموَّل.",
      en: "Free, no equity, no hidden strings — and how it's funded.",
    },
    items: [
      {
        id: "hidden-costs",
        q: { ar: "هل توجد أيّ رسومٍ أو تكاليف خفيّة؟", en: "Are there any hidden fees or costs?" },
        a: {
          ar: "لا، ولا واحدة. لا رسوم انتساب، ولا اشتراكات، ولا «مقابلٍ لاحق». المساحة والتدريب والأرصدة والإرشاد كلّها مجّانيّة للأعضاء المقبولين. إن طلب منك أحدٌ مالًا باسم آيلاند هيفن فهو ليس منّا — أبلغنا فورًا.",
          en: "None, not one. No membership fee, no subscription, no “pay us later.” The space, training, credits and mentorship are all free to accepted members. If anyone asks you for money in Island Haven's name, it isn't from us — tell us at once.",
        },
      },
      {
        id: "equity",
        q: { ar: "هل تأخذون حصّةً من مشروعي أو ملكيّتي الفكريّة؟", en: "Do you take equity or own my IP?" },
        a: {
          ar: "إطلاقًا. لا نأخذ حصّةً في شركتك، ولا نطالب بأيّ نسبةٍ من أرباحك، ولا نملك ما تبنيه. مشروعك ملكك بالكامل، وكلّ ما تنشئه هنا — كودًا أو تصميمًا أو منتجًا — يبقى لك أنت.",
          en: "Never. We take no stake in your company, claim no share of your revenue, and own nothing you build. Your project is fully yours, and everything you create here — code, design or product — stays yours.",
        },
      },
      {
        id: "funding",
        q: { ar: "إذًا كيف تُموَّل الحاضنة؟", en: "So how is the incubator funded?" },
        a: {
          ar: "يغطّي تكاليف التشغيل داعمون وشركاء يؤمنون بالموهبة الغزّيّة — في مقدّمتهم NasToNas وGaza Sky Geeks. نموذجنا قائمٌ على الدعم والشراكة، لا على الربح من الأعضاء؛ هدفنا أثرٌ يُقاس، لا عائدٌ يُجبى.",
          en: "Operating costs are covered by supporters and partners who believe in Gazan talent — led by NasToNas and Gaza Sky Geeks. Our model runs on backing and partnership, not on profiting from members; our goal is measured impact, not a return to collect.",
        },
      },
      {
        id: "credits-cost",
        q: { ar: "هل أدفع مقابل الأرصدة السحابيّة والأدوات؟", en: "Do I pay for the cloud credits and tools?" },
        a: {
          ar: "لا. نُمكّنك من الوصول إلى أرصدة وأدواتٍ عالميّة (Replit وAWS Activate وGoogle for Startups وغيرها) دون أن تدفع، مع دعمٍ تقنيّ لإعداد حسابك واستخدامها بفعاليّة في بناء مشروعك.",
          en: "No. We unlock access to global credits and tools (Replit, AWS Activate, Google for Startups and more) at no cost to you, with technical support to set up your account and use them effectively to build your project.",
        },
      },
    ],
  },
  {
    id: "space",
    label: { ar: "المساحة والموقع", en: "The space & location" },
    lede: {
      ar: "المكان، الأوقات، الإنترنت والكهرباء — تفاصيل العمل من المساحة.",
      en: "The place, the hours, the internet and power — the practicalities of working from the space.",
    },
    items: [
      {
        id: "facilities",
        q: { ar: "ما الذي توفّره المساحة بالضبط؟", en: "What exactly does the space provide?" },
        a: {
          ar: "مساحة عمل احترافيّة مجهّزة بالكامل: إنترنت موثوق، كهرباء مستمرّة، مقاعد ومكاتب مريحة، قاعات اجتماعات، وأجواء مهيّأة للتركيز والتعاون — كلّ ما تحتاجه لتعمل باحترافيّة من قلب غزّة.",
          en: "A fully equipped, professional workspace: reliable internet, continuous power, comfortable seats and desks, meeting rooms, and an environment set up for focus and collaboration — everything you need to work professionally from the heart of Gaza.",
        },
      },
      {
        id: "internet-power",
        q: { ar: "كيف تضمنون الإنترنت والكهرباء في غزّة؟", en: "How do you keep internet and power running in Gaza?" },
        a: {
          ar: "نعرف أنّ الاتّصال والكهرباء أكبر عائقَين أمام العمل الرقميّ هنا، لذا جعلناهما أولويّة: حلول طاقة احتياطيّة واتّصال مهيّأ ليبقي عملك مستمرًّا قدر الإمكان. المساحة بُنيت تحديدًا لتزيل هذا العبء عن كاهلك.",
          en: "We know connectivity and power are the two biggest obstacles to digital work here, so we made them a priority: backup power solutions and provisioned connectivity to keep your work running as continuously as possible. The space was built specifically to take that burden off you.",
        },
      },
      {
        id: "hours",
        q: { ar: "ما أوقات العمل، وكيف أحجز مقعدًا؟", en: "What are the hours, and how do I book a seat?" },
        a: {
          ar: "تحجز مقعدك عبر صفحة الحجز وتختار الوقت المناسب لك. الأوقات المتاحة قد تتغيّر حسب الظرف على الأرض، لذا الطريقة الأضمن هي التواصل معنا على واتساب لتأكيد موعدك ومعرفة آخر المستجدّات.",
          en: "You reserve your seat through the booking page and pick a time that suits you. Available hours can shift with conditions on the ground, so the surest way is to reach us on WhatsApp to confirm your slot and get the latest.",
        },
      },
      {
        id: "visit",
        q: { ar: "هل يمكنني زيارة المساحة قبل أن أنتسب؟", en: "Can I visit the space before joining?" },
        a: {
          ar: "نعم. يمكنك حجز جولةٍ استطلاعيّة لترى المساحة بنفسك قبل أيّ قرار. لأسبابٍ تتعلّق بالسلامة، نشارك العنوان التفصيليّ عبر الرسائل الخاصّة بعد تأكيد الموعد.",
          en: "Yes. You can book a visit to see the space for yourself before deciding anything. For safety reasons, we share the detailed address privately once your appointment is confirmed.",
        },
      },
    ],
  },
  {
    id: "programs",
    label: { ar: "البرامج ويوم العرض", en: "Programs & Demo Day" },
    lede: {
      ar: "ما الذي تتعلّمه، كيف تسير الدفعة، وما الذي يُتوّجها.",
      en: "What you learn, how a cohort runs, and what it builds toward.",
    },
    items: [
      {
        id: "what-programs",
        q: { ar: "ما أنواع البرامج والتدريب التي تقدّمونها؟", en: "What kinds of programs and training do you run?" },
        a: {
          ar: "تدريبٌ تقنيّ ومهنيّ في البرمجة والتصميم والمنتجات الرقميّة، ورشٌ تطبيقيّة، مسارات احتضان منظّمة، وذكاءٌ اصطناعيّ مدمجٌ في طريقة عملك. لا محاضرات نظريّة مؤجّلة، بل قدرةٌ تُبنى مشروعًا بعد مشروع.",
          en: "Technical and professional training across code, design and digital products, hands-on workshops, structured incubation tracks, and AI embedded into how you work. Not deferred theory lectures, but capability built project after project.",
        },
      },
      {
        id: "commitment",
        q: { ar: "كم من الوقت والالتزام تتطلّبه الدفعة؟", en: "How much time and commitment does a cohort take?" },
        a: {
          ar: "الدفعة مسارٌ منظّمٌ على مدى فترةٍ محدّدة، يتطلّب حضورًا والتزامًا منتظمَين لتستفيد فعلًا. نحدّد الإيقاع والمدّة بوضوح مع كلّ دفعة قبل أن تبدأ، حتّى تعرف ما الذي تلتزم به وتخطّط له.",
          en: "A cohort is a structured track over a defined period that asks for regular attendance and commitment to truly benefit. We set the cadence and duration clearly with each cohort before it begins, so you know exactly what you're committing to and can plan for it.",
        },
      },
      {
        id: "demo-day",
        q: { ar: "ما هو يوم العرض (Demo Day) ولماذا يهمّ؟", en: "What is Demo Day, and why does it matter?" },
        a: {
          ar: "يوم العرض هو تتويج مسار الدفعة: تقدّم فيه ما بنيته أمام شبكةٍ من المرشدين والشركاء والداعمين. إنّه ليس حفلًا ختاميًّا فحسب، بل بوّابتك الحقيقيّة إلى فرص العمل والتدريب والاستثمار خارج الحدود.",
          en: "Demo Day is the culmination of the cohort track: you present what you've built to a network of mentors, partners and supporters. It isn't just a closing ceremony — it's your real gateway to work, training and investment opportunities beyond the border.",
        },
      },
      {
        id: "certificate",
        q: { ar: "هل أحصل على شهادةٍ في النهاية؟", en: "Do I get a certificate at the end?" },
        a: {
          ar: "نعم، يحصل المشاركون على شهادة إتمامٍ معتمدة من آيلاند هيفن. الأهمّ من الورقة هو ما يرافقها: مشروعٌ بنيته، شبكةٌ تعرفك، ومسارٌ واضحٌ نحو الفرصة التالية.",
          en: "Yes, participants receive a completion certificate from Island Haven. More valuable than the paper is what comes with it: a project you built, a network that knows you, and a clear path to your next opportunity.",
        },
      },
      {
        id: "events-public",
        q: { ar: "هل فعالياتكم مفتوحةٌ لغير الأعضاء؟", en: "Are your events open to non-members?" },
        a: {
          ar: "بعض الورش والفعاليات مفتوحٌ للجميع، وبعضها مخصّصٌ للأعضاء. تابع حساباتنا على إنستغرام @ih_haven ولينكدإن، أو اشترك في النشرة، لتعرف القادم وشروط المشاركة قبل أسبوعٍ على الأقلّ.",
          en: "Some workshops and events are open to everyone, others are members-only. Follow us on Instagram @ih_haven and LinkedIn, or join the newsletter, to see what's coming and how to take part — announced at least a week ahead.",
        },
      },
    ],
  },
  {
    id: "after",
    label: { ar: "بعد البرنامج", en: "After the program" },
    lede: {
      ar: "ما يبقى معك حين تنتهي الدفعة — الشبكة، الفرص، والدعم.",
      en: "What stays with you once the cohort ends — the network, the opportunities, the support.",
    },
    items: [
      {
        id: "after-cohort",
        q: { ar: "ماذا يحدث بعد أن تنتهي دفعتي؟", en: "What happens after my cohort ends?" },
        a: {
          ar: "لا تنتهي علاقتك بآيلاند بانتهاء الدفعة. تبقى جزءًا من المجتمع والشبكة، مع وصولٍ مستمرّ إلى الفعاليات والفرص والتشبيك. الدفعة بدايةٌ لعلاقةٍ طويلة، لا محطّةً تنتهي عند خطّ النهاية.",
          en: "Your relationship with Island Haven doesn't end when the cohort does. You remain part of the community and network, with continued access to events, opportunities and connections. A cohort is the start of a long relationship, not a stop that ends at the finish line.",
        },
      },
      {
        id: "jobs",
        q: { ar: "هل تساعدونني في إيجاد عملٍ أو عملاء؟", en: "Do you help me find work or clients?" },
        a: {
          ar: "هذا جوهر ما نفعله. نربطك بفرص العمل والتدريب عبر شركائنا، ونشارك قاعدة فرصٍ محدّثة، وننظّم تشبيكًا مع خبراء ومؤسّساتٍ خارج الحدود. كثيرٌ من أعضائنا يعملون اليوم مع عملاء في أوروبا والخليج وأمريكا الشماليّة — من غزّة.",
          en: "This is the heart of what we do. We connect you to work and training opportunities through our partners, share an updated opportunities database, and arrange networking with experts and organisations beyond the border. Many of our members work today with clients in Europe, the Gulf and North America — from Gaza.",
        },
      },
      {
        id: "payments",
        q: { ar: "كيف أستقبل المدفوعات من عملاء دوليّين؟", en: "How do I receive payments from international clients?" },
        a: {
          ar: "استقبال المدفوعات من أكبر تحدّيات العمل الحرّ في غزّة، ونعمل عليه مباشرةً. نساعدك في الوصول إلى حلولٍ عمليّة مثل Payoneer وغيرها، مع توجيهٍ لإتمام المعاملات الدوليّة بشكلٍ صحيحٍ وآمن. الحلول تُحدَّث باستمرارٍ حسب ما هو متاح.",
          en: "Receiving payments is one of the hardest challenges of freelancing from Gaza, and we work on it directly. We help you access practical solutions like Payoneer and others, with guidance to complete international transactions correctly and safely. The solutions are continuously updated as availability changes.",
        },
      },
      {
        id: "alumni-mentor",
        q: { ar: "هل أستطيع العودة كمرشدٍ أو أن أردّ الجميل لاحقًا؟", en: "Can I come back to mentor or give back later?" },
        a: {
          ar: "نتمنّى ذلك. كثيرٌ من أعضائنا يعودون مرشدين، يقودون ورشًا، أو يفتحون أبوابًا لمن جاء بعدهم. آيلاند مجتمعٌ يُبنى يومًا بيوم بأيدي أبنائه — ونجاحك جزءٌ من بنيته التحتيّة للجيل التالي.",
          en: "We hope you do. Many members return as mentors, lead workshops, or open doors for those who come after them. Island Haven is a community built day by day by its own people — and your success becomes part of the infrastructure for the next generation.",
        },
      },
    ],
  },
  {
    id: "logistics",
    label: { ar: "اللوجستيّات والخصوصيّة", en: "Logistics & privacy" },
    lede: {
      ar: "العمل عن بُعد، الأجهزة، بياناتك، ومَن نرحّب به — تفاصيل تطمئنك.",
      en: "Remote work, hardware, your data, and who's welcome — the details that put you at ease.",
    },
    items: [
      {
        id: "remote",
        q: { ar: "هل يجب أن أحضر إلى المساحة، أم يمكنني العمل عن بُعد؟", en: "Must I come to the space, or can I work remotely?" },
        a: {
          ar: "المساحة الفعليّة قيمتها كبيرة — إنترنت وكهرباء وزملاء — لكنّنا نعي أنّ الظرف لا يسمح للجميع بالحضور دائمًا. التدريب والإرشاد والمتابعة متاحةٌ بمرونة، وننسّق معك ما يناسب وضعك. تواصل معنا لنرتّب أنسب صيغةٍ لك.",
          en: "The physical space is hugely valuable — internet, power, peers — but we know conditions don't always let everyone attend. Training, mentorship and follow-up are available flexibly, and we work out what fits your situation. Reach out and we'll arrange the right setup for you.",
        },
      },
      {
        id: "hardware",
        q: { ar: "هل أحتاج إلى حاسوبي الخاصّ؟", en: "Do I need my own laptop?" },
        a: {
          ar: "إن كان لديك حاسوبك فهو الأنسب لعملك المستمرّ. وإن كانت الأجهزة عائقًا أمامك، أخبرنا في طلبك أو على واتساب — نبحث الحلول حالةً بحالة قدر ما تسمح به مواردنا، لأنّ هدفنا ألّا تقف الأدوات بينك وبين موهبتك.",
          en: "If you have your own laptop, that's ideal for continuous work. If hardware is an obstacle for you, tell us in your application or on WhatsApp — we look at solutions case by case as far as our resources allow, because our aim is that tools never stand between you and your talent.",
        },
      },
      {
        id: "privacy",
        q: { ar: "كيف تتعاملون مع بياناتي وخصوصيّتي؟", en: "How do you handle my data and privacy?" },
        a: {
          ar: "نأخذ خصوصيّتك على محمل الجدّ. نستخدم بياناتك لإدارة طلبك وعضويّتك ومنفعتك فقط، ولا نبيعها. ونحمي معلوماتك الحسّاسة — مثل موقع المساحة — ونشاركها عبر قنواتٍ خاصّةٍ آمنة، حمايةً لك ولمجتمعنا.",
          en: "We take your privacy seriously. We use your data only to manage your application, membership and benefit, and we never sell it. We protect sensitive information — such as the space's location — and share it through private, secure channels, to protect you and our community.",
        },
      },
      {
        id: "women",
        q: { ar: "هل النساء مرحّبٌ بهنّ، وهل المساحة آمنة؟", en: "Are women welcome, and is the space safe?" },
        a: {
          ar: "بالتأكيد، ونرحّب بشكلٍ خاصّ بالمهنيّات والطالبات اللواتي يطوّرن مساراتهنّ التقنيّة. نلتزم ببيئةٍ محترمةٍ وآمنةٍ للجميع، ونرتّب ما يلزم لتشعري بالراحة والأمان في المساحة. لكِ أن تسألي عن أيّ تفصيلٍ يهمّك قبل أن تنتسبي.",
          en: "Absolutely, and we especially welcome women professionals and students growing their technical paths. We're committed to a respectful, safe environment for everyone, and we make whatever arrangements help you feel comfortable and secure in the space. You're welcome to ask about any detail that matters to you before joining.",
        },
      },
      {
        id: "students",
        q: { ar: "أنا طالبٌ جامعيّ — هل هذا مناسبٌ لي؟", en: "I'm a university student — is this right for me?" },
        a: {
          ar: "تمامًا. الطلّاب من أهمّ مَن نبني معهم. نرتّب الالتزام بما يحترم دراستك، ونعطيك ما لا توفّره الجامعة عادةً: مشاريع حقيقيّة، أدواتٍ عالميّة، إرشادًا مهنيًّا، وشبكةً تفتح لك أوّل فرصة. ابدأ مبكرًا، تسبق غيرك.",
          en: "Completely. Students are among the most important people we build with. We arrange commitments that respect your studies, and give you what university usually doesn't: real projects, global tools, professional mentorship, and a network that opens your first opportunity. Start early, get ahead.",
        },
      },
    ],
  },
];

function AccordionRow({
  qa,
  isOpen,
  onToggle,
}: {
  qa: QA;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();
  const panelId = `faq-panel-${qa.id}`;
  const btnId = `faq-btn-${qa.id}`;

  return (
    <div
      className="border-t border-border-strong first:border-t-0"
      data-testid={`faq-item-${qa.id}`}
    >
      <h3>
        <button
          id={btnId}
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen ? "true" : "false"}
          aria-controls={panelId}
          data-testid={`faq-trigger-${qa.id}`}
          className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 sm:gap-x-10 w-full text-start py-[clamp(1.5rem,3.2vw,2.5rem)]"
        >
          <span
            className={`font-display transition-colors ${
              isOpen ? "text-primary" : "text-foreground group-hover:text-primary"
            }`}
            style={{
              fontSize: "clamp(1.2rem, 2.1vw, 1.7rem)",
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              fontWeight: 700,
            }}
          >
            {t(qa.q)}
          </span>
          {/* Bare chevron — no medallion, no chrome — rotates on open */}
          <ChevronDown
            aria-hidden
            strokeWidth={1.75}
            className={`mt-1 h-6 w-6 shrink-0 transition-[transform,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
              isOpen
                ? "rotate-180 text-primary"
                : "text-fg-faint group-hover:text-primary"
            }`}
          />
        </button>
      </h3>

      {/* Animated panel: grid-template-rows 0fr→1fr — no height, no layout jank */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p
            className={`t-body pb-[clamp(1.75rem,3.2vw,2.75rem)] max-w-2xl leading-relaxed transition-opacity duration-300 motion-reduce:transition-none ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
            style={{ fontSize: "clamp(1rem, 1.4vw, 1.18rem)", lineHeight: 1.7 }}
          >
            {t(qa.a)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const { t, lang } = useLanguage();
  const p = I18N.pages.faq;
  const [activeCat, setActiveCat] = useState(0);
  // Open the first question of the active chapter by default — never an empty panel.
  const [open, setOpen] = useState<string | null>(CATEGORIES[0].items[0].id);

  const category = CATEGORIES[activeCat];
  const totalCount = useMemo(
    () => CATEGORIES.reduce((n, c) => n + c.items.length, 0),
    [],
  );
  // Render the count with Arabic-Indic numerals in AR (matches Hero/NumbersBand/TrustStrip).
  const countLabel = totalCount.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");

  function selectCategory(i: number) {
    setActiveCat(i);
    setOpen(CATEGORIES[i].items[0].id);
  }

  return (
    <PageShell
      title={t(p.title)}
      highlight={t(p.highlight)}
      subtitle={t(p.subtitle)}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[clamp(220px,26%,300px)_1fr] gap-x-[clamp(2.5rem,6vw,6rem)] gap-y-12 items-start">
        {/* ── Chapter index — a quiet hairline table of contents, no ledger ── */}
        <Reveal className="lg:sticky lg:top-28">
          <nav aria-label={t({ ar: "فهرس الأسئلة", en: "Question index" })} className="contents">
          <p className="t-caption text-fg-secondary tnum mb-[clamp(1.5rem,3vw,2.25rem)]">
            {t({ ar: `${countLabel} سؤالًا`, en: `${countLabel} questions` })}
          </p>

          <ul className="flex flex-row lg:flex-col gap-x-1 lg:gap-y-0 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map((c, i) => {
              const active = activeCat === i;
              return (
                <li key={c.id} className="shrink-0 lg:border-b lg:border-border-strong/60 lg:last:border-b-0">
                  <button
                    type="button"
                    onClick={() => selectCategory(i)}
                    aria-current={active ? "true" : undefined}
                    data-testid={`faq-cat-${c.id}`}
                    className="group relative grid grid-cols-[auto_1fr] items-baseline gap-x-3.5 w-full text-start py-3 lg:py-[clamp(0.9rem,1.6vw,1.15rem)]"
                  >
                    {/* A single crimson tick marks the active chapter — no pill, no number */}
                    <span
                      aria-hidden
                      className={`h-px w-[clamp(1rem,2vw,1.75rem)] self-center transition-[width,background-color,opacity] duration-300 ${
                        active
                          ? "bg-primary opacity-100"
                          : "bg-border-strong opacity-60 w-3 group-hover:bg-primary group-hover:opacity-100"
                      }`}
                    />
                    <span
                      className={`font-display leading-snug transition-colors ${
                        active
                          ? "text-foreground"
                          : "text-fg-secondary group-hover:text-foreground"
                      }`}
                      style={{
                        fontSize: "clamp(0.95rem, 1.3vw, 1.05rem)",
                        letterSpacing: "-0.015em",
                        fontWeight: active ? 700 : 600,
                      }}
                    >
                      {t(c.label)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          </nav>

          {/* Side aside — a quiet WhatsApp invitation, hairline-divided */}
          <div className="mt-[clamp(2rem,4vw,3rem)] hidden lg:block border-t border-border-strong pt-[clamp(1.5rem,3vw,2rem)]">
            <p className="t-body max-w-[16rem] leading-relaxed">
              {t({
                ar: "لم تجد سؤالك؟ نردّ مباشرةً على واتساب.",
                en: "Don't see your question? We answer directly on WhatsApp.",
              })}
            </p>
            <a
              href="https://wa.me/972567536815"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="faq-aside-whatsapp"
              className="group mt-3.5 inline-flex items-center gap-2 t-caption font-semibold text-primary"
            >
              {t({ ar: "تواصل عبر واتساب", en: "Talk to us on WhatsApp" })}
              <ArrowLeft className="w-4 h-4 ltr:rotate-180 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
            </a>
          </div>
        </Reveal>

        {/* ── The active chapter — monumental display title + hairline accordion ── */}
        <div className="min-w-0">
          <Reveal>
            <div className="pb-[clamp(1.75rem,3.5vw,2.75rem)] mb-2 border-b border-border-strong">
              <h2
                className="font-display text-foreground"
                style={{
                  fontSize: "clamp(2rem, 4.4vw, 3.25rem)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.04em",
                  fontWeight: 700,
                }}
              >
                {t(category.label)}
              </h2>
              <p
                className="t-body mt-[clamp(0.9rem,1.8vw,1.4rem)] max-w-xl"
                style={{ fontSize: "clamp(1rem, 1.5vw, 1.25rem)", lineHeight: 1.65 }}
              >
                {t(category.lede)}
              </p>
            </div>

            <div>
              {category.items.map((qa) => (
                <AccordionRow
                  key={qa.id}
                  qa={qa}
                  isOpen={open === qa.id}
                  onToggle={() => setOpen(open === qa.id ? null : qa.id)}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── Closing chapter — still have a question? ── */}
      <Reveal className="mt-[clamp(5rem,11vw,9rem)] border-t border-border-strong pt-[clamp(3rem,6vw,5rem)]">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-10 items-center">
          <div className="lg:col-span-7">
            <h2
              className="font-display text-foreground"
              style={{
                fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
                lineHeight: "var(--lh-display)",
                letterSpacing: "-0.04em",
                fontWeight: 700,
              }}
            >
              {t({ ar: "ما زال لديك ", en: "Still have a " })}
              <span className="text-primary">
                {t({ ar: "سؤال؟", en: "question?" })}
              </span>
            </h2>
            <p
              className="mt-[clamp(1.5rem,3vw,2.25rem)] max-w-lg text-fg-secondary"
              style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", lineHeight: 1.6 }}
            >
              {t(p.stillQuestion)}{" "}
              {t({
                ar: "تواصل معنا مباشرةً على واتساب، أو ابدأ طلبك — الردّ يأتيك بأسرع ما يمكن.",
                en: "Message us directly on WhatsApp, or start your application — we reply as fast as we can.",
              })}
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-wrap items-center gap-x-6 gap-y-4 lg:justify-end">
            <a
              href="https://wa.me/972567536815"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="faq-whatsapp"
              className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t(p.whatsapp)}
              <ArrowLeft className="w-4 h-4 ltr:rotate-180 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
            </a>
            <Link
              href="/apply"
              data-testid="faq-apply"
              className="group inline-flex items-center gap-2 text-[14px] font-semibold text-primary"
            >
              {t({ ar: "قدّم الآن", en: "Apply now" })}
              <ArrowLeft className="w-4 h-4 ltr:rotate-180 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
            </Link>
            <Link
              href="/process"
              data-testid="faq-process"
              className="group inline-flex items-center gap-2 text-[14px] font-semibold text-fg-secondary hover:text-foreground transition-colors"
            >
              {t({ ar: "كيف تنضمّ", en: "How to join" })}
              <ArrowLeft className="w-4 h-4 ltr:rotate-180 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </Reveal>
    </PageShell>
  );
}
