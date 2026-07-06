import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { splitTags } from "@/lib/labels";
import { CinematicMedia } from "@/components/landing/CinematicMedia";
import { imageUrl } from "@/hooks/use-content";

interface FMember {
  id: number;
  fullName: string;
  jobTitle: string;
  avatarUrl: string | null;
  skills: string;
}

/** Homepage community preview — real members from /api/members, told at hero
 *  power: a member-at-work photograph anchors the section, one oversized featured
 *  member leads, the rest follow as glass cards. Renders nothing on error so the
 *  homepage never shows a broken/empty section. */
export function FeaturedMembers() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const [members, setMembers] = useState<FMember[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ members: FMember[] }>("/members?page=1")
      .then((r) => !cancelled && setMembers((r.members ?? []).slice(0, 5)))
      .catch(() => !cancelled && setMembers([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!members || members.length === 0) return null;

  return (
    <CinematicMedia
      as="section"
      src={imageUrl("/photos/IMG_8303.webp")}
      scrim="heavy"
      sideScrim={false}
      className="border-t border-white/[0.06]"
      aria-label={t({ ar: "مواهب من المجتمع", en: "Talent from the community" })}
    >
      <div className="container-ih section-y">
        <div className="mb-[clamp(2rem,4vw,3rem)] flex items-end justify-between gap-4">
          <Link
            href="/members"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/70 hover:text-white transition-colors"
          >
            {t({ ar: "عرض الكلّ", en: "View all" })}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
          <div className="text-end">
            <p className="eyebrow eyebrow-sand mb-3">{t({ ar: "المجتمع", en: "Community" })}</p>
            <h2
              className="font-display font-extrabold text-white"
              style={{ fontSize: "clamp(1.9rem,3.6vw,3rem)", letterSpacing: "-0.03em", lineHeight: 1.04 }}
            >
              {t({ ar: "مواهب تصنع الفارق", en: "Talent that makes a difference" })}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {members.map((m, i) => {
            const featured = i === 0;
            const initial = m.fullName.trim().charAt(0);
            const tags = splitTags(m.skills);
            return (
              <motion.div
                key={m.id}
                whileHover={reduce ? undefined : { y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={featured ? "col-span-2 lg:row-span-2" : ""}
              >
                <Link
                  href={`/u/${m.id}`}
                  className={`group relative flex h-full flex-col rounded-[20px] border border-white/15 bg-white/[0.07] backdrop-blur-md p-5 ${featured ? "lg:p-8" : ""} transition-colors duration-300 hover:border-primary/50 hover:bg-white/[0.12]`}
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
                      <span className={`grid place-items-center rounded-full border border-white/20 bg-white/[0.06] font-display font-black text-sand-bright ${featured ? "h-16 w-16 lg:h-24 lg:w-24 text-2xl lg:text-4xl" : "h-12 w-12"}`}>
                        {initial}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className={`font-display font-bold text-white leading-tight line-clamp-1 group-hover:text-primary transition-colors ${featured ? "text-[clamp(1.15rem,2vw,1.7rem)]" : "text-[15px]"}`}>
                        {m.fullName}
                      </h3>
                      {m.jobTitle && (
                        <p className={`text-white/60 line-clamp-1 mt-1 ${featured ? "text-[14px] lg:text-[15px]" : "text-[12.5px]"}`}>
                          {m.jobTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {tags.slice(0, featured ? 4 : 2).map((s) => (
                        <span key={s} className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-white/75">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                    {t({ ar: "عرض الملفّ", en: "View profile" })}
                    <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </CinematicMedia>
  );
}
