import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useInView, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { Reveal } from "@/components/landing/Reveal";
import { imageUrl } from "@/hooks/use-content";
import { useNumbers } from "@/hooks/use-public-data";

function CountUp({ value, lang }: { value: number; lang: Lang }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    // Reduced motion, or a zero/absent value → show the final figure at once.
    if (reduce || value <= 0) {
      setN(value);
      return;
    }
    if (inView) {
      const start = performance.now();
      const dur = 1200;
      let raf = 0;
      const tick = (t: number) => {
        const k = Math.min(1, (t - start) / dur);
        setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    // Safety net: if the element never registers as in-view, snap to the real value.
    const fallback = window.setTimeout(() => setN(value), 1400);
    return () => clearTimeout(fallback);
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className="tnum">
      {n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
    </span>
  );
}

/**
 * NumbersBand — the incubator's live proof, told at the site's strongest register:
 * a VIVID full-bleed Gaza photograph anchors the section, an ambient glow lifts it
 * off flat black, and the figures FLOAT above it on frosted `glass-panel` tiles.
 * The figures ARE the design: a monumental gold lead over a column of supporting
 * metrics on glass, refined depth and obsessive spacing. Every figure is live from
 * `/numbers` (with a fallback) and never invented. Tokens only.
 */
export function NumbersBand() {
  const { lang, t } = useLanguage();
  // Live figures from the ONE shared, cached /numbers query (deduped across the
  // homepage). `n` stays null until it resolves — the "—" placeholders below
  // cover the loading state, and on error it degrades to those same placeholders
  // rather than inventing a figure. Every rendered number is real or nothing.
  const { data } = useNumbers();
  const n = data?.numbers ?? null;

  const lead = {
    value: n?.enrollments ?? 0,
    label: t({ ar: "تسجيل في برامجنا ودوراتنا", en: "Enrollments across our programs" }),
    en: "Enrollments",
    meaning: t({
      ar: "تعلّمٌ حقيقيّ يحدث هنا كلّ أسبوع — لا وعودٌ، بل مقاعدُ مشغولة.",
      en: "Real learning happening here every week — not promises, seats taken.",
    }),
  };
  const rest = [
    { key: "members", value: n?.members ?? 0, label: t({ ar: "منتسب في المجتمع", en: "Community members" }), en: "Members", context: t({ ar: "بُنيَت تحت القصف.", en: "Built under bombardment." }) },
    { key: "works", value: n?.works ?? 0, label: t({ ar: "عمل منشور في المعرض", en: "Works in the showcase" }), en: "Works", context: t({ ar: "من عملٍ حقيقيّ لعميلٍ يدفع.", en: "Real work, paying clients." }) },
    { key: "events", value: n?.events ?? 0, label: t({ ar: "فعاليّة وورشة", en: "Events & workshops" }), en: "Events", context: t({ ar: "تعلّمٌ لا يتوقّف.", en: "Learning that never stops." }) },
  ];

  const composition = [
    { value: n?.freelancers ?? 0, label: t({ ar: "مستقلّ", en: "freelancers" }) },
    { value: n?.graduates ?? 0, label: t({ ar: "خرّيج", en: "graduates" }) },
    { value: n?.students ?? 0, label: t({ ar: "طالب جامعيّ", en: "students" }) },
  ];

  const fmt = (v: number) => v.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");

  return (
    <CinematicMedia
      as="section"
      id="numbers"
      src={imageUrl("/photos/IMG_8308.webp")}
      scrim="medium"
      sideScrim={false}
      className="relative overflow-hidden border-t border-white/[0.06]"
      aria-label={t({ ar: "الحاضنة بالأرقام", en: "By the numbers" })}
    >
      {/* Ambient glow — lifts the glass off the photo, terracotta/gold light field. */}
      <div aria-hidden className="glass-ambient pointer-events-none absolute inset-0" />

      <div className="container-ih section-y relative">
        {/* Type-protection field — the same cure the hero got, for the same reason.
            The accent «أرقامٌ حقيقيّة» is terracotta (luminance ≈0.21), and it was
            landing on this frame's brightest region: the yellow blinds. No scrim
            strength can save a terracotta glyph on a mid-tone photograph — the
            ground has to fall below ≈0.037 (near-black) to clear AA-large, and
            darkening the WHOLE frame that far would just kill the picture. So the
            veil is bound to the header block instead: near-black under the words,
            the photograph untouched everywhere else. */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -z-10 -inset-x-[10%] -top-[40%] -bottom-[34%]"
            style={{
              background:
                "radial-gradient(70% 78% at 50% 46%, rgba(6,6,10,0.92) 0%, rgba(6,6,10,0.82) 38%, rgba(6,6,10,0.48) 66%, rgba(6,6,10,0.16) 85%, transparent 100%)",
            }}
          />
        {/* Header — a quiet LIVE signal + one monumental line, roomy sub. */}
        <Reveal className="max-w-3xl">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="eyebrow">
              {t({ ar: "الحاضنة بالأرقام", en: "By the numbers" })}
            </span>
            <span className="eyebrow">
              {t({ ar: "· مباشر", en: "· LIVE" })}
            </span>
          </div>
          <h2
            className="font-display text-white"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)", fontWeight: 900, lineHeight: "var(--lh-display)", letterSpacing: "-0.04em" }}
          >
            {t({ ar: "ليست شعارات — ", en: "Not slogans — " })}
            <span className="text-primary">{t({ ar: "أرقامٌ حقيقيّة.", en: "real numbers." })}</span>
          </h2>
          <p className="mt-5 max-w-2xl text-[1.0625rem] leading-[1.7] text-white/80">
            {t({
              ar: "كلّ رقم هنا يأتي مباشرةً من قاعدة بياناتنا، ويتحدّث تلقائيًّا مع كلّ منتسبٍ جديد، كلّ عمل، وكلّ مقعد محجوز.",
              en: "Every figure here comes straight from our database and updates automatically with each new member, each work, and each booked seat.",
            })}
          </p>
        </Reveal>
        </div>

        {/* The figures float on glass. Monumental gold lead on a feature tile +
            a column of supporting metrics on a glass panel — Vision Pro depth. */}
        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 gap-[clamp(1.25rem,2.5vw,1.75rem)] lg:grid-cols-12">
          {/* Lead figure — enrollments, the largest, on a feature tile. */}
          <Reveal className="lg:col-span-5">
            <div
              style={{ transition: "transform .5s cubic-bezier(.2,.7,.2,1), border-color .5s cubic-bezier(.2,.7,.2,1), box-shadow .5s cubic-bezier(.2,.7,.2,1)" }}
              className="glass-panel-lg flex h-full -translate-y-0 flex-col p-[clamp(1.75rem,3vw,2.5rem)] hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_44px_100px_-36px_hsl(0_0%_0%/0.8)]"
            >
              <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">{lead.en}</div>
              <div
                data-testid="numbers-lead-enrollments"
                aria-label={`${fmt(lead.value)} — ${lead.label}`}
                className="font-display font-black tabular-nums leading-[0.88] text-sand-bright"
                style={{ fontSize: "clamp(3rem, 6vw, 5rem)", letterSpacing: "-0.04em" }}
              >
                {n ? <CountUp value={lead.value} lang={lang} /> : "—"}
              </div>
              <div className="mt-5 text-[clamp(1.05rem,1.7vw,1.35rem)] font-bold leading-snug text-white">{lead.label}</div>
              <p className="mt-2.5 max-w-sm text-[14px] leading-relaxed text-white/80 md:text-[15px]">{lead.meaning}</p>
            </div>
          </Reveal>

          {/* Supporting metrics — a column of tiles on a single glass panel. */}
          <div className="lg:col-span-7">
            <div
              style={{ transition: "transform .5s cubic-bezier(.2,.7,.2,1), border-color .5s cubic-bezier(.2,.7,.2,1), box-shadow .5s cubic-bezier(.2,.7,.2,1)" }}
              className="glass-panel flex h-full -translate-y-0 flex-col divide-y divide-white/[0.08] px-[clamp(1.5rem,2.5vw,2rem)] hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_44px_100px_-36px_hsl(0_0%_0%/0.8)]"
            >
              {rest.map((s, i) => (
                <Reveal
                  key={s.key}
                  index={i}
                  className="flex flex-1 items-center justify-between gap-6 py-[clamp(1rem,2vw,1.75rem)]"
                >
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold leading-snug text-white">{s.label}</div>
                    <div className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.2em] text-white/50">{s.en}</div>
                    <div className="mt-1.5 text-[12.5px] text-primary">{s.context}</div>
                  </div>
                  <span
                    data-testid={`numbers-row-${s.key}`}
                    aria-label={`${fmt(s.value)} — ${s.label}`}
                    className="shrink-0 font-display font-black tabular-nums leading-[0.95] text-sand-bright"
                    style={{ fontSize: "clamp(1.9rem, 3vw, 2.75rem)", letterSpacing: "-0.02em" }}
                  >
                    {n ? <CountUp value={s.value} lang={lang} /> : "—"}
                  </span>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Composition line + CTA — a quiet footer on a slim glass rail. */}
        <Reveal className="mt-[clamp(1.25rem,2.5vw,1.75rem)]">
          <div
            style={{ transition: "border-color .5s cubic-bezier(.2,.7,.2,1), box-shadow .5s cubic-bezier(.2,.7,.2,1)" }}
            className="glass-panel flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-[clamp(1.5rem,2.5vw,2rem)] py-[clamp(1.25rem,2.5vw,1.75rem)] hover:border-primary/45 hover:shadow-[0_44px_100px_-36px_hsl(0_0%_0%/0.8)]"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[14px] text-white/80">
              <span className="text-white/55">{t({ ar: "مجتمعنا:", en: "Our community:" })}</span>
              {composition.map((cmp, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5"
                  aria-label={n ? `${fmt(cmp.value)} ${cmp.label}` : undefined}
                >
                  {i > 0 && <span aria-hidden className="px-1 text-white/45">·</span>}
                  <span className="tnum font-bold text-sand-bright">{n ? fmt(cmp.value) : "—"}</span>
                  <span>{cmp.label}</span>
                </span>
              ))}
            </div>
            <Link
              href="/numbers"
              data-testid="link-numbers-more"
              className="group inline-flex items-center gap-2 rounded-full border border-white/[0.12] px-4 py-2 text-[14px] font-semibold text-primary transition-all duration-200 hover:border-primary/40 hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608] motion-reduce:transition-none"
            >
              {t({ ar: "كلّ الأرقام والإنجازات", en: "All numbers & milestones" })}
              <ArrowLeft className="h-4 w-4 ltr:rotate-180 transition-transform duration-300 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </div>
    </CinematicMedia>
  );
}
