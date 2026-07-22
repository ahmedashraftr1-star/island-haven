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
import { useLanguage } from "@/contexts/LanguageContext";
import { Btn } from "@/components/ui/Btn";

// A self-contained press / media kit page. Everything here is drawn from
// confirmed, public facts so it's safe to put in front of journalists and an
// evaluation committee.

const PRESS_EMAIL = "island-haven@nastonas.org";

const BOILERPLATE = {
  ar: "آيلاند هيفن حاضنة أعمال غزّاويّة مجّانيّة تابعة لمبادرة «من النّاس إلى النّاس» (NasToNas). نَحتضن المشاريع الناشئة والمستقلّين والخرّيجين عبر الإرشاد، وبرامج الاحتضان (Cohorts)، ومكتبة موارد، وشبكة من الخبراء والشركاء. يحصل كلّ منتسب على مساحة عمل، وجلسات إرشاد فرديّة (Office Hours)، ووصول إلى playbook من القوالب والأدلّة وحوافز الشركاء، ومشاركة في دفعات احتضان مكثّفة تنتهي بـ Demo Day. رؤيتنا: تمكين الشباب واختصار المسافة بينهم وبين سوق العمل العالميّ عبر الاقتصاد الرقميّ — عقولٌ تقهر الركام.",
  en: "Island Haven is a free Gaza-based business incubator under the “People to People” (NasToNas) initiative. We support startups, freelancers, and graduates through mentorship, incubation cohorts, a resource library, and a network of experts and partners. Every member gets a workspace, one-on-one office hours, access to a playbook of templates, guides, and partner perks, and a place in intensive cohorts that culminate in a Demo Day. Our vision: empower young people and close the distance between them and the global job market through the digital economy — minds that rise above the rubble.",
};

const FACTS: Array<{
  icon: typeof Lightbulb;
  value: { ar: string; en: string };
  label: { ar: string; en: string };
}> = [
  {
    icon: Lightbulb,
    value: { ar: "١٥", en: "15" },
    label: {
      ar: "فكرة ريادية بُنيت في هاكثون البنّائين",
      en: "startup ideas built at the Builders' Hackathon",
    },
  },
  {
    icon: Users,
    value: { ar: "١٠٠٪", en: "100%" },
    label: { ar: "مجّانيّ للمنتسبين", en: "free for members" },
  },
  {
    icon: Building2,
    value: { ar: "غزّة", en: "Gaza" },
    label: {
      ar: "في قلب فلسطين · تأسّس ٢٠٢٤",
      en: "in the heart of Palestine · founded 2024",
    },
  },
  {
    icon: Sparkles,
    value: { ar: "٣", en: "3" },
    label: {
      ar: "شركاء: Replit · عوالم · ناس تو ناس",
      en: "partners: Replit · Awalem · NasToNas",
    },
  },
];

const NAME_SPELLINGS = [
  { ar: "آيلاند هيفن (العربيّة)", en: "آيلاند هيفن (Arabic)" },
  { ar: "Island Haven (English)", en: "Island Haven (English)" },
  { ar: "@ih_haven (Instagram)", en: "@ih_haven (Instagram)" },
];

const BRAND_COLORS = [
  { name: "Primary Red", hex: "#DC2637" },
  { name: "Deep Navy", hex: "#0a0a0a" },
  { name: "Ink", hex: "#15171F" },
];

function Copyable({ text }: { text: string }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text)}
      title={t({ ar: "نسخ", en: "Copy" })}
      aria-label={t({ ar: "نسخ", en: "Copy" })}
      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
    >
      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  );
}

export default function Press() {
  const { t } = useLanguage();
  usePageMeta({
    title: t({ ar: "المركز الإعلاميّ", en: "Press & Media Center" }),
    description: t({
      ar: "حقائق واقتباسات وهويّة بصريّة وجهة تواصل — كلّ ما تحتاجه لتغطية قصّة آيلاند هيفن.",
      en: "Facts, quotes, brand assets, and a contact — everything you need to cover the Island Haven story.",
    }),
  });

  return (
    <PageShell
      active="about"
      eyebrow="Press & Media"
      title={t({ ar: "المركز", en: "Press &" })}
      highlight={t({ ar: "الإعلاميّ", en: "Media" })}
      subtitle={t({
        ar: "كلّ ما تحتاجه لتغطية قصّة آيلاند هيفن — حقائق، اقتباسات، هويّة بصريّة، وجهة تواصل.",
        en: "Everything you need to cover the Island Haven story — facts, quotes, brand assets, and a contact.",
      })}
    >
      {/* Boilerplate */}
      <GlassCard className="p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-4 h-4 text-primary" />
          <h2 className="text-foreground font-bold text-[16px]">
            {t({ ar: "نبذة للنشر", en: "Boilerplate" })}
          </h2>
          <Copyable text={t(BOILERPLATE)} />
        </div>
        <p className="text-fg-secondary text-[14.5px] leading-[1.95]">{t(BOILERPLATE)}</p>
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
            className="rounded-2xl p-5 bg-surface-2 border border-border-strong"
          >
            <f.icon className="w-5 h-5 text-primary mb-3" />
            <div className="text-foreground font-bold text-[26px] leading-none mb-1.5 tabular-nums">
              {t(f.value)}
            </div>
            <div className="text-muted-foreground text-[12px] leading-snug">{t(f.label)}</div>
          </motion.div>
        ))}
      </div>

      {/* Founder quote */}
      <GlassCard className="p-6 sm:p-8 mb-6 relative overflow-hidden">
        <Quote className="absolute -top-2 -right-2 w-24 h-24 text-primary/10" />
        <div className="relative">
          <p className="text-foreground text-[17px] sm:text-[19px] font-semibold leading-[1.8] mb-4">
            {t({
              ar: "«تنظيم فعاليّة بهذا الحجم تحت هذه الظروف يمثّل تحدّيًا كبيرًا ومباشرًا — عقولٌ تقهر الركام وتبني مستقبلًا رقميًّا لغزّة.»",
              en: "“Organizing an event of this scale under these conditions is a direct and immense challenge — minds that rise above the rubble and build a digital future for Gaza.”",
            })}
          </p>
          <div className="text-primary-bright font-bold text-[14px]">
            {t({ ar: "مهنّد جندية", en: "Muhannad Jundiyya" })}
          </div>
          <div className="text-fg-secondary text-[12.5px]">
            {t({
              ar: "المدير ومؤسّس آيلاند هيفن",
              en: "Director & Founder of Island Haven",
            })}
          </div>
        </div>
      </GlassCard>

      {/* In the media */}
      <GlassCard className="p-6 sm:p-8 mb-6">
        <h2 className="text-foreground font-bold text-[16px] mb-4">
          {t({ ar: "في الإعلام", en: "In the media" })}
        </h2>
        <a
          href="https://felesteen.news/post/181271"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 bg-surface-2 border border-border-strong hover:border-primary/40 transition-colors"
        >
          <div className="min-w-0">
            <div className="text-foreground font-semibold text-[13.5px] truncate">
              {t({
                ar: "عقولٌ تقهر الركام.. شباب غزّة يطلقون «هاكثون البنّائين»",
                en: "Minds that rise above the rubble.. Gaza's youth launch the “Builders' Hackathon”",
              })}
            </div>
            <div className="text-muted-foreground text-[11.5px]">
              {t({ ar: "فلسطين أون لاين", en: "Felesteen Online" })}
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
        </a>
      </GlassCard>

      {/* Brand assets */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <GlassCard className="p-6 sm:p-8">
          <h2 className="text-foreground font-bold text-[16px] mb-4">
            {t({ ar: "الاسم الرسميّ", en: "Official name" })}
          </h2>
          <ul className="space-y-2.5">
            {NAME_SPELLINGS.map((n) => (
              <li
                key={n.en}
                className="flex items-center justify-between gap-3 text-foreground text-[13.5px]"
              >
                <span>{t(n)}</span>
                <Copyable text={t(n)} />
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard className="p-6 sm:p-8">
          <h2 className="text-foreground font-bold text-[16px] mb-4">
            {t({ ar: "ألوان الهويّة", en: "Brand colors" })}
          </h2>
          <div className="flex flex-wrap gap-3">
            {BRAND_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => navigator.clipboard?.writeText(c.hex)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 bg-surface-2 border border-border-strong hover:border-border-strong transition-colors"
                title={t({ ar: "نسخ", en: "Copy" })}
              >
                <span
                  className="w-6 h-6 rounded-md border border-border-strong"
                  style={{ background: c.hex }}
                />
                <div className="text-right">
                  <div className="text-foreground text-[12px] font-semibold">
                    {c.name}
                  </div>
                  <div className="text-muted-foreground text-[10.5px] font-mono tabular-nums">
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
        <h2 className="text-foreground font-bold text-[17px] mb-1">
          {t({ ar: "للاستفسارات الإعلاميّة", en: "Press inquiries" })}
        </h2>
        <p className="text-muted-foreground text-[13px] mb-4">
          {t({
            ar: "فريقنا جاهز لتزويدك بالمعلومات والمقابلات والصور عالية الدقّة.",
            en: "Our team is ready to provide information, interviews, and high-resolution images.",
          })}
        </p>
        <Btn asChild variant="primary" size="md">
          <a href={`mailto:${PRESS_EMAIL}`}>
            <Mail className="w-4 h-4" />
            {PRESS_EMAIL}
          </a>
        </Btn>
      </GlassCard>
    </PageShell>
  );
}
