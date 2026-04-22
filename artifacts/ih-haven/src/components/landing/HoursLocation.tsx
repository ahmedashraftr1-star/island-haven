import { motion } from "framer-motion";
import {
  Instagram,
  Linkedin,
  Facebook,
  Link as LinkIcon,
  FileText,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { EditorialHeader } from "./EditorialHeader";
import { GazaPulseMap } from "./GazaPulseMap";
import { OpeningHours } from "./OpeningHours";
import { useContentSection } from "@/hooks/use-content";

const ICONS = [LinkIcon, FileText, Instagram, Linkedin, Facebook, MapPin];

const FALLBACK = {
  label: "كل الأبواب مفتوحة",
  titleA: "تابعنا، سجّل،",
  titleB: "أو",
  titleAccent: "زرنا.",
  sub: "نحن متواجدون على كلّ المنصّات الرئيسيّة. اختر القناة التي تناسبك واختبر المساحة قبل أن تقرّر.",
  locationEyebrow: "Where we are · أين نحن",
  locationTitle: "في قلب غزّة، على ضفّة المتوسّط.",
  locationBody:
    "المساحة في موقع آمن ومركزيّ نُرسله عبر الرسائل الخاصّة بعد تأكيد الانتساب.",
  locationStatus: "مفتوح الآن للزوّار بموعد مسبق",
  locationCoords: "٣١.٥٠° ش · ٣٤.٤٧° شرق",
  c1Ar: "Linktree الرسمي", c1En: "All links", c1Desc: "", c1Href: "https://linktr.ee/ih_haven", c1Handle: "linktr.ee/ih_haven",
  c2Ar: "نموذج التسجيل", c2En: "Apply", c2Desc: "", c2Href: "/apply", c2Handle: "افتح النموذج",
  c3Ar: "إنستغرام", c3En: "Instagram", c3Desc: "", c3Href: "https://www.instagram.com/ih_haven", c3Handle: "@ih_haven",
  c4Ar: "لينكدإن", c4En: "LinkedIn", c4Desc: "", c4Href: "https://www.linkedin.com/company/ih-haven", c4Handle: "Island Haven",
  c5Ar: "فيسبوك", c5En: "Facebook", c5Desc: "", c5Href: "https://www.facebook.com/islandhaven101", c5Handle: "islandhaven101",
  c6Ar: "زرنا في غزّة", c6En: "Visit", c6Desc: "", c6Href: "https://www.instagram.com/ih_haven", c6Handle: "راسلنا للعنوان",
  bottomNote: "ضوابط استخدام المكان والتفاصيل الكاملة تُرسَل عند تأكيد الانتساب — راسلنا لأيّ سؤال.",
};

export function HoursLocation() {
  const c = useContentSection("hours", FALLBACK);
  const channels = [
    { ar: c.c1Ar, en: c.c1En, desc: c.c1Desc, href: c.c1Href, handle: c.c1Handle },
    { ar: c.c2Ar, en: c.c2En, desc: c.c2Desc, href: c.c2Href, handle: c.c2Handle },
    { ar: c.c3Ar, en: c.c3En, desc: c.c3Desc, href: c.c3Href, handle: c.c3Handle },
    { ar: c.c4Ar, en: c.c4En, desc: c.c4Desc, href: c.c4Href, handle: c.c4Handle },
    { ar: c.c5Ar, en: c.c5En, desc: c.c5Desc, href: c.c5Href, handle: c.c5Handle },
    { ar: c.c6Ar, en: c.c6En, desc: c.c6Desc, href: c.c6Href, handle: c.c6Handle },
  ].filter((x) => x.ar);

  return (
    <section id="visit" className="relative bg-muted/40 py-24 lg:py-32 border-t border-border">
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 lg:mb-14 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center bg-white border border-border rounded-3xl p-6 lg:p-10 shadow-soft overflow-hidden"
        >
          <div className="lg:col-span-7 order-2 lg:order-1">
            <GazaPulseMap className="w-full max-w-[480px] mx-auto aspect-square" />
          </div>
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="text-[11px] tracking-[0.14em] uppercase text-foreground/45 font-semibold mb-3">
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
              <div className="text-[13px] text-foreground/55">{c.locationCoords}</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {channels.map((ch, i) => {
            const Icon = ICONS[i] ?? LinkIcon;
            const external = ch.href?.startsWith("http");
            return (
              <motion.a
                key={`${ch.ar}-${i}`}
                href={ch.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.06 }}
                className="group bg-white border border-border rounded-2xl p-7 lg:p-8 shadow-soft hover:shadow-soft-hover hover:border-primary/25 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="tile-soft w-12 h-12 rounded-xl flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="text-[11px] tracking-[0.1em] uppercase text-foreground/45 font-medium mb-1.5">
                  {ch.en}
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-foreground mb-2.5">{ch.ar}</h3>
                <p className="text-[14px] text-foreground/65 leading-relaxed mb-5 whitespace-pre-line">
                  {ch.desc}
                </p>
                <div className="flex items-center gap-2 text-primary font-semibold text-[13px] group-hover:gap-3 transition-all">
                  {ch.handle}
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                </div>
              </motion.a>
            );
          })}
        </div>

        <p className="mt-10 text-[13px] text-foreground/55 max-w-2xl whitespace-pre-line">
          {c.bottomNote}
        </p>
      </div>
    </section>
  );
}
