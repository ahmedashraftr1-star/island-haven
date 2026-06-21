import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowLeft, Users, Star, Sparkles, Calendar } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { useLanguage, type Lang } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { VENTURE_STAGE_LABELS, type VentureStage } from "@/lib/labels";

interface Venture {
  id: number;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string;
  founderName: string;
  sector: string;
  stage: VentureStage;
  foundedYear: number;
  teamSize: number;
  featured: boolean;
}

// English counterparts to the Arabic-only VENTURE_STAGE_LABELS in @/lib/labels.
const VENTURE_STAGE_LABELS_EN: Record<VentureStage, string> = {
  idea: "Idea",
  mvp: "MVP",
  launched: "Launched",
  scaling: "Scaling",
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
// Localised numeral: Arabic-Indic in AR, Western digits in EN.
function num(n: number, lang: Lang): string {
  return lang === "ar" ? toArabicNum(n) : String(n);
}
// Stage label localised by language.
function stageLabel(stage: VentureStage, lang: Lang): string {
  return lang === "ar" ? VENTURE_STAGE_LABELS[stage] : VENTURE_STAGE_LABELS_EN[stage];
}

export default function Ventures() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<Venture[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.title =
      lang === "ar" ? "المشاريع الناشئة — Island Haven" : "Ventures — Island Haven";
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    api<{ ventures: Venture[] }>("/ventures")
      .then((r) => !cancelled && setRows(r.ventures))
      .catch(
        (e) =>
          !cancelled &&
          setError(
            e instanceof ApiError
              ? e.message
              : lang === "ar"
                ? "تعذّر التحميل"
                : "Couldn't load ventures",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const featured = (rows ?? []).filter((v) => v.featured);
  const rest = (rows ?? []).filter((v) => !v.featured);
  const total = rows?.length ?? 0;

  return (
    <PageShell
      active="ventures"
      eyebrow={t({ ar: "صُنِع في آيلاند · Made in Gaza", en: "Made in Island Haven · Made in Gaza" })}
      title={t({ ar: "المشاريع", en: "Our" })}
      highlight={t({ ar: "الناشئة", en: "Ventures" })}
      subtitle={t({
        ar: "مشاريع وُلدت ونمت داخل مساحتنا — من فكرة على ورقة إلى منتجات تخدم النّاس وتصنع فرص عمل في غزّة.",
        en: "Ventures born and grown inside our space — from an idea on paper to products that serve people and create jobs in Gaza.",
      })}
    >
      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {rows === null && !error ? (
        <SkeletonVentures />
      ) : rows && rows.length === 0 ? (
        <EmptyState
          title={t({ ar: "قريبًا — أوّل دفعة مشاريع", en: "Coming soon — our first cohort of ventures" })}
          hint={t({
            ar: "نعمل مع روّاد الأعمال على إطلاق مشاريعهم. تابعنا.",
            en: "We're working with founders to launch their ventures. Stay tuned.",
          })}
        />
      ) : (
        <>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap items-center gap-2.5 mb-12 sm:mb-14"
          >
            <Chip>
              {num(total, lang)} {t({ ar: "مشروعًا ناشئًا", en: "ventures" })}
            </Chip>
            <Chip>{t({ ar: "صُنعت داخل الحاضنة", en: "Built inside the incubator" })}</Chip>
          </motion.div>

          {featured.length > 0 && (
            <section className="mb-14 sm:mb-16">
              <SectionHeader
                index={num(1, lang).padStart(2, lang === "ar" ? "٠" : "0")}
                title={t({ ar: "في الواجهة", en: "In the Spotlight" })}
                blurb={t({
                  ar: "مشاريع تركت أثرًا — قصص بدأت بفكرة وانتهت بمنتج حيّ.",
                  en: "Ventures that left a mark — stories that began with an idea and ended in a living product.",
                })}
              />
              <motion.div
                variants={reduce ? undefined : stagger}
                initial={reduce ? undefined : "hidden"}
                whileInView={reduce ? undefined : "show"}
                viewport={{ once: true, margin: "-8% 0px" }}
                className={`grid gap-5 ${featured.length === 1 ? "" : "lg:grid-cols-2"}`}
              >
                {featured.map((v) => (
                  <SpotlightCard key={v.id} v={v} reduce={!!reduce} />
                ))}
              </motion.div>
            </section>
          )}

          {rest.length > 0 && (
            <section>
              {featured.length > 0 && (
                <SectionHeader
                  index={num(2, lang).padStart(2, lang === "ar" ? "٠" : "0")}
                  title={t({ ar: "كلّ المشاريع", en: "All Ventures" })}
                  blurb={t({
                    ar: "المحفظة الكاملة للمشاريع التي تنمو في آيلاند.",
                    en: "The full portfolio of ventures growing at Island Haven.",
                  })}
                />
              )}
              <motion.div
                variants={reduce ? undefined : stagger}
                initial={reduce ? undefined : "hidden"}
                whileInView={reduce ? undefined : "show"}
                viewport={{ once: true, margin: "-8% 0px" }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {rest.map((v) => (
                  <VentureCard key={v.id} v={v} reduce={!!reduce} />
                ))}
              </motion.div>
            </section>
          )}
        </>
      )}
    </PageShell>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-white/70 bg-white/[0.04] border border-white/10">
      {children}
    </span>
  );
}

function SectionHeader({ index, title, blurb }: { index: string; title: string; blurb: string }) {
  return (
    <div className="relative mb-7 sm:mb-9">
      <span
        aria-hidden
        className="absolute -top-7 sm:-top-9 right-0 select-none font-black leading-none"
        style={{
          fontSize: "clamp(4.5rem, 13vw, 9rem)",
          WebkitTextStroke: "1.25px rgba(255,255,255,0.065)",
          color: "transparent",
        }}
      >
        {index}
      </span>
      <div className="relative">
        <h2
          className="text-white font-bold mb-2"
          style={{ fontSize: "clamp(1.3rem, 3vw, 1.85rem)", letterSpacing: "-0.025em" }}
        >
          {title}
        </h2>
        <p className="text-white/50 text-[13.5px] leading-[1.8] max-w-xl">{blurb}</p>
      </div>
    </div>
  );
}

function SpotlightCard({ v, reduce }: { v: Venture; reduce: boolean }) {
  const { lang, t } = useLanguage();
  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className="h-full"
    >
      <Link
        href={`/ventures/${v.id}`}
        className="group block h-full"
        data-testid={`venture-card-${v.id}`}
      >
        <GlassCard className="group relative h-full overflow-hidden group-hover:border-primary/40 transition-colors">
          <div className="relative aspect-[16/10] sm:aspect-[16/8] overflow-hidden bg-black/30">
            {v.coverUrl ? (
              <img
                src={v.coverUrl}
                alt={v.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />
            )}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, #0A0E1A 6%, rgba(10,14,26,0.55) 42%, transparent 78%)",
              }}
            />
            <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-bold bg-amber-400/15 text-amber-100 border border-amber-300/30 backdrop-blur-sm">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />{" "}
              {t({ ar: "مشروع مميّز", en: "Featured" })}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <div className="flex items-center gap-3 mb-3">
                {v.logoUrl ? (
                  <img src={v.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/15" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg">
                    {v.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-[20px] leading-tight truncate">{v.name}</h3>
                  <span className="text-[12px] text-primary font-semibold">
                    {stageLabel(v.stage, lang)}
                    {v.sector ? ` · ${v.sector}` : ""}
                  </span>
                </div>
              </div>
              {v.tagline && (
                <p className="text-white/80 text-[14px] leading-[1.7] mb-3 max-w-xl">{v.tagline}</p>
              )}
              <div className="flex items-center justify-between text-[12.5px] text-white/65">
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    {num(v.teamSize, lang)} {t({ ar: "في الفريق", en: "on the team" })}
                  </span>
                  {v.foundedYear ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {num(v.foundedYear, lang)}
                    </span>
                  ) : null}
                </span>
                <span className="inline-flex items-center gap-1 text-white group-hover:text-primary transition-colors font-bold">
                  {t({ ar: "القصّة الكاملة", en: "Full story" })}
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

function VentureCard({ v, reduce }: { v: Venture; reduce: boolean }) {
  const { lang, t } = useLanguage();
  return (
    <motion.div
      variants={reduce ? undefined : rise}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="h-full"
    >
      <Link
        href={`/ventures/${v.id}`}
        className="group block h-full"
        data-testid={`venture-card-${v.id}`}
      >
        <GlassCard className="group h-full flex flex-col overflow-hidden group-hover:border-primary/40 transition-colors">
          {v.coverUrl ? (
            <div className="aspect-[16/9] overflow-hidden bg-black/30">
              <img
                src={v.coverUrl}
                alt={v.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
          )}
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-2.5">
              {v.logoUrl ? (
                <img src={v.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/70 font-bold">
                  {v.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-bold text-[16px] truncate">{v.name}</h3>
                <span className="text-[11px] text-primary/90 font-medium">
                  {stageLabel(v.stage, lang)}
                  {v.sector ? ` · ${v.sector}` : ""}
                </span>
              </div>
            </div>
            {v.tagline && (
              <p className="text-white/65 text-[13px] leading-[1.7] mb-2">{v.tagline}</p>
            )}
            {v.description && (
              <p className="text-white/45 text-[12.5px] leading-[1.7] line-clamp-3 mb-4">{v.description}</p>
            )}
            <div className="mt-auto flex items-center justify-between text-[12px] text-white/55 pt-3 border-t border-white/[0.06]">
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary/80" />
                {num(v.teamSize, lang)} {t({ ar: "في الفريق", en: "on the team" })}
                {v.foundedYear ? ` · ${num(v.foundedYear, lang)}` : ""}
              </span>
              <span className="inline-flex items-center gap-1 text-white/65 group-hover:text-primary transition-colors font-semibold">
                {t({ ar: "التفاصيل", en: "Details" })}
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
              </span>
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

function SkeletonVentures() {
  return (
    <div className="space-y-12">
      <div className="flex gap-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="h-8 w-36 rounded-full bg-white/[0.04] border border-white/10 animate-pulse" />
        ))}
      </div>
      <div className="h-7 w-40 rounded-lg bg-white/[0.05] animate-pulse" />
      <div className="grid lg:grid-cols-2 gap-5">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-[24px] h-72 bg-white/[0.035] border border-white/10 animate-pulse" />
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[24px] h-72 bg-white/[0.035] border border-white/10 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
