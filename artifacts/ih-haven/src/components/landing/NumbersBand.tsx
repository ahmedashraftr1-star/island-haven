import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useContentSection } from "@/hooks/use-content";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

const FALLBACK = {
  eyebrow: "الحاضنة بالأرقام · By the numbers",
  titleA: "ليست شعارات.",
  titleAccent: "أرقام حقيقيّة",
  titleB: "من قاعدة بياناتنا.",
  sub: "كلّ رقم تراه هنا يعكس حالة الحاضنة الآن — يتغيّر تلقائيًّا مع كلّ منتسب، كلّ مشروع، وكلّ مقعد إرشاد.",
  ctaLabel: "عرض الكلّ",
  tile1Label: "رائد/ة أعمال في المجتمع",
  tile1En: "Members",
  tile2Label: "مشروع في المعرض",
  tile2En: "Works",
  tile3Label: "تسجيل في البرامج",
  tile3En: "Enrollments",
  tile4Label: "مقعد استضفناه",
  tile4En: "Seats hosted",
};

interface Numbers {
  members: number;
  works: number;
  courses: number;
  enrollments: number;
  bookings: number;
  seatsHosted: number;
  events: number;
  applications: number;
}

function CountUp({ value, lang }: { value: number; lang: Lang }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1100;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      // Apple-style ease-out
      const eased = 1 - Math.pow(1 - k, 3);
      setN(Math.round(value * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  // Localised numeral: Arabic-Indic in AR, Western digits in EN.
  return (
    <span ref={ref} className="tnum">
      {n.toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
    </span>
  );
}

/**
 * NumbersBand — the incubator's live figures told as an editorial ledger
 * (NOT a grid of identical icon-tile cards). A photo-anchored lead on the
 * logical start, then a hairline-divided index where oversized SOLID tabular
 * numerals — tinted in the warm Gaza sand accent — carry the eye. Every figure
 * comes straight from the database. No gradient text, no icon tiles, no glow
 * blobs: photography + typography + real numbers.
 */
export function NumbersBand() {
  const { lang, t } = useLanguage();
  const [n, setN] = useState<Numbers | null>(null);
  const c = useContentSection("numbersBand", FALLBACK);

  useEffect(() => {
    api<{ numbers: Numbers }>("/numbers")
      .then((r) => setN(r.numbers))
      .catch(() => setN(null));
  }, []);

  const rows = [
    {
      value: n?.members ?? 0,
      label: t({ ar: c.tile1Label, en: "Members of the community" }),
      en: c.tile1En,
    },
    {
      value: n?.works ?? 0,
      label: t({ ar: c.tile2Label, en: "Works in the showcase" }),
      en: c.tile2En,
    },
    {
      value: n?.enrollments ?? 0,
      label: t({ ar: c.tile3Label, en: "Program enrollments" }),
      en: c.tile3En,
    },
    {
      value: n?.seatsHosted ?? 0,
      label: t({ ar: c.tile4Label, en: "Seats we've hosted" }),
      en: c.tile4En,
    },
  ];

  return (
    <section id="numbers" className="relative bg-surface-1 section-y">
      <div className="container-ih">
        <div className="grid lg:grid-cols-12 gap-x-[clamp(2rem,5vw,5rem)] gap-y-12 items-start">
          {/* Photo + lead — the place, shown not described */}
          <Reveal as="div" className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="flex items-center gap-3 mb-5">
              <span className="eyebrow">
                {t({ ar: c.eyebrow, en: "By the numbers" })}
              </span>
              <span className="chip-accent-2 inline-flex items-center gap-1.5 px-2.5 h-[22px] rounded-full text-[10px] font-bold tracking-[0.12em]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-2 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-2" />
                </span>
                LIVE
              </span>
            </div>
            <h2
              className="font-display font-extrabold text-foreground"
              style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
            >
              {t({ ar: c.titleA, en: "Not slogans." })}
              <br />
              {t({ ar: c.titleAccent, en: "Real numbers" })}{" "}
              {t({ ar: c.titleB, en: "from our database." })}
            </h2>
            <p className="t-body mt-5 max-w-md">
              {t({
                ar: c.sub,
                en: "Every figure here mirrors the incubator right now — updating automatically with each member, each project, and each mentorship seat.",
              })}
            </p>
            <div className="mt-8 overflow-hidden rounded-[20px] ring-1 ring-white/10">
              <img
                src="/photos/IMG_8352.webp"
                alt={t({ ar: "مجتمع آيلاند هيفن في غزّة", en: "The Island Haven community in Gaza" })}
                loading="lazy"
                className="w-full aspect-[5/4] object-cover saturate-[1.03]"
              />
            </div>
            <Link
              href="/numbers"
              className="mt-7 inline-flex items-center gap-2 h-11 px-5 rounded-full cta-fill text-[13px] font-semibold transition-colors duration-200"
              data-testid="link-numbers-more"
            >
              {t({ ar: c.ctaLabel, en: "View all" })}
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </Reveal>

          {/* Editorial index — oversized solid tabular numerals, hairline-divided, no cards */}
          <div className="lg:col-span-7">
            {rows.map((row, i) => (
              <Reveal key={row.en} delay={i * 0.05}>
                <div
                  className="grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-9 items-baseline border-t border-border-strong py-7 sm:py-9 first:border-t-0 first:pt-0"
                  data-testid={`numbers-row-${row.en.toLowerCase()}`}
                >
                  <span
                    className="font-display font-extrabold tabular-nums text-sand-bright leading-none"
                    style={{ fontSize: "clamp(2.6rem, 6vw, 4.25rem)" }}
                  >
                    {n ? <CountUp value={row.value} lang={lang} /> : "—"}
                  </span>
                  <div>
                    <div className="text-[15px] sm:text-base font-semibold text-foreground leading-snug">
                      {row.label}
                    </div>
                    <div className="text-[10.5px] tracking-[0.2em] uppercase text-muted-foreground font-semibold mt-1.5">
                      {row.en}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
