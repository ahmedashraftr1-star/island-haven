import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Printer, Award } from "lucide-react";
import { PageShell, GlassCard, BackLink } from "@/components/shell/PageShell";
import { HavenMark } from "@/components/landing/HavenMark";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/labels";

interface CertificateData {
  course: { title: string };
  user: { fullName: string };
  completedAt: string | null;
}

export default function Certificate() {
  const { lang, dir, t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/certificate/:courseId");
  const courseId = params?.courseId;
  const [data, setData] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Certificates are per-member — send guests to login (returning here after),
  // matching the gate on Saved/Messages/Onboarding, instead of showing an error.
  useEffect(() => {
    if (!authLoading && !user)
      navigate(`/login?next=/certificate/${courseId ?? ""}`);
  }, [authLoading, user, courseId, navigate]);

  useEffect(() => {
    document.title =
      lang === "ar"
        ? "شهادة الإكمال — Island Haven"
        : "Certificate of Completion — Island Haven";
  }, [lang]);

  useEffect(() => {
    if (!courseId || !user) return; // wait for auth; guests are redirected above
    let cancelled = false;
    api<CertificateData>(`/me/certificate/${courseId}`)
      .then((r) => !cancelled && setData(r))
      .catch(
        (e) =>
          !cancelled &&
          setError(
            e instanceof ApiError
              ? e.message
              : t({ ar: "تعذّر تحميل الشهادة", en: "Couldn't load the certificate" }),
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [courseId, lang, user]);

  if (error && !data) {
    return (
      <PageShell active="learning">
        <BackLink
          href="/learning"
          label={t({ ar: "عودة للتعلّم", en: "Back to learning" })}
        />
        <GlassCard className="p-8 text-center text-destructive">{error}</GlassCard>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell active="learning">
        <div className="h-96 rounded-[28px] bg-white/[0.035] border border-border-strong animate-pulse" />
      </PageShell>
    );
  }

  return (
    <PageShell active="learning">
      {/* Print rules: hide the whole app shell, render only the certificate
          sheet on a clean white page. */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          #certificate-sheet, #certificate-sheet * { visibility: visible !important; }
          #certificate-sheet {
            position: fixed; inset: 0; margin: 0;
            width: 100%; box-shadow: none !important; border: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print">
        <BackLink
          href="/learning"
          label={t({ ar: "عودة للتعلّم", en: "Back to learning" })}
        />
      </div>

      {/* The printable sheet */}
      <div
        id="certificate-sheet"
        dir={dir}
        className="relative mx-auto max-w-3xl rounded-[28px] overflow-hidden bg-[#0B1020] border border-border-strong shadow-[0_40px_120px_-40px_rgba(0,0,0,0.7)] print:bg-white print:text-[#0B1020]"
        style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
        data-testid="certificate-sheet"
      >
        {/* Decorative aura (screen only) */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none print:hidden"
          style={{
            background:
              "radial-gradient(70% 50% at 50% 0%, rgba(220,38,55,0.18) 0%, transparent 60%)",
          }}
        />

        <div className="relative px-8 sm:px-14 py-12 sm:py-16 text-center">
          {/* Brand */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <HavenMark size={40} strokeColor="hsl(354 80% 60%)" />
            <div className="text-right leading-tight">
              <div className="text-[16px] font-bold tracking-tight text-foreground print:text-[#0B1020]">
                Island Haven
              </div>
              <div className="text-[11px] tracking-[0.18em] uppercase text-fg-faint print:text-[#0B1020]/55">
                آيلاند هيفن
              </div>
            </div>
          </div>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 border border-primary/40 mb-6 print:bg-primary/10">
            <Award className="w-8 h-8 text-primary" />
          </div>

          <div className="text-[11px] tracking-[0.3em] uppercase text-primary font-bold mb-3">
            {t({ ar: "شهادة إكمال", en: "Certificate of Completion" })}
          </div>

          <p className="text-muted-foreground text-[14px] mb-2 print:text-[#0B1020]/60">
            {t({
              ar: "تشهد آيلاند هيفن بأنّ",
              en: "Island Haven hereby certifies that",
            })}
          </p>

          <h1
            className="font-bold text-foreground leading-tight mb-4 print:text-[#0B1020]"
            style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)" }}
            data-testid="certificate-name"
          >
            {data.user.fullName}
          </h1>

          <p className="text-muted-foreground text-[14px] mb-2 print:text-[#0B1020]/60">
            {t({ ar: "قد أكمل بنجاح", en: "has successfully completed" })}
          </p>

          <h2
            className="font-bold text-foreground leading-snug mb-7 print:text-primary"
            style={{ fontSize: "clamp(1.2rem, 3.5vw, 1.7rem)" }}
            data-testid="certificate-course"
          >
            {data.course.title}
          </h2>

          <div className="h-px w-40 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent mb-7 print:via-[#0B1020]/20" />

          <p className="text-muted-foreground text-[13.5px] print:text-[#0B1020]/65">
            {t({ ar: "بتاريخ", en: "on" })}{" "}
            <span className="text-foreground font-semibold print:text-[#0B1020]">
              {formatDate(data.completedAt, lang) || "—"}
            </span>
          </p>

          <p className="text-muted-foreground text-[11px] tracking-[0.16em] uppercase mt-8 print:text-[#0B1020]/70">
            {t({
              ar: "Island Haven · حاضنة أعمال في غزّة",
              en: "Island Haven · A business incubator in Gaza",
            })}
          </p>
        </div>
      </div>

      {/* Print action (screen only) */}
      <div className="no-print mt-7 flex justify-center">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-white font-bold text-[15px] hover:-translate-y-px hover:shadow-[0_18px_40px_-12px_rgba(220,38,55,0.55)] transition-all"
          data-testid="button-print"
        >
          <Printer className="w-4 h-4" />
          {t({ ar: "اطبع الشهادة", en: "Print certificate" })}
        </button>
      </div>
    </PageShell>
  );
}
