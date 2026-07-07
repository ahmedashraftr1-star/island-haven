import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { splitTags } from "@/lib/labels";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

interface ExpertCard {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  expertise: string;
  yearsExperience: number;
  acceptingSessions: boolean;
}

/**
 * Initials for the avatar fallback — first letters of the first two meaningful
 * name words, skipping single-letter honorifics ("م.", "أ.", "د."). Derived, not
 * hardcoded, so it holds for any mentor the API returns.
 */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const words = parts.filter((w) => w.replace(/\./g, "").length > 1);
  return (words.length ? words : parts)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("");
}

/**
 * ExpertsBand — the DARK GLASS "Mentors" section.
 *
 * The unified "Vision Pro" register: a deep #060608 canvas lit by a soft ambient
 * field, a big quiet headline with one terracotta accent word, and a roomy,
 * breathing grid of frosted glass mentor cards (avatar/initials · name · role ·
 * an "Available to book" pill). No paper, no icon circles, no glowing blobs —
 * translucent glass floating on lit space carries it. Terracotta is the sole
 * accent. Motion via the reduced-motion-safe Reveal. The evergreen empty state
 * (roster gathering + Be-a-mentor CTA) lives on the same dark glass register.
 * All data fetch / i18n / routes / testids preserved.
 */
export function ExpertsBand() {
  const { t, lang } = useLanguage();
  const [rows, setRows] = useState<ExpertCard[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ experts: ExpertCard[] }>("/experts")
      .then((r) => { if (!cancelled) setRows(r.experts.slice(0, 6)); })
      .catch(() => { if (!cancelled) setRows([]); });
    return () => { cancelled = true; };
  }, []);

  const isEmpty = rows !== null && rows.length === 0;
  const experts = rows ?? Array.from({ length: 6 }).map(() => null);
  const available = rows?.filter((e) => e.acceptingSessions).length ?? 0;
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
    <section
      id="experts"
      className="section-y relative overflow-hidden bg-[#060608] text-white border-t border-white/[0.06]"
      data-testid="experts-band"
    >
      <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />
      <div className="container-ih relative">
        {/* Header — calm eyebrow, one monumental line with a single terracotta
            accent word, a roomy sub, and (default path) live availability. The
            evergreen branch keeps the same register and tells the true story. */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7" duration={0.7}>
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary rtl:tracking-[0.12em]">
              {t({ ar: "الخبراء والمرشدون", en: "Experts & mentors" })}
            </p>
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
            <p className="max-w-xl text-[1.0625rem] lg:text-[1.2rem] leading-[1.7] text-white/70">
              {intro}
            </p>
            {!isEmpty && rows && available > 0 && (
              <p className="mt-6 inline-flex items-center gap-2.5 text-[14px] font-semibold text-primary">
                <span aria-hidden className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="tnum">
                  {availableLabel} {t({ ar: "متاحون للحجز الآن", en: "available to book now" })}
                </span>
              </p>
            )}
          </Reveal>
        </div>

        {/* ── Mentor grid — roomy frosted-glass cards on the lit dark field, or
             the evergreen empty state. A restrained 2–3 column grid with
             generous gaps. ── */}
        {isEmpty ? (
          <Reveal className="mt-[clamp(3rem,7vh,5rem)]" duration={0.7}>
            <div className="glass-panel flex flex-col items-start gap-6 p-8 sm:p-10">
              <p className="max-w-2xl text-[1.0625rem] leading-[1.7] text-white/70">
                {t({
                  ar: "الروستر يتشكّل الآن. إن كنت مؤسّسًا أو متخصّصًا وتودّ أن تمنح ساعةً من وقتك، فكن أوّل المرشدين.",
                  en: "The roster is forming. If you're a founder or specialist willing to give an hour of your time, be one of the first mentors.",
                })}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/become-mentor?ref=home-experts-empty"
                  data-testid="experts-empty-become-mentor"
                  className="cta-fill group inline-flex h-12 items-center gap-2.5 rounded-full px-7 text-[14px] font-bold transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  {t({ ar: "سجّل كمرشد", en: "Become a mentor" })}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
                </Link>
                <Link
                  href="/experts#how-it-works"
                  className="group inline-flex items-center gap-2 text-[14px] font-semibold text-primary transition-all duration-200 hover:gap-3 motion-reduce:transition-none"
                >
                  {t({ ar: "كيف يعمل الإرشاد", en: "How mentorship works" })}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
                </Link>
              </div>
            </div>
          </Reveal>
        ) : (
          <>
            <div className="mt-[clamp(3rem,7vh,5rem)] grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {experts.map((e, i) => {
                if (!e) {
                  return (
                    <div
                      key={i}
                      className="glass-panel flex flex-col gap-5 p-6 sm:p-7"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 shrink-0 rounded-full bg-white/10 animate-pulse" />
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="h-5 w-32 rounded bg-white/10 animate-pulse" />
                          <div className="h-3.5 w-24 rounded bg-white/[0.07] animate-pulse" />
                        </div>
                      </div>
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
                      className="group glass-panel flex h-full flex-col gap-5 p-6 sm:p-7 transition-[transform,border-color,box-shadow] duration-300 [transition-timing-function:cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1 hover:!border-white/25 hover:shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.18),0_36px_80px_-30px_hsl(0_0%_0%/0.85)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar — a real face where one exists; otherwise calm
                            terracotta initials so every mentor carries a face. */}
                        {e.avatarUrl ? (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15">
                            <img
                              src={e.avatarUrl}
                              alt={e.fullName}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <span
                            aria-hidden
                            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/25 font-display text-[1.05rem] font-black leading-none text-primary"
                          >
                            {initials(e.fullName)}
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-display font-bold text-white transition-colors group-hover:text-primary"
                            style={{ fontSize: "clamp(1.15rem, 1.8vw, 1.35rem)", letterSpacing: "-0.02em", lineHeight: 1.2 }}
                          >
                            {e.fullName}
                          </h3>
                          {e.yearsExperience > 0 && (
                            <p className="mt-0.5 text-[13px] text-white/50 tnum">
                              {lang === "en"
                                ? `${e.yearsExperience}+ yrs experience`
                                : `خبرة ${e.yearsExperience.toLocaleString("ar-EG")}+ سنة`}
                            </p>
                          )}
                        </div>
                      </div>

                      {role && (
                        <p className="text-[15px] leading-relaxed text-white/60 line-clamp-2">
                          {role}
                        </p>
                      )}

                      {/* Availability pill + a quiet cue, pinned to the card foot. */}
                      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                        {e.acceptingSessions ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-primary/12 border border-primary/25 px-3 py-1.5 text-[12.5px] font-semibold text-primary">
                            <span aria-hidden className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                            {bookLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-[12.5px] font-semibold text-white/50">
                            {busyLabel}
                          </span>
                        )}
                        <ArrowLeft className="h-4 w-4 text-white/40 rtl:rotate-180 transition-[color,transform] duration-300 group-hover:text-primary group-hover:-translate-x-1 rtl:group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden />
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>

            {/* Terminal CTA — a calm confident line, no icon tile. */}
            <Reveal className="mt-[clamp(2.5rem,5vw,4rem)] flex flex-wrap items-center gap-x-4 gap-y-3" delay={0.1} duration={0.7}>
              <p className="text-white/70" style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)" }}>
                {t({ ar: "كلّ الخبراء، في مكانٍ واحد.", en: "Every expert, in one place." })}
              </p>
              <Link
                href="/experts"
                className="group inline-flex items-center gap-2 font-semibold text-primary transition-all duration-200 hover:gap-3 motion-reduce:transition-none"
                style={{ fontSize: "clamp(1rem,1.6vw,1.2rem)" }}
              >
                {t({ ar: "تصفّح كل الخبراء", en: "Browse all experts" })}
                <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
              </Link>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}
