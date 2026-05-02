import { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
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
import { api, ApiError } from "@/lib/api";

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

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1300;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setN(Math.round(value * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {n.toLocaleString("ar-EG")}
    </span>
  );
}

export default function Numbers() {
  const [n, setN] = useState<Numbers | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "مُجتمعنا بالأرقام — آيلاند هيفن";
  }, []);

  useEffect(() => {
    api<{ numbers: Numbers }>("/numbers")
      .then((r) => setN(r.numbers))
      .catch((e) => setError(e instanceof ApiError ? e.message : "تعذّر التحميل"));
  }, []);

  return (
    <PageShell
      eyebrow="By the numbers"
      title="مُجتمعنا بالأرقام"
      subtitle="لا شيء هنا مكتوب يدويًّا. كلّ رقم يُحسب الآن من قاعدة بياناتنا — يتغيّر تلقائيًّا مع كلّ منتسب جديد، كلّ عمل، وكلّ مقعد محجوز."
    >
      {error && (
        <GlassCard className="p-6 text-center text-red-200 mb-8">{error}</GlassCard>
      )}

      <div className="space-y-10">
        <Group title="المجتمع" en="Community">
          <Tile
            icon={Users}
            value={n?.members}
            label="إجمالي المنتسبين"
            en="Active members"
            big
          />
          <Tile
            icon={Briefcase}
            value={n?.freelancers}
            label="مُستقلّون"
            en="Freelancers"
          />
          <Tile
            icon={GraduationCap}
            value={n?.graduates}
            label="خرّيجون"
            en="Graduates"
          />
          <Tile
            icon={Sparkles}
            value={n?.students}
            label="طلّاب"
            en="Students"
          />
        </Group>

        <Group title="الإنتاج" en="Output">
          <Tile
            icon={Briefcase}
            value={n?.works}
            label="عمل منشور في المعرض"
            en="Published works"
            big
          />
          <Tile
            icon={BookOpen}
            value={n?.courses}
            label="برنامج تدريبيّ"
            en="Programs"
          />
          <Tile
            icon={GraduationCap}
            value={n?.enrollments}
            label="تسجيل في برامج"
            en="Enrollments"
          />
        </Group>

        <Group title="الاستضافة" en="Hospitality">
          <Tile
            icon={CalendarCheck}
            value={n?.bookings}
            label="حجز نشط"
            en="Bookings"
          />
          <Tile
            icon={Users}
            value={n?.seatsHosted}
            label="مقعد استضفناه"
            en="Seats hosted"
            big
          />
          <Tile
            icon={Inbox}
            value={n?.applications}
            label="طلب انتساب"
            en="Applications"
          />
          <Tile
            icon={TrendingUp}
            value={n?.events}
            label="منشور · فعاليّة"
            en="Posts & events"
          />
        </Group>
      </div>
    </PageShell>
  );
}

function Group({
  title,
  en,
  children,
}: {
  title: string;
  en: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="text-white font-bold text-[20px] tracking-tight">{title}</h2>
        <span className="text-[10.5px] tracking-[0.22em] uppercase text-white/40 font-bold">
          {en}
        </span>
        <span className="flex-1 h-px bg-white/10" />
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
  big = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value: number | undefined;
  label: string;
  en: string;
  big?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-3xl p-5 lg:p-6 bg-white/[0.05] border border-white/10 backdrop-blur-md overflow-hidden ${
        big ? "lg:col-span-2" : ""
      }`}
      data-testid={`numbers-page-tile-${en.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center gap-2.5 mb-4 text-white/55">
        <span className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
          <Icon className="w-4 h-4" strokeWidth={2.2} />
        </span>
        <span className="text-[10.5px] tracking-[0.18em] uppercase font-bold">
          {en}
        </span>
      </div>
      <div
        className="font-bold text-white leading-none mb-2 tabular-nums"
        style={{
          fontSize: big ? "clamp(2.6rem, 6vw, 4.4rem)" : "clamp(2rem, 4.6vw, 3rem)",
          letterSpacing: "-0.03em",
        }}
      >
        {value === undefined ? (
          <span className="text-white/25">—</span>
        ) : (
          <CountUp value={value} />
        )}
      </div>
      <div className="text-[13.5px] font-semibold text-white/75">{label}</div>
    </motion.div>
  );
}
