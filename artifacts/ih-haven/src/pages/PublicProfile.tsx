import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/use-meta";
import { Link, useRoute } from "wouter";
import {
  Phone,
  Globe,
  Linkedin,
  Github,
  Briefcase,
  ExternalLink,
  Award,
} from "lucide-react";
import { PageShell, GlassCard, BackLink, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { ROLE_LABELS, type ExtraLink, type UserRole } from "@/lib/auth";
import { splitTags } from "@/lib/labels";

interface Resp {
  user: {
    id: number;
    fullName: string;
    role: UserRole;
    avatarUrl: string | null;
    bio: string;
    jobTitle: string;
    skills: string;
    portfolioUrl: string;
    linkedinUrl: string;
    behanceUrl: string;
    githubUrl: string;
    otherLinks: ExtraLink[];
    phone: string;
    createdAt: string;
  };
  works: Array<{
    id: number;
    title: string;
    summary: string;
    coverUrl: string | null;
    tags: string;
  }>;
  badges?: Array<{
    id: number;
    key: string;
    name: string;
    description: string;
    icon: string;
    color: string;
  }>;
}

const BehanceMark = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
    className={className}
  >
    <path d="M22 7h-7V5.5h7V7Zm1.7 10.7H14V6.4h9.5c4.6 0 4.6 5.7 1.5 6.4 3.7.7 3.4 5-1.3 4.9Zm-5.5-9.3v2.8h4.6c1.5 0 1.7-2.8 0-2.8h-4.6Zm0 4.6v3h4.7c1.8 0 2.1-3 0-3h-4.7ZM10.4 9.2c0-2.5-1.7-3.7-4.6-3.7H0v13h6.1c3 0 4.7-1.5 4.7-4 0-1.7-.7-2.9-2.4-3.4 1.4-.6 2-1.5 2-2Zm-7.6-.7H6c2.3 0 2.4 2.5 0 2.5H2.8V8.5Zm3.4 7.5H2.8v-3h3.5c2.6 0 2.6 3 0 3Z" />
  </svg>
);

export default function PublicProfile() {
  const [, params] = useRoute("/u/:id");
  const id = params?.id;
  const [data, setData] = useState<Resp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<Resp>(`/users/${id}`)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "تعذّر التحميل"));
  }, [id]);

  usePageMeta({
    title: data?.user.fullName,
    description: data?.user.bio || undefined,
    image: data?.user.avatarUrl || undefined,
    type: "profile",
  });

  if (error && !data) {
    return (
      <PageShell active="members">
        <BackLink href="/members" label="عودة للمنتسبين" />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell active="members">
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  const u = data.user;
  const initials = u.fullName.split(/\s+/).slice(0, 2).map((p) => p[0]).join("");
  const skills = splitTags(u.skills);
  const otherLinks = Array.isArray(u.otherLinks) ? u.otherLinks : [];

  const externalLinks: Array<{ label: string; url: string; Icon: React.ComponentType<{ className?: string }> }> = [];
  if (u.linkedinUrl) externalLinks.push({ label: "LinkedIn", url: u.linkedinUrl, Icon: Linkedin });
  if (u.behanceUrl) externalLinks.push({ label: "Behance", url: u.behanceUrl, Icon: BehanceMark });
  if (u.githubUrl) externalLinks.push({ label: "GitHub", url: u.githubUrl, Icon: Github });
  if (u.portfolioUrl) externalLinks.push({ label: "الموقع", url: u.portfolioUrl, Icon: Globe });

  return (
    <PageShell active="members" maxWidth="max-w-5xl">
      <BackLink href="/members" label="كلّ المنتسبين" />
      <GlassCard className="p-6 sm:p-10 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/40 flex items-center justify-center text-[28px] font-bold text-white shadow-[0_10px_40px_-12px_rgba(220,38,55,0.55)] shrink-0">
            {u.avatarUrl ? (
              <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
            ) : (
              initials || "·"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-2">
              {ROLE_LABELS[u.role]}
            </div>
            <h1
              className="font-bold text-white leading-tight mb-2"
              style={{ fontSize: "clamp(1.7rem, 4.5vw, 2.4rem)" }}
              data-testid="text-public-profile-name"
            >
              {u.fullName}
            </h1>
            {u.jobTitle && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-white/80 text-[13px] mb-4">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                {u.jobTitle}
              </div>
            )}
            {u.bio && (
              <p className="text-white/65 text-[14.5px] leading-[1.95] mb-4 whitespace-pre-wrap">
                {u.bio}
              </p>
            )}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11.5px] font-semibold border border-primary/30"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex sm:flex-col gap-2 shrink-0">
            {u.phone && (
              <a
                href={`https://wa.me/${u.phone.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-[12.5px] font-semibold hover:bg-emerald-500/15 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> واتساب
              </a>
            )}
          </div>
        </div>

        {(externalLinks.length > 0 || otherLinks.length > 0) && (
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-2">
            {externalLinks.map(({ label, url, Icon }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-white text-[12px] font-semibold hover:bg-white/[0.1] transition-colors"
                data-testid={`link-${label.toLowerCase()}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </a>
            ))}
            {otherLinks.map((l, i) => (
              <a
                key={`${l.url}-${i}`}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/85 text-[12px] font-semibold hover:bg-white/[0.08] transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {l.label}
              </a>
            ))}
          </div>
        )}
      </GlassCard>

      {data.badges && data.badges.length > 0 && (
        <div className="mb-6">
          <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-3">
            الإنجازات — {data.badges.length}
          </div>
          <div className="flex flex-wrap gap-2">
            {data.badges.map((b) => (
              <span
                key={b.id}
                title={b.description || b.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/10 text-amber-200 border border-amber-400/30 text-[12.5px] font-semibold"
                data-testid={`badge-${b.key}`}
              >
                <Award className="w-3.5 h-3.5" />
                {b.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-4">
        الأعمال — {data.works.length}
      </div>

      {data.works.length === 0 ? (
        <EmptyState title="لا توجد أعمال منشورة بعد" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.works.map((w) => (
            <Link
              key={w.id}
              href={`/works/${w.id}`}
              className="group block"
              data-testid={`profile-work-${w.id}`}
            >
              <GlassCard className="h-full hover:border-primary/40 transition-colors">
                {w.coverUrl ? (
                  <div className="aspect-[16/10] overflow-hidden bg-black/30">
                    <img
                      src={w.coverUrl}
                      alt={w.title}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary/20 to-transparent" />
                )}
                <div className="p-4">
                  <h3 className="text-white font-bold text-[14.5px] leading-snug line-clamp-2">
                    {w.title}
                  </h3>
                  {w.summary && (
                    <p className="text-white/55 text-[12.5px] mt-1 line-clamp-2">
                      {w.summary}
                    </p>
                  )}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
