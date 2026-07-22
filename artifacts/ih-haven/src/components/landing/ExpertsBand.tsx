import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { splitTags } from "@/lib/labels";
import { useExperts } from "@/hooks/use-public-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { Btn } from "@/components/ui/Btn";
import { Reveal } from "@/components/landing/Reveal";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { imageUrl } from "@/hooks/use-content";
import { ExpertAvatar } from "@/components/ui/ExpertAvatar";
import { SpotlightOverlay } from "@/components/ui/SpotlightCard";

interface ExpertCard {
  id: number;
  fullName: string;
  fullNameEn: string;
  avatarUrl: string | null;
  headline: string;
  headlineEn: string;
  expertise: string;
  expertiseEn: string;
  yearsExperience: number;
  acceptingSessions: boolean;
}

/**
 * ExpertsBand — the "Mentors" section, told at hero power.
 *
 * The winning register (shared with FeaturedMembers): a VIVID full-bleed Gaza
 * photograph anchors the section, a soft ambient field adds depth, and a roomy,
 * breathing grid of frosted glass mentor cards FLOATS on the photo — avatar or
 * terracotta initials · name · role · an "Available to book" pill. No paper, no
 * icon circles, no glowing blobs — translucent glass on lit space carries it.
 * Terracotta is the sole accent. Motion via the reduced-motion-safe Reveal. The
 * evergreen empty state (roster gathering + Be-a-mentor CTA) rides the same
 * register. All data fetch / i18n / routes / testids preserved.
 */
/** Locale-resolved expert card — in EN only the stored English fields are
 *  shown; experts without an English name are dropped upstream (hide rather
 *  than mix languages). */
interface ExpertView {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  expertise: string;
  yearsExperience: number;
  acceptingSessions: boolean;
}

export function ExpertsBand() {
  const { t, lang } = useLanguage();
  const { data, isLoading, isError } = useExperts<ExpertCard>();
  const en = lang === "en";
  // Loading → null (skeleton grid). Error → [] so the evergreen empty state
  // (roster gathering + become-a-mentor CTA) stands quietly. Resolved → in EN
  // drop experts with no English name, then resolve each field to English;
  // top-6.
  const rows: ExpertView[] | null = isLoading
    ? null
    : isError || !data
      ? []
      : data.experts
          .filter((e) => (en ? e.fullNameEn.trim() !== "" : true))
          .slice(0, 6)
          .map((e) => ({
            id: e.id,
            fullName: en ? e.fullNameEn : e.fullName,
            avatarUrl: e.avatarUrl,
            headline: en ? e.headlineEn : e.headline,
            expertise: en ? e.expertiseEn : e.expertise,
            yearsExperience: e.yearsExperience,
            acceptingSessions: e.acceptingSessions,
          }));

  const isEmpty = rows !== null && rows.length === 0;
  const experts = rows ?? Array.from({ length: 6 }).map(() => null);
  // Count "available to book" over the FULL roster (same source + filter as the
  // /experts page: `experts.filter(acceptingSessions).length`), NOT the top-6
  // display slice above — so the figure is identical wherever it appears.
  const available = data?.experts.filter((e) => e.acceptingSessions).length ?? 0;
  const availableLabel = lang === "en" ? available.toString() : available.toLocaleString("ar-EG");

  const intro = isEmpty
    ? t({
        ar: "مؤسّسون وبُناةٌ ومتخصّصون من حول العالم يجلسون مع جيلٍ غزّيّ شابّ، واحدًا لواحد. جلسة واحدة قد تفتح بابًا أغلقته الحرب.",
        en: "Founders, builders and specialists worldwide sit with a young Gazan generation, one to one. A single session can open a door the war had closed.",
      })
    : t({
        ar: "احجز جلسة إرشاد فرديّة مَجّانًا، وحوّل فكرتك إلى مشروع قابل للنموّ.",
        en: "Book a free one-to-one session, and turn your idea into a venture that can scale.",
      });

  const bookLabel = t({ ar: "متاح للحجز", en: "Available to book" });
  const busyLabel = t({ ar: "قائمة الانتظار", en: "Waitlist" });

  return (
    <CinematicMedia
      as="section"
      id="experts"
      data-testid="experts-band"
      src={imageUrl("/photos/IMG_8313.webp")}
      scrim="medium"
      sideScrim={false}
      data-rail-theme="light"
      className="relative overflow-hidden border-t border-white/[0.06]"
      aria-label={t({ ar: "الخبراء والمرشدون", en: "Experts & mentors" })}
    >
      {/* Ambient lit-space field so the photo reads as depth, not a flat plate */}
      <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />

      <div className="container-ih section-y relative">
        {/* Header — calm eyebrow, one monumental line with a single terracotta
            accent word, a roomy sub, and (default path) live availability. The
            evergreen branch keeps the same register and tells the true story. */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7" duration={0.7}>
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden className="h-px w-9 bg-primary/70" />
              <span className="eyebrow">
                {t({ ar: "الخبراء والمرشدون", en: "Experts & mentors" })}
              </span>
            </div>
            <h2
              className="font-display text-white"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
                fontWeight: 900,
                lineHeight: 0.98,
                letterSpacing: "-0.04em",
              }}
            >
              {isEmpty ? (
                <>
                  {t({ ar: "المرشدون يتجمّعون. ", en: "The mentors are gathering. " })}
                  <span className="text-primary">{t({ ar: "كن منهم.", en: "Be one." })}</span>
                </>
              ) : (
                <>
                  {t({ ar: "خبراءٌ يأخذون بيدك نحو ", en: "Experts who take your hand toward " })}
                  <span className="text-primary">{t({ ar: "الأثر.", en: "impact." })}</span>
                </>
              )}
            </h2>
          </Reveal>

          <Reveal className="lg:col-span-5" delay={0.08} duration={0.7}>
            <p className="max-w-xl text-[1.0625rem] lg:text-[1.2rem] leading-[1.7] text-white/80">
              {intro}
            </p>
            {!isEmpty && rows && available > 0 && (
              <p className="mt-6 inline-flex items-center gap-2.5 text-[14px] font-semibold text-primary">
                <span aria-hidden className="inline-flex h-1.5 w-1.5 rounded-full bg-primary motion-safe:animate-pulse" />
                <span className="tnum">
                  {availableLabel} {t({ ar: "متاحون للحجز الآن", en: "available to book now" })}
                </span>
              </p>
            )}
          </Reveal>
        </div>

        {/* ── Mentor grid — a clean, evenly-aligned grid of refined glass cards
             floating on the vivid photo, each led by a generous mentor PHOTO;
             or the evergreen empty state. A restrained 2–3 column grid with
             consistent heights + gaps. ── */}
        {isEmpty ? (
          <Reveal className="mt-[clamp(3rem,7vh,5rem)]" duration={0.7}>
            <div className="glass-panel flex flex-col items-start gap-5 p-6 sm:p-8">
              <p className="max-w-2xl text-[1.0625rem] leading-[1.7] text-white/80">
                {t({
                  ar: "الروستر يتشكّل الآن. إن كنت مؤسّسًا أو متخصّصًا وتودّ أن تمنح ساعةً من وقتك، فكن أوّل المرشدين.",
                  en: "The roster is forming. If you're a founder or specialist willing to give an hour of your time, be one of the first mentors.",
                })}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Btn asChild variant="primary" size="md" className="group">
                  <Link href="/become-mentor?ref=home-experts-empty" data-testid="experts-empty-become-mentor">
                    {t({ ar: "سجّل كمرشد", en: "Become a mentor" })}
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
                  </Link>
                </Btn>
                <Btn asChild variant="ghost" className="group hover:gap-3 text-primary-bright hover:text-primary motion-reduce:transition-none">
                  <Link href="/experts#how-it-works">
                    {t({ ar: "كيف يعمل الإرشاد", en: "How mentorship works" })}
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
                  </Link>
                </Btn>
              </div>
            </div>
          </Reveal>
        ) : (
          <>
            <div className="mt-[clamp(1.75rem,3.5vh,2.75rem)] grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {experts.map((e, i) => {
                if (!e) {
                  return (
                    <div
                      key={i}
                      className="glass-panel flex h-full flex-col items-center gap-5 p-7 text-center sm:p-8"
                    >
                      <div className="h-24 w-24 shrink-0 rounded-full bg-white/10 animate-pulse" />
                      <div className="flex w-full flex-col items-center gap-2.5">
                        <div className="h-5 w-36 rounded bg-white/10 animate-pulse" />
                        <div className="h-3.5 w-28 rounded bg-white/[0.07] animate-pulse" />
                      </div>
                      <div className="mt-auto h-8 w-28 rounded-full bg-white/[0.07] animate-pulse" />
                    </div>
                  );
                }
                const tags = splitTags(e.expertise).slice(0, 2);
                const role = e.headline || tags.join(lang === "en" ? " · " : " • ");
                return (
                  <Reveal key={e.id} as="div" delay={i * 0.06} duration={0.6}>
                    <Link
                      href={`/experts/${e.id}`}
                      data-testid={`home-expert-${e.id}`}
                      className="group relative glass-panel spectral-edge flex h-full flex-col items-center gap-5 overflow-hidden p-7 text-center sm:p-8 transition-[transform,border-color,box-shadow] duration-500 [transition-timing-function:cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1.5 hover:!border-white/25 hover:shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.2),0_44px_96px_-32px_hsl(0_0%_0%/0.88)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    >
                      {/* Terracotta spotlight follows the cursor on the existing glass. */}
                      <SpotlightOverlay />
                      {/* Hairline gold detail — a quiet luxe seam at the card head,
                          lit fully on hover. */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(38_80%_60%/0.35)] to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                      />

                      {/* Mentor PHOTO — the focal element, via the ONE shared
                          ExpertAvatar (photo in a gold-ringed glass circle, else
                          the same gold-on-glass initials used on /experts). A soft
                          terracotta halo blooms on hover. */}
                      <div className="relative shrink-0">
                        <span
                          aria-hidden
                          className="pointer-events-none absolute -inset-2 rounded-full bg-primary/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
                        />
                        <ExpertAvatar
                          name={e.fullName}
                          avatarUrl={e.avatarUrl}
                          size="lg"
                          className="relative transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
                        />
                      </div>

                      {/* Name → role hierarchy, optically centred. */}
                      <div className="flex w-full flex-col items-center gap-1.5">
                        <h3
                          className="font-display font-bold text-white transition-colors group-hover:text-primary"
                          style={{ fontSize: "clamp(1.2rem, 1.9vw, 1.4rem)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                        >
                          {e.fullName}
                        </h3>
                        {role && (
                          <p className="text-[14.5px] leading-relaxed text-white/75 line-clamp-2">
                            {role}
                          </p>
                        )}
                        {e.yearsExperience > 0 && (
                          <p className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-white/50 tnum">
                            {lang === "en"
                              ? `${e.yearsExperience}+ yrs experience`
                              : `خبرة ${e.yearsExperience.toLocaleString("ar-EG")}+ سنة`}
                          </p>
                        )}
                      </div>

                      {/* Availability pill — pinned to the card foot so every card
                          shares an aligned baseline. */}
                      <div className="mt-auto pt-2">
                        {e.acceptingSessions ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-primary/12 border border-primary/25 px-4 py-1.5 text-[12.5px] font-semibold text-primary transition-colors duration-300 group-hover:bg-primary/18 group-hover:border-primary/40">
                            <span aria-hidden className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                            {bookLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-[12.5px] font-semibold text-white/65">
                            {busyLabel}
                          </span>
                        )}
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>

            {/* Terminal CTA — a calm confident line, no icon tile. */}
            <Reveal className="mt-[clamp(2.5rem,5vw,4rem)] flex flex-wrap items-center gap-x-4 gap-y-3" delay={0.1} duration={0.7}>
              <p className="text-white/80" style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)" }}>
                {t({ ar: "كلّ الخبراء، في مكانٍ واحد.", en: "Every expert, in one place." })}
              </p>
              <Btn
                asChild
                variant="ghost"
                className="group hover:gap-3 text-primary-bright hover:text-primary motion-reduce:transition-none"
              >
                <Link href="/experts" style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)" }}>
                  {t({ ar: "تصفّح كل الخبراء", en: "Browse all experts" })}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
                </Link>
              </Btn>
            </Reveal>
          </>
        )}
      </div>
    </CinematicMedia>
  );
}
