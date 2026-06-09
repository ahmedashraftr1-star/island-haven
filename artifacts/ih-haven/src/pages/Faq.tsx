import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle } from "lucide-react";
import { PageShell } from "@/components/shell/PageShell";
import { Link } from "wouter";

interface FaqItem { q: string; a: string; }
interface FaqSection { title: string; en: string; items: FaqItem[]; }

const FAQ_DATA: FaqSection[] = [
  {
    title: "عن آيلاند هيفن",
    en: "About Island Haven",
    items: [
      { q: "ما هي آيلاند هيفن؟", a: "آيلاند هيفن حاضنة أعمال غزّاويّة تأخذ فكرتك من الورقة إلى المنتج، ومن المنتج إلى السوق. نوفّر مساحة عمل، برامج احتضان منظّمة، شبكة خبراء، وتمويلاً لدعم رواد الأعمال في غزة." },
      { q: "أين تقع الحاضنة؟", a: "تقع الحاضنة في قلب غزة وتضمّ مساحات عمل تعاونيّة، قاعات تدريب، ومكاتب خاصة للمشاريع في مرحلة النموّ. للاطلاع على ساعات العمل والعنوان التفصيلي، تفضّل بزيارة صفحة 'احجز مقعداً'." },
      { q: "هل الحاضنة مرتبطة بجهة حكومية أو سياسية؟", a: "لا. آيلاند هيفن كيان مستقل يعمل خارج أيّ إطار حكومي أو سياسي. هدفنا الوحيد هو دعم رواد الأعمال وبناء منظومة ريادة أعمال متكاملة في غزة." },
      { q: "هل يمكن للمرأة الانضمام؟", a: "بالتأكيد. الحاضنة مفتوحة للجميع بغضّ النظر عن الجنس أو العمر أو المستوى التعليمي. نشجّع بشكل خاصّ رائدات الأعمال على التقديم." },
    ],
  },
  {
    title: "التقديم والانضمام",
    en: "Applications & Membership",
    items: [
      { q: "من يحقّ له التقديم؟", a: "كل شخص لديه فكرة أو مشروع ناشئ في أي مرحلة. لا يُشترط وجود شركة مسجّلة مسبقاً، ولا يُشترط خبرة سابقة في ريادة الأعمال — الدافعية وصدق الفكرة هما المعياران الأساسيان." },
      { q: "كيف تسير عملية التقديم؟", a: "تملأ نموذج التقديم الإلكتروني، تمرّ بمراجعة أوّليّة خلال أسبوع، ثمّ تُدعى لمقابلة شخصيّة أو عبر الإنترنت. يصدر قرار القبول في غضون أسبوع من المقابلة. لمزيد من التفاصيل، تفضّل بزيارة صفحة 'عملية القبول'." },
      { q: "ما هي معايير الاختيار؟", a: "نبحث عن: صدق الفكرة وحاجتها السوقيّة، جدية المتقدم والتزامه، إمكانيّة التنفيذ على أرض الواقع، وقابليّة المشروع للنموّ. لسنا نبحث عن الكمال — نبحث عن الشغف والإرادة." },
      { q: "هل هناك رسوم للتقديم أو الانضمام؟", a: "التقديم مجاني تماماً. رسوم الاشتراك في المساحة وبرامج الاحتضان تختلف حسب الباقة المختارة وتُحدّد خلال مرحلة القبول. نوفّر خيارات مرنة تناسب مختلف الأوضاع المادية." },
      { q: "كم مرة تُفتح دورات القبول؟", a: "تُفتح دورتان للقبول سنوياً — في بداية كل نصف سنة. يمكنك التسجيل في قائمة الانتظار حتى تصلك إشعارات الدورة القادمة." },
    ],
  },
  {
    title: "البرامج والدُّفعات",
    en: "Programs & Cohorts",
    items: [
      { q: "ما الفرق بين 'عضوية المساحة' وبرامج الاحتضان؟", a: "عضويّة المساحة تمنحك حقّ استخدام مرافق الحاضنة والانضمام إلى فعاليّاتها المجتمعيّة. برامج الاحتضان (الدُّفعات) هي برامج مكثّفة من 3 إلى 6 أشهر مع متابعة مباشرة، تمويل، وإرشاد من خبراء متخصّصين." },
      { q: "ما مدّة برنامج الاحتضان؟", a: "تتراوح مدّة البرامج بين 3 و6 أشهر حسب البرنامج. تُقسَّم إلى مراحل: بناء المنتج، التحقق من السوق، والتهيّؤ للتوسّع." },
      { q: "ما الذي يحصل عليه المتقدم في برنامج الاحتضان؟", a: "إرشاد أسبوعيّ من خبراء في مجالك، ورشات تدريبيّة، منح ودعم مادي، شبكة علاقات مع مستثمرين وشركاء، وعرض في Demo Day لإطلاق مشروعك رسمياً أمام جمهور متخصّص." },
      { q: "هل يمكن الانضمام عن بُعد؟", a: "بعض البرامج تتيح الانضمام الجزئي عن بُعد، لكنّ الحضور الفعلي يُوصى به بشكل كبير للاستفادة القصوى من التفاعل مع الخبراء والمجتمع." },
    ],
  },
  {
    title: "المرافق والمساحة",
    en: "Facilities & Space",
    items: [
      { q: "ما المرافق المتاحة في الحاضنة؟", a: "مقاعد عمل تعاونيّة، مكاتب خاصة، قاعات اجتماعات، استوديو تصوير، مستلزمات إنتاج، إنترنت عالي السرعة، مطبخ، وأجواء عمل ملهمة. كما تُنظَّم فعاليّات أسبوعية وشهريّة داخل المساحة." },
      { q: "كيف أحجز مقعداً؟", a: "توجّه إلى صفحة 'احجز مقعداً' واختر الوقت المناسب لك. الحجز متاح لغير الأعضاء أيضاً بتكلفة يوميّة أو أسبوعيّة." },
      { q: "هل يمكنني استخدام الحاضنة كعنوان تجاري لشركتي؟", a: "نعم. يمكن للأعضاء المسجّلين استخدام عنوان الحاضنة كعنوان تجاري رسميّ. تواصل معنا للاستفسار عن هذه الخدمة." },
    ],
  },
  {
    title: "المجتمع والشبكة",
    en: "Community & Network",
    items: [
      { q: "كيف أتواصل مع الخبراء؟", a: "بعد الانضمام يمكنك حجز جلسات إرشاد مباشرة مع الخبراء عبر المنصّة. الجلسات تتراوح بين 30 دقيقة وساعة، وتشمل مجالات متعدّدة من التقنية والتسويق إلى المالية والقانون." },
      { q: "هل هناك مجتمع رقمي للأعضاء؟", a: "نعم. يحصل الأعضاء على وصول لمجموعة تواصل خاصة، منصّة الأعضاء الداخليّة، وإشعارات بالفعاليّات والفرص الحصريّة." },
      { q: "هل يمكنني الوصول للمنصة من خارج غزة؟", a: "المنصّة الرقميّة متاحة من أي مكان في العالم. إذا كنت خارج غزة وتريد الانضمام لبرامجنا، تواصل معنا لنناقش الخيارات المتاحة." },
    ],
  },
];

function FaqItem({ item, index }: { item: FaqItem; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="border-b border-white/[0.07] last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-4 text-right"
      >
        <span className={`text-[14.5px] font-semibold leading-snug transition-colors ${open ? "text-primary" : "text-white/85"}`}>
          {item.q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center"
        >
          <ChevronDown className="w-3.5 h-3.5 text-white/50" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[13.5px] text-white/55 leading-relaxed">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Faq() {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <PageShell
      eyebrow="FAQ · الأسئلة الشائعة"
      title="كلّ ما تريد معرفته"
      subtitle="إجابات واضحة لأكثر الأسئلة شيوعاً حول آيلاند هيفن."
    >
      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-8 items-start">
        {/* Sidebar nav */}
        <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:sticky lg:top-8">
          {FAQ_DATA.map((sec, i) => (
            <button
              key={i}
              onClick={() => setActiveSection(i)}
              className={`shrink-0 text-right px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                activeSection === i
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
              }`}
            >
              {sec.title}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-5 pb-4 border-b border-white/[0.07]">
              <div className="text-[11px] font-bold text-primary/70 tracking-widest uppercase mb-1">
                {FAQ_DATA[activeSection].en}
              </div>
              <h2 className="text-[20px] font-bold text-white">
                {FAQ_DATA[activeSection].title}
              </h2>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {FAQ_DATA[activeSection].items.map((item, i) => (
                <FaqItem key={i} item={item} index={i} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/[0.06] p-8 text-center">
        <MessageCircle className="w-10 h-10 text-primary/60 mx-auto mb-3" />
        <h3 className="text-[18px] font-bold text-white mb-2">لم تجد إجابتك؟</h3>
        <p className="text-[13.5px] text-white/50 mb-5">تواصل معنا مباشرة وسنرد عليك في أقرب وقت.</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a
            href="https://wa.me/972567536815"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white font-semibold text-[13px] hover:bg-primary/90 transition-colors"
          >
            تواصل معنا عبر واتساب
          </a>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/15 text-white/70 font-medium text-[13px] hover:border-white/30 hover:text-white transition-all"
          >
            قدّم الآن
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
