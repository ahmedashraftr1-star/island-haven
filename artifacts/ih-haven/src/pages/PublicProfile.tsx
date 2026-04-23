import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { Phone, Globe, ExternalLink } from "lucide-react";
import { PageShell, GlassCard, BackLink, EmptyState } from "@/components/shell/PageShell";
import { api, ApiError } from "@/lib/api";
import { ROLE_LABELS, type UserRole } from "@/lib/auth";
import { splitTags } from "@/lib/labels";

interface Resp {
  user: {
    id: number;
    fullName: string;
    role: UserRole;
    avatarUrl: string | null;
    bio: string;
    skills: string;
    portfolioUrl: string;
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
}

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

  useEffect(() => {
    if (data?.user?.fullName) {
      document.title = `${data.user.fullName} — آيلاند هيفن`;
    }
  }, [data?.user?.fullName]);

  if (error && !data) {
    return (
      <PageShell>
        <BackLink href="/works" label="عودة" />
        <GlassCard className="p-8 text-center text-red-200">{error}</GlassCard>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell>
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-white/10 animate-pulse" />
      </PageShell>
    );
  }

  const u = data.user;
  const initials = u.fullName.split(/\s+/).slice(0, 2).map((p) => p[0]).join("");
  const skills = splitTags(u.skills);

  return (
    <PageShell maxWidth="max-w-5xl">
      <BackLink href="/works" label="معرض المجتمع" />
      <GlassCard className="p-6 sm:p-10 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/40 flex items-center justify-center text-[28px] font-bold text-white shadow-[0_10px_40px_-12px_rgba(220,38,55,0.55)]">
            {initials || "·"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] tracking-[0.22em] uppercase text-primary font-bold mb-2">
              {ROLE_LABELS[u.role]}
            </div>
            <h1
              className="font-bold text-white leading-tight mb-3"
              style={{ fontSize: "clamp(1.7rem, 4.5vw, 2.4rem)" }}
              data-testid="text-public-profile-name"
            >
              {u.fullName}
            </h1>
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
            {u.portfolioUrl && (
              <a
                href={u.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/15 text-white text-[12.5px] font-semibold hover:bg-white/[0.1] transition-colors"
              >
                <Globe className="w-3.5 h-3.5" /> الموقع
              </a>
            )}
          </div>
        </div>
      </GlassCard>

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
