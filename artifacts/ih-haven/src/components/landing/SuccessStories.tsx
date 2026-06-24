import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { EditorialHeader } from "./EditorialHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

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
      className="relative bg-foreground/[0.02] py-24 lg:py-32 overflow-hidden"
    >
      <div className="container mx-auto px-6 lg:px-12 max-w-[1500px]">
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {(rows ?? Array.from({ length: 3 }).map(() => null)).map((s, i) =>
            s ? (
              <motion.figure
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="group relative rounded-3xl p-6 lg:p-7 bg-card border border-border shadow-[0_18px_44px_-22px_rgba(0,0,0,0.7)] hover:border-primary/25 hover:shadow-[0_28px_64px_-20px_rgba(220,68,84,0.28)] hover:-translate-y-1 transition-all duration-500 flex flex-col overflow-hidden"
              >
                <div
                  aria-hidden
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                />
                <Quote className="relative w-8 h-8 text-primary/40 mb-3" />
                <blockquote className="relative text-foreground/80 text-[14.5px] leading-[1.9] flex-1">
                  {s.quote}
                </blockquote>
                <figcaption className="relative flex items-center gap-3 mt-5 pt-5 border-t border-border">
                  {s.avatarUrl ? (
                    <img
                      src={s.avatarUrl}
                      alt={s.personName}
                      className="w-11 h-11 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold">
                      {s.personName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-foreground text-[13.5px] truncate">
                      {s.personName}
                    </div>
                    <div className="text-foreground/65 text-[12px] truncate">
                      {[s.role, s.ventureName].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </figcaption>
              </motion.figure>
            ) : (
              <div
                key={i}
                className="h-56 rounded-3xl bg-foreground/[0.03] border border-border animate-pulse"
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
