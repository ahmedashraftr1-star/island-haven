import { Link } from "wouter";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useMembers } from "@/hooks/use-public-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { splitTags } from "@/lib/labels";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { Reveal } from "@/components/landing/Reveal";
import { imageUrl } from "@/hooks/use-content";

interface FMember {
  id: number;
  fullName: string;
  jobTitle: string;
  avatarUrl: string | null;
  skills: string;
}

/** Homepage community preview — real members from /api/members, told at hero
 *  power on the site-wide "Vision Pro" dark canvas: a member-at-work photograph
 *  anchors the section, one oversized featured member leads, the rest follow as
 *  unified frosted glass panels. Renders nothing on error so the homepage never
 *  shows a broken/empty section. */
export function FeaturedMembers() {
  const { t } = useLanguage();
  useReducedMotion();
  const { data } = useMembers<FMember>();
  // Top-5 slice; undefined until resolved. On loading / error / empty the
  // section renders nothing (below) so the homepage never shows a broken block.
  const members = (data?.members ?? []).slice(0, 5);

  if (members.length === 0) return null;

  return (
    <CinematicMedia
      as="section"
      src={imageUrl("/photos/IMG_8303.webp")}
      scrim="heavy"
      sideScrim={false}
      className="relative overflow-hidden border-t border-white/[0.06]"
      aria-label={t({ ar: "مواهب من المجتمع", en: "Talent from the community" })}
    >
      {/* Ambient lit-space field so the dark canvas reads as depth, not flat black */}
      <div className="glass-ambient pointer-events-none absolute inset-0" aria-hidden />

      <div className="container-ih section-y relative">
        <Reveal>
          <div className="mb-[clamp(2.25rem,4vw,3.25rem)] flex items-end justify-between gap-6">
            <Link
              href="/members"
              className="group inline-flex items-center gap-1.5 rounded-md pb-1.5 text-[13px] font-semibold text-white/70 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608]"
            >
              {t({ ar: "عرض الكلّ", en: "View all" })}
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 rtl:rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" aria-hidden />
            </Link>
            <div className="text-end">
              <span className="mb-6 flex items-center justify-end gap-3">
                <span aria-hidden className="h-px w-9 bg-primary/70" />
                <span className="eyebrow">
                  {t({ ar: "المجتمع", en: "Community" })}
                  <span className="text-white/45"> · </span>
                  <span className="text-primary">{t({ ar: "غزّة", en: "Gaza" })}</span>
                </span>
              </span>
              <h2
                className="font-display text-white"
                style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 0.98 }}
              >
                {t({ ar: "مواهب ", en: "Talent that " })}
                <span className="text-primary">{t({ ar: "تصنع الفارق", en: "makes a difference" })}</span>
              </h2>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {members.map((m, i) => {
            const featured = i === 0;
            const initial = m.fullName.trim().charAt(0);
            const tags = splitTags(m.skills);
            return (
              <Reveal
                key={m.id}
                index={i}
                className={featured ? "col-span-2 lg:row-span-2" : ""}
              >
                <div className="h-full">
                  <Link
                    href={`/u/${m.id}`}
                    style={{ transition: "transform .5s cubic-bezier(.2,.7,.2,1), border-color .5s cubic-bezier(.2,.7,.2,1), box-shadow .5s cubic-bezier(.2,.7,.2,1)" }}
                    className={`group relative flex h-full flex-col ${featured ? "glass-panel-lg p-6 lg:p-8" : "glass-panel p-5"} -translate-y-0 motion-safe:hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_44px_100px_-36px_hsl(0_0%_0%/0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608]`}
                  >
                    <div className={`flex items-center gap-4 ${featured ? "lg:flex-col lg:items-start lg:gap-6" : ""}`}>
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt={m.fullName}
                          loading="lazy"
                          className={`rounded-full object-cover ring-1 ring-white/20 ${featured ? "h-16 w-16 lg:h-24 lg:w-24" : "h-12 w-12"}`}
                        />
                      ) : (
                        <span className={`grid place-items-center rounded-full border border-white/20 bg-white/[0.06] font-display font-black text-sand-bright ${featured ? "h-16 w-16 text-2xl lg:h-24 lg:w-24 lg:text-4xl" : "h-12 w-12"}`}>
                          {initial}
                        </span>
                      )}
                      <div className="min-w-0">
                        <h3 className={`font-display font-bold text-white leading-[1.1] line-clamp-1 transition-colors group-hover:text-primary ${featured ? "text-[clamp(1.15rem,2vw,1.7rem)]" : "text-[15px]"}`}>
                          {m.fullName}
                        </h3>
                        {m.jobTitle && (
                          <p className={`mt-1 text-white/70 line-clamp-1 ${featured ? "text-[14px] lg:text-[15px]" : "text-[12.5px]"}`}>
                            {m.jobTitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {tags.slice(0, featured ? 4 : 2).map((s) => (
                          <span key={s} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] text-white/75">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-semibold text-primary">
                      {t({ ar: "عرض الملفّ", en: "View profile" })}
                      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 rtl:rotate-180 rtl:group-hover:translate-x-1" />
                    </span>
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </CinematicMedia>
  );
}
