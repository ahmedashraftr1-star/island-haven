import { motion } from "framer-motion";
import { MapPin, Instagram, Linkedin, Facebook, Link2, FileText, ArrowLeft } from "lucide-react";

const links = [
  {
    icon: <Link2 className="w-5 h-5" />,
    title: "Linktree الرسمي",
    description: "كل روابطنا في مكان واحد، يشمل رابط الانتساب ومقعد الضيف.",
    href: "https://linktr.ee/ih_haven",
    cta: "linktr.ee/ih_haven",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "نموذج التسجيل",
    description: "للانتساب إلى المجتمع — راجع معايير القبول قبل التقديم.",
    href: "https://forms.gle/5r7dEeidxjg46m399",
    cta: "افتح نموذج التسجيل",
  },
  {
    icon: <Instagram className="w-5 h-5" />,
    title: "إنستغرام",
    description: "آخر الأخبار، الورش، الفعاليّات، وصور من داخل المساحة.",
    href: "https://www.instagram.com/ih_haven",
    cta: "‎@ih_haven",
  },
  {
    icon: <Linkedin className="w-5 h-5" />,
    title: "لينكدإن",
    description: "الجانب المهنيّ من Island Haven — للشركات والشركاء والداعمين.",
    href: "https://www.linkedin.com/company/ih-haven",
    cta: "Island Haven on LinkedIn",
  },
  {
    icon: <Facebook className="w-5 h-5" />,
    title: "فيسبوك",
    description: "متابعة الأنشطة وقصص المنتسبين عبر صفحتنا الرسمية.",
    href: "https://www.facebook.com/islandhaven101",
    cta: "facebook.com/islandhaven101",
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    title: "زرنا في غزّة",
    description: "العنوان التفصيليّ يُرسَل عبر الرسائل الخاصّة لضمان السلامة.",
    href: "https://www.instagram.com/ih_haven",
    cta: "راسلنا للحصول على العنوان",
  },
];

export function HoursLocation() {
  return (
    <section id="visit" className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="max-w-2xl mb-12">
          <span className="inline-block text-sm font-medium text-primary tracking-wide mb-4">
            تواصل معنا
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground leading-tight">
            كلّ الأبواب مفتوحة
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed">
            تابعنا، سجّل للانتساب، أو احجز مقعد ضيف لتجرّب المساحة قبل أن تقرّر.
            نحن متواجدون على كلّ المنصّات الرئيسيّة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {links.map((l, i) => (
            <motion.a
              key={i}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group p-7 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all flex flex-col"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {l.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">{l.title}</h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed mb-5 flex-1">
                {l.description}
              </p>
              <span className="inline-flex items-center gap-2 text-primary font-medium text-sm">
                {l.cta}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 group-hover:-translate-x-1 transition-transform" />
              </span>
            </motion.a>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-2xl border border-dashed border-border bg-secondary/10">
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            <span className="font-medium text-foreground">ملاحظة:</span> ساعات العمل
            وضوابط استخدام المكان متوفّرة عند تأكيد الانتساب. للاطّلاع على الضوابط
            الكاملة، يُرجى التواصل عبر إحدى قنواتنا.
          </p>
        </div>
      </div>
    </section>
  );
}
