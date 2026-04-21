import { Instagram, Linkedin, Facebook, Link2, ExternalLink } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 py-14">
          <div className="md:col-span-5">
            <div className="text-3xl font-bold text-foreground mb-1">Island Haven</div>
            <div className="text-sm text-primary mb-4 font-medium">مساحة تتّسع لأحلامك</div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-sm">
              مجتمع مهنيّ ومساحة عمل في غزّة، تابع لفريق "من الناس إلى الناس".
              نوفّر بيئة عمل مجانيّة للمستقلّين والخريجين وطلبة الجامعات،
              مع برامج تدريب وفرص تشبيك.
            </p>

            <div className="flex items-center gap-2 mt-6">
              <a
                href="https://www.instagram.com/ih_haven"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-secondary/20 text-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/ih-haven"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-full bg-secondary/20 text-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/islandhaven101"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-secondary/20 text-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://linktr.ee/ih_haven"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Linktree"
                className="w-10 h-10 rounded-full bg-secondary/20 text-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
              >
                <Link2 className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">
              تنقّل
            </div>
            <ul className="space-y-3 text-sm">
              <li><a href="#about" className="text-foreground hover:text-primary transition-colors">من نحن</a></li>
              <li><a href="#audience" className="text-foreground hover:text-primary transition-colors">الفئات والمعايير</a></li>
              <li><a href="#offerings" className="text-foreground hover:text-primary transition-colors">ما نقدّم</a></li>
              <li><a href="#programs" className="text-foreground hover:text-primary transition-colors">البرامج والفعاليّات</a></li>
              <li><a href="#story" className="text-foreground hover:text-primary transition-colors">قصّتنا</a></li>
              <li><a href="#visit" className="text-foreground hover:text-primary transition-colors">تواصل معنا</a></li>
              <li><a href="#support" className="text-foreground hover:text-primary transition-colors">ادعمنا</a></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-medium">
              برنامج تنمويّ تابع لـ
            </div>
            <div className="text-lg font-bold text-foreground mb-2">من الناس إلى الناس</div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed mb-4">
              فريق تطوّعيّ يعمل على إيصال الدعم المباشر إلى المشاريع المجتمعيّة في غزّة.
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href="https://nastonas.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              >
                nastonas.org <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://nas2nas.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              >
                nas2nas.org — تبرّع <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {year} Island Haven · غزّة — فلسطين</p>
          <p className="font-light">بُني بحبّ، ليتّسع لأحلامكم.</p>
        </div>
      </div>
    </footer>
  );
}
