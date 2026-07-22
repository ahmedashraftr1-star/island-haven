import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Copy, Check, Download, Mail, ImageOff } from "lucide-react";
import { PageShell } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO } from "@/lib/motion";

/* ────────────────────────────────────────────────────────────────────────────
   /media — a tight press kit. Journalists get exactly what they need: a one-line
   boilerplate they can copy (ar + en), the four brand colours as hex swatches,
   a logo-usage note + download, and a single press contact. House bar: warm
   near-black canvas, GOLD micro-labels (eyebrow-sand / font-mono), RED for the
   one accent + the copy CTA, calm editorial typography.
   ──────────────────────────────────────────────────────────────────────────── */

const PRESS_EMAIL = "island-haven@nastonas.org";
const LOGO_URL = "/logo.png";

const BOILERPLATE = {
  ar: "آيلاند هيفن حاضنة أعمال مجّانيّة في غزّة، تحوّل موهبة الشباب إلى شركات ناشئة قادرة على المنافسة في الاقتصاد الرقميّ العالميّ.",
  en: "Island Haven is a free startup incubator in Gaza, turning young talent into ventures that can compete in the global digital economy.",
};

interface Swatch {
  name: { ar: string; en: string };
  hex: string;
  /** true → light swatch needs a hairline so it reads on the dark canvas */
  light?: boolean;
}

const SWATCHES: Swatch[] = [
  { name: { ar: "أسود مائل للدفء", en: "Near-black" }, hex: "#080808" },
  { name: { ar: "أحمر الجزيرة", en: "Island red" }, hex: "#E8341C" },
  { name: { ar: "ذهبيّ", en: "Gold" }, hex: "#BFA06A" },
  { name: { ar: "أبيض دافئ", en: "Warm-white" }, hex: "#F2EDE6", light: true },
];

interface Typeface {
  /** The literal sample glyphs — language-neutral, rendered in the face itself. */
  sample: string;
  /** A short living line so the face is seen "in use", not just as specimens. */
  line: { ar: string; en: string };
  /** Honest face name (the family the app actually renders with). */
  family: string;
  /** font- utility that maps to the real app stack for this role. */
  fontClass: string;
  /** Force a direction on the specimen line (Arabic display must read RTL). */
  sampleDir?: "rtl" | "ltr";
  use: { ar: string; en: string };
}

const TYPEFACES: Typeface[] = [
  {
    sample: "أ ب ت",
    line: { ar: "نبني من غزّة", en: "نبني من غزّة" },
    family: "IBM Plex Sans Arabic",
    fontClass: "font-editorial",
    sampleDir: "rtl",
    use: { ar: "العناوين العربيّة العريضة", en: "Display headings" },
  },
  {
    sample: "Aa Bb Cc",
    line: { ar: "Built in Gaza", en: "Built in Gaza" },
    family: "Inter",
    fontClass: "font-display",
    sampleDir: "ltr",
    use: { ar: "العناوين اللاتينيّة", en: "Latin headings" },
  },
  {
    sample: "01 02 03",
    line: { ar: "ABOUT · 2024 · 100%", en: "ABOUT · 2024 · 100%" },
    family: "IBM Plex Mono",
    fontClass: "font-mono",
    sampleDir: "ltr",
    use: { ar: "الوسوم والأرقام", en: "Labels & numbers" },
  },
];

/** The four brand dots, reused by the hero press card. */
const BRAND_DOTS: { hex: string; light?: boolean }[] = [
  { hex: "#080808" },
  { hex: "#E8341C" },
  { hex: "#BFA06A" },
  { hex: "#F2EDE6", light: true },
];

/** A copy-to-clipboard pill with reduced-motion-safe success feedback. */
function CopyButton({
  text,
  label,
  copiedLabel,
}: {
  text: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently no-op, text is still selectable */
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-live="polite"
      className="inline-flex items-center gap-2 h-10 max-sm:h-11 px-5 rounded-full border border-border-strong text-[13px] font-semibold text-fg-secondary hover:border-foreground/30 hover:text-foreground transition-colors"
    >
      {copied ? (
        <Check className="w-4 h-4 text-sand-bright" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      {copied ? copiedLabel : label}
    </button>
  );
}

/** Decorative hero visual — a mock "press card" preview: wordmark + tagline +
 *  the four brand dots. Mirrors the kit's identity at a glance. Pure decoration,
 *  hidden from assistive tech. */
function PressCardPreview() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden
      className="relative w-full max-w-[24rem] mx-auto lg:mx-0 select-none"
    >
      <div className="card-base p-[clamp(1.4rem,3vw,1.9rem)]">
        {/* top row — a press-pass micro label + a live identity dot */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9.5px] tracking-[0.24em] uppercase text-sand rtl:tracking-[0.12em]">
            {t({ ar: "بطاقة صحفيّة", en: "Press card" })}
          </span>
          <span className="block w-1.5 h-1.5 rounded-full bg-primary" />
        </div>

        {/* wordmark */}
        <div
          className="mt-[clamp(1.6rem,5vw,2.4rem)] font-editorial font-bold text-foreground"
          style={{ fontSize: "clamp(1.55rem,5vw,2.1rem)", lineHeight: 1.02, letterSpacing: "-0.03em" }}
          dir="ltr"
        >
          Island <span className="text-primary">Haven</span>
        </div>

        {/* tagline */}
        <p className="mt-2.5 t-caption text-fg-secondary max-w-[20rem]" dir="ltr">
          A free startup incubator in Gaza.
        </p>

        {/* hairline + the four brand-colour dots */}
        <div aria-hidden className="mt-[clamp(1.4rem,4vw,1.9rem)] h-px w-full bg-border-strong" />
        <div className="mt-4 flex items-center gap-2.5">
          {BRAND_DOTS.map((d, i) => (
            <motion.span
              key={d.hex}
              className={`block w-3.5 h-3.5 rounded-full ${d.light ? "ring-1 ring-inset ring-border-strong" : ""}`}
              style={{ backgroundColor: d.hex }}
              initial={reduce ? false : { opacity: 0, scale: 0.4 }}
              animate={reduce ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.35 + i * 0.07, ease: EASE_OUT_EXPO }}
            />
          ))}
          <span className="ms-auto font-mono text-[10px] text-fg-faint tnum">2024</span>
        </div>
      </div>
    </div>
  );
}

export default function Media() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  return (
    <PageShell
      active="media"
      eyebrow={t({ ar: "الغرفة الإعلاميّة", en: "Media Kit" })}
      title={t({ ar: "الغرفة", en: "Media" })}
      highlight={t({ ar: "الإعلاميّة", en: "Kit" })}
      heroAside={<PressCardPreview />}
      subtitle={t({
        ar: "كلّ ما تحتاجه لتكتب عنّا: نبذة جاهزة للنسخ، ألوان العلامة، الشعار، وجهة اتّصال صحفيّة واحدة.",
        en: "Everything you need to write about us: a copy-ready boilerplate, our brand colours, the logo, and a single press contact.",
      })}
    >
      <div className="space-y-[clamp(4rem,9vw,7rem)]">
        {/* ── Boilerplate — one line, ar + en, each copyable ── */}
        <section>
          <Reveal>
            <span className="eyebrow eyebrow-sand">
              {t({ ar: "نبذة في سطر", en: "About in one line" })}
            </span>
          </Reveal>

          <div className="mt-[clamp(1.75rem,4vw,2.75rem)] grid gap-[clamp(1rem,2.5vw,1.5rem)] md:grid-cols-2">
            {(["ar", "en"] as const).map((boilerLang, i) => (
              <Reveal key={boilerLang} delay={i * 0.06}>
                <div className="card-base h-full p-[clamp(1.5rem,3vw,2rem)] flex flex-col">
                  <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-sand mb-4">
                    {boilerLang === "ar" ? "العربيّة" : "English"}
                  </span>
                  <p
                    dir={boilerLang === "ar" ? "rtl" : "ltr"}
                    className="t-body text-foreground text-[15.5px] md:text-[16.5px] flex-1"
                  >
                    {BOILERPLATE[boilerLang]}
                  </p>
                  <div className="mt-6">
                    <CopyButton
                      text={BOILERPLATE[boilerLang]}
                      label={t({ ar: "نسخ النصّ", en: "Copy text" })}
                      copiedLabel={t({ ar: "تمّ النسخ", en: "Copied" })}
                    />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Brand colours — four hex swatches ── */}
        <section>
          <Reveal>
            <span className="eyebrow eyebrow-sand">
              {t({ ar: "ألوان العلامة", en: "Brand colours" })}
            </span>
            <motion.h2
              className="font-display font-bold text-foreground mt-4"
              style={{
                fontSize: "clamp(1.7rem, 4vw, 2.8rem)",
                lineHeight: 1.06,
                letterSpacing: "-0.032em",
              }}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
            >
              {t({ ar: "أربعة ألوان، ", en: "Four colours, " })}
              <span className="text-primary">
                {t({ ar: "هويّة واحدة.", en: "one identity." })}
              </span>
            </motion.h2>
          </Reveal>

          <div className="mt-[clamp(1.75rem,4vw,2.75rem)] grid gap-[clamp(0.875rem,2vw,1.25rem)] grid-cols-2 lg:grid-cols-4">
            {SWATCHES.map((s, i) => (
              <Reveal key={s.hex} delay={Math.min(i, 4) * 0.05}>
                <div className="card-base overflow-hidden h-full">
                  <div
                    className={`h-[clamp(6rem,16vw,9rem)] ${s.light ? "border-b border-border-strong" : ""}`}
                    style={{ backgroundColor: s.hex }}
                  />
                  <div className="p-[clamp(1rem,2.5vw,1.5rem)]">
                    <div className="font-display font-bold text-foreground text-[15px]">
                      {t(s.name)}
                    </div>
                    <div className="font-mono text-[13px] text-sand mt-1.5 tnum uppercase">
                      {s.hex}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Typography — the three brand typefaces, each shown in use ── */}
        <section>
          <Reveal>
            <span className="eyebrow eyebrow-sand">
              {t({ ar: "الخطوط", en: "Typography" })}
            </span>
            <motion.h2
              className="font-display font-bold text-foreground mt-4"
              style={{
                fontSize: "clamp(1.7rem, 4vw, 2.8rem)",
                lineHeight: 1.06,
                letterSpacing: "-0.032em",
              }}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
            >
              {t({ ar: "ثلاثة خطوط، ", en: "Three faces, " })}
              <span className="text-primary">
                {t({ ar: "صوت واحد.", en: "one voice." })}
              </span>
            </motion.h2>
          </Reveal>

          <div className="mt-[clamp(1.75rem,4vw,2.75rem)] grid gap-[clamp(0.875rem,2vw,1.25rem)] md:grid-cols-3">
            {TYPEFACES.map((tf, i) => (
              <Reveal key={tf.family} delay={Math.min(i, 3) * 0.06}>
                <div className="card-base h-full p-[clamp(1.5rem,3vw,2rem)] flex flex-col">
                  {/* large specimen */}
                  <div
                    dir={tf.sampleDir}
                    className={`${tf.fontClass} font-bold text-foreground leading-none`}
                    style={{ fontSize: "clamp(2.4rem,6vw,3.4rem)", letterSpacing: "-0.02em" }}
                  >
                    {tf.sample}
                  </div>

                  {/* the face seen "in use" */}
                  <div
                    dir={tf.sampleDir}
                    className={`${tf.fontClass} text-fg-secondary mt-[clamp(1.25rem,3vw,1.75rem)]`}
                    style={{ fontSize: "clamp(1.05rem,2.4vw,1.35rem)" }}
                  >
                    {t(tf.line)}
                  </div>

                  <div aria-hidden className="mt-auto pt-[clamp(1.5rem,4vw,2rem)]">
                    <div className="h-px w-full bg-border-strong" />
                  </div>

                  {/* family name + usage note */}
                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-sand rtl:tracking-[0.06em]" dir="ltr">
                      {tf.family}
                    </span>
                    <span className="font-mono text-[10px] text-fg-faint tnum">
                      {`0${i + 1}`}
                    </span>
                  </div>
                  <p className="t-caption text-fg-secondary mt-1.5">
                    {t({ ar: "تُستخدم لـ: ", en: "Used for: " })}
                    <span className="text-foreground">{t(tf.use)}</span>
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Logo — preview, usage note, download ── */}
        <section>
          <Reveal>
            <span className="eyebrow eyebrow-sand">
              {t({ ar: "الشعار", en: "The logo" })}
            </span>
          </Reveal>

          <Reveal delay={0.05} className="mt-[clamp(1.75rem,4vw,2.75rem)]">
            <div className="card-base grid gap-[clamp(1.5rem,4vw,3rem)] md:grid-cols-[auto_1fr] items-center p-[clamp(1.5rem,4vw,2.5rem)]">
              {/* Preview tile */}
              <div className="flex items-center justify-center w-[clamp(7rem,20vw,11rem)] h-[clamp(7rem,20vw,11rem)] rounded-[20px] surface-3 ring-edge mx-auto">
                <img
                  src={LOGO_URL}
                  alt={t({ ar: "شعار آيلاند هيفن", en: "Island Haven logo" })}
                  className="w-2/3 h-2/3 object-contain"
                  loading="lazy" decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (fb) fb.style.display = "flex";
                  }}
                />
                <span
                  className="hidden items-center justify-center text-fg-faint"
                  aria-hidden
                >
                  <ImageOff className="w-8 h-8" />
                </span>
              </div>

              {/* Usage note + download */}
              <div className="min-w-0">
                <h3 className="font-display font-bold text-foreground text-[clamp(1.15rem,2.4vw,1.6rem)] tracking-tight">
                  {t({ ar: "استخدام الشعار", en: "Using the logo" })}
                </h3>
                <p className="t-body text-[15px] md:text-[16px] mt-3 max-w-xl">
                  {t({
                    ar: "اترك مساحة فارغة حول الشعار، ولا تغيّر ألوانه أو نسبه أو تضعه على خلفية تُضعف وضوحه. الأحمر والذهبيّ هما لونا الهويّة — استخدمهما كما هما.",
                    en: "Keep clear space around the logo. Don't recolour it, distort its proportions, or place it on a background that hurts legibility. Red and gold are the identity's colours — use them as-is.",
                  })}
                </p>
                <a
                  href={LOGO_URL}
                  download
                  className="mt-6 inline-flex items-center gap-2.5 h-11 px-6 rounded-full cta-fill font-bold text-[13.5px] transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)] motion-reduce:transition-none"
                >
                  <Download className="w-4 h-4" />
                  {t({ ar: "تنزيل الشعار (PNG)", en: "Download logo (PNG)" })}
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Press contact ── */}
        <section>
          <Reveal>
            <div className="relative overflow-hidden rounded-[clamp(1.75rem,3vw,2.25rem)] border border-border-strong/70 surface-2 px-[clamp(1.75rem,5vw,4rem)] py-[clamp(2.25rem,5vw,3.5rem)]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-1/3 h-[150%] brand-aura opacity-50"
              />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="min-w-0">
                  <span className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-sand rtl:tracking-normal">
                    {t({ ar: "اتّصال صحفيّ", en: "Press contact" })}
                  </span>
                  <p
                    className="font-display font-bold text-foreground mt-3 break-words"
                    style={{ fontSize: "clamp(1.3rem,3vw,2rem)", letterSpacing: "-0.02em" }}
                    dir="ltr"
                  >
                    {PRESS_EMAIL}
                  </p>
                  <p className="t-caption text-fg-secondary mt-2">
                    {t({ ar: "نردّ على طلبات الصحافة خلال ٢٤ ساعة", en: "We answer press requests within 24 hours" })}
                  </p>
                </div>
                <a
                  href={`mailto:${PRESS_EMAIL}`}
                  className="group inline-flex items-center gap-2.5 h-12 px-7 rounded-full cta-fill font-bold text-[14px] shrink-0 transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-16px_hsl(354_82%_30%_/_0.55)] motion-reduce:transition-none"
                >
                  <Mail className="w-4 h-4" />
                  {t({ ar: "راسل الصحافة", en: "Email press" })}
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </PageShell>
  );
}
