import { motion } from "framer-motion";
import { Instagram, Linkedin, Facebook, Link as LinkIcon, FileText, MapPin, ArrowLeft } from "lucide-react";
import { EditorialHeader } from "./EditorialHeader";
import { GazaPulseMap } from "./GazaPulseMap";

const channels = [
  {
    icon: LinkIcon,
    ar: "Linktree الرسمي",
    en: "All links",
    desc: "كلّ روابطنا في مكان واحد، يشمل رابط الانتساب ومقعد الضيف.",
    href: "https://linktr.ee/ih_haven",
    handle: "linktr.ee/ih_haven",
  },
  {
    icon: FileText,
    ar: "نموذج التسجيل",
    en: "Apply",
    desc: "للانتساب إلى المجتمع — راجع معايير القبول قبل التقديم.",
    href: "/apply",
    handle: "افتح النموذج",
  },
  {
    icon: Instagram,
    ar: "إنستغرام",
    en: "Instagram",
    desc: "آخر الأخبار، الورش، الفعاليّات، وصور من داخل المساحة.",
    href: "https://www.instagram.com/ih_haven",
    handle: "@ih_haven",
  },
  {
    icon: Linkedin,
    ar: "لينكدإن",
    en: "LinkedIn",
    desc: "الجانب المهنيّ من Island Haven — للشركات والشركاء والداعمين.",
    href: "https://www.linkedin.com/company/ih-haven",
    handle: "Island Haven",
  },
  {
    icon: Facebook,
    ar: "فيسبوك",
    en: "Facebook",
    desc: "متابعة الأنشطة وقصص المنتسبين عبر صفحتنا الرسميّة.",
    href: "https://www.facebook.com/islandhaven101",
    handle: "islandhaven101",
  },
  {
    icon: MapPin,
    ar: "زرنا في غزّة",
    en: "Visit",
    desc: "العنوان التفصيليّ يُرسَل عبر الرسائل الخاصّة لضمان السلامة.",
    href: "https://www.instagram.com/ih_haven",
    handle: "راسلنا للعنوان",
  },
];

export function HoursLocation() {
  return (
    <section id="visit" className="relative bg-muted/40 py-24 lg:py-32 border-t border-border">
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px]">
        <EditorialHeader
          label="كل الأبواب مفتوحة"
          title={
            <>
              تابعنا، سجّل،
              <br />
              أو <span className="text-accent-gradient">زرنا.</span>
            </>
          }
          sub="نحن متواجدون على كلّ المنصّات الرئيسيّة. اختر القناة التي تناسبك واختبر المساحة قبل أن تقرّر."
        />

        {/* Where we are — hand-drawn Gaza coast with pulsing pin.
            A small love letter to the city. Never been done on a Gaza NGO site. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 lg:mb-14 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center bg-white border border-border rounded-3xl p-6 lg:p-10 shadow-soft overflow-hidden"
        >
          <div className="lg:col-span-7 order-2 lg:order-1">
            <GazaPulseMap className="w-full max-w-[480px] mx-auto aspect-square" />
          </div>
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="text-[11px] tracking-[0.14em] uppercase text-foreground/45 font-semibold mb-3">
              Where we are · أين نحن
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight leading-[1.15] mb-4">
              في قلب غزّة،<br/>
              على ضفّة المتوسّط.
            </h3>
            <p className="text-[15px] text-foreground/65 leading-relaxed mb-6">
              المساحة في موقع آمن ومركزيّ نُرسله عبر الرسائل الخاصّة بعد تأكيد
              الانتساب. النقطة النابضة على الخريطة تدلّ على الحيّ تقريباً —
              لا الإحداثيّات الدقيقة.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2 text-[13px] text-foreground/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                مفتوح الآن للزوّار بموعد مسبق
              </div>
              <div className="text-[13px] text-foreground/55">
                ٣١.٥٠° ش · ٣٤.٤٧° شرق
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {channels.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.a
                key={c.ar}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.06 }}
                className="group bg-white border border-border rounded-2xl p-7 lg:p-8 shadow-soft hover:shadow-soft-hover hover:border-primary/25 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="tile-soft w-12 h-12 rounded-xl flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="text-[11px] tracking-[0.1em] uppercase text-foreground/45 font-medium mb-1.5">
                  {c.en}
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-foreground mb-2.5">
                  {c.ar}
                </h3>
                <p className="text-[14px] text-foreground/65 leading-relaxed mb-5">
                  {c.desc}
                </p>
                <div className="flex items-center gap-2 text-primary font-semibold text-[13px] group-hover:gap-3 transition-all">
                  {c.handle}
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                </div>
              </motion.a>
            );
          })}
        </div>

        <p className="mt-10 text-[13px] text-foreground/55 max-w-2xl">
          ساعات العمل وضوابط استخدام المكان متوفّرة عند تأكيد الانتساب — راسلنا
          لأيّ تفاصيل.
        </p>
      </div>
    </section>
  );
}
