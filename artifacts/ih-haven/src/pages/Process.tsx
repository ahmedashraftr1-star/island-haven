import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Users,
  CheckCircle2,
  Rocket,
  Trophy,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

const STEPS = [
  {
    num: "01",
    icon: FileText,
    title: { ar: "تقدّم بطلبك", en: "Apply" },
    en: "Apply",
    desc: {
      ar: "أكمل نموذج التقديم الإلكتروني. سيستغرق ما بين 15 و30 دقيقة. كن صريحاً في وصف فكرتك وتحدياتها — نُقدّر الصراحة.",
      en: "Complete the online application. It takes 15–30 minutes. Be candid about your idea and its challenges — we value honesty.",
    },
    time: { ar: "15–30 دقيقة", en: "15–30 minutes" },
    color: "from-blue-500/20 to-blue-600/5",
    accent: "text-blue-400",
    border: "border-blue-500/20",
  },
  {
    num: "02",
    icon: Search,
    title: { ar: "المراجعة الأوليّة", en: "Initial Review" },
    en: "Initial Review",
    desc: {
      ar: "يراجع فريقنا طلبك خلال 5–7 أيام عمل. نتحقق من جدّية الفكرة، ومدى توافقها مع معايير الحاضنة، وإمكانية التنفيذ.",
      en: "Our team reviews your application within 5–7 business days. We assess the idea's seriousness, fit with the incubator's criteria, and feasibility.",
    },
    time: { ar: "5–7 أيام", en: "5–7 days" },
    color: "from-violet-500/20 to-violet-600/5",
    accent: "text-violet-400",
    border: "border-violet-500/20",
  },
  {
    num: "03",
    icon: Users,
    title: { ar: "المقابلة", en: "Interview" },
    en: "Interview",
    desc: {
      ar: "إذا اجتزت المرحلة الأوليّة، ستُدعى لمقابلة مع لجنة من الحاضنة. الجلسة تستمرّ 30–45 دقيقة وتكون مباشرة أو عبر الإنترنت.",
      en: "If you pass the first stage, you'll be invited to an interview with an incubator panel. The session lasts 30–45 minutes, in person or online.",
    },
    time: { ar: "30–45 دقيقة", en: "30–45 minutes" },
    color: "from-amber-500/20 to-amber-600/5",
    accent: "text-amber-400",
    border: "border-amber-500/20",
  },
  {
    num: "04",
    icon: CheckCircle2,
    title: { ar: "قرار القبول", en: "Decision" },
    en: "Decision",
    desc: {
      ar: "يصدر القرار خلال أسبوع من المقابلة. سواء قُبِلت أو لم تُقبَل، ستحصل على تغذية راجعة واضحة تساعدك على التطوير.",
      en: "A decision is issued within a week of the interview. Whether accepted or not, you'll receive clear feedback to help you grow.",
    },
    time: { ar: "5–7 أيام", en: "5–7 days" },
    color: "from-emerald-500/20 to-emerald-600/5",
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  {
    num: "05",
    icon: Rocket,
    title: { ar: "الاستقبال والتوجيه", en: "Onboarding" },
    en: "Onboarding",
    desc: {
      ar: "أسبوع توجيهيّ مكثّف تتعرّف فيه على الفريق والخبراء والأعضاء. تُوضع خارطة طريق واضحة لمشروعك خلال مدة البرنامج.",
      en: "An intensive orientation week where you meet the team, experts, and members. A clear roadmap is set for your project across the program.",
    },
    time: { ar: "أسبوع كامل", en: "A full week" },
    color: "from-primary/20 to-primary/5",
    accent: "text-primary",
    border: "border-primary/20",
  },
  {
    num: "06",
    icon: Trophy,
    title: { ar: "الانطلاق", en: "Launch" },
    en: "Launch",
    desc: {
      ar: "ابدأ رحلتك رسمياً ضمن دُفعتك. متابعة أسبوعية، ورشات شهريّة، وإرشاد مباشر — وفي نهاية البرنامج تعرض مشروعك في Demo Day.",
      en: "Officially begin your journey within your cohort. Weekly check-ins, monthly workshops, and direct mentorship — and at the end you present at Demo Day.",
    },
    time: { ar: "3–6 أشهر", en: "3–6 months" },
    color: "from-rose-500/20 to-rose-600/5",
    accent: "text-rose-400",
    border: "border-rose-500/20",
  },
];

const FAQS = [
  {
    q: { ar: "هل يمكنني التقديم أكثر من مرة؟", en: "Can I apply more than once?" },
    a: {
      ar: "نعم. إذا لم تُقبَل في دورة، يمكنك التقديم للدورة التالية مع تطوير طلبك بناءً على التغذية الراجعة.",
      en: "Yes. If you aren't accepted in one round, you can apply for the next one, improving your application based on the feedback.",
    },
  },
  {
    q: { ar: "هل هناك حدّ أدنى لعمر المتقدم؟", en: "Is there a minimum applicant age?" },
    a: {
      ar: "لا يوجد حدّ أدنى رسمي للعمر، لكن معظم المتقدمين فوق الـ 18. إذا كنت أصغر ولديك مشروع جدّي، تواصل معنا مباشرة.",
      en: "There's no official minimum age, but most applicants are over 18. If you're younger and have a serious project, reach out to us directly.",
    },
  },
  {
    q: {
      ar: "هل أحتاج إلى شريك في المشروع للتقديم؟",
      en: "Do I need a co-founder to apply?",
    },
    a: {
      ar: "لا. يمكنك التقديم بمفردك. بعض المشاريع تبدأ فردية وتجد شركاءها داخل الحاضنة لاحقاً.",
      en: "No. You can apply on your own. Some projects start solo and find their partners inside the incubator later.",
    },
  },
];

export default function Process() {
  const { t } = useLanguage();
  return (
    <PageShell
      eyebrow={t({
        ar: "Application Process · عمليّة القبول",
        en: "Application Process",
      })}
      title={t({ ar: "طريقك إلى آيلاند", en: "Your path to Island Haven" })}
      subtitle={t({
        ar: "6 خطوات واضحة — من تقديم طلبك إلى إطلاق مشروعك.",
        en: "6 clear steps — from submitting your application to launching your project.",
      })}
    >
      <div className="space-y-14">
        {/* Timeline */}
        <div className="relative">
          <div className="hidden lg:block absolute right-[calc(50%-1px)] top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          <div className="space-y-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isRight = i % 2 === 0;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isRight ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={`lg:grid lg:grid-cols-2 gap-8 items-center ${isRight ? "" : "lg:dir-ltr"}`}
                >
                  {/* Card — full width on mobile, half on desktop */}
                  <div className={`${isRight ? "lg:col-start-1" : "lg:col-start-2"} relative`}>
                    <GlassCard className={`p-6 border ${step.border} bg-gradient-to-br ${step.color}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${step.color} border ${step.border} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${step.accent}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className={`text-[11px] font-bold tracking-widest ${step.accent} opacity-60`}>
                              {step.num}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-medium">{step.en}</span>
                          </div>
                          <h3 className="text-[17px] font-bold text-foreground mb-2">{t(step.title)}</h3>
                          <p className="text-[13.5px] text-muted-foreground leading-relaxed">{t(step.desc)}</p>
                          <div className="flex items-center gap-1.5 mt-3">
                            <Clock className={`w-3.5 h-3.5 ${step.accent} opacity-60`} />
                            <span className={`text-[12px] font-medium ${step.accent} opacity-75`}>{t(step.time)}</span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </div>

                  {/* Connector dot — only on desktop */}
                  <div className={`hidden lg:flex ${isRight ? "lg:col-start-2 justify-start" : "lg:col-start-1 justify-end"} items-center`}>
                    <div className="relative">
                      <div className={`w-4 h-4 rounded-full border-2 ${step.border} bg-surface-1 ${isRight ? "-translate-x-full" : "translate-x-full"}`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-[20px] font-bold text-foreground mb-5">
            {t({ ar: "أسئلة شائعة عن التقديم", en: "Frequently asked questions" })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FAQS.map((faq, i) => (
              <GlassCard key={i} className="p-5">
                <h3 className="text-[14px] font-bold text-foreground mb-2">{t(faq.q)}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{t(faq.a)}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center py-8 rounded-3xl border border-primary/20 bg-primary/[0.05]"
        >
          <h3 className="text-[22px] font-bold text-foreground mb-2">
            {t({ ar: "مستعدّ للبدء؟", en: "Ready to begin?" })}
          </h3>
          <p className="text-fg-secondary text-[14px] mb-6">
            {t({
              ar: "خصّص 20 دقيقة وقدّم طلبك الآن — فكرتك تستحق.",
              en: "Set aside 20 minutes and apply now — your idea deserves it.",
            })}
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary-cta text-white font-semibold text-[15px] hover:bg-primary/90 transition-colors shadow-xl shadow-primary/25"
          >
            {t({ ar: "قدّم طلب الانتساب", en: "Submit your application" })}
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
          <div className="mt-4">
            <Link
              href="/faq"
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              {t({
                ar: "عندك أسئلة؟ راجع الأسئلة الشائعة",
                en: "Have questions? Check the FAQ",
              })}
            </Link>
          </div>
        </motion.div>
      </div>
    </PageShell>
  );
}
