import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { EditorialHeader } from "./EditorialHeader";
import { useLanguage } from "@/contexts/LanguageContext";

const PILLARS_AR = [
  {
    n: "01",
    label: "Workspace",
    title: "مساحة عمل مهنيّة",
    body: "بيئة هادئة وحديثة بتصميم عمليّ، مكاتب مريحة وكراسٍ مناسبة لساعات طويلة من العمل أو الدراسة المركّزة دون إرهاق.",
    photo: "/photos/IMG_8357.webp",
    spec: "39 مقعداً · مكاتب فرديّة وجماعيّة",
  },
  {
    n: "02",
    label: "Connectivity",
    title: "إنترنت مستقرّ",
    body: "بنية أساسيّة داعمة للاجتماعات المرئيّة، رفع الملفّات الكبيرة، والتواصل المتواصل مع العملاء دون انقطاع.",
    photo: "/photos/IMG_8347.webp",
    spec: "اتّصال احتياطيّ · سرعة عالية",
  },
  {
    n: "03",
    label: "Power",
    title: "كهرباء لا تنقطع",
    body: "مصادر طاقة احتياطيّة تضمن استمرار العمل خلال ساعات انقطاع الشبكة، مع منافذ شحن خاصّة في كلّ مكتب.",
    photo: "/photos/IMG_8300.webp",
    spec: "طاقة بديلة · على مدار اليوم",
  },
  {
    n: "04",
    label: "Training",
    title: "ورش تدريبيّة تطبيقيّة",
    body: "برامج عمليّة مرتبطة بسوق العمل، تُقدَّم للمنتسبين وغير المنتسبين، تربط المعرفة الأكاديميّة بالتطبيق المهنيّ.",
    photo: "/photos/IMG_8352.webp",
    spec: "مفتوحة للمجتمع",
  },
  {
    n: "05",
    label: "Community",
    title: "بيئة تشاركيّة",
    body: "مساحة لتبادل الخبرات بين المستقلّين والخريجين والطلبة — يتعلّم بعضهم من بعض في كلّ يومٍ من أيّام الأسبوع.",
    photo: "/photos/IMG_8358.webp",
    spec: "80 منتسباً · ثلاث فئات",
  },
  {
    n: "06",
    label: "Network",
    title: "فرص تشبيك حقيقيّة",
    body: "علاقات مهنيّة تتجاوز جدران المكان: مشاريع مشتركة، توصيات مهنيّة، فرص عمل، وامتدادات إلى ما بعد المساحة.",
    photo: "/photos/IMG_8344.webp",
    spec: "حلقات شهريّة · عابرة للقطاعات",
  },
];

const PILLARS_EN = [
  {
    n: "01",
    label: "Workspace",
    title: "Professional workspace",
    body: "A quiet, modern environment with ergonomic design — comfortable desks and chairs suited for long hours of focused work or study without fatigue.",
    photo: "/photos/IMG_8357.webp",
    spec: "39 seats · Individual & group desks",
  },
  {
    n: "02",
    label: "Connectivity",
    title: "Stable internet",
    body: "Infrastructure that supports video calls, large file uploads, and constant client communication without interruption.",
    photo: "/photos/IMG_8347.webp",
    spec: "Backup connection · High speed",
  },
  {
    n: "03",
    label: "Power",
    title: "Uninterrupted electricity",
    body: "Backup power sources ensure work continues during outages, with dedicated charging outlets at every desk.",
    photo: "/photos/IMG_8300.webp",
    spec: "Alternative energy · All day",
  },
  {
    n: "04",
    label: "Training",
    title: "Applied training workshops",
    body: "Practical programs tied to the job market, open to members and non-members alike, bridging academic knowledge with professional application.",
    photo: "/photos/IMG_8352.webp",
    spec: "Open to the community",
  },
  {
    n: "05",
    label: "Community",
    title: "Collaborative environment",
    body: "A space for knowledge exchange between freelancers, graduates, and students — learning from each other every day of the week.",
    photo: "/photos/IMG_8358.webp",
    spec: "80 members · Three categories",
  },
  {
    n: "06",
    label: "Network",
    title: "Real networking opportunities",
    body: "Professional relationships that go beyond the space's walls: joint projects, professional referrals, job opportunities, and connections that extend beyond.",
    photo: "/photos/IMG_8344.webp",
    spec: "Monthly circles · Cross-sector",
  },
];

export function Showcase() {
  const { lang } = useLanguage();
  const pillars = lang === "en" ? PILLARS_EN : PILLARS_AR;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const cardWidth = 560;
  const totalWidth = pillars.length * (cardWidth + 32);
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -(totalWidth - 1280 + 80)]
  );

  return (
    <section
      id="offerings"
      ref={containerRef}
      className="relative bg-background"
      style={{ height: `${pillars.length * 80}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
        <div className="container mx-auto px-6 lg:px-10 max-w-7xl pt-24 pb-6">
          <EditorialHeader
            no="08"
            label={lang === "en" ? "Pillars · What we offer" : "Pillars · ما نُقدّم"}
            title={
              lang === "en" ? (
                <>
                  Six pillars that shape{" "}
                  <span className="text-primary italic">the experience</span>.
                </>
              ) : (
                <>
                  ستّة أعمدة تصنع <span className="text-primary italic">التجربة</span>.
                </>
              )
            }
            meta={<span>Horizontal Index · 06 pillars</span>}
          />
        </div>

        <div className="container mx-auto px-6 lg:px-10 max-w-7xl pb-6 flex items-center justify-between gap-6">
          <div className="flex-1 h-px bg-foreground/15 relative overflow-hidden">
            <motion.div
              className="absolute inset-y-0 right-0 origin-right h-px bg-foreground"
              style={{ scaleX: scrollYProgress }}
            />
          </div>
          <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/55 font-bold whitespace-nowrap">
            {lang === "en" ? "↓ Scroll down" : "↓ مرّر للأسفل"}
          </div>
        </div>

        <div className="flex-1 flex items-stretch overflow-hidden pb-10">
          <motion.div
            style={{ x }}
            className="flex gap-8 px-6 lg:px-10 will-change-transform"
            dir="ltr"
          >
            {pillars.map((p, i) => (
              <article
                key={i}
                className="relative shrink-0 w-[88vw] sm:w-[480px] lg:w-[560px] flex flex-col border border-foreground/15 bg-background"
                dir={lang === "en" ? "ltr" : "rtl"}
              >
                <div className="flex items-center justify-between px-6 lg:px-8 py-4 border-b border-foreground/12">
                  <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/55 font-bold">
                    [ Pillar {p.n} — {p.label} ]
                  </div>
                  <div className="text-2xl font-extrabold text-foreground/85 leading-none">
                    {p.n}
                  </div>
                </div>

                <div className="relative aspect-[4/3] overflow-hidden bg-foreground/5">
                  <img loading="lazy" decoding="async"
                    src={p.photo}
                    alt={p.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-400 hover:scale-105"
                  />
                </div>

                <div className="px-6 lg:px-8 py-7 flex-1 flex flex-col">
                  <h3
                    className="font-bold text-foreground leading-tight mb-3"
                    style={{ fontSize: "clamp(1.5rem, 2vw, 2rem)" }}
                  >
                    {p.title}
                  </h3>
                  <p className="text-[15px] text-foreground/70 font-light leading-relaxed mb-6">
                    {p.body}
                  </p>
                  <div className="mt-auto pt-4 border-t border-foreground/10 text-[10px] tracking-[0.35em] uppercase text-foreground/55 font-bold">
                    {p.spec}
                  </div>
                </div>
              </article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
