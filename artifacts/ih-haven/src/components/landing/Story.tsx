import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { EditorialHeader } from "./EditorialHeader";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { useLanguage } from "@/contexts/LanguageContext";

const FALLBACK = {
  label: "قصّتنا",
  titleA: "محاولة",
  titleAccent: "جادّة",
  titleB: "لبناء شيءٍ مستدام في مكانٍ يفتقر إلى الاستقرار.",
  chapter: "الفصل الأوّل · المنشأ",
  lead: "وُلد Island Haven من إيمانٍ بأنّ الاستثمار الحقيقيّ هو في الإنسان قبل أيّ شيء آخر.",
  p1: "",
  p2: "",
  quote: "",
  image: "/photos/IMG_8358.webp",
  creditEyebrow: "برنامج تنمويّ تابع لـ",
  creditTitle: "فريق «من الناس إلى الناس»",
  creditBody: "",
  creditLink1: "https://nastonas.org",
  creditLink2: "https://nastonas.org/generalDonations/4/0",
  stat1V: "2024", stat1L: "تأسّس",
  stat2V: "39", stat2L: "مقعد",
  stat3V: "100%", stat3L: "مجّانيّ",
};

const EN_FALLBACK = {
  label: "Our Story",
  titleA: "A serious",
  titleAccent: "attempt",
  titleB: "to build something sustainable where stability is scarce.",
  chapter: "Chapter One · The Origin",
  lead: "Island Haven was born from a belief that the truest investment is in people before anything else.",
  p1: "We started with a simple conviction: Gazan talent is world-class. What it lacked was a space — physical, professional, and human — to grow.",
  p2: "Island Haven bridges that gap. From mentorship to cloud credits, from co-working to global payment solutions, we give Gazan entrepreneurs every tool they need to compete on the world stage.",
  quote: '"We are proving, day by day, that geography is not destiny."',
  image: "/photos/IMG_8358.webp",
  creditEyebrow: "A development programme by",
  creditTitle: "NasToNas — People to People",
  creditBody: "NasToNas is a solidarity initiative connecting friends of Gaza with real, ground-level projects — making a direct, measurable difference.",
  creditLink1: "https://nastonas.org",
  creditLink2: "https://nastonas.org/generalDonations/4/0",
  stat1V: "2024", stat1L: "Founded",
  stat2V: "39", stat2L: "seats",
  stat3V: "100%", stat3L: "free",
};

export function Story() {
  const { lang } = useLanguage();
  const cms = useContentSection("story", FALLBACK);
  const c = lang === "en" ? EN_FALLBACK : cms;
  const stats = [
    { v: c.stat1V, l: c.stat1L },
    { v: c.stat2V, l: c.stat2L },
    { v: c.stat3V, l: c.stat3L },
  ].filter((s) => s.v || s.l);

  return (
    <section id="story" className="relative bg-background py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px]">
        <EditorialHeader
          label={c.label}
          title={
            <>
              {c.titleA} <span className="text-accent-gradient">{c.titleAccent}</span> لبناء شيءٍ
              <br />
              {c.titleB.replace(/^لبناء شيءٍ\s*/, "")}
            </>
          }
        />

        <div className="grid grid-cols-12 gap-6 lg:gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="col-span-12 lg:col-span-7"
          >
            <div className="text-[11px] tracking-[0.15em] uppercase text-primary font-semibold mb-5">
              {c.chapter}
            </div>
            <p
              className="text-2xl lg:text-3xl text-foreground leading-snug font-semibold mb-8"
              style={{ letterSpacing: "-0.015em" }}
            >
              {c.lead}
            </p>

            <div className="space-y-5 text-base lg:text-lg text-foreground/75 leading-relaxed whitespace-pre-line">
              {c.p1 && <p>{c.p1}</p>}
              {c.p2 && <p>{c.p2}</p>}
            </div>

            {c.quote && (
              <div className="mt-10 bg-primary-soft border border-primary/15 rounded-2xl p-7 lg:p-8 relative">
                <p
                  className="text-xl lg:text-2xl text-foreground leading-snug font-medium whitespace-pre-line"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  {c.quote}
                </p>
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-border">
              <div className="text-[11px] tracking-[0.15em] uppercase text-foreground/50 font-semibold mb-3">
                {c.creditEyebrow}
              </div>
              <h3 className="font-bold text-foreground text-2xl mb-3">{c.creditTitle}</h3>
              <p className="text-foreground/70 leading-relaxed max-w-xl mb-5 whitespace-pre-line">
                {c.creditBody}
              </p>
              <div className="flex flex-wrap gap-3">
                {c.creditLink1 && (
                  <a
                    href={c.creditLink1}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white border border-border text-foreground text-[13px] font-semibold hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {(c.creditLink1 || "").replace(/^https?:\/\//, "")}
                    <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                  </a>
                )}
                {c.creditLink2 && (
                  <a
                    href={c.creditLink2}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
                  >
                    {(c.creditLink2 || "").replace(/^https?:\/\//, "")} · {lang === "en" ? "Donate" : "للتبرّع"}
                    <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="col-span-12 lg:col-span-5 lg:sticky lg:top-24"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-soft">
              <img
                src={imageUrl(c.image)}
                alt="منظر داخليّ من آيلاند هيفن"
                className="w-full aspect-[3/4] object-cover"
              />
            </div>

            {stats.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-3">
                {stats.map((s, i) => (
                  <div key={i} className="bg-white border border-border rounded-xl p-4 shadow-soft">
                    <div
                      className="font-bold text-foreground leading-none tabular-nums"
                      style={{ fontSize: "clamp(1.25rem, 2vw, 1.75rem)" }}
                    >
                      {s.v}
                    </div>
                    <div className="text-[12px] text-foreground/55 mt-1.5 font-medium">{s.l}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
