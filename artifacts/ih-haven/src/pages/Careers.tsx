import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Target, Users, TrendingUp } from "lucide-react";
import { PageShell } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

const EMAIL = "island-haven@nastonas.org";

type Bi = { ar: string; en: string };

const REASONS: { icon: typeof Target; title: Bi; body: Bi }[] = [
  {
    icon: Target,
    title: { ar: "مهمّة تستحقّ", en: "A mission worth it" },
    body: {
      ar: "كلّ يوم عملٍ هنا يُترجَم إلى فرصةٍ حقيقيّة لشابّ أو شابّة في غزّة.",
      en: "Every working day here turns into a real opportunity for a young person in Gaza.",
    },
  },
  {
    icon: Users,
    title: { ar: "فريق صغير، أثر كبير", en: "Small team, big impact" },
    body: {
      ar: "ستعمل مباشرةً مع المؤسّسين في بيئةٍ تتحرّك بسرعة ولا تنتظر الإذن.",
      en: "You'll work directly with the founders in a fast-moving, ownership-first environment.",
    },
  },
  {
    icon: TrendingUp,
    title: { ar: "نموّ حقيقيّ", en: "Real growth" },
    body: {
      ar: "تعلّم، اشتبك مع مشكلات صعبة، وابنِ مساراً مهنيّاً مختلفاً عن أيّ مكانٍ آخر.",
      en: "Learn, take on hard problems, and build a career path unlike anywhere else.",
    },
  },
];

const JOBS: { title: Bi; cat: Bi; body: Bi; tags: Bi[] }[] = [
  {
    title: { ar: "مدير برامج الاحتضان", en: "Incubation Programs Lead" },
    cat: { ar: "البرامج · دوام كامل", en: "Programs · Full-time" },
    body: {
      ar: "تصميم وتنفيذ مسارات الاحتضان لدفعات المنتسبين، والتنسيق مع المرشدين والدّاعمين حتّى يوم العرض.",
      en: "Design and run the incubation tracks for each cohort, coordinating mentors and backers through to Demo Day.",
    },
    tags: [
      { ar: "غزّة", en: "Gaza" },
      { ar: "دوام كامل", en: "Full-time" },
    ],
  },
  {
    title: { ar: "منسّق محتوى ومجتمع", en: "Content & Community Coordinator" },
    cat: { ar: "المحتوى والإعلام · دوام جزئيّ", en: "Community & Media · Part-time" },
    body: {
      ar: "إنتاج قصص النجاح، إدارة حسابات التواصل الاجتماعيّ، وتنظيم فعاليّات المجتمع وورشه.",
      en: "Produce success stories, run the social channels, and organise community events and workshops.",
    },
    tags: [
      { ar: "غزّة", en: "Gaza" },
      { ar: "دوام جزئيّ", en: "Part-time" },
    ],
  },
  {
    title: { ar: "مطوّر منتج (متطوّع)", en: "Product Engineer (Volunteer)" },
    cat: { ar: "المنتج · تطوّع", en: "Product · Volunteer" },
    body: {
      ar: "المساهمة في بناء الأدوات الدّاخليّة وتحسين تجربة المنتسبين رقميًّا، جنبًا إلى جنب مع الفريق.",
      en: "Help build the internal tooling and improve the members' digital experience, side by side with the team.",
    },
    tags: [
      { ar: "عن بُعد", en: "Remote" },
      { ar: "تطوّع", en: "Volunteer" },
    ],
  },
];

export default function Careers() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <PageShell
      active="careers"
      eyebrow={t({ ar: "الوظائف · انضمّ إلينا", en: "Careers · Join us" })}
      title={t({ ar: "انضمّ إلى", en: "Join the" })}
      highlight={t({ ar: "فريق آيلاند", en: "Island Haven team" })}
      subtitle={t({
        ar: "نبحث عن أناسٍ يؤمنون أنّ الموهبة لا تحدّها الجغرافيا. إذا أردت أن تصنع فرقًا من قلب غزّة — فهذا مكانك.",
        en: "We're looking for people who believe talent isn't bound by geography. If you want to make a difference from the heart of Gaza — this is your place.",
      })}
      heroAside={
        <div className="rounded-[18px] border border-border-strong bg-surface-2/40 p-7 sm:p-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div
                className="font-mono font-black text-sand-bright tnum leading-none"
                style={{ fontSize: "clamp(2.6rem,6vw,3.75rem)" }}
              >
                {t({ ar: "٣", en: "3" })}
              </div>
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted-foreground mt-3 rtl:tracking-normal">
                {t({ ar: "وظائف مفتوحة", en: "open roles" })}
              </div>
            </div>
            <div>
              <div
                className="font-mono font-black text-primary tnum leading-none"
                style={{ fontSize: "clamp(2.6rem,6vw,3.75rem)" }}
              >
                {t({ ar: "٢٠٢٦", en: "2026" })}
              </div>
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted-foreground mt-3 rtl:tracking-normal">
                {t({ ar: "الدفعة القادمة", en: "next cohort" })}
              </div>
            </div>
          </div>
          <div aria-hidden className="my-6 h-px w-full bg-border-strong" />
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            <span className="text-[14px] font-semibold text-foreground">
              {t({ ar: "التوظيف مفتوح الآن", en: "Hiring open now" })}
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-[clamp(4.5rem,9vw,8rem)]">
        {/* ── Why Island Haven ── */}
        <section>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          >
            <span className="eyebrow eyebrow-sand">{t({ ar: "لماذا آيلاند", en: "Why Island Haven" })}</span>
            <h2
              className="font-display font-bold text-foreground mt-4 leading-[1.05]"
              style={{ fontSize: "clamp(1.8rem,4vw,3rem)", letterSpacing: "-0.03em" }}
            >
              {t({ ar: "أثرٌ حقيقيّ، من قلب غزّة.", en: "Real impact, from the heart of Gaza." })}
            </h2>
          </motion.div>

          <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {REASONS.map((r, i) => {
              const Icon = r.icon;
              return (
                <motion.div
                  key={i}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_OUT_EXPO }}
                  className="rounded-[18px] border border-border-strong bg-surface-2/40 p-6 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/40"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <h3 className="font-display font-bold text-foreground text-[18px] mt-4 leading-tight">
                    {t(r.title)}
                  </h3>
                  <p className="t-body text-[14.5px] mt-2">{t(r.body)}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Open positions ── */}
        <section>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
            className="pb-[clamp(1.25rem,2.5vw,2rem)] border-b border-border-strong"
          >
            <span className="eyebrow text-primary font-mono">{t({ ar: "الوظائف المفتوحة", en: "Open positions" })}</span>
            <h2
              className="font-display font-bold text-foreground mt-3 leading-tight"
              style={{ fontSize: "clamp(1.6rem,3.4vw,2.4rem)", letterSpacing: "-0.03em" }}
            >
              {t({ ar: "ثلاثة أدوار، أثرٌ واحد.", en: "Three roles, one mission." })}
            </h2>
          </motion.div>

          <ul className="mt-[clamp(2rem,4vw,3rem)] space-y-3 sm:space-y-4">
            {JOBS.map((job, i) => (
              <motion.li
                key={i}
                initial={reduce ? false : { opacity: 0, y: 18 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: Math.min(i, 4) * 0.06, ease: EASE_OUT_EXPO }}
                className="rounded-[18px] border border-border-strong bg-surface-2/40 p-6 sm:p-7 transition-[border-color] duration-300 hover:border-primary/40"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-primary rtl:tracking-normal">
                      {t(job.cat)}
                    </span>
                    <h3 className="font-display font-bold text-foreground text-[clamp(1.25rem,2.4vw,1.6rem)] mt-2 leading-tight">
                      {t(job.title)}
                    </h3>
                    <p className="t-body text-[14.5px] mt-2 max-w-2xl">{t(job.body)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.tags.map((tag, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center rounded-full border border-border-strong px-2.5 py-0.5 text-[11px] text-fg-secondary"
                        >
                          {t(tag)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href="/apply"
                    className="cta-fill inline-flex shrink-0 items-center gap-2 self-start rounded-full px-5 py-2.5 text-[14px] font-semibold md:self-center"
                  >
                    {t({ ar: "تقدّم الآن", en: "Apply now" })}
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </div>
              </motion.li>
            ))}
          </ul>
        </section>

        {/* ── Open application CTA ── */}
        <section className="border-t border-border-strong pt-[clamp(2.5rem,5vw,4rem)] text-center">
          <h2
            className="font-display font-bold text-foreground leading-tight"
            style={{ fontSize: "clamp(1.6rem,3.6vw,2.6rem)", letterSpacing: "-0.03em" }}
          >
            {t({ ar: "لا تجد وظيفتك هنا؟", en: "Don't see your role?" })}
          </h2>
          <p className="t-body text-[15px] mt-3 max-w-xl mx-auto">
            {t({
              ar: "أرسل لنا ملفّك الشخصيّ وأخبرنا كيف تريد أن تترك أثرًا — الباب مفتوح دائمًا.",
              en: "Send us your profile and tell us how you'd make a difference — the door is always open.",
            })}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`mailto:${EMAIL}?subject=${encodeURIComponent(
                t({ ar: "طلب انضمام إلى فريق آيلاند", en: "Joining the Island Haven team" }),
              )}`}
              className="cta-fill inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold"
            >
              {t({ ar: "راسلنا مباشرةً", en: "Email us directly" })}
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </a>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 rounded-full border border-border-strong px-6 py-3 text-[14px] font-semibold text-foreground transition-colors hover:border-primary/50"
            >
              {t({ ar: "احجز جلسة مع المؤسّس", en: "Book a session with the founder" })}
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
