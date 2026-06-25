import { motion } from "framer-motion";
import { EditorialHeader } from "./EditorialHeader";
import { GazaPulseMap } from "./GazaPulseMap";
import { OpeningHours } from "./OpeningHours";
import { useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { EASE_OUT_EXPO, VIEWPORT } from "@/lib/motion";

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
      className="relative bg-background section-y"
    >
      <div className="container-ih">
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center card-base rounded-[20px] p-6 lg:p-10 overflow-hidden"
        >
          <div className="lg:col-span-7 order-2 lg:order-1">
            <GazaPulseMap className="w-full max-w-[480px] mx-auto aspect-square" />
          </div>
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="eyebrow !text-muted-foreground mb-3">
              {c.locationEyebrow}
            </div>
            <h3 className="t-h3 !text-foreground !text-2xl lg:!text-3xl mb-4 whitespace-pre-line">
              {c.locationTitle}
            </h3>
            <p className="t-body !text-fg-secondary mb-6 whitespace-pre-line">
              {c.locationBody}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="inline-flex items-center gap-2 chip-accent-2 rounded-full px-3 py-1.5 t-caption font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-2 animate-pulse" />
                {c.locationStatus}
              </div>
              <div className="t-caption !text-muted-foreground font-mono tnum">{c.locationCoords}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
