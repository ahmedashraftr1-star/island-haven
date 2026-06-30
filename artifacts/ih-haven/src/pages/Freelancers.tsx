import { useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { FreelancerCard } from "@/components/FreelancerCard";
import { FREELANCERS, CATEGORY_LABELS, type FreelancerCategory } from "@/data/freelancers";

type Filter = "all" | FreelancerCategory;

export default function Freelancers() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const [activeCat, setActiveCat] = useState<Filter>("all");
  const [availOnly, setAvailOnly] = useState(false);

  const nf = (n: number) =>
    new Intl.NumberFormat(lang === "en" ? "en-US" : "ar-EG").format(n);

  const total = FREELANCERS.length;
  const availableCount = FREELANCERS.filter((f) => f.available).length;
  const totalProjects = FREELANCERS.reduce((s, f) => s + f.completedProjects, 0);
  const avgRating = FREELANCERS.reduce((s, f) => s + f.rating, 0) / total;

  // Only show tabs for categories that actually have talent.
  const catsPresent = (Object.keys(CATEGORY_LABELS) as FreelancerCategory[]).filter((c) =>
    FREELANCERS.some((f) => f.category === c),
  );

  const filtered = FREELANCERS.filter(
    (f) => (activeCat === "all" || f.category === activeCat) && (!availOnly || f.available),
  );

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: t({ ar: "الكلّ", en: "All" }), count: FREELANCERS.length },
    ...catsPresent.map((c) => ({
      key: c as Filter,
      label: t(CATEGORY_LABELS[c]),
      count: FREELANCERS.filter((f) => f.category === c).length,
    })),
  ];

  return (
    <PageShell
      active="freelancers"
      eyebrow={t({ ar: "فريلانسر دائم · Freelancers", en: "Freelancers · Hire from Gaza" })}
      title={t({ ar: "موهبة", en: "Talent" })}
      highlight={t({ ar: "لا تُحدّها الجغرافيا", en: "without borders" })}
      titleClassName="text-sand"
      highlightClassName="text-foreground"
      subtitle={t({
        ar: "فريلانسرز محترفون من قلب غزّة — يعملون مع عملاء حول العالم. وثّق عملك، ابنِ سمعتك، واكسب من أيّ مكان.",
        en: "Professional freelancers from the heart of Gaza — working with clients worldwide. Build your reputation, and earn from anywhere.",
      })}
      heroAside={
        <div className="rounded-[18px] border border-border-strong bg-surface-2/40 p-7 sm:p-8">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-primary rtl:tracking-normal">
            {t({ ar: "موهبة نشطة", en: "Active talent" })}
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span
              className="font-mono font-black text-sand-bright tnum leading-none"
              style={{ fontSize: "clamp(2.8rem,6vw,4rem)" }}
            >
              {nf(total)}
            </span>
            <span className="t-caption text-fg-secondary">{t({ ar: "موهبة في الشبكة", en: "talents listed" })}</span>
          </div>
          <div aria-hidden className="my-5 h-px w-full bg-border-strong" />
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="font-mono font-bold text-foreground tnum text-[22px] leading-none">{nf(totalProjects)}+</dt>
              <dd className="t-caption text-fg-secondary mt-1.5">{t({ ar: "مشروع مُنجز", en: "projects done" })}</dd>
            </div>
            <div>
              <dt className="font-mono font-bold text-foreground tnum text-[22px] leading-none">
                {lang === "en" ? avgRating.toFixed(1) : nf(Number(avgRating.toFixed(1)))}
                <span className="text-fg-faint">/{nf(5)}</span>
              </dt>
              <dd className="t-caption text-fg-secondary mt-1.5">{t({ ar: "تقييم متوسّط", en: "avg. rating" })}</dd>
            </div>
          </dl>
          <div aria-hidden className="my-5 h-px w-full bg-border-strong" />
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            <span className="text-[13.5px] font-semibold text-foreground">
              {t({ ar: `${nf(availableCount)} متاحون للعمل الآن`, en: `${nf(availableCount)} available now` })}
            </span>
          </div>
        </div>
      }
    >
      {/* Hero CTAs */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/apply?type=freelancer"
          className="cta-fill inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold"
        >
          {t({ ar: "أضف ملفّك الشخصيّ", en: "Add your profile" })}
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Link>
        <a
          href="#talents"
          className="inline-flex items-center gap-2 rounded-full border border-border-strong px-6 py-3 text-[14px] font-semibold text-foreground transition-colors hover:border-primary/50"
        >
          {t({ ar: "استعرض المواهب", en: "Browse talent" })}
        </a>
      </div>

      {/* ── Filter + grid ── */}
      <section id="talents" className="mt-[clamp(3.5rem,7vw,6rem)]">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const active = activeCat === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCat(tab.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 h-9 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-primary border-primary text-white"
                    : "border-border-strong text-fg-secondary hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className={`tnum text-[11px] ${active ? "text-white/70" : "text-fg-faint"}`}>{nf(tab.count)}</span>
              </button>
            );
          })}
        </div>

        {/* Count + availability toggle */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <span className="t-caption text-fg-secondary tnum">
            {nf(filtered.length)} {t({ ar: "فريلانسر", en: "freelancers" })}
          </span>
          <button
            type="button"
            onClick={() => setAvailOnly((v) => !v)}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-fg-secondary"
            aria-pressed={availOnly}
          >
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                availOnly ? "bg-primary" : "bg-border-strong"
              }`}
            >
              <span
                className={`absolute h-4 w-4 rounded-full bg-white transition-transform ${
                  availOnly ? "translate-x-0.5" : "translate-x-[1.125rem]"
                } rtl:${availOnly ? "-translate-x-0.5" : "-translate-x-[1.125rem]"}`}
              />
            </span>
            {t({ ar: "المتاحون فقط", en: "Available only" })}
          </button>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <ul className="mt-[clamp(1.75rem,3.5vw,2.5rem)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((f, i) => (
              <FreelancerCard key={f.id} f={f} i={i} />
            ))}
          </ul>
        ) : (
          <p className="mt-12 t-body text-center text-fg-secondary">
            {t({ ar: "لا مواهب في هذا التصنيف بعد.", en: "No talent in this category yet." })}
          </p>
        )}
      </section>

      {/* ── Hire widget ── */}
      <section className="mt-[clamp(4.5rem,9vw,8rem)] rounded-[22px] border border-border-strong bg-surface-1 px-6 py-[clamp(3rem,7vw,5rem)] text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        >
          <h2
            className="font-display font-bold text-foreground leading-tight"
            style={{ fontSize: "clamp(1.7rem,3.8vw,2.8rem)", letterSpacing: "-0.03em" }}
          >
            {t({ ar: "هل تبحث عن موهبةٍ محدّدة؟", en: "Looking for specific talent?" })}
          </h2>
          <p className="t-body text-[15px] mt-3 max-w-xl mx-auto">
            {t({
              ar: "أخبرنا بما تحتاج — وسنرشّح أفضل المواهب لمشروعك خلال ٢٤ ساعة.",
              en: "Tell us what you need — we'll match the best talent to your project within 24 hours.",
            })}
          </p>
          <Link
            href="/contact?type=hire"
            className="cta-fill mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold"
          >
            {t({ ar: "أرسل طلب التوظيف", en: "Send a hiring request" })}
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </motion.div>
      </section>
    </PageShell>
  );
}
