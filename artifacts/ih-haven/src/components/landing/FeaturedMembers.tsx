import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { splitTags } from "@/lib/labels";

interface FMember {
  id: number;
  fullName: string;
  jobTitle: string;
  avatarUrl: string | null;
  skills: string;
}

/** Homepage community preview — the first three real members from /api/members.
 *  Renders nothing on error so the homepage never shows a broken section. */
export function FeaturedMembers() {
  const { t } = useLanguage();
  const [members, setMembers] = useState<FMember[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ members: FMember[] }>("/members?page=1")
      .then((r) => !cancelled && setMembers((r.members ?? []).slice(0, 3)))
      .catch(() => !cancelled && setMembers([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!members || members.length === 0) return null;

  return (
    <section className="relative bg-background py-20 sm:py-24 border-t border-border-strong">
      <div className="container-ih">
        <div className="mb-10 flex items-end justify-between gap-4">
          <Link
            href="/members"
            className="inline-flex items-center gap-1.5 t-caption text-fg-secondary hover:text-foreground transition-colors"
          >
            {t({ ar: "عرض الكلّ", en: "View all" })}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
          <div className="text-end">
            <p className="eyebrow eyebrow-sand font-mono mb-2">{t({ ar: "المجتمع", en: "Community" })}</p>
            <h2
              className="font-display font-bold text-foreground"
              style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", letterSpacing: "-0.02em" }}
            >
              {t({ ar: "مواهب تصنع الفارق", en: "Talent that makes a difference" })}
            </h2>
          </div>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {members.map((m) => {
            const initial = m.fullName.trim().charAt(0);
            return (
              <li key={m.id}>
                <Link
                  href={`/u/${m.id}`}
                  className="group flex h-full flex-col rounded-[18px] border border-border-strong bg-surface-2/40 p-5 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/40"
                >
                  <div className="flex items-center gap-3">
                    {m.avatarUrl ? (
                      <img
                        src={m.avatarUrl}
                        alt={m.fullName}
                        loading="lazy"
                        className="h-12 w-12 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <span className="grid h-12 w-12 place-items-center rounded-full border border-border-strong bg-white/[0.03] font-display font-black text-sand-bright">
                        {initial}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-foreground text-[15px] leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {m.fullName}
                      </h3>
                      {m.jobTitle && <p className="t-caption text-fg-secondary line-clamp-1 mt-0.5">{m.jobTitle}</p>}
                    </div>
                  </div>
                  {splitTags(m.skills).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {splitTags(m.skills)
                        .slice(0, 2)
                        .map((s) => (
                          <span key={s} className="rounded border border-border-strong px-2 py-0.5 text-[11px] text-fg-secondary">
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
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
