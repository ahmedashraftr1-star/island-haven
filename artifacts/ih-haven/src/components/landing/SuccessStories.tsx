import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { EditorialHeader } from "./EditorialHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { EASE_OUT_EXPO, VIEWPORT } from "@/lib/motion";

interface Story {
  id: number;
  personName: string;
  role: string;
  quote: string;
  avatarUrl: string | null;
  ventureName: string;
}

export function SuccessStories() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<Story[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ stories: Story[] }>("/stories")
      .then((r) => !cancelled && setRows(r.stories.slice(0, 6)))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows !== null && rows.length === 0) return null;

  return (
    <section
      id="stories"
      className="relative bg-surface-1 section-y overflow-hidden"
    >
      <div className="container-ih">
        <EditorialHeader
          label={t({ ar: "قصص نجاح", en: "Success Stories" })}
          title={
            lang === "ar" ? (
              <>
                من <span className="text-accent-gradient">آيلاند</span> إلى العالم
              </>
            ) : (
              <>
                From <span className="text-accent-gradient">Island Haven</span> to
                the World
              </>
            )
          }
          sub={t({
            ar: "حكايات أعضاء وروّاد بدؤوا من مقعد في مساحتنا، وصنعوا أثرًا يُلهم الجيل القادم.",
            en: "Stories of members and founders who started from a seat in our space and made an impact that inspires the next generation.",
          })}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(rows ?? Array.from({ length: 3 }).map(() => null)).map((s, i) =>
            s ? (
              <motion.figure
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.6, delay: Math.min(i, 5) * 0.06, ease: EASE_OUT_EXPO }}
                className="group card-base card-hover rounded-[20px] p-7 lg:p-8 flex flex-col overflow-hidden"
              >
                <Quote className="w-7 h-7 text-primary/45 mb-4 shrink-0" strokeWidth={2} />
                <blockquote className="text-fg-secondary t-body flex-1">
                  {s.quote}
                </blockquote>
                <figcaption className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
                  {s.avatarUrl ? (
                    <img
                      src={s.avatarUrl}
                      alt={s.personName}
                      className="w-11 h-11 rounded-full object-cover ring-1 ring-border-strong"
                      loading="lazy"
                    />
                  ) : (
                    <div className="icon-tile !w-11 !h-11 !rounded-full font-bold">
                      {s.personName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-foreground t-caption !text-[13.5px] truncate">
                      {s.personName}
                    </div>
                    <div className="text-muted-foreground t-caption truncate">
                      {[s.role, s.ventureName].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </figcaption>
              </motion.figure>
            ) : (
              <div
                key={i}
                className="h-56 rounded-[20px] card-base skeleton-shimmer"
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
