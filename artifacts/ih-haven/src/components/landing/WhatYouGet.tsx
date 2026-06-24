import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Armchair, Users, Rocket, Network } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * WhatYouGet — the incubator's core promise, stated plainly. Every world-class
 * accelerator (YC, Antler, Techstars) has a clear "what you get" block. Four
 * substantive pillars, each linking to the real surface that delivers it.
 */
export function WhatYouGet() {
  const { t } = useLanguage();

  const pillars = [
    {
      icon: Armchair,
      title: t({ ar: "مساحة عمل مجّانيّة", en: "A free workspace" }),
      body: t({
        ar: "مقعد ثابت في مساحة هادئة بإنترنت موثوق وكهرباء — احجز مقعدك متى احتجت.",
        en: "A reliable seat in a calm space with stable internet and power — book it whenever you need.",
      }),
      href: "/book",
      cta: t({ ar: "احجز مقعدك", en: "Book a seat" }),
    },
    {
      icon: Users,
      title: t({ ar: "إرشاد من خبراء", en: "Expert mentorship" }),
      body: t({
        ar: "جلسات فرديّة مع مرشدين وروّاد أعمال ومتخصّصين — هندسةً وتصميمًا وأعمالًا.",
        en: "1:1 sessions with mentors, founders and specialists — engineering, design and business.",
      }),
      href: "/experts",
      cta: t({ ar: "تعرّف على المرشدين", en: "Meet the mentors" }),
    },
    {
      icon: Rocket,
      title: t({ ar: "برامج ودفعات + Demo Day", en: "Programs, cohorts & Demo Day" }),
      body: t({
        ar: "مسارات احتضان وتسريع منظّمة، تنتهي بيوم عرض أمام شبكة من الداعمين.",
        en: "Structured incubation & acceleration tracks that culminate in a Demo Day to our network.",
      }),
      href: "/programs",
      cta: t({ ar: "استكشف البرامج", en: "Explore programs" }),
    },
    {
      icon: Network,
      title: t({ ar: "شبكة ومجتمع", en: "A network & community" }),
      body: t({
        ar: "انضمّ لمجتمع من المستقلّين والخرّيجين والمؤسّسين — تعاون، أعمال، وفرص.",
        en: "Join a community of freelancers, graduates and founders — collaboration, work and opportunity.",
      }),
      href: "/members",
      cta: t({ ar: "تصفّح المجتمع", en: "Browse the community" }),
    },
  ];

  return (
    <section id="what-you-get" className="relative bg-muted/40 py-20 lg:py-28 border-t border-border">
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px]">
        <div className="max-w-2xl mb-12 lg:mb-16">
          <div className="text-[11px] tracking-[0.2em] uppercase text-primary font-bold mb-3">
            {t({ ar: "ماذا تأخذ من آيلاند", en: "What you get" })}
          </div>
          <h2
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(1.95rem, 4.6vw, 3.4rem)", letterSpacing: "-0.03em" }}
          >
            {t({ ar: "كلّ ما تحتاجه ", en: "Everything you need " })}
            <span className="text-accent-gradient">
              {t({ ar: "لتبدأ وتنمو", en: "to start and grow" })}
            </span>
          </h2>
          <p className="mt-4 text-foreground/60 text-[15px] leading-relaxed">
            {t({
              ar: "حاضنة كاملة — مساحة، إرشاد، برامج، وشبكة — مجّانًا، من قلب غزّة.",
              en: "A full incubator — space, mentorship, programs and a network — free, from the heart of Gaza.",
            })}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.href}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="h-full"
              >
                <Link
                  href={p.href}
                  className="group flex flex-col h-full rounded-3xl bg-card border border-border p-7 hover:border-primary/40 hover:-translate-y-1 transition-all duration-500 shadow-soft hover:shadow-soft-hover"
                  data-testid={`pillar-${p.href.slice(1)}`}
                >
                  <div className="tile-soft w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-foreground font-bold text-[17px] mb-2 leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-foreground/65 text-[13.5px] leading-relaxed flex-1">
                    {p.body}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary group-hover:gap-2.5 transition-all">
                    {p.cta}
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180 ltr:rotate-180" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
