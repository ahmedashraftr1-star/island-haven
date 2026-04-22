import { Instagram, Linkedin, Facebook, Link as LinkIcon, ArrowLeft } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  const socials = [
    { label: "Instagram", icon: Instagram, href: "https://www.instagram.com/ih_haven" },
    { label: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/company/ih-haven" },
    { label: "Facebook", icon: Facebook, href: "https://www.facebook.com/islandhaven101" },
    { label: "Linktree", icon: LinkIcon, href: "https://linktr.ee/ih_haven" },
  ];

  const index = [
    ["#about", "من نحن"],
    ["#audience", "الفئات والمعايير"],
    ["#offerings", "ما نقدّم"],
    ["#programs", "البرامج والفعاليّات"],
    ["#story", "قصّتنا"],
    ["#visit", "تواصل معنا"],
    ["#support", "ادعمنا"],
  ];

  return (
    <footer className="relative bg-muted/40 border-t border-border pt-20 pb-10">
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px]">
        {/* Sign-off */}
        <div className="grid grid-cols-12 gap-6 lg:gap-10 mb-16">
          <div className="col-span-12 lg:col-span-9">
            <div className="text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-5">
              Colophon · شعار الكتاب
            </div>
            <h2
              className="font-bold text-foreground"
              style={{
                fontSize: "clamp(2.25rem, 6vw, 5rem)",
                lineHeight: 1.04,
                letterSpacing: "-0.025em",
              }}
            >
              مساحة <span className="text-accent-gradient">تتّسع</span>
              <br />
              لأحلامك.
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-3 lg:text-right text-[12px] text-foreground/55 font-medium flex items-end lg:justify-end">
            <div>
              تأسّس ٢٠٢٤
              <br />
              غزّة · فلسطين
            </div>
          </div>
        </div>

        {/* Colophon */}
        <div className="grid grid-cols-12 gap-6 lg:gap-10 border-t border-border pt-12">
          {/* About */}
          <div className="col-span-12 lg:col-span-5">
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
              <div className="text-xl font-bold text-foreground">Island Haven</div>
            </div>
            <p className="text-foreground/65 leading-relaxed text-[15px] mb-6 max-w-md">
              مجتمع مهنيّ ومساحة عمل في غزّة، تابع لفريق «من الناس إلى الناس».
              نوفّر بيئة عمل مجّانيّة للمستقلّين والخرّيجين وطلبة الجامعات،
              مع برامج تدريب وفرص تشبيك.
            </p>
            <div className="flex items-center gap-2">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-foreground/65 hover:text-primary hover:border-primary/30 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Index */}
          <div className="col-span-6 lg:col-span-3">
            <div className="text-[11px] tracking-[0.15em] uppercase text-foreground/45 font-semibold mb-4">
              فهرس
            </div>
            <ul className="space-y-2.5 text-[14px]">
              {index.map(([href, label]) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-foreground/75 hover:text-primary transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Programme of */}
          <div className="col-span-6 lg:col-span-4">
            <div className="text-[11px] tracking-[0.15em] uppercase text-foreground/45 font-semibold mb-4">
              برنامج تنمويّ تابع لـ
            </div>
            <div className="text-xl font-bold text-foreground mb-2">
              من الناس إلى الناس
            </div>
            <p className="text-foreground/65 leading-relaxed text-[14px] mb-5">
              فريق تطوّعيّ يعمل على إيصال الدعم المباشر إلى المشاريع المجتمعيّة
              في غزّة.
            </p>
            <div className="flex flex-col gap-2 text-[14px]">
              <a
                href="https://nastonas.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-foreground/75 hover:text-primary transition-colors w-fit"
              >
                nastonas.org
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              </a>
              <a
                href="https://nas2nas.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline underline-offset-4 w-fit"
              >
                nas2nas.org · للتبرّع
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-foreground/55">
          <p>© {year} Island Haven · غزّة — فلسطين</p>
          <p>بُني بحبّ ليتّسع لأحلامكم</p>
        </div>
      </div>
    </footer>
  );
}
