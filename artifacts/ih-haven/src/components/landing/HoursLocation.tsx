import { Link } from "wouter";
import { ArrowLeft, MapPin } from "lucide-react";
import { GazaPulseMap } from "./GazaPulseMap";
import { OpeningHours } from "./OpeningHours";
import { useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { Reveal } from "@/components/landing/Reveal";

/**
 * HoursLocation — "Visit us", told in the homepage's canonical editorial voice:
 * a system eyebrow + oversized solid display headline with a single cerulean
 * accent, then the OpeningHours dial and the place rendered as real card-base
 * material. The hand-drawn GazaPulseMap is framed INSIDE a card (paired with a
 * real photo of the space + the address/CTA) — never floating on empty canvas.
 * No glass, no dark voids. Keeps id="visit", the child components + their testids.
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
    <section id="visit" className="relative bg-background section-y overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[55%] brand-aura opacity-60" />

      <div className="container-ih relative">
        {/* Header — system eyebrow (hairline + kicker) + oversized solid display */}
        <Reveal as="header" className="max-w-3xl">
          <div className="flex items-center gap-3 mb-5">
            <span aria-hidden className="h-px w-9 bg-primary/50" />
            <span className="eyebrow">{c.label}</span>
          </div>
          <h2
            className="font-display font-extrabold text-foreground"
            style={{ fontSize: "clamp(2rem, 4.4vw, 3.6rem)", lineHeight: 1.04, letterSpacing: "-0.028em" }}
          >
            {c.titleA}
            <br />
            {c.titleB} <span className="text-sand-bright">{c.titleAccent}</span>
          </h2>
          <p className="t-body-lg mt-5 max-w-2xl">{c.sub}</p>
        </Reveal>

        {/* Opening hours — the dial keeps its own crafted treatment + day testids */}
        <div className="mt-[clamp(2.5rem,5vw,4rem)]">
          <OpeningHours />
        </div>

        {/* The place — one real card pairing the pulse map, a photo of the space,
            and the address/CTA. The map is framed material, not a floating glyph. */}
        <Reveal className="mt-[clamp(2.5rem,5vw,4rem)]">
          <div className="card-base rounded-[20px] shadow-soft overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Map plate — pulse map on a contained cerulean-washed surface */}
            <div className="lg:col-span-6 relative border-b border-border-strong lg:border-b-0 lg:border-e">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 110% at 50% 0%, hsl(var(--accent-2) / 0.10) 0%, hsl(var(--surface-3)) 72%)",
                }}
              />
              <div className="relative p-7 lg:p-10 flex flex-col h-full">
                <div className="eyebrow eyebrow-sand mb-6">{c.locationEyebrow}</div>
                <div className="flex-1 flex items-center justify-center">
                  <GazaPulseMap className="w-full max-w-[420px] mx-auto aspect-square" />
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5">
                  <div className="inline-flex items-center gap-2 chip-accent-2 rounded-full px-3 py-1.5 t-caption font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-2 animate-pulse" />
                    {c.locationStatus}
                  </div>
                  <div className="t-caption !text-muted-foreground font-mono tnum">{c.locationCoords}</div>
                </div>
              </div>
            </div>

            {/* Place plate — real photo + address + CTA, told with confidence */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="relative overflow-hidden">
                <img
                  src="/photos/IMG_8353.webp"
                  alt={t({ ar: "مساحة آيلاند هيفن في غزّة", en: "The Island Haven space in Gaza" })}
                  loading="lazy"
                  className="w-full h-[clamp(200px,26vw,280px)] object-cover object-center saturate-[1.04]"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A]/85 via-[#0A0E1A]/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
                  <div className="text-[11px] tracking-[0.2em] uppercase text-white/80 font-semibold mb-1.5">
                    {t({ ar: "من داخل المساحة", en: "Inside the space" })}
                  </div>
                  <div className="font-display font-bold text-white text-[clamp(1.1rem,2vw,1.55rem)]">
                    {t({ ar: "غرفة عمل واحدة، مدينة كاملة من الإمكانات.", en: "One workroom, a whole city of possibility." })}
                  </div>
                </div>
              </div>

              <div className="p-7 lg:p-10 flex flex-col flex-1">
                <h3
                  className="font-display font-bold text-foreground whitespace-pre-line"
                  style={{ fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                >
                  {c.locationTitle}
                </h3>
                <p className="t-body mt-4 max-w-md whitespace-pre-line">{c.locationBody}</p>

                <div className="mt-auto pt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/apply"
                    data-testid="visit-apply"
                    className="group inline-flex items-center gap-2 h-11 px-5 rounded-full cta-fill text-[13px] font-semibold"
                  >
                    {t({ ar: "انتسب لتعرف العنوان", en: "Join to get the address" })}
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180 rtl:rotate-0 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/contact"
                    data-testid="visit-contact"
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-border-strong bg-surface-2 text-fg-secondary text-[13px] font-semibold hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-primary" />
                    {t({ ar: "اسأل عن الزيارة", en: "Ask about visiting" })}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
