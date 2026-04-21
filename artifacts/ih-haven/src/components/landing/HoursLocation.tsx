import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";

const channels = [
  {
    no: "01",
    ar: "Linktree الرسمي",
    en: "All links",
    desc: "كلّ روابطنا في مكان واحد، يشمل رابط الانتساب ومقعد الضيف.",
    href: "https://linktr.ee/ih_haven",
    handle: "linktr.ee/ih_haven",
  },
  {
    no: "02",
    ar: "نموذج التسجيل",
    en: "Apply",
    desc: "للانتساب إلى المجتمع — راجع معايير القبول قبل التقديم.",
    href: "/apply",
    handle: "افتح النموذج",
  },
  {
    no: "03",
    ar: "إنستغرام",
    en: "Instagram",
    desc: "آخر الأخبار، الورش، الفعاليّات، وصور من داخل المساحة.",
    href: "https://www.instagram.com/ih_haven",
    handle: "@ih_haven",
  },
  {
    no: "04",
    ar: "لينكدإن",
    en: "LinkedIn",
    desc: "الجانب المهنيّ من Island Haven — للشركات والشركاء والداعمين.",
    href: "https://www.linkedin.com/company/ih-haven",
    handle: "Island Haven",
  },
  {
    no: "05",
    ar: "فيسبوك",
    en: "Facebook",
    desc: "متابعة الأنشطة وقصص المنتسبين عبر صفحتنا الرسميّة.",
    href: "https://www.facebook.com/islandhaven101",
    handle: "islandhaven101",
  },
  {
    no: "06",
    ar: "زرنا في غزّة",
    en: "Visit",
    desc: "العنوان التفصيليّ يُرسَل عبر الرسائل الخاصّة لضمان السلامة.",
    href: "https://www.instagram.com/ih_haven",
    handle: "راسلنا للعنوان",
  },
];

export function HoursLocation() {
  return (
    <section id="visit" className="relative bg-background py-24 lg:py-32 border-t border-foreground/10">
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
        <EditorialHeader
          no="15"
          label="كل الأبواب مفتوحة"
          meta={<>Reach<br />us</>}
          title={
            <>
              تابعنا، سجّل،
              <br />
              أو <span className="text-primary italic">زرنا.</span>
            </>
          }
          sub="نحن متواجدون على كلّ المنصّات الرئيسيّة. اختر القناة التي تناسبك واختبر المساحة قبل أن تقرّر."
        />

        <div className="border-t border-foreground/12">
          {channels.map((c) => (
            <motion.a
              key={c.no}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
              className="group grid grid-cols-12 gap-4 lg:gap-10 items-baseline py-7 lg:py-9 border-b border-foreground/12 hover:bg-foreground hover:text-background transition-colors"
            >
              <div className="col-span-2 lg:col-span-1 text-[11px] tracking-[0.3em] font-bold text-foreground/45 group-hover:text-background/45">
                {c.no}
              </div>
              <div className="col-span-10 lg:col-span-3">
                <h3
                  className="font-bold leading-tight"
                  style={{
                    fontFamily: "Cairo, sans-serif",
                    fontSize: "clamp(1.4rem, 2vw, 1.875rem)",
                  }}
                >
                  {c.ar}
                </h3>
                <div className="text-[10px] tracking-[0.3em] uppercase text-foreground/45 group-hover:text-background/45 mt-2">
                  {c.en}
                </div>
              </div>
              <p className="col-span-12 lg:col-span-5 text-foreground/75 group-hover:text-background/85 font-light leading-relaxed text-[15px]">
                {c.desc}
              </p>
              <div className="col-span-12 lg:col-span-3 lg:text-right text-[11px] tracking-[0.25em] uppercase font-bold text-primary group-hover:text-primary flex items-center lg:justify-end gap-2">
                {c.handle}
                <span className="inline-block transition-transform group-hover:-translate-x-2 rtl:group-hover:translate-x-2">
                  →
                </span>
              </div>
            </motion.a>
          ))}
        </div>

        <p className="mt-10 text-[11px] tracking-[0.3em] uppercase font-bold text-foreground/45 max-w-2xl">
          ساعات العمل وضوابط استخدام المكان متوفّرة عند تأكيد الانتساب — راسلنا لأيّ تفاصيل.
        </p>
      </div>
    </section>
  );
}
