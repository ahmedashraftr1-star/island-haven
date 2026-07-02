import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useReducedMotion } from "framer-motion";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { splitTags } from "@/lib/labels";

/**
 * LiveWorkTicker — kinetic social proof: two counter-scrolling rows of REAL
 * member work (name · tech · title), pulled live from /api/works. The point is
 * proof, so every entry is real data and links to the member's actual profile —
 * no invented names or client claims. Reuses the existing `ih-marquee` keyframe
 * (doubled track, −50%); the second row runs it in reverse. Pauses on hover;
 * reduced-motion → static (no inline animation). Renders nothing if there isn't
 * enough real work to fill a marquee, so the homepage never shows an empty band.
 */

interface WorkRow {
  work: { id: number; title: string; tags: string };
  author: { id: number; fullName: string };
}

interface Entry {
  authorId: number;
  member: string;
  tech: string;
  title: string;
}

function TickerItem({ e, accent }: { e: Entry; accent: "red" | "sand" }) {
  return (
    <Link href={`/u/${e.authorId}`} className="group/item inline-flex items-center whitespace-nowrap">
      <span className="font-display font-bold text-foreground text-[1.02rem] tracking-tight transition-colors group-hover/item:text-primary">
        {e.member}
      </span>
      <span className="mx-3 text-white/20 text-sm" aria-hidden>·</span>
      <span className="font-mono text-fg-faint text-[0.78rem] tracking-wide">{e.tech}</span>
      <span className="mx-3 text-white/20 text-sm" aria-hidden>·</span>
      <span className="text-fg-secondary text-[0.95rem]">{e.title}</span>
      <span className={`mx-7 text-lg ${accent === "red" ? "text-primary/45" : "text-sand/45"}`} aria-hidden>✦</span>
    </Link>
  );
}

function TickerRow({ entries, duration, reverse, reduce }: { entries: Entry[]; duration: number; reverse?: boolean; reduce: boolean }) {
  const track = [...entries, ...entries]; // doubled so the −50% translate loops seamlessly
  return (
    <div className="relative flex items-center overflow-hidden h-14 [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)]">
      <div
        className="inline-flex items-center will-change-transform group-hover:[animation-play-state:paused]"
        style={reduce ? undefined : { animation: `ih-marquee ${duration}s linear infinite${reverse ? " reverse" : ""}` }}
      >
        {track.map((e, i) => (
          <TickerItem key={i} e={e} accent={i % 2 === 0 ? "red" : "sand"} />
        ))}
      </div>
    </div>
  );
}

export function LiveWorkTicker() {
  const { t } = useLanguage();
  const reduce = !!useReducedMotion();
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ works: WorkRow[] }>("/works?page=1")
      .then((r) => {
        if (cancelled) return;
        const mapped = (r.works ?? [])
          .filter((w) => w.work?.title && w.author?.fullName)
          .map((w) => ({
            authorId: w.author.id,
            member: w.author.fullName,
            tech: splitTags(w.work.tags).slice(0, 2).join(" · ") || t({ ar: "عمل", en: "work" }),
            title: w.work.title,
          }));
        setEntries(mapped);
      })
      .catch(() => !cancelled && setEntries([]));
    return () => { cancelled = true; };
  }, [t]);

  // Need enough real work to fill a seamless marquee — otherwise show nothing.
  if (!entries || entries.length < 4) return null;

  return (
    <section
      aria-label={t({ ar: "أعمال حيّة من المجتمع", en: "Live work from the community" })}
      className="group relative bg-surface-1 border-y border-white/[0.08] overflow-hidden"
    >
      <div className="flex items-center justify-between px-[clamp(1rem,4vw,2.5rem)] py-3 border-b border-white/[0.06]">
        <span className="font-mono text-[0.68rem] tracking-[0.14em] uppercase text-fg-faint">Live work output</span>
        <span className="flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.06em] uppercase text-fg-faint">
          <span
            className="inline-block w-[7px] h-[7px] rounded-full bg-primary animate-pulse"
            style={{ boxShadow: "0 0 8px hsl(var(--primary) / 0.8)" }}
            aria-hidden
          />
          {t({ ar: "أعمالٌ حقيقيّة من المجتمع", en: "Real work from the community" })}
        </span>
      </div>

      <TickerRow entries={entries} duration={52} reduce={reduce} />
      <div className="border-t border-white/[0.05]" />
      <TickerRow entries={[...entries].reverse()} duration={68} reverse reduce={reduce} />
    </section>
  );
}
