import { motion } from "framer-motion";
import { EditorialHeader, HairlineRow } from "./EditorialHeader";
import { imageUrl, useContentSection } from "@/hooks/use-content";

const FALLBACK = {
  label: "من نحن",
  titleA: "حاضنة",
  titleAccent: "أعمال",
  titleB: "في غزّة — من الفكرة إلى الأثَر.",
  body: "آيلاند هيفن — البرنامج التنمويّ للتقنية والريادة من «من النّاس إلى النّاس». نَحضن المشاريع الناشئة والمستقلّين والخرّيجين بإرشاد، برامج، وشبكة شركاء.",
  image: "/photos/IMG_8347.webp",
  imageBadge: "Open · مفتوح",
  imageEyebrow: "Inside the Haven · من داخل المساحة",
  imageCaption: "ركنٌ من مكاتب آيلاند هيفن المفتوحة للمستقلّين والخرّيجين والطلبة.",
  quote:
    "«نعم هو مكان للعمل، لكنّه قبل ذلك مساحة للالتقاء، وللتعلّم، ولبناء الثقة بالنفس وبالطريق.»",
  quoteAuthor: "— رؤية المؤسّسين",
  p1Ar: "رؤيتنا",
  p1En: "Vision",
  p1Body:
    "غزّة تَحضن أوّل ألف رائد/ة أعمال بحلول ٢٠٣٠ — يَبنون شركات تَخدم النّاس وتَصنع فرص عمل من الأرض.",
  p2Ar: "رسالتنا",
  p2En: "Mission",
  p2Body:
    "نُهيّئ بيئة مجّانيّة من مكان وإرشاد وشبكة علاقات، تَنقل صاحب الفكرة إلى صاحب مشروع، وصاحب المشروع إلى صاحب أثَر.",
  p3Ar: "لماذا مجتمع؟",
  p3En: "Why community?",
  p3Body:
    "الحاضنة ليست مكاتب — هي ناس. لمّا يجتمع المستقلّ مع المصمّم مع المبرمج مع المرشد في غرفة واحدة، تَلِد المشاريع وتَكبر أسرع.",
};

export function About() {
  const c = useContentSection("about", FALLBACK);
  return (
    <section id="about" className="relative bg-background py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-10 max-w-[1500px]">
        <EditorialHeader
          label={c.label}
          title={
            <>
              {c.titleA} <span className="text-accent-gradient">{c.titleAccent}</span>
              <br />
              {c.titleB}
            </>
          }
          sub={<>{c.body}</>}
        />

        <div className="grid grid-cols-12 gap-6 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 lg:col-span-5"
          >
            <figure className="group relative">
              <div className="relative rounded-2xl overflow-hidden shadow-soft-hover">
                <img
                  src={imageUrl(c.image)}
                  alt={c.imageCaption}
                  className="w-full aspect-[4/5] object-cover transition-transform duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 p-6 lg:p-7 text-white">
                  <div className="text-[10px] tracking-[0.22em] uppercase font-semibold opacity-75 mb-2">
                    {c.imageEyebrow}
                  </div>
                  <div className="text-[15px] lg:text-base leading-snug font-medium max-w-sm whitespace-pre-line">
                    {c.imageCaption}
                  </div>
                </div>
                {c.imageBadge && (
                  <div className="absolute top-5 right-5 inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/12 backdrop-blur-md border border-white/20 text-[10px] tracking-[0.18em] uppercase font-semibold text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {c.imageBadge}
                  </div>
                )}
              </div>
              <figcaption className="mt-7 pr-5 border-r-2 border-primary/40 text-foreground/85 text-lg leading-relaxed">
                {c.quote}
                <span className="block mt-3 text-[11px] tracking-[0.18em] uppercase text-foreground/45 font-semibold">
                  {c.quoteAuthor}
                </span>
              </figcaption>
            </figure>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="col-span-12 lg:col-span-7"
          >
            <HairlineRow no="01" ar={c.p1Ar} en={c.p1En} body={c.p1Body} />
            <HairlineRow no="02" ar={c.p2Ar} en={c.p2En} body={c.p2Body} />
            <HairlineRow no="03" ar={c.p3Ar} en={c.p3En} body={c.p3Body} />
            <div className="border-t border-border" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
