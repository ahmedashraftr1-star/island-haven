import { motion } from "framer-motion";
import { usePageMeta } from "@/hooks/use-meta";
import {
  Newspaper,
  Quote,
  ExternalLink,
  Mail,
  Sparkles,
  Building2,
  Users,
  Lightbulb,
  Copy,
} from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";

// A self-contained press / media kit page. Everything here is drawn from
// confirmed, public facts so it's safe to put in front of journalists and an
// evaluation committee.

const PRESS_EMAIL = "island-haven@nastonas.org";

const BOILERPLATE =
  "آيلاند هيفن حاضنة أعمال غزّاويّة مجّانيّة تابعة لمبادرة «من النّاس إلى النّاس» (NasToNas). نَحتضن المشاريع الناشئة والمستقلّين والخرّيجين عبر الإرشاد، وبرامج الاحتضان (Cohorts)، ومكتبة موارد، وشبكة من الخبراء والشركاء. يحصل كلّ منتسب على مساحة عمل، وجلسات إرشاد فرديّة (Office Hours)، ووصول إلى playbook من القوالب والأدلّة وحوافز الشركاء، ومشاركة في دفعات احتضان مكثّفة تنتهي بـ Demo Day. رؤيتنا: تمكين الشباب واختصار المسافة بينهم وبين سوق العمل العالميّ عبر الاقتصاد الرقميّ — عقولٌ تقهر الركام.";

const FACTS = [
  { icon: Lightbulb, value: "١٥", label: "فكرة ريادية بُنيت في هاكثون البنّائين" },
  { icon: Users, value: "١٠٠٪", label: "مجّانيّ للمنتسبين" },
  { icon: Building2, value: "غزّة", label: "في قلب فلسطين · تأسّس ٢٠٢٤" },
  { icon: Sparkles, value: "٣", label: "شركاء: Replit · عوالم · ناس تو ناس" },
];

const NAME_SPELLINGS = [
  "آيلاند هيفن (العربيّة)",
  "Island Haven (English)",
  "@ih_haven (Instagram)",
];

const BRAND_COLORS = [
  { name: "Primary Red", hex: "#DC2637" },
  { name: "Deep Navy", hex: "#0A0E1A" },
  { name: "Ink", hex: "#15171F" },
];

function Copyable({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text)}
      title="نسخ"
      className="inline-flex items-center gap-1.5 text-white/45 hover:text-primary transition-colors"
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}

export default function Press() {
  usePageMeta({
    title: "المركز الإعلاميّ",
    description:
      "حقائق واقتباسات وهويّة بصريّة وجهة تواصل — كلّ ما تحتاجه لتغطية قصّة آيلاند هيفن.",
  });

  return (
    <PageShell
      active="about"
      eyebrow="Press & Media"
      title="المركز"
      highlight="الإعلاميّ"
      subtitle="كلّ ما تحتاجه لتغطية قصّة آيلاند هيفن — حقائق، اقتباسات، هويّة بصريّة، وجهة تواصل."
    >
      {/* Boilerplate */}
      <GlassCard className="p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-4 h-4 text-primary" />
          <h2 className="text-white font-bold text-[16px]">نبذة للنشر</h2>
          <Copyable text={BOILERPLATE} />
        </div>
        <p className="text-white/75 text-[14.5px] leading-[1.95]">{BOILERPLATE}</p>
      </GlassCard>

      {/* Fast facts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {FACTS.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="rounded-2xl p-5 bg-white/[0.05] border border-white/10"
          >
            <f.icon className="w-5 h-5 text-primary mb-3" />
            <div className="text-white font-bold text-[26px] leading-none mb-1.5 tabular-nums">
              {f.value}
            </div>
            <div className="text-white/55 text-[12px] leading-snug">{f.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Founder quote */}
      <GlassCard className="p-6 sm:p-8 mb-6 relative overflow-hidden">
        <Quote className="absolute -top-2 -right-2 w-24 h-24 text-primary/10" />
        <div className="relative">
          <p className="text-white text-[17px] sm:text-[19px] font-semibold leading-[1.8] mb-4">
            «تنظيم فعاليّة بهذا الحجم تحت هذه الظروف يمثّل تحدّيًا كبيرًا ومباشرًا —
            عقولٌ تقهر الركام وتبني مستقبلًا رقميًّا لغزّة.»
          </p>
          <div className="text-primary font-bold text-[14px]">مهنّد جندية</div>
          <div className="text-white/45 text-[12.5px]">مدير مجتمع آيلاند هيفن</div>
        </div>
      </GlassCard>

      {/* In the media */}
      <GlassCard className="p-6 sm:p-8 mb-6">
        <h2 className="text-white font-bold text-[16px] mb-4">في الإعلام</h2>
        <a
          href="https://felesteen.news/post/181271"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] hover:border-primary/40 transition-colors"
        >
          <div className="min-w-0">
            <div className="text-white font-semibold text-[13.5px] truncate">
              عقولٌ تقهر الركام.. شباب غزّة يطلقون «هاكثون البنّائين»
            </div>
            <div className="text-white/45 text-[11.5px]">فلسطين أون لاين</div>
          </div>
          <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-primary shrink-0" />
        </a>
      </GlassCard>

      {/* Brand assets */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <GlassCard className="p-6 sm:p-8">
          <h2 className="text-white font-bold text-[16px] mb-4">الاسم الرسميّ</h2>
          <ul className="space-y-2.5">
            {NAME_SPELLINGS.map((n) => (
              <li
                key={n}
                className="flex items-center justify-between gap-3 text-white/80 text-[13.5px]"
              >
                <span>{n}</span>
                <Copyable text={n} />
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard className="p-6 sm:p-8">
          <h2 className="text-white font-bold text-[16px] mb-4">ألوان الهويّة</h2>
          <div className="flex flex-wrap gap-3">
            {BRAND_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => navigator.clipboard?.writeText(c.hex)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 bg-white/[0.04] border border-white/[0.08] hover:border-white/20 transition-colors"
                title="نسخ"
              >
                <span
                  className="w-6 h-6 rounded-md border border-white/15"
                  style={{ background: c.hex }}
                />
                <div className="text-right">
                  <div className="text-white text-[12px] font-semibold">
                    {c.name}
                  </div>
                  <div className="text-white/45 text-[10.5px] font-mono tabular-nums">
                    {c.hex}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Press contact */}
      <GlassCard className="p-6 sm:p-8 text-center">
        <Mail className="w-7 h-7 text-primary mx-auto mb-3" />
        <h2 className="text-white font-bold text-[17px] mb-1">للاستفسارات الإعلاميّة</h2>
        <p className="text-white/55 text-[13px] mb-4">
          فريقنا جاهز لتزويدك بالمعلومات والمقابلات والصور عالية الدقّة.
        </p>
        <a
          href={`mailto:${PRESS_EMAIL}`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white font-bold text-[14px] hover:-translate-y-px transition-transform"
        >
          <Mail className="w-4 h-4" />
          {PRESS_EMAIL}
        </a>
      </GlassCard>
    </PageShell>
  );
}
