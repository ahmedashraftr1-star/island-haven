import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Wifi,
  Zap,
  Armchair,
  Users,
  GraduationCap,
  Network,
} from "lucide-react";

const cards = [
  {
    n: "01",
    icon: Armchair,
    title: "مساحة عمل مهنيّة",
    description:
      "بيئة هادئة وحديثة بتصميم عمليّ، مكاتب مريحة وكراسٍ مناسبة لساعات طويلة من العمل أو الدراسة المركّزة.",
    photo: "/photos/IMG_8357.jpg",
  },
  {
    n: "02",
    icon: Wifi,
    title: "إنترنت مستقرّ",
    description:
      "بنية أساسيّة داعمة لاجتماعات مرئيّة، رفع ملفات، وتواصل مع العملاء دون انقطاع.",
    photo: "/photos/IMG_8347.jpg",
  },
  {
    n: "03",
    icon: Zap,
    title: "كهرباء لا تنقطع",
    description:
      "مصادر طاقة احتياطيّة تضمن استمرار العمل خلال ساعات انقطاع الشبكة، مع منافذ شحن في كلّ مكتب.",
    photo: "/photos/IMG_8300.jpg",
  },
  {
    n: "04",
    icon: GraduationCap,
    title: "ورش تدريبيّة تطبيقيّة",
    description:
      "برامج عمليّة مرتبطة بسوق العمل، تُقدَّم للمنتسبين وغير المنتسبين، تربط المعرفة بالتطبيق.",
    photo: "/photos/IMG_8352.jpg",
  },
  {
    n: "05",
    icon: Users,
    title: "بيئة تشاركيّة",
    description:
      "مساحة لتبادل الخبرات بين المستقلّين والخريجين والطلبة — يتعلّم بعضهم من بعض كلّ يوم.",
    photo: "/photos/IMG_8358.jpg",
  },
  {
    n: "06",
    icon: Network,
    title: "فرص تشبيك حقيقيّة",
    description:
      "علاقات مهنيّة تتجاوز جدران المكان: مشاريع مشتركة، توصيات، فرص عمل، وامتدادات إلى ما بعد المساحة.",
    photo: "/photos/IMG_8344.jpg",
  },
];

export function Showcase() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const cardWidth = 520;
  const totalWidth = cards.length * (cardWidth + 24);
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
      style={{ height: `${cards.length * 80}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
        {/* Header strip */}
        <div className="container mx-auto px-6 lg:px-10 max-w-7xl pt-28 pb-8 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold mb-3">
              [ N°04 — ما نُقدّمه ]
            </div>
            <h2
              className="font-black text-foreground leading-[1.05] tracking-tight max-w-2xl"
              style={{
                fontFamily: "Cairo, sans-serif",
                fontSize: "clamp(1.75rem, 4vw, 3.5rem)",
              }}
            >
              ستّة أعمدة تصنع التجربة.
            </h2>
          </div>
          <div className="text-xs text-muted-foreground tracking-[0.2em] uppercase font-medium">
            ↓ مرّر للأسفل لاستعراض الأعمدة
          </div>
        </div>

        {/* Horizontal track */}
        <div className="flex-1 flex items-center overflow-hidden">
          <motion.div
            style={{ x }}
            className="flex gap-6 px-6 lg:px-10 will-change-transform"
            dir="ltr"
          >
            {cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <article
                  key={i}
                  className="relative shrink-0 w-[85vw] sm:w-[480px] lg:w-[520px] aspect-[3/4] rounded-3xl overflow-hidden border border-foreground/10 bg-card group"
                >
                  <img
                    src={c.photo}
                    alt={c.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/40 to-transparent" />
                  <div className="absolute top-6 right-6 left-6 flex items-start justify-between text-background" dir="rtl">
                    <div className="text-[10px] tracking-[0.3em] uppercase font-bold opacity-80">
                      عمود
                    </div>
                    <div
                      className="text-3xl font-black tracking-tight"
                      style={{ fontFamily: "Cairo, sans-serif" }}
                    >
                      {c.n}
                    </div>
                  </div>

                  <div className="absolute bottom-0 right-0 left-0 p-8 lg:p-10 text-background" dir="rtl">
                    <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-5 shadow-lg">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3
                      className="text-2xl lg:text-3xl font-bold mb-3 leading-tight"
                      style={{ fontFamily: "Cairo, sans-serif" }}
                    >
                      {c.title}
                    </h3>
                    <p className="text-sm lg:text-base text-background/85 font-light leading-relaxed max-w-md">
                      {c.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </motion.div>
        </div>

        {/* Bottom progress */}
        <div className="container mx-auto px-6 lg:px-10 max-w-7xl pb-8 pt-6">
          <div className="h-[3px] bg-foreground/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary origin-left"
              style={{ scaleX: scrollYProgress }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
