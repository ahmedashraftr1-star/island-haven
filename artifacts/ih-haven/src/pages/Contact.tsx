import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  Mail,
  Phone,
  MessageCircle,
  Clock,
  ArrowLeft,
  Send,
  Linkedin,
  Instagram,
  type LucideIcon,
} from "lucide-react";
import { PageShell } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

/* ────────────────────────────────────────────────────────────────────────────
   /contact — a warm, calm contact page. Three monumental tappable rows (email,
   phone, WhatsApp) carry the whole page; a quiet response-time note + social
   links sit beneath, and a cross-link sends founders to Apply / Book. No backend
   form: the email row is a mailto, the most direct path for this audience.
   House bar: warm near-black canvas, GOLD micro-labels (eyebrow-sand), RED for
   the single CTA accent, editorial hairline rows, opacity+rise reveals.
   ──────────────────────────────────────────────────────────────────────────── */

const EMAIL = "island-haven@nastonas.org";
const PHONE_DISPLAY = "+972 56 753 6815";
const PHONE_TEL = "+972567536815";
const WHATSAPP_URL = "https://wa.me/972567536815";

interface ChannelRow {
  icon: LucideIcon;
  label: { ar: string; en: string };
  value: string;
  hint: { ar: string; en: string };
  href: string;
  external?: boolean;
}

const CHANNELS: ChannelRow[] = [
  {
    icon: Mail,
    label: { ar: "البريد الإلكترونيّ", en: "Email" },
    value: EMAIL,
    hint: { ar: "أفضل طريقة للوصول إلينا", en: "The best way to reach us" },
    href: `mailto:${EMAIL}`,
  },
  {
    icon: Phone,
    label: { ar: "الهاتف", en: "Phone" },
    value: PHONE_DISPLAY,
    hint: { ar: "اتّصل بنا في أوقات العمل", en: "Call us during working hours" },
    href: `tel:${PHONE_TEL}`,
  },
  {
    icon: MessageCircle,
    label: { ar: "واتساب", en: "WhatsApp" },
    value: PHONE_DISPLAY,
    hint: { ar: "محادثة سريعة ومباشرة", en: "A quick, direct chat" },
    href: WHATSAPP_URL,
    external: true,
  },
];

interface SocialLink {
  icon: LucideIcon;
  label: string;
  href: string;
}

const SOCIALS: SocialLink[] = [
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/company/island-haven" },
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/islandhaven" },
];

export default function Contact() {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <PageShell
      active="contact"
      eyebrow={t({ ar: "تواصل معنا", en: "Contact" })}
      title={t({ ar: "تواصل", en: "Get in" })}
      highlight={t({ ar: "معنا", en: "touch" })}
      subtitle={t({
        ar: "سؤال، فكرة، أو شراكة — اكتب لنا متى شئت. الباب مفتوح، والرّدّ مضمون.",
        en: "A question, an idea, a partnership — write to us anytime. The door is open, and a reply is guaranteed.",
      })}
    >
      <div className="space-y-[clamp(4rem,9vw,7rem)]">
        {/* ── Channels — three monumental tappable rows ── */}
        <section>
          <Reveal>
            <div className="flex items-center gap-3 mb-5">
              <span className="eyebrow eyebrow-sand">
                {t({ ar: "القنوات", en: "Channels" })}
              </span>
            </div>
          </Reveal>

          <ul className="border-t border-border-strong/60">
            {CHANNELS.map((c, i) => {
              const Icon = c.icon;
              return (
                <li key={c.href}>
                  <Reveal delay={Math.min(i, 4) * 0.06}>
                    <a
                      href={c.href}
                      {...(c.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-[clamp(1rem,3vw,2rem)] border-b border-border-strong/60 py-[clamp(1.5rem,3.5vw,2.5rem)] transition-colors hover:border-border-strong"
                    >
                      {/* Icon tile */}
                      <span className="flex items-center justify-center w-[clamp(2.75rem,5vw,3.5rem)] h-[clamp(2.75rem,5vw,3.5rem)] rounded-2xl bg-primary-soft border border-primary/20 text-primary transition-colors group-hover:bg-primary/15">
                        <Icon className="w-5 h-5" />
                      </span>

                      {/* Label + value + hint */}
                      <span className="min-w-0">
                        <span className="block font-mono text-[10.5px] tracking-[0.2em] uppercase text-sand mb-1.5 rtl:tracking-normal">
                          {t(c.label)}
                        </span>
                        <span
                          className="block font-display font-bold text-foreground group-hover:text-primary transition-colors break-words"
                          style={{
                            fontSize: "clamp(1.25rem, 3.2vw, 2.1rem)",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.12,
                          }}
                          dir="ltr"
                        >
                          {c.value}
                        </span>
                        <span className="block t-caption text-fg-secondary mt-1.5">
                          {t(c.hint)}
                        </span>
                      </span>

                      {/* Affordance arrow */}
                      <ArrowLeft className="w-5 h-5 text-fg-faint rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1 shrink-0" />
                    </a>
                  </Reveal>
                </li>
              );
            })}
          </ul>

          {/* Response-time note */}
          <Reveal delay={0.08} className="mt-[clamp(1.75rem,4vw,2.5rem)]">
            <div className="inline-flex items-center gap-3 rounded-full border border-sand/30 bg-sand-soft px-5 py-2.5">
              <Clock className="w-4 h-4 text-sand-bright shrink-0" />
              <span className="t-caption text-sand-bright tnum">
                {t({ ar: "نردّ خلال ٢٤ ساعة", en: "We reply within 24 hours" })}
              </span>
            </div>
          </Reveal>
        </section>

        {/* ── Social + write-to-us CTA band ── */}
        <section>
          <Reveal>
            <div className="relative overflow-hidden rounded-[clamp(1.75rem,3vw,2.25rem)] border border-border-strong/70 surface-2 px-[clamp(1.75rem,5vw,4rem)] py-[clamp(2.5rem,6vw,4rem)]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-1/3 h-[150%] brand-aura opacity-60"
              />
              <div className="relative max-w-2xl">
                <motion.h2
                  className="font-display font-bold text-foreground"
                  style={{
                    fontSize: "clamp(1.7rem, 4vw, 3rem)",
                    lineHeight: 1.06,
                    letterSpacing: "-0.032em",
                  }}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
                >
                  {t({ ar: "حدّثنا عمّا ", en: "Tell us what " })}
                  <span className="text-primary">
                    {t({ ar: "في بالك.", en: "you're building." })}
                  </span>
                </motion.h2>
                <p className="t-body text-[15px] md:text-[17px] mt-5 max-w-xl">
                  {t({
                    ar: "فريق صغير يقرأ كلّ رسالة بنفسه. لا روبوتات، ولا ردود جاهزة — إنسان حقيقيّ سيعود إليك.",
                    en: "A small team reads every message themselves. No bots, no canned replies — a real person will get back to you.",
                  })}
                </p>

                <div className="mt-[clamp(2rem,4vw,2.75rem)] flex items-center gap-3 flex-wrap">
                  <a
                    href={`mailto:${EMAIL}`}
                    className="group inline-flex items-center gap-2.5 h-12 px-7 rounded-full cta-fill font-bold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)] motion-reduce:transition-none"
                  >
                    <Send className="w-4 h-4" />
                    {t({ ar: "اكتب لنا", en: "Write to us" })}
                  </a>

                  {/* Social links */}
                  <div className="inline-flex items-center gap-2">
                    {SOCIALS.map((s) => {
                      const SIcon = s.icon;
                      return (
                        <a
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.label}
                          className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-border-strong text-fg-secondary hover:border-foreground/30 hover:text-foreground transition-colors"
                        >
                          <SIcon className="w-[18px] h-[18px]" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Cross-link — or apply / book ── */}
        <section>
          <Reveal>
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-9 bg-sand/50" />
              <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-sand rtl:tracking-normal">
                {t({ ar: "أو", en: "Or" })}
              </span>
            </div>
            <p
              className="font-display font-bold text-fg-secondary max-w-2xl"
              style={{
                fontSize: "clamp(1.25rem, 2.6vw, 1.9rem)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {t({
                ar: "جاهز للانطلاق؟ لا حاجة لرسالة —",
                en: "Ready to start? No message needed —",
              })}{" "}
              <Link
                href="/apply"
                className="text-primary underline decoration-primary/40 underline-offset-[6px] hover:decoration-primary transition-colors"
              >
                {t({ ar: "سجّل طلبك", en: "apply" })}
              </Link>{" "}
              {t({ ar: "أو", en: "or" })}{" "}
              <Link
                href="/book"
                className="text-foreground underline decoration-border-strong underline-offset-[6px] hover:decoration-foreground/50 transition-colors"
              >
                {t({ ar: "احجز مقعدًا", en: "book a seat" })}
              </Link>
              {t({ ar: " مباشرةً.", en: " directly." })}
            </p>
          </Reveal>
        </section>
      </div>
    </PageShell>
  );
}
