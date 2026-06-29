import { useState } from "react";
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
  CheckCircle2,
  UserCheck,
  Globe,
  MapPin,
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

// Who's reaching out — a quiet self-select so we can route the message right.
const ENQUIRY_TYPES: { ar: string; en: string }[] = [
  { ar: "رائد أعمال", en: "Founder" },
  { ar: "مستثمر", en: "Investor" },
  { ar: "شريك مؤسّسيّ", en: "Partner" },
  { ar: "صحفيّ / إعلاميّ", en: "Press" },
  { ar: "خبير / مرشد", en: "Mentor" },
  { ar: "أخرى", en: "Other" },
];

// Response-time indicators (Linear-style honesty strip).
const INDICATORS: { icon: LucideIcon; label: { ar: string; en: string }; value: { ar: string; en: string }; accent?: boolean }[] = [
  { icon: Clock, label: { ar: "وقت الرّدّ", en: "Response time" }, value: { ar: "أقلّ من ٢٤ ساعة", en: "Under 24 hours" } },
  { icon: UserCheck, label: { ar: "النّوع", en: "Type" }, value: { ar: "إنسانٌ فعليّ", en: "A real human" } },
  { icon: Globe, label: { ar: "اللغات", en: "Languages" }, value: { ar: "عربي · English", en: "Arabic · English" } },
  { icon: MapPin, label: { ar: "الموقع", en: "Location" }, value: { ar: "غزّة · فلسطين", en: "Gaza · Palestine" }, accent: true },
];

export default function Contact() {
  const { lang, t } = useLanguage();
  const reduce = useReducedMotion();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [enquiry, setEnquiry] = useState<string>("");
  const [sent, setSent] = useState(false);

  // No backend lead endpoint — compose a real email the visitor can send. This
  // keeps the form genuinely functional (no silent /dev/null) and needs no API.
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const who = enquiry ? ` — ${enquiry}` : "";
    const body = `${form.message}\n\n— ${form.name}${who}\n${form.email}`;
    const subject = form.subject || (lang === "ar" ? "رسالة من موقع آيلاند هيفن" : "Message from Island Haven");
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  const field =
    "w-full bg-surface-2 border border-border-strong rounded-2xl px-5 py-3.5 text-foreground text-[15px] outline-none transition-[border-color,box-shadow] placeholder:text-fg-faint focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]";

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

          {/* Response indicators — a calm honesty strip (Linear register) */}
          <Reveal delay={0.08} className="mt-[clamp(2rem,4.5vw,3rem)]">
            <div className="flex flex-wrap items-center gap-x-[clamp(1.5rem,4vw,3rem)] gap-y-5 border-t border-border-strong/60 pt-[clamp(1.5rem,3vw,2rem)]">
              {INDICATORS.map((it) => {
                const ItIcon = it.icon;
                return (
                  <div key={it.label.en} className="inline-flex items-center gap-2.5">
                    <ItIcon className={`w-4 h-4 shrink-0 ${it.accent ? "text-primary" : "text-sand"}`} />
                    <div className="leading-tight">
                      <div className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-muted-foreground rtl:tracking-normal">
                        {t(it.label)}
                      </div>
                      <div className="text-[13.5px] font-semibold text-foreground">{t(it.value)}</div>
                    </div>
                  </div>
                );
              })}
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

                {sent ? (
                  <div className="mt-[clamp(2rem,4vw,2.75rem)] inline-flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] px-5 py-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-emerald-300 text-[14px]">
                        {t({ ar: "فُتح بريدك ورسالتك جاهزة.", en: "Your email opened with the message ready." })}
                      </div>
                      <div className="t-caption text-fg-secondary mt-0.5">
                        {t({ ar: "أرسلها وسيردّ عليك إنسانٌ خلال ٢٤ ساعة.", en: "Send it and a real person will reply within 24 hours." })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="mt-[clamp(2rem,4vw,2.75rem)] grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={t({ ar: "الاسم الكامل", en: "Full name" })}
                      aria-label={t({ ar: "الاسم الكامل", en: "Full name" })}
                      className={field}
                    />
                    <input
                      required
                      type="email"
                      dir="ltr"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      aria-label={t({ ar: "البريد الإلكترونيّ", en: "Email" })}
                      className={`${field} text-start`}
                    />
                    <input
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder={t({ ar: "الموضوع", en: "Subject" })}
                      aria-label={t({ ar: "الموضوع", en: "Subject" })}
                      className={`${field} sm:col-span-2`}
                    />
                    <div className="sm:col-span-2">
                      <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-sand mb-2.5 rtl:tracking-normal">
                        {t({ ar: "نوع التواصل", en: "I am a…" })}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ENQUIRY_TYPES.map((ty) => {
                          const on = enquiry === t(ty);
                          return (
                            <button
                              type="button"
                              key={ty.en}
                              onClick={() => setEnquiry(on ? "" : t(ty))}
                              className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors ${
                                on
                                  ? "border-primary/60 bg-primary/10 text-primary"
                                  : "border-border-strong text-fg-secondary hover:text-foreground hover:border-foreground/30"
                              }`}
                            >
                              {t(ty)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder={t({ ar: "اكتب رسالتك هنا…", en: "Write your message here…" })}
                      aria-label={t({ ar: "رسالتك", en: "Your message" })}
                      className={`${field} sm:col-span-2 resize-y`}
                    />
                    <div className="sm:col-span-2 flex items-center justify-between gap-3 flex-wrap">
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
                      <button
                        type="submit"
                        className="group inline-flex items-center gap-2.5 h-12 px-7 rounded-full cta-fill font-bold text-[14px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)] motion-reduce:transition-none"
                      >
                        {t({ ar: "أرسل الرسالة", en: "Send message" })}
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}
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
