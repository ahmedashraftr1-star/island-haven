import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toAr = (s: string) => s.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

/**
 * ActMarker — a whisper-quiet chapter marker between the homepage's narrative
 * acts. A centered gold act-label (localized index · title) flanked by terracotta
 * hairlines, on the same near-black canvas as the cinematic sections so it reads
 * as a seamless chapter break. This is what makes the page's "chaptering"
 * (التقسيم) feel deliberate without adding clutter. Reduced-motion safe via Reveal.
 */
export function ActMarker({
  idx,
  ar,
  en,
  id,
}: {
  idx: number;
  ar: string;
  en: string;
  /** Optional anchor id — used by HomeTOC's scroll-spy to observe this act. */
  id?: string;
}) {
  const { t, lang } = useLanguage();
  const two = String(idx).padStart(2, "0");
  const num = lang === "ar" ? toAr(two) : two;
  return (
    <div id={id} className="relative bg-[#060608] text-white">
      <Reveal
        as="div"
        distance={12}
        // `act-y`, not a vh clamp: the chapter break must stay proportional to the
        // section seam (both on vw), or it drifts with window HEIGHT — at 390 the
        // old 6.5vh made an act break the same size as a plain seam, and on a tall
        // tablet it made it bigger than one. The break has to read as a break.
        className="container-ih act-y flex items-center justify-center gap-4"
      >
        <span aria-hidden className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-primary/50" />
        <span className="inline-flex items-center gap-2.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.22em] rtl:tracking-normal">
          <span className="font-mono tabular-nums text-primary">{num}</span>
          <span aria-hidden className="text-white/20">/</span>
          <span className="text-sand-bright">{t({ ar, en })}</span>
        </span>
        <span aria-hidden className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-primary/50" />
      </Reveal>
    </div>
  );
}
