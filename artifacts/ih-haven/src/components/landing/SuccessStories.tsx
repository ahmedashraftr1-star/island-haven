import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Quote } from "lucide-react";
import { EditorialHeader } from "./EditorialHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { EASE_OUT_EXPO, VIEWPORT } from "@/lib/motion";

interface Story {
  id: number;
  personName: string;
  role: string;
  quote: string;
  avatarUrl: string | null;
  ventureName: string;
}

/**
 * SuccessStories — member voices, told the editorial way: a start-aligned
 * display header (no gradient text), a photo-forward featured testimonial paired
 * with a real Gaza-space image, then a quiet roster of supporting quotes on ONE
 * card spec. Initials fall back to a warm sand plate (no icon tile).
 */
export function SuccessStories() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<Story[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ stories: Story[] }>("/stories")
      .then((r) => !cancelled && setRows(r.stories.slice(0, 6)))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, []);

  // EVERGREEN fallback — before the first member story is recorded, this CORE
  // proof section must still stand. We hold the light editorial register and
  // lead with the founding belief itself, attributed to the team, + apply CTA.
  if (rows !== null && rows.length === 0) {
    return (
      <section id="stories" className="relative bg-surface-1 section-y overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 top-0 h-[50%] brand-aura opacity-50" />
        <div className="container-ih relative">
          <EditorialHeader
            label={t({ ar: "قصص نجاح", en: "Success Stories" })}
            title={
              lang === "ar" ? (
                <>
                  أوّل القصص <span className="text-sand">تُكتب الآن</span>
                </>
              ) : (
                <>
                  The first stories <span className="text-sand">are being written</span>
                </>
              )
            }
            sub={t({
              ar: "قبل أن نروي قصص أعضائنا، نبدأ بالقناعة التي بُنيت عليها آيلاند.",
              en: "Before we tell our members' stories, we begin with the belief Island Haven was built on.",
            })}
          />

          <motion.figure
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="card-base p-8 lg:p-12 max-w-4xl"
          >
            <Quote className="w-10 h-10 text-sand mb-6" strokeWidth={2} />
            <blockquote
              className="font-editorial italic text-foreground"
              style={{ fontSize: "clamp(1.7rem, 3.6vw, 3rem)", lineHeight: 1.18, letterSpacing: "-0.02em" }}
            >
              {t({
                ar: "نؤمن أنّ الموهبة لا تحدّها الجغرافيا.",
                en: "We believe talent is not bound by geography.",
              })}
            </blockquote>
            <p className="t-body-lg mt-7 max-w-2xl">
              {t({
                ar: "في غزّة كفاءاتٌ تستحقّ مقعدًا في الاقتصاد الرقميّ العالميّ — ومهمّتنا أن نوصلها إليه. أوّل من يقدّم اليوم، يكتب أوّل القصص.",
                en: "Gaza holds talent that deserves a seat in the global digital economy — and our mission is to get it there. Whoever applies today writes the first story.",
              })}
            </p>
            <figcaption className="flex items-center gap-3.5 mt-8 pt-7 border-t border-border-strong">
              <div
                className="w-12 h-12 rounded-full grid place-items-center font-display font-black text-white ring-2 ring-white/15 shadow-soft select-none"
                style={{ background: "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--primary-pressed)) 100%)" }}
              >
                {t({ ar: "آ", en: "IH" })}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-foreground text-[15px]">
                  {t({ ar: "فريق آيلاند هيفن", en: "The Island Haven team" })}
                </div>
                <div className="text-muted-foreground t-caption">
                  {t({ ar: "قناعتنا التأسيسيّة", en: "Our founding belief" })}
                </div>
              </div>
            </figcaption>
          </motion.figure>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.42, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/apply"
              data-testid="stories-empty-apply"
              className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t({ ar: "اكتب أوّل قصّة", en: "Write the first story" })}
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>
    );
  }

  const lead = rows?.[0] ?? null;
  const rest = rows ? rows.slice(1) : [];

  const Avatar = ({ s, size }: { s: Story; size: string }) =>
    s.avatarUrl ? (
      <img
        src={s.avatarUrl}
        alt={s.personName}
        className={`${size} rounded-full object-cover ring-1 ring-border-strong`}
        loading="lazy"
      />
    ) : (
      <div
        className={`${size} rounded-full grid place-items-center font-display font-black text-white ring-2 ring-white/15 shadow-soft`}
        style={{ background: "linear-gradient(140deg, hsl(var(--primary)) 0%, hsl(var(--primary-pressed)) 100%)" }}
      >
        {s.personName.charAt(0)}
      </div>
    );

  const Caption = ({ s }: { s: Story }) => (
    <figcaption className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
      <Avatar s={s} size="w-11 h-11" />
      <div className="min-w-0">
        <div className="font-bold text-foreground t-caption !text-[13.5px] truncate">
          {s.personName}
        </div>
        <div className="text-muted-foreground t-caption truncate">
          {[s.role, s.ventureName].filter(Boolean).join(" · ")}
        </div>
      </div>
    </figcaption>
  );

  return (
    <section
      id="stories"
      className="relative bg-surface-1 section-y overflow-hidden"
    >
      <div className="container-ih">
        <EditorialHeader
          label={t({ ar: "قصص نجاح", en: "Success Stories" })}
          title={
            lang === "ar" ? (
              <>
                من <span className="text-sand">آيلاند</span> إلى العالم
              </>
            ) : (
              <>
                From <span className="text-sand">Island Haven</span> to the World
              </>
            )
          }
          sub={t({
            ar: "حكايات أعضاء وروّاد بدؤوا من مقعد في مساحتنا، وصنعوا أثرًا يُلهم الجيل القادم.",
            en: "Stories of members and founders who started from a seat in our space and made an impact that inspires the next generation.",
          })}
        />

        {/* Loading state */}
        {!rows && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 rounded-[20px] card-base skeleton-shimmer" />
            ))}
          </div>
        )}

        {/* Featured testimonial — photo-forward, asymmetric, breaks the grid */}
        {lead && (
          <motion.figure
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="grid lg:grid-cols-12 gap-x-[clamp(2rem,4vw,4rem)] gap-y-8 items-center mb-12 lg:mb-16"
          >
            <div className="lg:col-span-5 lg:order-2">
              <div className="overflow-hidden rounded-[20px] ring-1 ring-white/10">
                <img
                  src="/photos/IMG_8352.webp"
                  alt={t({ ar: "مساحة آيلاند هيفن في غزّة", en: "The Island Haven space in Gaza" })}
                  loading="lazy"
                  className="w-full aspect-[5/4] object-cover saturate-[1.03]"
                />
              </div>
            </div>
            <div className="lg:col-span-7 lg:order-1">
              <Quote className="w-9 h-9 text-sand mb-6" strokeWidth={2} />
              <blockquote
                className="font-display font-semibold text-foreground"
                style={{ fontSize: "clamp(1.4rem, 2.6vw, 2.15rem)", lineHeight: 1.3, letterSpacing: "-0.02em" }}
              >
                {lead.quote}
              </blockquote>
              <figcaption className="flex items-center gap-3.5 mt-8">
                <Avatar s={lead} size="w-12 h-12" />
                <div className="min-w-0">
                  <div className="font-bold text-foreground text-[15px]">
                    {lead.personName}
                  </div>
                  <div className="text-muted-foreground t-caption">
                    {[lead.role, lead.ventureName].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </figcaption>
            </div>
          </motion.figure>
        )}

        {/* Supporting roster — one quiet card spec */}
        {rest.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((s, i) => (
              <motion.figure
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.42, delay: Math.min(i, 5) * 0.06, ease: EASE_OUT_EXPO }}
                className="group card-base card-hover rounded-[20px] p-7 lg:p-8 flex flex-col overflow-hidden"
              >
                <Quote className="w-7 h-7 text-sand/55 mb-4 shrink-0" strokeWidth={2} />
                <blockquote className="text-fg-secondary t-body flex-1">
                  {s.quote}
                </blockquote>
                <Caption s={s} />
              </motion.figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
