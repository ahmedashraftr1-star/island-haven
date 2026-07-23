import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Btn } from "@/components/ui/Btn";
import { useStories } from "@/hooks/use-public-data";
import { Reveal } from "@/components/landing/Reveal";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { imageUrl, photoSrcSet, useContentSection } from "@/hooks/use-content";
import { credit } from "@/lib/credit";

// Section-chrome copy (eyebrow, headline, evergreen belief, empty state, labels)
// — editable in the bilingual CMS. Member quotes / names / roles stay on the API.
// Bilingual → `foo`/`fooEn`.
const FALLBACK = {
  eyebrow: "أصوات أعضائنا",
  eyebrowEn: "Voices of our members",
  title: "أصواتٌ من ",
  titleEn: "Voices from ",
  titleAccent: "الميدان.",
  titleAccentEn: "the ground.",
  beliefLead: "الموهبة لا تحدّها ",
  beliefLeadEn: "Talent is not bound by ",
  beliefAccent: "الجغرافيا",
  beliefAccentEn: "geography",
  beliefTail: ".",
  beliefTailEn: ".",
  emptyBody: "في غزّة كفاءاتٌ تستحقّ مقعدًا في الاقتصاد الرقميّ العالميّ — ومهمّتنا أن نوصلها إليه. أوّل من يقدّم اليوم، يكتب أوّل القصص.",
  emptyBodyEn: "Gaza holds talent that deserves a seat in the global digital economy — our mission is to get it there. Whoever applies today writes the first story.",
  emptyAvatar: "آ",
  emptyAvatarEn: "I",
  emptyAttribution: "فريق آيلاند هيفن — قناعتنا التأسيسيّة",
  emptyAttributionEn: "The Island Haven team — our founding belief",
  emptyCta: "اكتب أوّل قصّة",
  emptyCtaEn: "Write the first story",
  originalLabel: "",
  originalLabelEn: "Original · Arabic",
};

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
        // This circle is 40–60px across, and it was being filled with the 1350×1800
        // original — 2.4 megapixels to paint 1,600, decoded ON the main thread. It
        // was the single most expensive image on the homepage. Ask for the size we
        // actually paint, and decode it off-thread.
        srcSet={photoSrcSet(src)}
        sizes={`${size}px`}
        alt={name}
        loading="lazy"
        decoding="async"
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
  const c = useContentSection("successStories", FALLBACK);
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
        {t({ ar: c.eyebrow, en: c.eyebrowEn })}
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
        data-rail-theme="light"
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
        data-rail-theme="light"
        className="relative overflow-hidden border-t border-white/[0.06]"
        aria-label={t({ ar: "قصص النجاح", en: "Success stories" })}
        data-testid="stories-band"
      >
        <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />
        <div className="container-ih section-y relative">
          <figure className="relative max-w-4xl glass-panel-lg p-[clamp(1.5rem,3vw,2.5rem)]">
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
                  {t({ ar: c.beliefLead, en: c.beliefLeadEn })}
                  <span className="text-primary">{t({ ar: c.beliefAccent, en: c.beliefAccentEn })}</span>
                  {t({ ar: c.beliefTail, en: c.beliefTailEn })}
                </span>
              </Reveal>

              <Reveal as="p" delay={0.12} className="mt-6 sm:mt-8 max-w-2xl text-white/70">
                <span style={{ fontSize: "clamp(1.1rem, 1.9vw, 1.4rem)", lineHeight: 1.6 }}>
                  {t({ ar: c.emptyBody, en: c.emptyBodyEn })}
                </span>
              </Reveal>

              <Reveal
                as="div"
                delay={0.18}
                className="mt-7 sm:mt-9 flex flex-wrap items-center gap-x-6 gap-y-5 border-t border-white/10 pt-6"
              >
                <div className="flex items-center gap-4">
                  <Avatar name={t({ ar: c.emptyAvatar, en: c.emptyAvatarEn })} src={null} size={52} />
                  <span className="text-[13px] uppercase tracking-[0.16em] text-white/70 rtl:tracking-normal">
                    {t({ ar: c.emptyAttribution, en: c.emptyAttributionEn })}
                  </span>
                </div>
                <Btn asChild variant="primary" size="md" className="group">
                  <Link href="/apply" data-testid="stories-empty-apply">
                    {t({ ar: c.emptyCta, en: c.emptyCtaEn })}
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
                  </Link>
                </Btn>
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
      data-rail-theme="light"
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
            {t({ ar: c.title, en: c.titleEn })}
            <span className="text-primary">{t({ ar: c.titleAccent, en: c.titleAccentEn })}</span>
          </h2>
        </Reveal>

        {/* FEATURED — the lead testimonial set LARGE in white inside a feature
            glass tile floating on the vivid photo, with a terracotta quote mark
            and a confident avatar/name/role attribution. This is the moment. */}
        <Reveal as="div" delay={0.06} className="mt-[clamp(2.5rem,6vh,4.5rem)] max-w-5xl">
          <figure className="relative glass-panel-lg p-[clamp(1.5rem,3vw,2.5rem)]">
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
                  {t({ ar: c.originalLabel, en: c.originalLabelEn })}
                </p>
              )}

              <figcaption className="mt-6 flex items-center gap-4 border-t border-white/10 pt-6 sm:mt-8 sm:pt-7">
                <Avatar name={lead.personName} src={lead.avatarUrl} size={60} />
                <div className="min-w-0">
                  <div className="font-bold text-white text-[clamp(1.05rem,1.7vw,1.3rem)] leading-tight">
                    {lead.personName}
                  </div>
                  <div className="mt-1.5 text-[13px] uppercase tracking-[0.14em] text-white/65 rtl:tracking-normal">
                    {credit(lead.personName, lead.role, lead.ventureName)}
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
                className={`group grid items-center gap-x-8 gap-y-4 py-[clamp(1.1rem,2.4vh,1.6rem)] md:grid-cols-12 ${
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
                      {credit(s.personName, s.role, s.ventureName)}
                    </div>
                    {lang === "en" && (
                      <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/35">
                        {t({ ar: c.originalLabel, en: c.originalLabelEn })}
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
