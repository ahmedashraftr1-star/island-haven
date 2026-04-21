export function Footer() {
  const year = new Date().getFullYear();

  const socials: { label: string; abbr: string; href: string }[] = [
    { label: "Instagram", abbr: "IG", href: "https://www.instagram.com/ih_haven" },
    { label: "LinkedIn", abbr: "LI", href: "https://www.linkedin.com/company/ih-haven" },
    { label: "Facebook", abbr: "FB", href: "https://www.facebook.com/islandhaven101" },
    { label: "Linktree", abbr: "LT", href: "https://linktr.ee/ih_haven" },
  ];

  const index: [string, string, string][] = [
    ["#about", "من نحن", "04"],
    ["#audience", "الفئات والمعايير", "07"],
    ["#offerings", "ما نقدّم", "08"],
    ["#programs", "البرامج والفعاليّات", "09"],
    ["#story", "قصّتنا", "12"],
    ["#campaign", "الحملة الراهنة", "13"],
    ["#visit", "ساعات وموقع", "15"],
    ["#support", "ادعمنا", "16"],
  ];

  return (
    <footer className="relative bg-background border-t border-foreground/15 pt-20 pb-10 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-10 max-w-7xl">
        {/* Massive sign-off type */}
        <div className="grid grid-cols-12 gap-6 lg:gap-10 mb-20">
          <div className="col-span-12 lg:col-span-9">
            <div className="text-[10px] tracking-[0.4em] uppercase text-primary font-bold mb-5">
              [ N°17 — Colophon ]
            </div>
            <h2
              className="font-extrabold text-foreground leading-[1.1] tracking-tight"
              style={{
                fontFamily: "Cairo, sans-serif",
                fontSize: "clamp(2.75rem, 8vw, 7.5rem)",
              }}
            >
              مساحة <span className="text-primary italic">تتّسع</span>
              <br />
              لأحلامك.
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-3 lg:text-right text-[10px] tracking-[0.4em] uppercase text-foreground/55 font-bold flex items-end lg:justify-end">
            <div>
              EST. 2024
              <br />
              GAZA · PALESTINE
            </div>
          </div>
        </div>

        {/* Editorial colophon table */}
        <div className="grid grid-cols-12 gap-6 lg:gap-10 border-t border-foreground/12 pt-12">
          {/* About */}
          <div className="col-span-12 lg:col-span-4">
            <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-bold mb-4">
              [ The Project ]
            </div>
            <div
              className="text-2xl font-bold text-foreground mb-2"
              style={{ fontFamily: "Cairo, sans-serif" }}
            >
              Island Haven
            </div>
            <p className="text-foreground/70 font-light leading-relaxed text-[15px] mb-6 max-w-sm">
              مجتمع مهنيّ ومساحة عمل في غزّة، تابع لفريق «من الناس إلى الناس».
              نوفّر بيئة عملٍ مجّانيّة للمستقلّين والخرّيجين وطلبة الجامعات،
              مع برامج تدريب وفرص تشبيك.
            </p>
            <div className="flex items-center gap-5 text-[11px] tracking-[0.3em] uppercase font-bold">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="group inline-flex items-baseline gap-1.5 text-foreground/65 hover:text-foreground transition-colors"
                >
                  <span className="text-foreground/40 group-hover:text-primary transition-colors">/</span>
                  <span>{s.abbr}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Index */}
          <div className="col-span-6 lg:col-span-4">
            <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-bold mb-4">
              [ Index ]
            </div>
            <ul className="space-y-0 text-sm">
              {index.map(([href, label, no]) => (
                <li key={href}>
                  <a
                    href={href}
                    className="group flex items-baseline justify-between gap-3 py-2.5 border-b border-foreground/10 hover:border-primary transition-colors"
                  >
                    <span className="text-foreground group-hover:text-primary transition-colors">
                      {label}
                    </span>
                    <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/40 font-bold">
                      N°{no}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Programme of */}
          <div className="col-span-6 lg:col-span-4">
            <div className="text-[10px] tracking-[0.4em] uppercase text-foreground/45 font-bold mb-4">
              [ Programme of ]
            </div>
            <div
              className="text-2xl font-bold text-foreground mb-2"
              style={{ fontFamily: "Cairo, sans-serif" }}
            >
              من الناس إلى الناس
            </div>
            <p className="text-foreground/70 font-light leading-relaxed text-[15px] mb-6">
              فريق تطوّعيّ يعمل على إيصال الدعم المباشر إلى المشاريع المجتمعيّة في غزّة.
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="https://nastonas.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors font-bold tracking-wide underline-offset-4 hover:underline"
              >
                nastonas.org →
              </a>
              <a
                href="https://nas2nas.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors font-bold tracking-wide underline-offset-4 hover:underline"
              >
                nas2nas.org · للتبرّع →
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-foreground/12 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] tracking-[0.3em] uppercase font-bold text-foreground/55">
          <p>© {year} Island Haven · غزّة — فلسطين</p>
          <p>Volume N°01 · بُني بحبّ ليتّسع لأحلامكم</p>
        </div>
      </div>
    </footer>
  );
}
