import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";
import { GazaPulseMap } from "./GazaPulseMap";
import { OpeningHours } from "./OpeningHours";
import { useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * HoursLocation — single composite section that frames the "ساعات العمل"
 * dial alongside the Gaza pulse map. Social channels were intentionally
 * removed from this surface; they live exclusively in the footer now.
 */
export function HoursLocation() {
  const { t } = useLanguage();

  const FALLBACK = {
    label: t({ ar: "كل الأبواب مفتوحة", en: "Every door is open" }),
    titleA: t({ ar: "زرنا.", en: "Visit us." }),
    titleB: t({ ar: "اعرف أين", en: "Find out where" }),
    titleAccent: t({ ar: "نحن.", en: "we are." }),
    sub: t({
      ar: "ساعات العمل، الموقع، وكلّ ما تحتاج معرفته قبل أن تأتي.",
      en: "Opening hours, our location, and everything you need to know before you come.",
    }),
    locationEyebrow: t({ ar: "Where we are · أين نحن", en: "Where we are · أين نحن" }),
    locationTitle: t({
      ar: "في قلب غزّة، على ضفّة المتوسّط.",
      en: "In the heart of Gaza, on the Mediterranean shore.",
    }),
    locationBody: t({
      ar: "المساحة في موقع آمن ومركزيّ نُرسله عبر الرسائل الخاصّة بعد تأكيد الانتساب.",
      en: "The space sits in a safe, central location we share by private message once your membership is confirmed.",
    }),
    locationStatus: t({
      ar: "مفتوح الآن للزوّار بموعد مسبق",
      en: "Open now for visitors with an appointment",
    }),
    locationCoords: t({
      ar: "٣١.٥٠° ش · ٣٤.٤٧° شرق",
      en: "31.50° N · 34.47° E",
    }),
  };

  const c = useContentSection("hours", FALLBACK);

  return (
    <section
      id="visit"
      className="relative bg-muted/40 py-24 lg:py-32 border-t border-border"
    >
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px]">
        <EditorialHeader
          label={c.label}
          title={
            <>
              {c.titleA}
              <br />
              {c.titleB} <span className="text-accent-gradient">{c.titleAccent}</span>
            </>
          }
          sub={c.sub}
        />

        <OpeningHours />

        <motion.div
          initial={{ y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center bg-card border border-border rounded-3xl p-6 lg:p-10 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          <div className="lg:col-span-7 order-2 lg:order-1">
            <GazaPulseMap className="w-full max-w-[480px] mx-auto aspect-square" />
          </div>
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="text-[11px] tracking-[0.14em] uppercase text-foreground/55 font-semibold mb-3">
              {c.locationEyebrow}
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight leading-[1.15] mb-4 whitespace-pre-line">
              {c.locationTitle}
            </h3>
            <p className="text-[15px] text-foreground/65 leading-relaxed mb-6 whitespace-pre-line">
              {c.locationBody}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2 text-[13px] text-foreground/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {c.locationStatus}
              </div>
              <div className="text-[13px] text-foreground/65 tabular-nums">{c.locationCoords}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
