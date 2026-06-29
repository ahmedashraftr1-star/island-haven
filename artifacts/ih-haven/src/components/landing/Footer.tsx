import { Instagram, Linkedin, Facebook, Link as LinkIcon, ArrowLeft, Mail, Phone, MessageCircle } from "lucide-react";
import { imageUrl, useContent, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { I18N } from "@/lib/i18n";

const FOOTER_FALLBACK = {
  logo: "/logo.png",
  colophonEyebrow: "Colophon · شعار الكتاب",
  signOffA: "حاضنة",
  signOffAccent: "نحضنُ",
  signOffB: "أحلامكم.",
  estLabel: "تأسّس ٢٠٢٤",
  placeLabel: "غزّة · فلسطين",
  brand: "Island Haven",
  aboutBody:
    "حاضنة أعمال غزّاويّة. نَحضن المشاريع الناشئة والمستقلّين والخرّيجين بإرشاد، برامج، وشبكة من الخبراء والشركاء.",
  indexLabel: "فهرس",
  programmeLabel: "برنامج تنمويّ تابع لـ",
  programmeTitle: "من الناس إلى الناس",
  programmeBody:
    "آيلاند هيفن هو البرنامج التنمويّ للتقنية والريادة من «من النّاس إلى النّاس» — جسر تضامن يربط أصدقاء غزّة بمشاريع حقيقيّة على الأرض.",
  contactLabel: "تواصل معنا",
  bottomCopy: "© Island Haven · غزّة — فلسطين",
  bottomTag: "بُني بحبّ ليتّسع لأحلامكم",
};

const CONTACT_FALLBACK = {
  instagram: "https://www.instagram.com/ih_haven",
  linkedin: "https://www.linkedin.com/company/ih-haven",
  facebook: "https://www.facebook.com/islandhaven101",
  linktree: "https://linktr.ee/ih_haven",
  nastonas: "https://nastonas.org",
  nas2nas: "https://nastonas.org/generalDonations/4/0",
  email: "island-haven@nastonas.org",
  phone: "+972 56 753 6815",
  whatsapp: "https://wa.me/972567536815",
};

export function Footer() {
  const { lang, t } = useLanguage();
  const cms = useContentSection("footer", FOOTER_FALLBACK);
  const c = lang === "en" ? {
    ...cms,
    colophonEyebrow: I18N.footer.colophon.en,
    signOffA: I18N.footer.signOffA.en,
    signOffAccent: I18N.footer.signOffAccent.en,
    signOffB: I18N.footer.signOffB.en,
    estLabel: I18N.footer.estLabel.en,
    placeLabel: I18N.footer.placeLabel.en,
    aboutBody: I18N.footer.aboutBody.en,
    indexLabel: I18N.footer.indexLabel.en,
    contactLabel: I18N.footer.contactLabel.en,
    programmeLabel: I18N.footer.programmeLabel.en,
    programmeTitle: I18N.footer.programmeTitle.en,
    programmeBody: I18N.footer.programmeBody.en,
    bottomCopy: I18N.footer.copyright.en,
    bottomTag: I18N.footer.builtWith.en,
  } : cms;
  const contact = useContentSection("contact", CONTACT_FALLBACK);
  const { data } = useContent();
  const heroEyebrow = data?.content.hero?.eyebrow;

  const socials = [
    { label: "Instagram", icon: Instagram, href: contact.instagram },
    { label: "LinkedIn", icon: Linkedin, href: contact.linkedin },
    { label: "Facebook", icon: Facebook, href: contact.facebook },
    { label: "Linktree", icon: LinkIcon, href: contact.linktree },
  ].filter((s) => s.href);

  const indexEntries = Object.entries(I18N.footerIndex) as Array<[keyof typeof I18N.footerIndex, { ar: string; en: string }]>;
  const index: Array<[string, string]> = indexEntries.map(([href, bi]) => [href, t(bi)]);

  return (
    <footer className="relative bg-[#050505] border-t border-border-strong pt-20 pb-10">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[55%] brand-aura opacity-50" />

      <div className="container-ih relative">
        <div className="grid grid-cols-12 gap-6 lg:gap-10 mb-16 items-start">
          <div className="col-span-12 lg:col-span-9">
            <div className="eyebrow mb-6">
              {t({ ar: "إيماننا", en: "What we believe" })}
            </div>
            <h2
              className="font-display font-extrabold text-foreground max-w-4xl"
              style={{ fontSize: "clamp(1.9rem, 4.4vw, 3.4rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}
            >
              {t({ ar: "نؤمن أنّ الموهبة لا ", en: "We believe talent is not bound by " })}
              <span className="text-primary">{t({ ar: "تحدّها الجغرافيا", en: "geography" })}</span>
              {t({ ar: ".", en: "." })}
            </h2>
            <p className="t-body-lg mt-5 text-fg-secondary max-w-xl">
              {t({ ar: "مساحة تتّسع لأحلامك — من قلب غزّة، إلى العالم.", en: "A space wide enough for your dreams — from the heart of Gaza, to the world." })}
            </p>
          </div>
          <div className="col-span-12 lg:col-span-3 lg:text-end font-mono text-caption text-muted-foreground flex items-start lg:justify-end">
            <div>
              {c.estLabel}
              <br />
              {c.placeLabel}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 lg:gap-10 border-t border-border pt-12">
          <div className="col-span-12 lg:col-span-5">
            <div className="flex items-center gap-2.5 mb-4">
              <img src={imageUrl(c.logo)} alt="" className="w-8 h-8 object-contain" />
              <div className="text-xl font-bold text-foreground">{c.brand}</div>
            </div>
            <p className="t-body text-[14px] mb-6 max-w-md whitespace-pre-line">
              {c.aboutBody}
            </p>
            {socials.length > 0 && (
              <div className="mb-6">
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
                        className="w-10 h-10 rounded-full bg-surface-2 border border-border-strong flex items-center justify-center text-fg-secondary hover:text-primary hover:border-primary/35 transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
                {contact.instagram && (
                  <a
                    href={contact.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary transition-colors w-fit"
                  >
                    <span dir="ltr">@ih_haven</span>
                  </a>
                )}
              </div>
            )}
            {(contact.email || contact.phone || contact.whatsapp) && (
              <div className="space-y-2.5 text-[14px]">
                <div className="eyebrow text-muted-foreground mb-2">
                  {c.contactLabel}
                </div>
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-2 text-fg-secondary hover:text-primary transition-colors w-fit"
                  >
                    <Mail className="w-4 h-4 text-primary/80" />
                    <span dir="ltr">{contact.email}</span>
                  </a>
                )}
                {contact.phone && (
                  <div className="block">
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-2 text-fg-secondary hover:text-primary transition-colors w-fit"
                    >
                      <Phone className="w-4 h-4 text-primary/80" />
                      <span dir="ltr">{contact.phone}</span>
                    </a>
                  </div>
                )}
                {contact.whatsapp && (
                  <div className="block">
                    <a
                      href={contact.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-fg-secondary hover:text-primary transition-colors w-fit"
                    >
                      <MessageCircle className="w-4 h-4 text-primary/80" />
                      WhatsApp
                    </a>
                  </div>
                )}
              </div>
            )}
            {heroEyebrow && (
              <div className="sr-only">{heroEyebrow}</div>
            )}
          </div>

          <div className="col-span-6 lg:col-span-3">
            <div className="eyebrow text-muted-foreground mb-4">
              {c.indexLabel}
            </div>
            <ul className="space-y-2.5 text-[14px]">
              {index.map(([href, label]) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-fg-secondary hover:text-primary transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-6 lg:col-span-4">
            <div className="eyebrow text-muted-foreground mb-4">
              {c.programmeLabel}
            </div>
            <div className="text-xl font-bold text-foreground mb-2">{c.programmeTitle}</div>
            <p className="t-body text-[14px] mb-5 whitespace-pre-line">
              {c.programmeBody}
            </p>
            <div className="flex flex-col gap-2 text-[14px]">
              {contact.nastonas && (
                <a
                  href={contact.nastonas}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-fg-secondary hover:text-primary transition-colors w-fit"
                >
                  {contact.nastonas.replace(/^https?:\/\//, "")}
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                </a>
              )}
              {contact.nas2nas && (
                <a
                  href={contact.nas2nas}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-semibold hover:underline underline-offset-4 w-fit"
                >
                  {contact.nas2nas.replace(/^https?:\/\//, "")} · {t(I18N.footer.donate)}
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-caption text-muted-foreground">
          <p>{c.bottomCopy}</p>
          <div className="flex items-center gap-4">
            <p>{c.bottomTag}</p>
            <a
              href={`${import.meta.env.BASE_URL}admin`}
              aria-label={t({ ar: "لوحة الإدارة", en: "Admin panel" })}
              title={t({ ar: "لوحة الإدارة (Cmd/Ctrl + Shift + A)", en: "Admin panel (Cmd/Ctrl + Shift + A)" })}
              className="group inline-flex items-center justify-center w-7 h-7 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3"
                aria-hidden
              >
                <rect width="18" height="11" x="3" y="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
