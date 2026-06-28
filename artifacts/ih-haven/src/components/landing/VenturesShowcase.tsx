import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { imageUrl } from "@/hooks/use-content";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";
import { EASE_OUT_EXPO } from "@/lib/motion";

interface Venture {
  id: number;
  name: string;
  tagline: string;
  founderName: string;
  sector: string;
  stage: string;
  featured: boolean;
  coverUrl: string | null;
  logoUrl: string | null;
}

const STAGE_EN: Record<string, string> = {
  idea: "Idea", mvp: "MVP", launched: "Launched", scaling: "Scaling", growth: "Growth",
};
const STAGE_AR: Record<string, string> = {
  idea: "فكرة", mvp: "نموذج أوّليّ", launched: "انطلق", scaling: "توسّع", growth: "نموّ",
};

// Evergreen frames so a cover-less venture still wears real, dignified imagery
// (deterministic by id — a venture always keeps the same frame).
const FRAMES = [
  "/photos/IMG_8344.webp", "/photos/IMG_8347.webp", "/photos/IMG_8349.webp",
  "/photos/IMG_8353.webp", "/photos/IMG_8357.webp", "/photos/IMG_8358.webp",
];
const frameFor = (id: number) => FRAMES[Math.abs(id) % FRAMES.length];

/**
 * VentureCard — one full-bleed, image-forward project band (the jonnyczar register):
 * a large cover under a slow scroll parallax + a deep bottom scrim, with the metadata,
 * a monumental venture name, the tagline, and a "Case study →" affordance overlaid at the
 * foot. The whole band is the link; the cover lifts on hover. Cinematic, not a card deck.
 */
function VentureCard({
  v, index, lang, t, reduce,
}: {
  v: Venture; index: number; lang: Lang; t: ReturnType<typeof useLanguage>["t"]; reduce: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-9%", "9%"]);
  const cover = v.coverUrl ? imageUrl(v.coverUrl) : frameFor(v.id);
  const stage = lang === "ar" ? STAGE_AR[v.stage] ?? v.stage : STAGE_EN[v.stage] ?? v.stage;
  const n = (lang === "ar" ? (index + 1).toLocaleString("ar-EG") : String(index + 1)).padStart(2, "0");

  return (
    <Reveal as="div">
      <Link
        ref={ref}
        href={`/ventures/${v.id}`}
        data-testid={`showcase-venture-${v.id}`}
        className="group block relative overflow-hidden rounded-[24px] ring-1 ring-white/10"
      >
        <div className="relative h-[clamp(440px,64vh,720px)] overflow-hidden bg-[#05070F]">
          <motion.img
            style={{ y, willChange: "transform" }}
            src={cover}
            alt={v.name}
            loading="lazy"
            decoding="async"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = frameFor(v.id); }}
            className="absolute inset-0 h-[118%] w-full object-cover object-center saturate-[1.05] transition-transform duration-[1300ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-hover:scale-[1.045]"
          />
          {/* deep cinematic scrim — text always sits on the dark foot */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#05070F] via-[#05070F]/45 to-[#05070F]/5" />

          {/* index numeral, quiet, top corner */}
          <div className="absolute top-6 inset-x-6 sm:top-8 sm:inset-x-9 flex items-start justify-between">
            <span className="font-display font-black tabular-nums text-white/35 leading-none text-[clamp(1.6rem,2.4vw,2.4rem)]" style={{ letterSpacing: "-0.04em" }}>
              {n}
            </span>
            {v.featured && (
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-white/75 rtl:tracking-normal bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-3 h-7 inline-flex items-center">
                {t({ ar: "مميّز", en: "Featured" })}
              </span>
            )}
          </div>

          {/* foot content */}
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9 lg:p-12">
            {/* metadata line — the honest "badges": stage (crimson) / sector / founder */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4 text-[12px] font-bold uppercase tracking-[0.14em] rtl:tracking-normal">
              <span className="text-primary">{stage}</span>
              {v.sector && (<><span aria-hidden className="text-white/25">/</span><span className="text-white/75">{v.sector}</span></>)}
              {v.founderName && (<><span aria-hidden className="text-white/25">/</span><span className="text-white/75">{v.founderName}</span></>)}
            </div>

            <h3
              className="font-display font-black text-white"
              style={{ fontSize: "clamp(2.1rem, 5vw, 4.6rem)", lineHeight: 0.96, letterSpacing: "-0.042em" }}
            >
              {v.name}
            </h3>

            {v.tagline && (
              <p className="mt-4 max-w-2xl text-white/72 leading-relaxed" style={{ fontSize: "clamp(1rem, 1.5vw, 1.3rem)" }}>
                {v.tagline}
              </p>
            )}

            <span className="mt-7 inline-flex items-center gap-2.5 text-[14px] font-bold text-white">
              {t({ ar: "دراسة الحالة", en: "Case study" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1.5 rtl:group-hover:translate-x-1.5" />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

/**
 * VenturesShowcase — the portfolio, in the jonnyczar register: a vertical sequence of
 * full-bleed, image-forward venture bands flowing down the page, each one a cinematic
 * cover with the name at display scale and a case-study affordance. Real /ventures data,
 * never-empty evergreen fallback. The signature "عرض المشاريع".
 */
export function VenturesShowcase() {
  const { t, lang } = useLanguage();
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<Venture[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ ventures: Venture[] }>("/ventures")
      .then((r) => {
        if (cancelled) return;
        const sorted = [...r.ventures].sort((a, b) => Number(b.featured) - Number(a.featured));
        setRows(sorted.slice(0, 4));
      })
      .catch(() => !cancelled && setRows([]));
    return () => { cancelled = true; };
  }, []);

  if (!rows) return null;

  return (
    <section id="ventures-band" className="relative bg-background section-y overflow-hidden">
      <div className="container-ih relative">
        {/* Header */}
        <Reveal as="header" className="max-w-3xl">
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-primary font-bold rtl:tracking-normal">
              {t({ ar: "معرض المشاريع", en: "The portfolio" })}
            </span>
          </div>
          <h2
            className="font-display font-black text-foreground"
            style={{ fontSize: "clamp(2.2rem, 5.2vw, 4.4rem)", lineHeight: 0.98, letterSpacing: "-0.04em" }}
          >
            {t({ ar: "مشاريع وُلدت في ", en: "Ventures built at " })}
            <span className="text-primary">{t({ ar: "آيلاند.", en: "Island Haven." })}</span>
          </h2>
          <p className="t-body-lg mt-6 max-w-2xl">
            {t({
              ar: "من فكرة على ورقة، إلى يوم عرضٍ أمام الدّاعمين، إلى منتجٍ يخدم النّاس — هذه المحفظة تنمو داخل مساحتنا في غزّة.",
              en: "From an idea on paper, to a Demo Day in front of our backers, to a product serving people — this portfolio is growing inside our space in Gaza.",
            })}
          </p>
        </Reveal>

        {rows.length === 0 ? (
          /* EVERGREEN — a core proof section must never vanish. One full-bleed frame
             tells the true present-tense story: the first cohort is building now. */
          <Reveal className="mt-[clamp(2.5rem,5vw,4rem)]">
            <div className="relative overflow-hidden rounded-[24px] ring-1 ring-white/10 h-[clamp(420px,58vh,640px)]">
              <img src={frameFor(1)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#05070F] via-[#05070F]/55 to-[#05070F]/15" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9 lg:p-12 max-w-3xl">
                <div className="text-[12px] font-bold uppercase tracking-[0.14em] rtl:tracking-normal text-primary mb-4">
                  {t({ ar: "الدفعة الأولى", en: "Cohort 01" })}
                </div>
                <h3 className="font-display font-black text-white" style={{ fontSize: "clamp(2rem, 4.6vw, 4rem)", lineHeight: 0.98, letterSpacing: "-0.04em" }}>
                  {t({ ar: "أوّل دفعة تَبني الآن.", en: "The first cohort is building now." })}
                </h3>
                <p className="mt-4 max-w-xl text-white/72 leading-relaxed" style={{ fontSize: "clamp(1rem, 1.5vw, 1.25rem)" }}>
                  {t({
                    ar: "هنا، قريبًا، تظهر أسماء المشاريع التي وُلدت في آيلاند — ومقعدك في الصفحة التالية.",
                    en: "This is where the names of ventures born at Island Haven will live — and your seat is on the next page.",
                  })}
                </p>
                <Link href="/apply" data-testid="showcase-apply" className="cta-fill group mt-7 inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5">
                  {t({ ar: "قدّم للدفعة الأولى", en: "Apply to the first cohort" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>
        ) : (
          <>
            <div className="mt-[clamp(2.5rem,5vw,4rem)] flex flex-col gap-[clamp(1.5rem,3vw,2.75rem)]">
              {rows.map((v, i) => (
                <VentureCard key={v.id} v={v} index={i} lang={lang} t={t} reduce={!!reduce} />
              ))}
            </div>

            <Reveal className="mt-[clamp(2.5rem,5vw,4rem)]">
              <Link
                href="/ventures"
                data-testid="showcase-all"
                className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
              >
                {t({ ar: "كلّ المشاريع", en: "All ventures" })}
                <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}
