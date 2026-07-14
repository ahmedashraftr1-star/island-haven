import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  Instagram,
  Linkedin,
  Facebook,
  Link as LinkIcon,
  ArrowLeft,
  ArrowUp,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { I18N } from "@/lib/i18n";
import { FOOTER_COLUMNS } from "@/lib/nav";

const FOOTER_FALLBACK = {
  logo: "/logo.png",
  brand: "Island Haven",
  aboutBody:
    "حاضنة تقنيّة من غزّة. نَحضن الموهبة الغزيّة ونُطلقها نحو الأسواق العالميّة — بإرشاد، برامج، وشبكة من الخبراء والشركاء.",
  contactLabel: "تواصل معنا",
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
  const reduce = useReducedMotion();

  const cms = useContentSection("footer", FOOTER_FALLBACK);
  const c =
    lang === "en"
      ? { ...cms, aboutBody: I18N.footer.aboutBody.en, contactLabel: I18N.footer.contactLabel.en }
      : cms;
  const contact = useContentSection("contact", CONTACT_FALLBACK);

  const socials = [
    { label: "Instagram", icon: Instagram, href: contact.instagram },
    { label: "LinkedIn", icon: Linkedin, href: contact.linkedin },
    { label: "Facebook", icon: Facebook, href: contact.facebook },
    { label: "Linktree", icon: LinkIcon, href: contact.linktree },
  ].filter((s) => s.href);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <footer className="relative bg-[#0b0a09] border-t border-border-strong">
      {/* Signature gold + crimson aura, faint over the top of the footer. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[45%] brand-aura opacity-50" />

      <div className="container-ih relative">
        {/* ─────────────────────────────────────────────────────────────
            A · STATEMENT ROW — gold mono eyebrow, monumental headline with
            one red accent word, and a decisive Apply CTA on the side.
            ───────────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-end pt-[clamp(3.5rem,7vw,6rem)] pb-[clamp(2.75rem,5vw,4rem)]">
          <div className="lg:col-span-8">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="font-mono text-[11px] uppercase tracking-[0.28em] rtl:tracking-[0.12em] text-sand mb-6"
            >
              {t({ ar: "غزّة · فلسطين · تأسّس ٢٠٢٤", en: "GAZA · PALESTINE · EST. 2024" })}
            </motion.div>
            <motion.h2
              className="font-display font-extrabold text-foreground max-w-3xl"
              style={{ fontSize: "clamp(1.9rem, 5vw, 3.8rem)", lineHeight: 1.05, letterSpacing: "-0.035em" }}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {t({ ar: "نبني المستقبل ", en: "We build the future " })}
              <span className="text-primary">{t({ ar: "رغم كلّ شيء.", en: "against all odds." })}</span>
            </motion.h2>
          </div>

          <div className="lg:col-span-4 lg:flex lg:justify-end">
            <Link
              href="/apply"
              data-testid="footer-apply"
              className="cta-fill group inline-flex items-center justify-center gap-3 h-14 px-9 rounded-full font-bold text-[15px] tracking-[-0.005em] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 shadow-[0_24px_64px_-16px_hsl(7_84%_40%/0.5)]"
            >
              {t({ ar: "سجّل طلبك", en: "Apply now" })}
              <ArrowLeft className="h-4 w-4 ltr:rotate-180 transition-transform duration-300 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            B · LINKS GRID — brand column (logo + about + socials + contact)
            followed by the three shared FOOTER_COLUMNS.
            ───────────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-12 lg:gap-10 border-t border-border pt-[clamp(2.75rem,5vw,4rem)]">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-5">
            <div className="flex items-center gap-2.5 mb-4">
              <img src={imageUrl(c.logo)} alt="" width={32} height={32} loading="lazy" decoding="async" className="w-8 h-8 object-contain" />
              <div className="text-xl font-bold text-foreground">{c.brand}</div>
            </div>
            <p className="t-body text-[14px] mb-7 max-w-md whitespace-pre-line">{c.aboutBody}</p>

            {socials.length > 0 && (
              <div className="flex items-center gap-2 mb-8">
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
            )}

            {(contact.email || contact.phone || contact.whatsapp) && (
              <div className="space-y-2.5 text-[14px]">
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] rtl:tracking-normal text-sand mb-3">
                  {c.contactLabel}
                </div>
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-2 text-fg-secondary hover:text-primary transition-colors w-fit"
                  >
                    <Mail className="w-4 h-4 text-sand" />
                    <span dir="ltr">{contact.email}</span>
                  </a>
                )}
                {contact.phone && (
                  <div className="block">
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-2 text-fg-secondary hover:text-primary transition-colors w-fit"
                    >
                      <Phone className="w-4 h-4 text-sand" />
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
                      <MessageCircle className="w-4 h-4 text-sand" />
                      WhatsApp
                    </a>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Three shared FOOTER_COLUMNS */}
          {FOOTER_COLUMNS.map((col, ci) => (
            <nav
              key={ci}
              aria-label={t(col.title)}
              className={
                "col-span-1 " +
                (ci === 0 ? "lg:col-span-3 " : "lg:col-span-2 ") +
                (ci === FOOTER_COLUMNS.length - 1 ? "lg:col-start-11" : "")
              }
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] rtl:tracking-normal text-sand mb-5">
                {t(col.title)}
              </div>
              <ul className="space-y-3 text-[14px]">
                {col.links.map((link, li) => (
                  <li key={li}>
                    <Link
                      href={link.href}
                      className={
                        "inline-flex items-center gap-1.5 transition-colors w-fit " +
                        (link.accent
                          ? "text-primary font-semibold hover:text-primary-bright"
                          : "link-hover-slide text-fg-secondary hover:text-primary")
                      }
                    >
                      {t(link.label)}
                      {link.accent && <ArrowLeft className="w-3.5 h-3.5 ltr:rotate-180" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </section>

        {/* Programme line — NasToNas + donate, preserved (the development backer). */}
        {(contact.nastonas || contact.nas2nas) && (
          <div className="mt-[clamp(2.5rem,4vw,3.5rem)] pt-7 border-t border-border flex flex-col sm:flex-row sm:items-center gap-x-8 gap-y-3 flex-wrap">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] rtl:tracking-normal text-sand">
              {t(I18N.footer.programmeLabel)}
            </span>
            {contact.nastonas && (
              <a
                href={contact.nastonas}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[14px] text-fg-secondary hover:text-primary transition-colors w-fit"
              >
                <span dir="ltr">{contact.nastonas.replace(/^https?:\/\//, "")}</span>
                <ArrowLeft className="w-3.5 h-3.5 ltr:rotate-180" />
              </a>
            )}
            {contact.nas2nas && (
              <a
                href={contact.nas2nas}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[14px] text-primary font-semibold hover:text-primary-bright transition-colors w-fit"
              >
                {t(I18N.footer.donate)}
                <ArrowLeft className="w-3.5 h-3.5 ltr:rotate-180" />
              </a>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            C · BOTTOM BAR — copyright, a "season open" pill with a live dot,
            scroll-to-top, and the admin shortcut.
            ───────────────────────────────────────────────────────────── */}
        <div className="mt-[clamp(2.5rem,4vw,3.5rem)] pt-6 pb-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-caption text-muted-foreground order-2 md:order-1">
            {t({
              ar: "© ٢٠٢٤–٢٠٢٦ آيلاند هيفن · غزّة — فلسطين",
              en: "© 2024–2026 Island Haven · Gaza — Palestine",
            })}
          </p>

          <div className="flex items-center gap-3 order-1 md:order-2">
            {/* Season-open pill — gold, with a small live dot */}
            <span className="inline-flex items-center gap-2 h-8 ps-2.5 pe-3 rounded-full chip-sand font-mono text-[11px] uppercase tracking-[0.16em] rtl:tracking-normal">
              <span className="relative flex h-2 w-2" aria-hidden>
                {!reduce && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-sand opacity-60 animate-ping" />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sand" />
              </span>
              {t({ ar: "الدفعة · ٢٠٢٦ · مفتوحة", en: "SEASON · 2026 · OPEN" })}
            </span>

            {/* Scroll-to-top */}
            <button
              type="button"
              onClick={scrollToTop}
              aria-label={t({ ar: "العودة إلى الأعلى", en: "Back to top" })}
              title={t({ ar: "العودة إلى الأعلى", en: "Back to top" })}
              className="group inline-flex items-center justify-center w-8 h-8 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/35 hover:bg-primary/5 transition-all"
            >
              <ArrowUp className="w-3.5 h-3.5 transition-transform duration-300 motion-reduce:transition-none group-hover:-translate-y-0.5" />
            </button>

            {/* Admin shortcut — preserved testid/aria + lock svg + BASE_URL href */}
            <a
              href={`${import.meta.env.BASE_URL}admin`}
              aria-label={t({ ar: "لوحة الإدارة", en: "Admin panel" })}
              title={t({ ar: "لوحة الإدارة (Cmd/Ctrl + Shift + A)", en: "Admin panel (Cmd/Ctrl + Shift + A)" })}
              className="group inline-flex items-center justify-center w-8 h-8 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
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
