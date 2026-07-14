import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStories } from "@/hooks/use-public-data";
import { Reveal } from "@/components/landing/Reveal";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { imageUrl } from "@/hooks/use-content";

interface Story {
  id: number;
  personName: string;
  personNameEn: string;
  role: string;
  roleEn: string;
  quote: string;
  quoteEn: string;
  avatarUrl: string | null;
  ventureName: string;
  ventureNameEn: string;
}

/**
 * SuccessStories — member voices told at hero power on a VIVID full-bleed Gaza
 * photograph (the FeaturedMembers standard), not on flat black. Glass tiles
 * FLOAT on the photo + a slow ambient field: ONE monumental featured pull-quote
 * set LARGE and confident in white inside a `glass-panel-lg` tile with a terracotta
 * quote mark + clear avatar/initial attribution, then the supporting voices as a
 * refined hairline editorial column inside one frosted `glass-panel`. The
 * never-empty evergreen fallback stands on the same lit photo register.
 * Terracotta is the sole accent. All data / quotes / i18n / routes / testids kept.
 */

const PHOTO = imageUrl("/photos/IMG_8307.webp");

/** Attribution meta — role · venture — as one calm caption line. */
/**
 * A pull-quote's size must follow its LENGTH, or the section stops being a system.
 * These quotes are real and they vary wildly — one is a single confident line, the
 * next is a full paragraph. At the old fixed `clamp(1.9rem, 3.6vw, 3.4rem)` (up to
 * 54px) a short quote read as a monument and a long one became a wall of type that
 * ran off the top of the frame. Scaling by length keeps every card at the SAME
 * optical weight, which is what makes a set of them look composed rather than
 * ragged. Same idea as an editor sizing a pull-quote to its column.
 */
function quoteSize(text: string): { fontSize: string; lineHeight: number } {
  const n = (text ?? "").trim().length;
  if (n <= 90) return { fontSize: "clamp(1.8rem, 3.1vw, 2.9rem)", lineHeight: 1.2 };
  if (n <= 170) return { fontSize: "clamp(1.45rem, 2.3vw, 2.1rem)", lineHeight: 1.42 };
  return { fontSize: "clamp(1.2rem, 1.75vw, 1.6rem)", lineHeight: 1.62 };
}

function meta(role: string, venture: string) {
  const r = (role ?? "").trim();
  const v = (venture ?? "").trim();
  // The stored role often already NAMES the venture ("مؤسِّسة ومديرة تنفيذيّة —
  // مستشارك"), and we were appending it a second time, so the line read
  // "… — مستشارك · مستشارك". Only add the venture when the role doesn't already
  // carry it.
  if (!v || r.includes(v)) return r;
  return [r, v].filter(Boolean).join(" · ");
}

/** Avatar or a display initial in a ring, at a given size. */
function Avatar({
  name,
  src,
  size,
}: {
  name: string;
  src: string | null;
  size: number;
}) {
  const dim = { height: size, width: size };
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className="shrink-0 rounded-full object-cover ring-1 ring-white/25"
        style={dim}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full border border-white/20 bg-white/[0.06] font-display font-black text-sand-bright"
      style={{ ...dim, fontSize: size * 0.4 }}
    >
      {name.trim().charAt(0)}
    </span>
  );
}

/** Locale-resolved view of a story. In EN we render ONLY the stored English
 *  fields; stories without an English quote are dropped upstream so EN never
 *  shows an Arabic quote (honest, never mixed). */
interface StoryView {
  id: number;
  personName: string;
  role: string;
  quote: string;
  avatarUrl: string | null;
  ventureName: string;
}

export function SuccessStories() {
  const { lang, t } = useLanguage();
  const { data, isLoading, isError } = useStories<Story>();
  const en = lang === "en";
  // Loading → null (skeleton branch). Error → [] so the evergreen fallback
  // stands quietly instead of a broken blank. Resolved → locale-resolved,
  // top-6. In EN we drop any story whose English quote is empty (hide rather
  // than fall back to Arabic), then resolve each field to its English value.
  const rows: StoryView[] | null = isLoading
    ? null
    : isError || !data
      ? []
      : data.stories
          .filter((s) => (en ? s.quoteEn.trim() !== "" : true))
          .slice(0, 6)
          .map((s) => ({
            id: s.id,
            quote: en ? s.quoteEn : s.quote,
            personName: en ? s.personNameEn : s.personName,
            role: en ? s.roleEn : s.role,
            ventureName: en ? s.ventureNameEn : s.ventureName,
            avatarUrl: s.avatarUrl,
          }));

  const eyebrow = (
    <div className="mb-6 flex items-center gap-3">
      <span aria-hidden className="h-px w-9 bg-primary/70" />
      <span className="eyebrow">
        {t({ ar: "أصوات أعضائنا", en: "Voices of our members" })}
      </span>
    </div>
  );

  // The big terracotta opening quote mark, positioned inside a feature tile.
  const quoteMark = (
    <span
      aria-hidden
      className="pointer-events-none absolute font-display leading-none text-primary/90 select-none"
      style={{
        top: "clamp(0.25rem, 1.5vw, 1rem)",
        insetInlineStart: "clamp(1.1rem, 3vw, 2.5rem)",
        fontSize: "clamp(4.5rem, 10vw, 9rem)",
      }}
    >
      &ldquo;
    </span>
  );

  // Loading — a single calm glass placeholder floating on the lit photo field.
  if (!rows) {
    return (
      <CinematicMedia
        as="section"
        id="stories"
        src={PHOTO}
        scrim="medium"
        sideScrim={false}
        className="relative overflow-hidden border-t border-white/[0.06]"
        data-testid="stories-band"
      >
        <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />
        <div className="container-ih section-y relative">
          <div className="h-[clamp(16rem,34vh,24rem)] max-w-4xl rounded-[32px] glass-panel-lg skeleton-shimmer" />
        </div>
      </CinematicMedia>
    );
  }

  // EVERGREEN fallback — before the first member story is recorded, this CORE
  // proof section must still stand. We lead with the founding belief itself,
  // attributed to the team, as a large white pull-quote inside a glass tile
  // floating on the vivid photo + an apply CTA. No invented testimonials.
  if (rows.length === 0) {
    return (
      <CinematicMedia
        as="section"
        id="stories"
        src={PHOTO}
        scrim="medium"
        sideScrim={false}
        className="relative overflow-hidden border-t border-white/[0.06]"
        aria-label={t({ ar: "قصص النجاح", en: "Success stories" })}
        data-testid="stories-band"
      >
        <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />
        <div className="container-ih section-y relative">
          <figure className="relative max-w-4xl glass-panel-lg p-[clamp(1.75rem,4.5vw,4rem)]">
            {quoteMark}

            <div className="relative">
              <Reveal as="div">{eyebrow}</Reveal>
              <Reveal as="p" delay={0.05} className="font-display text-white">
                <span
                  style={{
                    display: "block",
                    fontSize: "clamp(2.6rem, 5.5vw, 5rem)",
                    lineHeight: 0.96,
                    letterSpacing: "-0.045em",
                    fontWeight: 900,
                  }}
                >
                  {lang === "ar" ? (
                    <>
                      الموهبة لا تحدّها <span className="text-primary">الجغرافيا</span>.
                    </>
                  ) : (
                    <>
                      Talent is not bound by <span className="text-primary">geography</span>.
                    </>
                  )}
                </span>
              </Reveal>

              <Reveal as="p" delay={0.12} className="mt-9 sm:mt-12 max-w-2xl text-white/70">
                <span style={{ fontSize: "clamp(1.1rem, 1.9vw, 1.4rem)", lineHeight: 1.6 }}>
                  {t({
                    ar: "في غزّة كفاءاتٌ تستحقّ مقعدًا في الاقتصاد الرقميّ العالميّ — ومهمّتنا أن نوصلها إليه. أوّل من يقدّم اليوم، يكتب أوّل القصص.",
                    en: "Gaza holds talent that deserves a seat in the global digital economy — our mission is to get it there. Whoever applies today writes the first story.",
                  })}
                </span>
              </Reveal>

              <Reveal
                as="div"
                delay={0.18}
                className="mt-10 sm:mt-12 flex flex-wrap items-center gap-x-6 gap-y-5 border-t border-white/10 pt-8"
              >
                <div className="flex items-center gap-4">
                  <Avatar name={t({ ar: "آ", en: "I" })} src={null} size={52} />
                  <span className="text-[13px] uppercase tracking-[0.16em] text-white/70 rtl:tracking-normal">
                    {t({ ar: "فريق آيلاند هيفن — قناعتنا التأسيسيّة", en: "The Island Haven team — our founding belief" })}
                  </span>
                </div>
                <Link
                  href="/apply"
                  data-testid="stories-empty-apply"
                  className="cta-fill group inline-flex items-center gap-2.5 h-12 px-7 rounded-full font-bold text-[14px] transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608]"
                >
                  {t({ ar: "اكتب أوّل قصّة", en: "Write the first story" })}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
                </Link>
              </Reveal>
            </div>
          </figure>
        </div>
      </CinematicMedia>
    );
  }

  const lead = rows[0];
  const rest = rows.slice(1, 4);

  return (
    <CinematicMedia
      as="section"
      id="stories"
      src={PHOTO}
      scrim="medium"
      sideScrim={false}
      className="relative overflow-hidden border-t border-white/[0.06]"
      aria-label={t({ ar: "أصوات أعضائنا", en: "Voices of our members" })}
      data-testid="stories-band"
    >
      <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />
      <div className="container-ih section-y relative">
        {/* Header — calm eyebrow + one monumental line. */}
        <Reveal as="div" className="max-w-4xl">
          {eyebrow}
          <h2
            className="font-display text-white"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 0.98,
              letterSpacing: "-0.04em",
            }}
          >
            {t({ ar: "أصواتٌ من ", en: "Voices from " })}
            <span className="text-primary">{t({ ar: "الميدان.", en: "the ground." })}</span>
          </h2>
        </Reveal>

        {/* FEATURED — the lead testimonial set LARGE in white inside a feature
            glass tile floating on the vivid photo, with a terracotta quote mark
            and a confident avatar/name/role attribution. This is the moment. */}
        <Reveal as="div" delay={0.06} className="mt-[clamp(2.5rem,6vh,4.5rem)] max-w-5xl">
          <figure className="relative glass-panel-lg p-[clamp(1.75rem,4.5vw,4rem)]">
            {quoteMark}

            <div className="relative">
              <blockquote
                className="font-display text-white"
                style={{
                  ...quoteSize(lead.quote),
                  letterSpacing: "-0.02em",
                  fontWeight: 800,
                  textWrap: "pretty",
                  maxWidth: "44ch",
                }}
              >
                {lead.quote}
              </blockquote>

              {lang === "en" && (
                <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-white/60">
                  {t({ ar: "", en: "Original · Arabic" })}
                </p>
              )}

              <figcaption className="mt-9 flex items-center gap-4 border-t border-white/10 pt-8 sm:mt-11 sm:pt-9">
                <Avatar name={lead.personName} src={lead.avatarUrl} size={60} />
                <div className="min-w-0">
                  <div className="font-bold text-white text-[clamp(1.05rem,1.7vw,1.3rem)] leading-tight">
                    {lead.personName}
                  </div>
                  <div className="mt-1.5 text-[13px] uppercase tracking-[0.14em] text-white/65 rtl:tracking-normal">
                    {meta(lead.role, lead.ventureName)}
                  </div>
                </div>
              </figcaption>
            </div>
          </figure>
        </Reveal>

        {/* SUPPORTING VOICES — a refined hairline editorial column inside ONE
            frosted glass tile floating on the photo: each voice a calm quote +
            avatar attribution, separated by hairlines, with a quiet terracotta
            hover accent. Impeccable rhythm, not a scattered card grid. */}
        {rest.length > 0 && (
          <Reveal
            as="div"
            delay={0.12}
            distance={20}
            className="mt-[clamp(2rem,5vh,3.25rem)] max-w-5xl glass-panel px-[clamp(1.25rem,3.5vw,2.75rem)] py-[clamp(0.5rem,1.5vh,1rem)]"
          >
            {/* `items-center`, not `items-start`: a quote and its attribution are one
                utterance, so they sit on one optical line. With items-start the credit
                floated at the top of a three-line quote and the column read as ragged.
                The attribution also gets a wider track (4/12, not 3/12) so a real role
                — «مؤسِّسة ومديرة تنفيذيّة — مستشارك» — stops wrapping onto three lines
                and dragging its row's height with it. */}
            {rest.map((s, i) => (
              <figure
                key={s.id}
                className={`group grid items-center gap-x-8 gap-y-4 py-[clamp(1.5rem,3.5vh,2.5rem)] md:grid-cols-12 ${
                  i > 0 ? "border-t border-white/10" : ""
                }`}
              >
                <blockquote
                  className="font-display text-white/90 transition-colors duration-300 group-hover:text-white md:col-span-8 motion-reduce:transition-none"
                  style={{
                    // A fixed measure, so every quote breaks at a similar line length
                    // and the set reads as a system instead of a pile. `pretty` (not
                    // `balance`) is right for multi-line prose — balance only helps a
                    // heading of two or three lines.
                    fontSize: "clamp(1.05rem, 1.55vw, 1.3rem)",
                    lineHeight: 1.55,
                    letterSpacing: "-0.012em",
                    fontWeight: 600,
                    textWrap: "pretty",
                    maxWidth: "56ch",
                  }}
                >
                  <span aria-hidden className="font-display text-primary/80 pe-1">
                    &ldquo;
                  </span>
                  {s.quote}
                </blockquote>

                <figcaption className="flex items-center gap-3 md:col-span-4 md:justify-end">
                  <Avatar name={s.personName} src={s.avatarUrl} size={40} />
                  <div className="min-w-0">
                    <div className="font-bold text-white text-[14px] leading-tight">
                      {s.personName}
                    </div>
                    <div className="mt-1 text-[12px] leading-snug text-white/60">
                      {meta(s.role, s.ventureName)}
                    </div>
                    {lang === "en" && (
                      <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/35">
                        {t({ ar: "", en: "Original · Arabic" })}
                      </div>
                    )}
                  </div>
                </figcaption>
              </figure>
            ))}
          </Reveal>
        )}
      </div>
    </CinematicMedia>
  );
}
