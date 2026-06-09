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
import { Link } from "wouter";

const STEPS = [
  {
    num: "01",
    icon: FileText,
    title: "تقدّم بطلبك",
    en: "Apply",
    desc: "أكمل نموذج التقديم الإلكتروني. سيستغرق ما بين 15 و30 دقيقة. كن صريحاً في وصف فكرتك وتحدياتها — نُقدّر الصراحة.",
    time: "15–30 دقيقة",
    color: "from-blue-500/20 to-blue-600/5",
    accent: "text-blue-400",
    border: "border-blue-500/20",
  },
  {
    num: "02",
    icon: Search,
    title: "المراجعة الأوليّة",
    en: "Initial Review",
    desc: "يراجع فريقنا طلبك خلال 5–7 أيام عمل. نتحقق من جدّية الفكرة، ومدى توافقها مع معايير الحاضنة، وإمكانية التنفيذ.",
    time: "5–7 أيام",
    color: "from-violet-500/20 to-violet-600/5",
    accent: "text-violet-400",
    border: "border-violet-500/20",
  },
  {
    num: "03",
    icon: Users,
    title: "المقابلة",
    en: "Interview",
    desc: "إذا اجتزت المرحلة الأوليّة، ستُدعى لمقابلة مع لجنة من الحاضنة. الجلسة تستمرّ 30–45 دقيقة وتكون مباشرة أو عبر الإنترنت.",
    time: "30–45 دقيقة",
    color: "from-amber-500/20 to-amber-600/5",
    accent: "text-amber-400",
    border: "border-amber-500/20",
  },
  {
    num: "04",
    icon: CheckCircle2,
    title: "قرار القبول",
    en: "Decision",
    desc: "يصدر القرار خلال أسبوع من المقابلة. سواء قُبِلت أو لم تُقبَل، ستحصل على تغذية راجعة واضحة تساعدك على التطوير.",
    time: "5–7 أيام",
    color: "from-emerald-500/20 to-emerald-600/5",
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  {
    num: "05",
    icon: Rocket,
    title: "الاستقبال والتوجيه",
    en: "Onboarding",
    desc: "أسبوع توجيهيّ مكثّف تتعرّف فيه على الفريق والخبراء والأعضاء. تُوضع خارطة طريق واضحة لمشروعك خلال مدة البرنامج.",
    time: "أسبوع كامل",
    color: "from-primary/20 to-primary/5",
    accent: "text-primary",
    border: "border-primary/20",
  },
  {
    num: "06",
    icon: Trophy,
    title: "الانطلاق",
    en: "Launch",
    desc: "ابدأ رحلتك رسمياً ضمن دُفعتك. متابعة أسبوعية، ورشات شهريّة، وإرشاد مباشر — وفي نهاية البرنامج تعرض مشروعك في Demo Day.",
    time: "3–6 أشهر",
    color: "from-rose-500/20 to-rose-600/5",
    accent: "text-rose-400",
    border: "border-rose-500/20",
  },
];

const FAQS = [
  { q: "هل يمكنني التقديم أكثر من مرة؟", a: "نعم. إذا لم تُقبَل في دورة، يمكنك التقديم للدورة التالية مع تطوير طلبك بناءً على التغذية الراجعة." },
  { q: "هل هناك حدّ أدنى لعمر المتقدم؟", a: "لا يوجد حدّ أدنى رسمي للعمر، لكن معظم المتقدمين فوق الـ 18. إذا كنت أصغر ولديك مشروع جدّي، تواصل معنا مباشرة." },
  { q: "هل أحتاج إلى شريك في المشروع للتقديم؟", a: "لا. يمكنك التقديم بمفردك. بعض المشاريع تبدأ فردية وتجد شركاءها داخل الحاضنة لاحقاً." },
];

export default function Process() {
  return (
    <PageShell
      eyebrow="Application Process · عمليّة القبول"
      title="طريقك إلى آيلاند"
      subtitle="6 خطوات واضحة — من تقديم طلبك إلى إطلاق مشروعك."
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
                            <span className="text-[11px] text-white/30 font-medium">{step.en}</span>
                          </div>
                          <h3 className="text-[17px] font-bold text-white mb-2">{step.title}</h3>
                          <p className="text-[13.5px] text-white/55 leading-relaxed">{step.desc}</p>
                          <div className="flex items-center gap-1.5 mt-3">
                            <Clock className={`w-3.5 h-3.5 ${step.accent} opacity-60`} />
                            <span className={`text-[12px] font-medium ${step.accent} opacity-75`}>{step.time}</span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </div>

                  {/* Connector dot — only on desktop */}
                  <div className={`hidden lg:flex ${isRight ? "lg:col-start-2 justify-start" : "lg:col-start-1 justify-end"} items-center`}>
                    <div className="relative">
                      <div className={`w-4 h-4 rounded-full border-2 ${step.border} bg-[#0A0E1A] ${isRight ? "-translate-x-full" : "translate-x-full"}`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-[20px] font-bold text-white mb-5">أسئلة شائعة عن التقديم</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FAQS.map((faq, i) => (
              <GlassCard key={i} className="p-5">
                <h3 className="text-[14px] font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-[13px] text-white/50 leading-relaxed">{faq.a}</p>
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
          <h3 className="text-[22px] font-bold text-white mb-2">مستعدّ للبدء؟</h3>
          <p className="text-white/45 text-[14px] mb-6">خصّص 20 دقيقة وقدّم طلبك الآن — فكرتك تستحق.</p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-white font-semibold text-[15px] hover:bg-primary/90 transition-colors shadow-xl shadow-primary/25"
          >
            قدّم طلب الانتساب
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
          <div className="mt-4">
            <Link
              href="/faq"
              className="text-[13px] text-white/35 hover:text-white/60 transition-colors underline underline-offset-2"
            >
              عندك أسئلة؟ راجع الأسئلة الشائعة
            </Link>
          </div>
        </motion.div>
      </div>
    </PageShell>
  );
}
