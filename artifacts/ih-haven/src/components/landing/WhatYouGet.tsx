import { Link } from "wouter";
import { ArrowLeft, Armchair, Users, Rocket, Network } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

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
    <section id="what-you-get" className="relative bg-surface-1 section-y">
      <div className="container-ih">
        <Reveal as="header" className="max-w-2xl mb-[clamp(2rem,4vw,3.5rem)]">
          <div className="eyebrow mb-4">
            {t({ ar: "ماذا تأخذ من آيلاند", en: "What you get" })}
          </div>
          <h2 className="t-h2">
            {t({ ar: "كلّ ما تحتاجه ", en: "Everything you need " })}
            <span className="text-accent-gradient">
              {t({ ar: "لتبدأ وتنمو", en: "to start and grow" })}
            </span>
          </h2>
          <p className="t-body mt-3">
            {t({
              ar: "حاضنة كاملة — مساحة، إرشاد، برامج، وشبكة — مجّانًا، من قلب غزّة.",
              en: "A full incubator — space, mentorship, programs and a network — free, from the heart of Gaza.",
            })}
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.href} delay={i * 0.07} className="h-full">
                <Link
                  href={p.href}
                  className="card-base card-hover group flex flex-col h-full p-7"
                  data-testid={`pillar-${p.href.slice(1)}`}
                >
                  <div className="icon-tile mb-5">
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <h3 className="t-h3 mb-2">{p.title}</h3>
                  <p className="t-body text-[14px] flex-1">{p.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary group-hover:gap-2.5 transition-all">
                    {p.cta}
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
