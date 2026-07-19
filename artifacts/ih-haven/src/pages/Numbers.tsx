import { useEffect, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import {
  Users,
  Briefcase,
  GraduationCap,
  CalendarCheck,
  BookOpen,
  Sparkles,
  Inbox,
  TrendingUp,
} from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { useContentSection } from "@/hooks/use-content";

const FALLBACK = {
  eyebrow: "By the numbers",
  title: "مُجتمعنا بالأرقام",
  subtitle:
    "لا شيء هنا مكتوب يدويًّا. كلّ رقم يُحسب الآن من قاعدة بياناتنا — يتغيّر تلقائيًّا مع كلّ منتسب جديد، كلّ عمل، وكلّ مقعد محجوز.",
  group1Title: "المجتمع",
  group1En: "Community",
  group2Title: "الإنتاج",
  group2En: "Output",
  group3Title: "الاستضافة",
  group3En: "Hospitality",
  tMembers: "إجمالي المنتسبين",
  tFreelancers: "مُستقلّون",
  tGraduates: "خرّيجون",
  tStudents: "طلّاب",
  tWorks: "عمل منشور في المعرض",
  tCourses: "برنامج تدريبيّ",
  tEnrollments: "تسجيل في برامج",
  tBookings: "حجز نشط",
  tSeats: "مقعد استضفناه",
  tApplications: "طلب انتساب",
  tEvents: "منشور · فعاليّة",
};

interface Numbers {
  members: number;
  freelancers: number;
  graduates: number;
  students: number;
  works: number;
  courses: number;
  enrollments: number;
  bookings: number;
  seatsHosted: number;
  applications: number;
  events: number;
}

function CountUp({ value, lang }: { value: number; lang: Lang }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (reduce || value <= 0) {
      setN(value);
      return;
    }
    if (inView) {
      const start = performance.now();
      const dur = 1300;
      let raf = 0;
      const tick = (timer: number) => {
        const k = Math.min(1, (timer - start) / dur);
        setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    // Safety net: never stall at 0 if the element never registers as in-view.
    const fallback = window.setTimeout(() => setN(value), 1400);
    return () => clearTimeout(fallback);
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
    </span>
  );
}

export default function Numbers() {
  const { lang, t } = useLanguage();
  const [n, setN] = useState<Numbers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const c = useContentSection("pageNumbers", FALLBACK);

  useEffect(() => {
    document.title =
      lang === "ar"
        ? "مُجتمعنا بالأرقام — آيلاند هيفن"
        : "Our Community by the Numbers — Island Haven";
  }, [lang]);

  useEffect(() => {
    api<{ numbers: Numbers }>("/numbers")
      .then((r) => setN(r.numbers))
      .catch((e) =>
        setError(
          lang === "ar"
              ? "تعذّر التحميل"
              : "Couldn't load the numbers",
        ),
      );
  }, [lang]);

  return (
    <PageShell
      eyebrow={t({ ar: c.eyebrow, en: "By the numbers" })}
      title={t({ ar: c.title, en: "Our Community by the Numbers" })}
      subtitle={t({
        ar: c.subtitle,
        en: "Nothing here is written by hand. Every number is computed live from our database — updating automatically with each new member, every published work, and each booked seat.",
      })}
    >
      {error && (
        <GlassCard className="p-6 text-center text-destructive mb-8">{error}</GlassCard>
      )}

      <div className="space-y-10">
        <Group title={t({ ar: c.group1Title, en: c.group1En })} en={c.group1En} lang={lang}>
          <Tile icon={Users} value={n?.members} label={t({ ar: c.tMembers, en: "Active members" })} en="Active members" lang={lang} big />
          <Tile icon={Briefcase} value={n?.freelancers} label={t({ ar: c.tFreelancers, en: "Freelancers" })} en="Freelancers" lang={lang} />
          <Tile icon={GraduationCap} value={n?.graduates} label={t({ ar: c.tGraduates, en: "Graduates" })} en="Graduates" lang={lang} />
          <Tile icon={Sparkles} value={n?.students} label={t({ ar: c.tStudents, en: "Students" })} en="Students" lang={lang} />
        </Group>

        <Group title={t({ ar: c.group2Title, en: c.group2En })} en={c.group2En} lang={lang}>
          <Tile icon={Briefcase} value={n?.works} label={t({ ar: c.tWorks, en: "Published works" })} en="Published works" lang={lang} big />
          <Tile icon={BookOpen} value={n?.courses} label={t({ ar: c.tCourses, en: "Programs" })} en="Programs" lang={lang} />
          <Tile icon={GraduationCap} value={n?.enrollments} label={t({ ar: c.tEnrollments, en: "Enrollments" })} en="Enrollments" lang={lang} />
        </Group>

        <Group title={t({ ar: c.group3Title, en: c.group3En })} en={c.group3En} lang={lang}>
          <Tile icon={CalendarCheck} value={n?.bookings} label={t({ ar: c.tBookings, en: "Bookings" })} en="Bookings" lang={lang} />
          <Tile icon={Users} value={n?.seatsHosted} label={t({ ar: c.tSeats, en: "Seats hosted" })} en="Seats hosted" lang={lang} big />
          <Tile icon={Inbox} value={n?.applications} label={t({ ar: c.tApplications, en: "Applications" })} en="Applications" lang={lang} />
          <Tile icon={TrendingUp} value={n?.events} label={t({ ar: c.tEvents, en: "Posts & events" })} en="Posts & events" lang={lang} />
        </Group>
      </div>
    </PageShell>
  );
}

function Group({
  title,
  en,
  lang,
  children,
}: {
  title: string;
  en: string;
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="text-foreground font-bold text-[20px] tracking-tight">{title}</h2>
        {lang === "ar" && (
          <span className="text-[10.5px] tracking-[0.22em] uppercase text-muted-foreground font-bold">
            {en}
          </span>
        )}
        <span className="flex-1 h-px bg-surface-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {children}
      </div>
    </section>
  );
}

function Tile({
  icon: Icon,
  value,
  label,
  en,
  lang,
  big = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value: number | undefined;
  label: string;
  en: string;
  lang: Lang;
  big?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-3xl p-5 lg:p-6 bg-surface-2 border border-border-strong backdrop-blur-md overflow-hidden ${
        big ? "lg:col-span-2" : ""
      }`}
      data-testid={`numbers-page-tile-${en.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center gap-2.5 mb-4 text-muted-foreground">
        <span className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
          <Icon className="w-4 h-4" strokeWidth={2.2} />
        </span>
        {lang === "ar" && (
          <span className="text-[10.5px] tracking-[0.18em] uppercase font-bold">
            {en}
          </span>
        )}
      </div>
      <div
        className="font-bold text-foreground leading-none mb-2 tabular-nums"
        style={{
          fontSize: big ? "clamp(2.6rem, 6vw, 4.4rem)" : "clamp(2rem, 4.6vw, 3rem)",
          letterSpacing: "-0.03em",
        }}
      >
        {value === undefined ? (
          <span className="text-fg-faint">—</span>
        ) : (
          <CountUp value={value} lang={lang} />
        )}
      </div>
      <div className="text-[13.5px] font-semibold text-fg-secondary">{label}</div>
    </motion.div>
  );
}
