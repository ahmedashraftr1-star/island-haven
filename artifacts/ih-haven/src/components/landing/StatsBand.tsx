import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  Briefcase,
  Sparkles,
  CalendarCheck,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";

interface Stats {
  users: number;
  applications: number;
  bookings: number;
  courses: number;
  enrollments: number;
  works: number;
  daily: number;
}

const ITEMS: Array<{
  key: keyof Stats;
  label: string;
  hint: string;
  icon: typeof Users;
}> = [
  { key: "users", label: "عضو في المجتمع", hint: "Members", icon: Users },
  { key: "courses", label: "كورس وورشة", hint: "Courses", icon: GraduationCap },
  {
    key: "enrollments",
    label: "تَسجيل في الفعاليّات",
    hint: "Enrollments",
    icon: Sparkles,
  },
  { key: "works", label: "عمل منشور", hint: "Works", icon: Briefcase },
  { key: "bookings", label: "حَجزَ مَقعَدًا", hint: "Bookings", icon: CalendarCheck },
  { key: "applications", label: "طَلبَ الانتساب", hint: "Applications", icon: FileText },
];

export function StatsBand() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ stats: Stats }>("/stats")
      .then((r) => {
        if (!cancelled) setStats(r.stats);
      })
      .catch(() => {
        // Silent: stats are decorative — never break the homepage on a hiccup.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative bg-gradient-to-b from-background to-background/60 border-y border-border">
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px] py-14 lg:py-20">
        <div className="text-center mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold">
              مَجتمَعنا بالأرقام
            </span>
          </div>
          <h2
            className="font-bold text-foreground"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              letterSpacing: "-0.025em",
            }}
          >
            أرقام حقيقيّة من قَلب المساحة
          </h2>
          <p className="text-foreground/55 text-[14px] sm:text-[15px] leading-[1.85] mt-3 max-w-2xl mx-auto">
            تُحدَّث لحظيًّا — كلّ رقم هنا يَحكي قصّة شَخص اختار أن يَنتمي.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="relative rounded-2xl bg-white border border-border p-5 lg:p-6 shadow-soft hover:shadow-soft-hover transition-shadow text-center"
              data-testid={`stat-${item.key}`}
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/8 text-primary mb-3">
                <item.icon className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div
                className="text-[28px] lg:text-[32px] font-bold text-foreground tabular-nums"
                style={{ letterSpacing: "-0.03em", lineHeight: 1 }}
              >
                {stats ? stats[item.key].toLocaleString("ar-EG") : "—"}
              </div>
              <div className="text-[12px] text-foreground/65 mt-2 font-medium leading-tight">
                {item.label}
              </div>
              <div className="text-[9.5px] tracking-[0.16em] uppercase text-foreground/35 mt-1">
                {item.hint}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
