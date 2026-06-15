import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle } from "lucide-react";
import { PageShell } from "@/components/shell/PageShell";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { I18N } from "@/lib/i18n";

interface FaqItem { q: string; a: string; }
interface FaqSection { title: string; en: string; items: FaqItem[]; }

const FAQ_DATA: FaqSection[] = [
  {
    title: "عن آيلاند هيفن",
    en: "About Island Haven",
    items: [
      { q: "ما هي آيلاند هيفن؟", a: "آيلاند هيفن (Island Haven) حاضنة أعمال ومجتمع تقني تأسّست من قلب قطاع غزة بقناعة راسخة بأن الموهبة لا تحدّها الجغرافيا. نجسر الفجوة بين المواهب الغزية والعالم — من خلال مساحات عمل احترافية، تدريب مكثّف، أرصدة سحابية، حلول مدفوعات، وتشبيك بالفرص العالمية." },
      { q: "متى تأسّست الحاضنة؟", a: "تأسّست آيلاند هيفن عام 2024 في قطاع غزة، فلسطين. نشأت تحت مظلّة مبادرة «من الناس إلى الناس» — مبادرة تطوّعية تعمل من داخل غزة وخارجها على إيصال الدعم المباشر إلى المشاريع المجتمعية الصغيرة." },
      { q: "هل الحاضنة مرتبطة بجهة حكومية أو سياسية؟", a: "لا. آيلاند هيفن كيان مستقل بالكامل. هدفنا الوحيد هو تهيئة المواهب الغزية مهنيًا وتقنيًا وربطها بفرص العمل والاستثمار العالمية." },
      { q: "هل يمكن للمرأة الانضمام؟", a: "بالتأكيد. الحاضنة مفتوحة للجميع بغضّ النظر عن الجنس أو العمر أو المستوى التعليمي. نرحّب بشكل خاص بالمهنيّات اللواتي يرغبن في تطوير مساراتهن التقنية والمهنية." },
      { q: "ما الفرق بين آيلاند هيفن وحاضنات الأعمال الأخرى؟", a: "آيلاند هيفن ليست فقط حاضنة أعمال تقليدية — هي منظومة متكاملة تجمع مساحة عمل احترافية، تدريبًا، أرصدة سحابية، حلول مدفوعات دولية، وتشبيكًا بالفرص العالمية. كل هذا مجانًا. نؤمن بأن الاستثمار الحقيقي هو في الإنسان قبل أي شيء آخر." },
    ],
  },
  {
    title: "مساحة العمل المشتركة",
    en: "Co-working Space",
    items: [
      { q: "ما المرافق المتاحة في مساحة العمل؟", a: "مساحة عمل مهنية مجهّزة بالكامل: إنترنت ألياف ضوئية عالي السرعة، مقاعد مريحة، مكاتب ذات تصميم مهني، كهرباء مستمرة، قاعات اجتماعات، ومطبخ — كل ما تحتاجه لتعمل باحترافية." },
      { q: "من يحقّ له الانتساب لمساحة العمل؟", a: "المساحة مفتوحة لأربع فئات رئيسية: طلاب التقنية والبرمجة، خرّيجو التخصصات التقنية، المستقلّون، وأصحاب المشاريع الناشئة. المعيار الأساسي هو امتلاك الموهبة والإرادة." },
      { q: "هل الانتساب مجاني؟", a: "نعم، الانتساب مجاني بالكامل. آيلاند هيفن مجتمع يُبنى يوميًا بأيدي داعميه ومنتسبيه — تكاليف التشغيل يغطّيها داعمون يؤمنون بالموهبة الغزية." },
      { q: "كيف أحجز مقعداً في المساحة؟", a: "توجّه إلى صفحة 'احجز مقعداً' على الموقع واختر الوقت المناسب لك. يمكنك أيضاً التواصل معنا مباشرة عبر واتساب لتأكيد الحجز." },
      { q: "هل يمكنني زيارة المساحة قبل الانتساب؟", a: "نعم. يمكنك حجز زيارة استطلاعية لترى المساحة بنفسك قبل اتخاذ أي قرار. العنوان التفصيلي يُرسَل عبر الرسائل الخاصة لأسباب أمنية بعد تأكيد الموعد." },
    ],
  },
  {
    title: "الدورات التدريبية والفعاليات",
    en: "Training & Events",
    items: [
      { q: "ما أنواع البرامج التدريبية التي تقدّمونها؟", a: "نقدّم دورات تقنية ومهنية في مجالات متعددة كالبرمجة والتصميم والتسويق الرقمي، ورش عمل تطبيقية أسبوعية، معسكرات تدريب مكثّفة (Bootcamps)، وهاكاثونات — يقودها مدرّبون ومتخصّصون من داخل غزة وخارجها." },
      { q: "هل البرامج التدريبية متاحة لغير الأعضاء؟", a: "بعض الفعاليات والورش مفتوحة للجميع، وبعضها مخصّص للأعضاء. تابع حساباتنا على وسائل التواصل الاجتماعي لمعرفة الفعاليات القادمة وشروط المشاركة." },
      { q: "كيف أعرف بالدورات والفعاليات القادمة؟", a: "تابعنا على إنستغرام @ih_haven وعلى لينكدإن، أو اشترك في النشرة البريدية من خلال الموقع. كل الفعاليات القادمة تُنشر على القنوات الرسمية قبل أسبوع على الأقل." },
      { q: "هل أحصل على شهادة بعد إتمام الدورة؟", a: "نعم، يحصل المشاركون على شهادات حضور واجتياز معتمدة من آيلاند هيفن. نعمل على توسيع شبكة الاعتراف بهذه الشهادات مع شركائنا المحليين والدوليين." },
    ],
  },
  {
    title: "الأرصدة السحابية",
    en: "Cloud Credits",
    items: [
      { q: "ما هي الأرصدة السحابية التي تقدّمونها؟", a: "نُمكّن أعضاءنا من الحصول على أرصدة سحابية مجانية على كبرى المنصات العالمية كـ AWS و Google Cloud و Microsoft Azure و Replit وغيرها — مع دعم تقني لاستخدامها في تطوير المشاريع والمهارات." },
      { q: "كيف أستفيد من الأرصدة السحابية؟", a: "بعد الانتساب، يمكنك التقديم على برنامج الأرصدة السحابية من خلال صفحة البرامج. فريقنا التقني يُرشدك في عملية التسجيل وإعداد الحساب على المنصّة التي تختارها." },
      { q: "هل الأرصدة السحابية كافية لتطوير مشروع حقيقي؟", a: "نعم. الأرصدة المتاحة من خلال برامجنا كافية لتطوير وإطلاق مشاريع تقنية حقيقية. كثير من أعضائنا بنوا تطبيقاتهم الأولى بالكامل باستخدام هذه الأرصدة." },
    ],
  },
  {
    title: "حلول المدفوعات والتشبيك",
    en: "Payments & Networking",
    items: [
      { q: "ما مشكلة المدفوعات التي تحلّونها؟", a: "واحدة من أكبر التحديات التي يواجهها المستقلّون في غزة هي صعوبة استقبال المدفوعات من العملاء الدوليين. نقدّم حلولاً عملية تُمكّن أعضاءنا من تحصيل حقوقهم حول العالم دون أن تكون الجغرافيا عائقًا." },
      { q: "ما الحلول المتاحة لاستقبال المدفوعات؟", a: "نعمل مع أعضائنا على إيجاد أفضل الحلول المتاحة التي تشمل منصّات كـ Payoneer وغيرها، مع توجيه قانوني ومالي لإتمام المعاملات الدولية بشكل صحيح وآمن. الحلول تُحدَّث باستمرار." },
      { q: "كيف يعمل برنامج التشبيك الدولي؟", a: "شبكتنا تربط أعضاءنا بفرص العمل والتدريب والاستثمار عبر شركاء ومرشدين دوليين. ننظّم فعاليات تشبيك شهرية، جلسات إرشاد مع خبراء، ونشارك قاعدة بيانات الفرص المحدّثة مع أعضائنا بانتظام." },
      { q: "هل يمكنني العمل مع عملاء خارج فلسطين؟", a: "هذا بالضبط ما نعمل عليه. هدفنا تمكين كل عضو من العمل مع عملاء حول العالم — من غزة. كثير من أعضائنا يعملون حاليًا مع عملاء في أوروبا والخليج وأمريكا الشمالية." },
    ],
  },
  {
    title: "التقديم والانضمام",
    en: "Applications & Membership",
    items: [
      { q: "من يحقّ له التقديم للانتساب؟", a: "يرحّب آيلاند هيفن بأربع فئات رئيسية: طلاب التقنية والبرمجة، خرّيجو التخصصات التقنية، المستقلّون في المجالات التقنية والإبداعية، وأصحاب المشاريع الناشئة. المعيار الأساسي هو امتلاك الموهبة والإرادة." },
      { q: "كيف تسير عملية التقديم؟", a: "تملأ نموذج التقديم الإلكتروني عبر صفحة 'قدّم الآن'، تمرّ بمراجعة أوّلية خلال أسبوع، ثم تُدعى لمقابلة قصيرة. يصدر قرار القبول في غضون أسبوع من المقابلة." },
      { q: "هل هناك رسوم للانتساب؟", a: "لا. الانتساب مجاني بالكامل. آيلاند هيفن مجتمع يُبنى بأيدي داعميه ومنتسبيه، وتكاليف التشغيل يغطّيها داعمون يؤمنون بالموهبة الغزية ويريدون المساهمة في تطويرها." },
      { q: "كم مرة تُفتح دورات القبول؟", a: "التقديم مفتوح على مدار العام. سجّل من صفحة 'قدّم الآن' وسيصلك إشعار فور توفّر مقعد جديد." },
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
  const { lang, t } = useLanguage();
  const p = I18N.pages.faq;
  const [activeSection, setActiveSection] = useState(0);

  return (
    <PageShell
      eyebrow={t(p.eyebrow)}
      title={t(p.title)}
      highlight={t(p.highlight)}
      subtitle={t(p.subtitle)}
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
              {lang === "en" ? sec.en : sec.title}
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
                {lang === "en" ? FAQ_DATA[activeSection].en : FAQ_DATA[activeSection].title}
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
        <h3 className="text-[18px] font-bold text-white mb-2">{t(p.stillQuestion)}</h3>
        <p className="text-[13.5px] text-white/50 mb-5">{lang === "en" ? "Contact us directly and we'll reply as soon as possible." : "تواصل معنا مباشرة وسنرد عليك في أقرب وقت."}</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a
            href="https://wa.me/972567536815"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white font-semibold text-[13px] hover:bg-primary/90 transition-colors"
          >
            {t(p.whatsapp)}
          </a>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/15 text-white/70 font-medium text-[13px] hover:border-white/30 hover:text-white transition-all"
          >
            {lang === "en" ? "Apply Now" : "قدّم الآن"}
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
