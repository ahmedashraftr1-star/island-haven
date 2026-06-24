import { motion } from "framer-motion";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type Member = {
  type: "freelancer" | "graduate" | "student";
  labelAr: string;
  labelEn: string;
};

const TOTAL = 80;
const F = Math.round(TOTAL * 0.4);
const G = Math.round(TOTAL * 0.4);

const roles: Record<Member["type"], Array<{ ar: string; en: string }>> = {
  freelancer: [
    { ar: "مطوّر واجهات", en: "Frontend Dev" },
    { ar: "مصمّمة جرافيك", en: "Graphic Designer" },
    { ar: "مترجم", en: "Translator" },
    { ar: "كاتبة محتوى", en: "Content Writer" },
    { ar: "محلّل بيانات", en: "Data Analyst" },
    { ar: "مونتيرة فيديو", en: "Video Editor" },
    { ar: "مدير منتج", en: "Product Manager" },
    { ar: "مصمّمة UX", en: "UX Designer" },
    { ar: "مصوّر", en: "Photographer" },
    { ar: "مطوّرة موبايل", en: "Mobile Dev" },
  ],
  graduate: [
    { ar: "خرّيج هندسة برمجيّات", en: "Software Eng. Grad" },
    { ar: "خرّيجة تصميم", en: "Design Graduate" },
    { ar: "خرّيج إدارة أعمال", en: "Business Grad" },
    { ar: "خرّيجة إعلام", en: "Media Graduate" },
    { ar: "خرّيج علم بيانات", en: "Data Science Grad" },
    { ar: "خرّيجة محاسبة", en: "Accounting Grad" },
    { ar: "خرّيج تسويق", en: "Marketing Grad" },
    { ar: "خرّيجة لغات", en: "Languages Grad" },
  ],
  student: [
    { ar: "طالبة برمجة", en: "CS Student" },
    { ar: "طالب هندسة", en: "Engineering Student" },
    { ar: "طالبة تصميم", en: "Design Student" },
    { ar: "طالب أعمال", en: "Business Student" },
    { ar: "طالبة إعلام", en: "Media Student" },
    { ar: "طالب رياضيّات", en: "Math Student" },
  ],
};

const members: Member[] = Array.from({ length: TOTAL }, (_, i) => {
  if (i < F) {
    const r = roles.freelancer[i % roles.freelancer.length];
    return { type: "freelancer", labelAr: r.ar, labelEn: r.en };
  }
  if (i < F + G) {
    const r = roles.graduate[(i - F) % roles.graduate.length];
    return { type: "graduate", labelAr: r.ar, labelEn: r.en };
  }
  const r = roles.student[(i - F - G) % roles.student.length];
  return { type: "student", labelAr: r.ar, labelEn: r.en };
});

function seedShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  let seed = 7;
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const grid = seedShuffle(members);

const colorOf = (t: Member["type"]) =>
  t === "freelancer"
    ? "bg-primary"
    : t === "graduate"
    ? "bg-foreground"
    : "bg-foreground/45";

export function CommunityWall() {
  const { lang } = useLanguage();
  const [hover, setHover] = useState<number | null>(null);
  const active = hover !== null ? grid[hover] : null;

  return (
    <section className="relative bg-background py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
        <div className="grid grid-cols-12 gap-6 mb-16 items-end">
          <div className="col-span-12 lg:col-span-7">
            <div className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold mb-4">
              {lang === "en" ? "[ N°06 — Wall of 80 ]" : "[ N°06 — حائط الـ٨٠ ]"}
            </div>
            <h2
              className="font-extrabold text-foreground leading-[1.1] tracking-tight"
              style={{ fontSize: "clamp(2rem, 5vw, 4.5rem)" }}
            >
              {lang === "en" ? (
                <>
                  Eighty<span className="text-primary">.</span>
                  <br />
                  Each dot has a story.
                </>
              ) : (
                <>
                  ثمانون<span className="text-primary">.</span>
                  <br />
                  لكلّ نقطة قصّة.
                </>
              )}
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <p className="text-base text-muted-foreground font-light leading-relaxed mb-6">
              {lang === "en"
                ? "This is not just a number. Eighty members rotate weekly across 39 seats — hover over a dot to meet one of them."
                : "هذا ليس مجرّد رقم. ثمانون منتسباً يدورون أسبوعيّاً على ٣٩ مقعداً — مرّر مؤشّرك فوق نقطة لتتعرّف على أحدهم."}
            </p>
            <div className="flex flex-wrap gap-5 text-xs">
              <Legend className="bg-primary" label={lang === "en" ? "Freelancer · 40%" : "فريلانسر · ٤٠٪"} />
              <Legend className="bg-foreground" label={lang === "en" ? "Graduate · 40%" : "خرّيج · ٤٠٪"} />
              <Legend className="bg-foreground/45" label={lang === "en" ? "Student · 20%" : "طالب · ٢٠٪"} />
            </div>
          </div>
        </div>

        <div className="relative">
          <div
            className="grid gap-3 lg:gap-4"
            style={{ gridTemplateColumns: "repeat(20, minmax(0, 1fr))" }}
          >
            {grid.map((m, i) => {
              const row = Math.floor(i / 20);
              const col = i % 20;
              const distFromCenter = Math.abs(row - 1.5) + Math.abs(col - 9.5);
              return (
                <motion.button
                  key={i}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  initial={{ scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.5,
                    delay: distFromCenter * 0.025,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  className="relative aspect-square group"
                  data-cursor="hover"
                >
                  <motion.span
                    animate={{
                      scale: hover === i ? 1.7 : hover === null ? 1 : 0.85,
                      opacity: hover === null ? 1 : hover === i ? 1 : 0.3,
                    }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className={`absolute inset-0 rounded-full ${colorOf(m.type)}`}
                  />
                </motion.button>
              );
            })}
          </div>

          <div className="mt-12 min-h-[80px] flex items-center justify-between gap-6 border-t border-foreground/15 pt-6">
            <div>
              <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-foreground/60 mb-2">
                {hover !== null
                  ? `Member #${String(hover + 1).padStart(2, "0")} / 80`
                  : lang === "en" ? "Hover over the wall" : "حرّك مؤشّرك على الحائط"}
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-foreground">
                {active
                  ? lang === "en" ? active.labelEn : active.labelAr
                  : lang === "en" ? "Island Haven — a renewing community" : "آيلاند هيفن — مجتمع متجدّد"}
              </div>
            </div>
            <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-foreground/50 hidden md:block">
              ↑ Hover · Tap to inspect
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-foreground/80 font-medium">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
