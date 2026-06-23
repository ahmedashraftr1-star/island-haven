import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowLeft, Users, Briefcase, GraduationCap, CalendarCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useContentSection } from "@/hooks/use-content";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";

const FALLBACK = {
  eyebrow: "الحاضنة بالأرقام · By the numbers",
  titleA: "ليست شعارات.",
  titleAccent: "أرقام حقيقيّة",
  titleB: "من قاعدة بياناتنا.",
  sub: "كلّ رقم تراه هنا يعكس حالة الحاضنة الآن — يتغيّر تلقائيًّا مع كلّ منتسب، كلّ مشروع، وكلّ مقعد إرشاد.",
  ctaLabel: "عرض الكلّ",
  tile1Label: "رائد/ة أعمال في المجتمع",
  tile1En: "Members",
  tile2Label: "مشروع في المعرض",
  tile2En: "Works",
  tile3Label: "تسجيل في البرامج",
  tile3En: "Enrollments",
  tile4Label: "مقعد استضفناه",
  tile4En: "Seats hosted",
};

interface Numbers {
  members: number;
  works: number;
  courses: number;
  enrollments: number;
  bookings: number;
  seatsHosted: number;
  events: number;
  applications: number;
}

function CountUp({ value, lang }: { value: number; lang: Lang }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1100;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      // Apple-style ease-out
      const eased = 1 - Math.pow(1 - k, 3);
      setN(Math.round(value * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  // Localised numeral: Arabic-Indic in AR, Western digits in EN.
  return (
    <span ref={ref} className="tabular-nums">
      {n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
    </span>
  );
}

/**
 * NumbersBand — homepage section that surfaces a tight 4-tile snapshot
 * of the community's real numbers, with a clear "view more" link to the
 * full /numbers page. Numbers come straight from the database — never
 * hard-coded.
 */
export function NumbersBand() {
  const { lang, t } = useLanguage();
  const [n, setN] = useState<Numbers | null>(null);
  const c = useContentSection("numbersBand", FALLBACK);

  useEffect(() => {
    api<{ numbers: Numbers }>("/numbers")
      .then((r) => setN(r.numbers))
      .catch(() => setN(null));
  }, []);

  const tiles = [
    {
      value: n?.members ?? 0,
      label: t({ ar: c.tile1Label, en: "Members of the community" }),
      en: c.tile1En,
      icon: Users,
    },
    {
      value: n?.works ?? 0,
      label: t({ ar: c.tile2Label, en: "Works in the showcase" }),
      en: c.tile2En,
      icon: Briefcase,
    },
    {
      value: n?.enrollments ?? 0,
      label: t({ ar: c.tile3Label, en: "Program enrollments" }),
      en: c.tile3En,
      icon: GraduationCap,
    },
    {
      value: n?.seatsHosted ?? 0,
      label: t({ ar: c.tile4Label, en: "Seats we've hosted" }),
      en: c.tile4En,
      icon: CalendarCheck,
    },
  ];

  return (
    <section
      id="numbers"
      className="relative bg-muted/40 py-20 lg:py-28 border-t border-border"
    >
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px]">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-end mb-10 lg:mb-12">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-[11px] tracking-[0.18em] uppercase text-primary font-bold">
                {t({ ar: c.eyebrow, en: "By the numbers" })}
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 h-5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-[10px] font-bold tracking-wider">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                LIVE
              </span>
            </div>
            <h2
              className="font-bold text-foreground tracking-tight leading-[1.08]"
              style={{ fontSize: "clamp(1.95rem, 4.4vw, 3.1rem)" }}
            >
              {t({ ar: c.titleA, en: "Not slogans." })}
              <br />
              <span className="text-accent-gradient">
                {t({ ar: c.titleAccent, en: "Real numbers" })}
              </span>{" "}
              {t({ ar: c.titleB, en: "from our database." })}
            </h2>
          </div>
          <div className="lg:col-span-5 lg:text-end">
            <p className="text-[15px] text-foreground/65 leading-relaxed mb-5 max-w-md lg:ms-auto">
              {t({
                ar: c.sub,
                en: "Every figure here mirrors the incubator right now — updating automatically with each member, each project, and each mentorship seat.",
              })}
            </p>
            <Link
              href="/numbers"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
              data-testid="link-numbers-more"
            >
              {t({ ar: c.ctaLabel, en: "View all" })}
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {tiles.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.en}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.07 }}
                className="relative bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-[0_18px_44px_-22px_rgba(0,0,0,0.7)] hover:border-primary/25 hover:shadow-[0_28px_64px_-20px_rgba(220,68,84,0.28)] transition-all duration-500 hover:-translate-y-1 group overflow-hidden"
                data-testid={`numbers-tile-${t.en.toLowerCase()}`}
              >
                <div
                  aria-hidden
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                />
                <div className="relative">
                  <div className="tile-soft w-11 h-11 rounded-xl flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <div
                    className="font-display font-extrabold text-foreground leading-none mb-2.5 tabular-nums"
                    style={{ fontSize: "clamp(2.6rem, 6vw, 4rem)", letterSpacing: "-0.04em" }}
                  >
                    {n ? <CountUp value={t.value} lang={lang} /> : "—"}
                  </div>
                  <div className="text-[14px] font-semibold text-foreground/75">
                    {t.label}
                  </div>
                  <div className="text-[10.5px] tracking-[0.18em] uppercase text-foreground/40 font-semibold mt-1">
                    {t.en}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
