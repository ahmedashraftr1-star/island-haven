import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, Linkedin, Mail, Sparkles } from "lucide-react";
import { PageShell, GlassCard, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";

type RoleGroup = "leadership" | "mentors" | "advisors" | "support";

interface TeamMember {
  id: number;
  fullName: string;
  role: string;
  bio: string;
  avatarUrl: string | null;
  linkedinUrl: string;
  websiteUrl: string;
  email: string;
  group: RoleGroup;
  featured: boolean;
}

const GROUP_LABELS: Record<RoleGroup, { ar: string; en: string }> = {
  leadership: { ar: "القيادة", en: "Leadership" },
  mentors: { ar: "المرشدون", en: "Mentors" },
  advisors: { ar: "المستشارون", en: "Advisors" },
  support: { ar: "الدّعم والتشغيل", en: "Support" },
};

const GROUP_ORDER: RoleGroup[] = ["leadership", "mentors", "advisors", "support"];

export default function Team() {
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "فريق آيلاند — حاضنة أعمال غزّة";
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ team: TeamMember[] }>("/team")
      .then((r) => !cancelled && setTeam(r.team))
      .catch(
        (e) =>
          !cancelled &&
          setError(e instanceof ApiError ? e.message : "تعذّر تحميل الفريق"),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = (team ?? []).reduce<Record<RoleGroup, TeamMember[]>>(
    (acc, m) => {
      (acc[m.group] ||= []).push(m);
      return acc;
    },
    { leadership: [], mentors: [], advisors: [], support: [] },
  );

  return (
    <PageShell
      eyebrow="من يقف خلف الحاضنة · The Team"
      title="فريق"
      highlight="آيلاند"
      subtitle="حاضنة أعمال يقودها فريق غزّاويّ-دوليّ يؤمن بأنّ المواهب هنا تستحقّ بيئة عمل، إرشاد، ودعمًا حقيقيّاً. نَنمو معكم، خطوة بخطوة."
    >
      {error && (
        <GlassCard className="p-5 text-red-200 text-center">{error}</GlassCard>
      )}

      {team === null && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-[24px] h-64 bg-white/[0.035] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : team && team.length === 0 ? (
        <EmptyState
          title="سيُعلَن عن الفريق قريبًا"
          hint="نُجهّز ملفّات الفريق والمرشدين — تابعنا."
        />
      ) : (
        <div className="space-y-12">
          {GROUP_ORDER.map((g) => {
            const items = grouped[g];
            if (!items?.length) return null;
            return (
              <section key={g}>
                <div className="flex items-baseline gap-3 mb-5">
                  <h2 className="text-white font-bold text-[20px]">
                    {GROUP_LABELS[g].ar}
                  </h2>
                  <span className="text-[10.5px] tracking-[0.22em] uppercase text-white/40 font-bold">
                    · {GROUP_LABELS[g].en}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.04 }}
                    >
                      <TeamCard m={m} />
                    </motion.div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="mt-14 rounded-[28px] p-7 sm:p-9 bg-white/[0.04] border border-white/10 text-center">
        <Sparkles className="w-6 h-6 text-primary mx-auto mb-3" />
        <h3 className="text-white font-bold text-[18px] mb-2">
          هل تريد الانضمام إلى الفريق؟
        </h3>
        <p className="text-white/55 text-[14px] leading-[1.85] max-w-md mx-auto mb-5">
          نَبحث دائماً عن مرشدين، خبراء قطاع، ومتطوّعين يُؤمنون بريادة الأعمال في غزّة.
          راسلنا وقُل لنا كيف تُريد أن تُساهم.
        </p>
        <a
          href="mailto:island-haven@nastonas.org?subject=الانضمام%20لفريق%20آيلاند"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-[14px] hover:scale-[1.025] transition-transform"
        >
          <Mail className="w-4 h-4" />
          راسلنا
        </a>
      </div>
    </PageShell>
  );
}

function TeamCard({ m }: { m: TeamMember }) {
  const initials = m.fullName.trim().charAt(0) || "؟";
  return (
    <GlassCard className="h-full flex flex-col p-6 hover:border-primary/40 transition-colors">
      {m.featured && (
        <div className="inline-flex items-center gap-1.5 self-start mb-4 px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-bold bg-amber-400/10 text-amber-200 border border-amber-400/30">
          <Sparkles className="w-3 h-3" /> مميَّز
        </div>
      )}
      <div className="flex items-center gap-4 mb-4">
        {m.avatarUrl ? (
          <img
            src={m.avatarUrl}
            alt={m.fullName}
            className="w-16 h-16 rounded-2xl object-cover border border-white/10"
            loading="lazy"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 border border-white/10 flex items-center justify-center text-2xl font-bold text-white/80">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-white font-bold text-[16px] leading-snug truncate">
            {m.fullName}
          </h3>
          {m.role && (
            <p className="text-primary/90 text-[12.5px] font-medium leading-snug mt-0.5">
              {m.role}
            </p>
          )}
        </div>
      </div>

      {m.bio && (
        <p className="text-white/65 text-[13.5px] leading-[1.85] mb-5 flex-1">
          {m.bio}
        </p>
      )}

      {(m.linkedinUrl || m.websiteUrl || m.email) && (
        <div className="flex items-center flex-wrap gap-3 pt-3 border-t border-white/[0.06]">
          {m.linkedinUrl && (
            <a
              href={m.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="inline-flex items-center gap-1.5 text-[12px] text-white/65 hover:text-primary transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn
            </a>
          )}
          {m.websiteUrl && (
            <a
              href={m.websiteUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="الموقع"
              className="inline-flex items-center gap-1.5 text-[12px] text-white/65 hover:text-primary transition-colors"
            >
              <Globe className="w-3.5 h-3.5" /> الموقع
            </a>
          )}
          {m.email && (
            <a
              href={`mailto:${m.email}`}
              aria-label="البريد"
              className="inline-flex items-center gap-1.5 text-[12px] text-white/65 hover:text-primary transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span dir="ltr">{m.email}</span>
            </a>
          )}
        </div>
      )}
    </GlassCard>
  );
}
