import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  ShieldCheck,
  KeyRound,
  Link2,
  FileCheck2,
  Hash,
  Copy,
  Check,
  X,
  Loader2,
  ChevronDown,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { PageShell, GlassCard } from "@/components/shell/PageShell";
import { Reveal } from "@/components/landing/Reveal";
import { useLanguage } from "@/contexts/LanguageContext";
import { Btn } from "@/components/ui/Btn";
import { useAttestationLatest, useAttestationChain } from "@/hooks/use-public-data";
import {
  verifyAttestation,
  verifyChain,
  canonicalize,
  type VerifyResult,
  type ChainResult,
  type PublicAttestation,
  type PublicKey,
} from "@/lib/attest-verify";

// Bilingual labels for each sealed number, in a stable display order.
const NUMBER_LABELS: Array<{ key: string; ar: string; en: string }> = [
  { key: "members", ar: "منتسب في المجتمع", en: "Community members" },
  { key: "freelancers", ar: "مستقلّ", en: "Freelancers" },
  { key: "graduates", ar: "خرّيج", en: "Graduates" },
  { key: "students", ar: "طالب جامعيّ", en: "Students" },
  { key: "experts", ar: "خبير", en: "Experts" },
  { key: "works", ar: "عمل منشور", en: "Published works" },
  { key: "ventures", ar: "مشروع ناشئ", en: "Ventures" },
  { key: "team", ar: "عضو في الفريق", en: "Team members" },
  { key: "courses", ar: "دورة", en: "Courses" },
  { key: "enrollments", ar: "تسجيل", en: "Enrollments" },
  { key: "bookings", ar: "حجز", en: "Bookings" },
  { key: "seatsHosted", ar: "مقعد استُضيف", en: "Seats hosted" },
  { key: "applications", ar: "طلب انتساب", en: "Applications" },
  { key: "events", ar: "فعاليّة", en: "Events" },
];

export default function Verify() {
  const { lang, t } = useLanguage();
  const { data: latest, isLoading, isError, isFetching, refetch } = useAttestationLatest();
  const { data: chain } = useAttestationChain(50);

  const [result, setResult] = useState<VerifyResult | null>(null);
  const [chainResult, setChainResult] = useState<ChainResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [ran, setRan] = useState(false);

  const attestation = latest?.attestation;
  const publicKey = latest?.publicKey;

  const fmt = (v: number) => v.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  // Run the real, in-browser verification. Nothing here trusts the server — it
  // re-hashes the sealed body and checks the Ed25519 signature against the
  // published key. A brief delay lets the visitor SEE it happen (skipped when the
  // OS asks for reduced motion via the CSS killswitch — the checks are instant).
  async function runVerify() {
    if (!attestation || !publicKey) return;
    setVerifying(true);
    setResult(null);
    setChainResult(null);
    const [r] = await Promise.all([
      verifyAttestation(attestation, [publicKey]),
      new Promise((res) => setTimeout(res, 480)),
    ]);
    setResult(r);
    if (chain) setChainResult(await verifyChain(chain.attestations, [chain.publicKey]));
    setVerifying(false);
    setRan(true);
  }

  // Auto-verify once the data is here, so a visitor who never clicks still sees
  // the proof — but the button below lets them re-run and watch it.
  useEffect(() => {
    if (attestation && publicKey && !ran && !verifying) void runVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attestation, publicKey]);

  // Verify the chain independently when it arrives (it may load after the latest
  // attestation, so the timeline populates even if the first auto-verify raced it).
  useEffect(() => {
    if (chain) void verifyChain(chain.attestations, [chain.publicKey]).then(setChainResult);
  }, [chain]);

  const heroAside = (
    <PublicKeyCard publicKey={publicKey} lang={lang} t={t} />
  );

  return (
    <PageShell
      eyebrow={t({ ar: "كل رقمٍ موقَّع رقميًّا", en: "Every number, cryptographically signed" })}
      title={t({ ar: "لا تثق بنا —", en: "Don't trust us —" })}
      highlight={t({ ar: "تحقّق منّا.", en: "verify us." })}
      highlightClassName="text-sand-bright"
      subtitle={t({
        ar: "أرقامنا ليست وعودًا على شاشة. كلّ رقمٍ نعرضه مختومٌ بتوقيعٍ تشفيريّ (Ed25519)، ويتحقّق متصفّحُك منه بنفسه — من غير أن يثق بخادمنا. النتيجة رياضيّاتٌ حسبتَها أنت، لا ادّعاءً قلناه نحن.",
        en: "Our numbers aren't promises on a screen. Every figure we publish is sealed with a cryptographic signature (Ed25519), and your own browser verifies it — without trusting our server. A pass is math you computed, not a claim we made.",
      })}
      heroAside={heroAside}
      maxWidth="max-w-6xl"
    >
      {isError && (
        <GlassCard className="p-8 text-center">
          <div className="text-foreground font-semibold">
            {t({ ar: "تعذّر تحميل الختم الآن.", en: "Couldn't load the attestation right now." })}
          </div>
          <div className="mt-2 text-[13.5px] text-muted-foreground">
            {t({ ar: "قد يكون اتّصالك أو خادمنا متوقّفًا لحظيًّا — أعد المحاولة.", en: "Your connection or our server may be momentarily down — try again." })}
          </div>
          <Btn
            type="button"
            variant="primary"
            size="md"
            onClick={() => void refetch()}
            disabled={isFetching}
            data-testid="verify-retry"
            className="mt-5 disabled:cursor-wait"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden />
            {isFetching
              ? t({ ar: "…إعادة المحاولة", en: "Retrying…" })
              : t({ ar: "أعد المحاولة", en: "Try again" })}
          </Btn>
        </GlassCard>
      )}

      {(isLoading || (!attestation && !isError)) && (
        <div className="animate-pulse space-y-4">
          <div className="h-28 rounded-[24px] bg-surface-2 border border-border-strong" />
          <div className="h-64 rounded-[24px] bg-surface-2 border border-border-strong" />
        </div>
      )}

      {attestation && publicKey && (
        <div className="space-y-[clamp(1.5rem,3vw,2.5rem)]">
          {/* ── The verdict — the emotional centre. ─────────────────────────── */}
          <VerdictCard
            result={result}
            verifying={verifying}
            onRerun={runVerify}
            sealedAt={attestation.payload.issuedAt}
            fmtTime={fmtTime}
            lang={lang}
            t={t}
          />

          {/* ── The sealed numbers ──────────────────────────────────────────── */}
          <section aria-label={t({ ar: "الأرقام الموقّعة", en: "The signed numbers" })}>
            <SectionHeading
              icon={<FileCheck2 className="h-4 w-4" />}
              title={t({ ar: "الأرقام الموقّعة", en: "The signed numbers" })}
              hint={t({
                ar: "توقيعٌ واحد يختم هذه الأرقام معًا — تغييرُ أيّ رقمٍ يكسر التوقيع.",
                en: "One signature seals these numbers together — altering any one breaks it.",
              })}
            />
            <div className="grid grid-cols-1 gap-[clamp(0.75rem,1.5vw,1rem)] sm:grid-cols-2 lg:grid-cols-3">
              {NUMBER_LABELS.filter((l) => l.key in attestation.payload.numbers).map((l, i) => (
                <Reveal key={l.key} index={i % 6}>
                  <NumberTile
                    label={t({ ar: l.ar, en: l.en })}
                    value={fmt(attestation.payload.numbers[l.key])}
                    verified={result?.valid === true}
                  />
                </Reveal>
              ))}
            </div>
          </section>

          {/* ── See the math — the transparent proof ────────────────────────── */}
          <TheMath
            attestation={attestation}
            publicKey={publicKey}
            result={result}
            lang={lang}
            t={t}
          />

          {/* ── The tamper-evident chain ────────────────────────────────────── */}
          {chain && chain.attestations.length > 0 && (
            <section aria-label={t({ ar: "السلسلة", en: "The chain" })}>
              <SectionHeading
                icon={<Link2 className="h-4 w-4" />}
                title={t({ ar: "السلسلة المتينة", en: "The tamper-evident chain" })}
                hint={t({
                  ar: "كلّ ختمٍ يشير إلى الذي قبله. حذفُ أو تعديلُ أيّ حلقةٍ يكسر السلسلة كلّها.",
                  en: "Each seal points to the one before it. Removing or editing any link breaks the whole chain.",
                })}
              />
              <ChainTimeline
                attestations={chain.attestations}
                chainResult={chainResult}
                fmt={fmt}
                fmtTime={fmtTime}
                lang={lang}
                t={t}
              />
            </section>
          )}

          {/* ── How it works + verify-it-yourself ───────────────────────────── */}
          <HowItWorks publicKey={publicKey} t={t} lang={lang} />
        </div>
      )}
    </PageShell>
  );
}

// ── The verdict card ─────────────────────────────────────────────────────────
function VerdictCard({
  result,
  verifying,
  onRerun,
  sealedAt,
  fmtTime,
  lang,
  t,
}: {
  result: VerifyResult | null;
  verifying: boolean;
  onRerun: () => void;
  sealedAt: string;
  fmtTime: (iso: string) => string;
  lang: string;
  t: (v: { ar: string; en: string }) => string;
}) {
  const valid = result?.valid === true;
  const failed = result != null && !result.valid;

  const checks = [
    { ok: result?.hashOk, label: t({ ar: "الهاش يطابق", en: "Hash matches" }) },
    { ok: result?.sigOk, label: t({ ar: "التوقيع صحيح", en: "Signature valid" }) },
    { ok: result?.keyOk, label: t({ ar: "المفتاح منشور", en: "Key published" }) },
  ];

  return (
    <GlassCard className="p-[clamp(1.5rem,3vw,2.5rem)]" testId="verify-verdict">
      <div className="glass-ambient pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span
            className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${
              valid
                ? "border-sand/40 bg-sand/10 text-sand-bright"
                : failed
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border-strong bg-surface-3 text-muted-foreground"
            }`}
            aria-hidden
          >
            {verifying ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : valid ? (
              <BadgeCheck className="h-7 w-7" />
            ) : failed ? (
              <X className="h-7 w-7" />
            ) : (
              <ShieldCheck className="h-7 w-7" />
            )}
          </span>
          <div>
            <div
              className="font-display text-[clamp(1.35rem,2.6vw,1.9rem)] font-black leading-tight text-foreground"
              aria-live="polite"
            >
              {verifying
                ? t({ ar: "…يتحقّق متصفّحُك", en: "Your browser is verifying…" })
                : valid
                  ? t({ ar: "موقّعٌ — والتوقيعُ صحيح", en: "Signed — and the signature checks out" })
                  : failed
                    ? t({ ar: "لم يجتَز التحقّق", en: "This didn't verify" })
                    : t({ ar: "جاهزٌ للتحقّق", en: "Ready to verify" })}
            </div>
            <div className="mt-1 text-[13.5px] text-muted-foreground">
              {valid
                ? t({
                    ar: "تحقّقتَ من هذا في متصفّحك أنت — لا نحن.",
                    en: "You verified this in your own browser — not us.",
                  })
                : failed
                  ? result?.reason ?? t({ ar: "تعذّر التحقّق.", en: "Verification failed." })
                  : t({ ar: "اضغط للتحقّق بنفسك.", en: "Press to verify it yourself." })}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
          <button
            type="button"
            onClick={onRerun}
            disabled={verifying}
            className="cta-fill inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-bold disabled:opacity-60"
            data-testid="verify-run"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            {t({ ar: "تحقّق الآن", en: "Verify now" })}
          </button>
          {result?.method && valid && (
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-muted-foreground" dir="ltr">
              <Cpu className="h-3.5 w-3.5" aria-hidden />
              {result.method === "webcrypto"
                ? t({ ar: "عبر WebCrypto (أصيل)", en: "via WebCrypto (native)" })
                : t({ ar: "عبر مُتحقِّقٍ مُضمَّن", en: "via bundled verifier" })}
            </span>
          )}
        </div>
      </div>

      {/* The three checks */}
      <div className="relative mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {checks.map((c, i) => (
          <div
            key={i}
            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-semibold ${
              c.ok
                ? "border-sand/30 bg-sand/[0.06] text-foreground"
                : "border-border-strong bg-surface-3/60 text-muted-foreground"
            }`}
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                c.ok ? "bg-sand/20 text-sand-bright" : "bg-surface-3 text-muted-foreground"
              }`}
              aria-hidden
            >
              {c.ok ? <Check className="h-3 w-3" /> : <span className="h-1 w-1 rounded-full bg-current" />}
            </span>
            {c.label}
          </div>
        ))}
      </div>

      <div className="relative mt-4 text-[12px] text-muted-foreground">
        {t({ ar: "خُتِم في", en: "Sealed" })} · <span dir="ltr" className="tnum">{fmtTime(sealedAt)}</span>
      </div>
    </GlassCard>
  );
}

// ── A single sealed-number tile ──────────────────────────────────────────────
function NumberTile({
  label,
  value,
  verified,
}: {
  label: string;
  value: string;
  verified: boolean;
}) {
  return (
    <div className="glass-panel flex items-center justify-between gap-4 rounded-2xl px-5 py-4">
      <div className="min-w-0">
        <div className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-black leading-none text-sand-bright tnum">
          {value}
        </div>
        <div className="mt-1.5 truncate text-[13px] font-semibold text-foreground/85">{label}</div>
      </div>
      <span
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
          verified
            ? "border-sand/40 bg-sand/10 text-sand-bright"
            : "border-border-strong bg-surface-3 text-muted-foreground/60"
        }`}
        aria-hidden
        title={verified ? "signed" : undefined}
      >
        <BadgeCheck className="h-4 w-4" />
      </span>
    </div>
  );
}

// ── The public-key fingerprint card (hero aside) ─────────────────────────────
function PublicKeyCard({
  publicKey,
  lang,
  t,
}: {
  publicKey?: PublicKey;
  lang: string;
  t: (v: { ar: string; en: string }) => string;
}) {
  const fp = publicKey?.publicKeyHex ?? "";
  const short = fp ? `${fp.slice(0, 8)}…${fp.slice(-8)}` : "—";
  return (
    <div className="rounded-[18px] border border-border-strong bg-surface-2/50 p-6">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground rtl:tracking-normal">
        <KeyRound className="h-3.5 w-3.5 text-sand-bright" aria-hidden />
        {t({ ar: "مفتاح التوقيع العامّ", en: "Public signing key" })}
      </div>
      <div dir="ltr" className="font-mono text-[15px] font-bold text-sand-bright tnum text-left break-all">
        {short}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        {t({ ar: "المفتاح نشِط · Ed25519", en: "Key active · Ed25519" })}
      </div>
    </div>
  );
}

// ── "See the math" — the transparent, expandable proof ───────────────────────
function TheMath({
  attestation,
  publicKey,
  result,
  lang,
  t,
}: {
  attestation: PublicAttestation;
  publicKey: PublicKey;
  result: VerifyResult | null;
  lang: string;
  t: (v: { ar: string; en: string }) => string;
}) {
  const [open, setOpen] = useState(false);
  const canonical = useMemo(() => canonicalize(attestation.payload), [attestation.payload]);

  return (
    <GlassCard className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-[clamp(1.25rem,2.5vw,2rem)] py-5 text-start"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <Hash className="h-4 w-4 text-sand-bright" aria-hidden />
          <span className="text-[15px] font-bold text-foreground">
            {t({ ar: "شاهد الرياضيّات", en: "See the math" })}
          </span>
          <span className="text-[12.5px] text-muted-foreground">
            {t({ ar: "الحمولة والهاش والتوقيع", en: "Payload, hash & signature" })}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="border-t border-border-strong px-[clamp(1.25rem,2.5vw,2rem)] py-6 space-y-5">
          <CodeRow
            label={t({ ar: "١ · الحمولة القانونيّة (ما وقّعناه)", en: "1 · Canonical payload (what we signed)" })}
            value={canonical}
            copyLabel={t({ ar: "نسخ", en: "Copy" })}
          />
          <div className="grid gap-5 md:grid-cols-2">
            <CodeRow
              label={t({ ar: "٢ · الهاش المُعاد حسابُه في متصفّحك", en: "2 · Hash recomputed in your browser" })}
              value={result?.recomputedHash || "…"}
              match={result ? result.hashOk : undefined}
              matchLabel={t({ ar: "يطابق الهاش المُقدَّم", en: "matches the served hash" })}
              copyLabel={t({ ar: "نسخ", en: "Copy" })}
            />
            <CodeRow
              label={t({ ar: "الهاش المُقدَّم من الخادم", en: "Hash served by the server" })}
              value={attestation.hash}
              copyLabel={t({ ar: "نسخ", en: "Copy" })}
            />
          </div>
          <CodeRow
            label={t({ ar: "٣ · التوقيع (Ed25519)", en: "3 · Signature (Ed25519)" })}
            value={attestation.signature}
            copyLabel={t({ ar: "نسخ", en: "Copy" })}
          />
          <CodeRow
            label={t({ ar: "٤ · المفتاح العامّ المنشور", en: "4 · The published public key" })}
            value={publicKey.publicKeyHex}
            copyLabel={t({ ar: "نسخ", en: "Copy" })}
          />
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            {t({
              ar: "متصفّحك يعيد حساب الهاش من الحمولة، يقارنه بالهاش المُقدَّم، ثمّ يتحقّق من أنّ التوقيع أُنتِج بالمفتاح الخاصّ المقابل لهذا المفتاح العامّ — بلا أيّ ثقةٍ بنا.",
              en: "Your browser re-hashes the payload, compares it to the served hash, then checks that the signature was produced by the private key matching this public key — trusting nothing from us.",
            })}
          </p>
        </div>
      )}
    </GlassCard>
  );
}

function CodeRow({
  label,
  value,
  match,
  matchLabel,
  copyLabel,
}: {
  label: string;
  value: string;
  match?: boolean;
  matchLabel?: string;
  copyLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold text-foreground/80">{label}</span>
        {match !== undefined && (
          <span
            className={`inline-flex items-center gap-1 text-[11.5px] font-bold ${
              match ? "text-sand-bright" : "text-primary"
            }`}
          >
            {match ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {matchLabel}
          </span>
        )}
      </div>
      <div className="relative">
        <pre
          dir="ltr"
          className="max-h-40 overflow-auto rounded-xl border border-border-strong bg-[#0a0a0c]/70 p-3.5 pe-11 text-left font-mono text-[12px] leading-relaxed text-foreground/80 break-all whitespace-pre-wrap"
        >
          {value}
        </pre>
        <button
          type="button"
          onClick={copy}
          className="absolute end-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border-strong bg-surface-2 text-muted-foreground hover:text-foreground"
          aria-label={copyLabel}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-sand-bright" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ── The chain timeline ───────────────────────────────────────────────────────
function ChainTimeline({
  attestations,
  chainResult,
  fmt,
  fmtTime,
  lang,
  t,
}: {
  attestations: PublicAttestation[];
  chainResult: ChainResult | null;
  fmt: (v: number) => string;
  fmtTime: (iso: string) => string;
  lang: string;
  t: (v: { ar: string; en: string }) => string;
}) {
  const linksOk = chainResult?.linksOk;
  return (
    <GlassCard className="p-[clamp(1.25rem,2.5vw,2rem)]">
      <div className="mb-5 flex items-center gap-2 text-[13px] font-semibold">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${
            linksOk
              ? "border-sand/30 bg-sand/[0.06] text-sand-bright"
              : linksOk === false
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border-strong bg-surface-3 text-muted-foreground"
          }`}
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          {linksOk
            ? t({ ar: "روابط السلسلة سليمة", en: "Chain links intact" })
            : linksOk === false
              ? t({ ar: "رابطٌ مكسور", en: "Broken link" })
              : t({ ar: "…يفحص السلسلة", en: "Checking chain…" })}
        </span>
        <span className="text-[12.5px] text-muted-foreground">
          {t({ ar: `${fmt(attestations.length)} ختمًا`, en: `${attestations.length} seals` })}
        </span>
      </div>

      <ol className="relative space-y-0">
        {/* the gold spine */}
        <span
          aria-hidden
          className="absolute bottom-4 top-4 w-px bg-gradient-to-b from-sand/60 via-sand/25 to-transparent start-[7px]"
        />
        {attestations.map((a) => {
          const item = chainResult?.items.find((it) => it.seq === a.seq);
          const ok = item?.valid;
          return (
            <li key={a.seq} className="relative flex gap-4 py-3 ps-0">
              <span
                className={`relative z-10 mt-1 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
                  ok
                    ? "border-sand-bright bg-sand-bright/30"
                    : ok === false
                      ? "border-primary bg-primary/30"
                      : "border-border-strong bg-surface-3"
                }`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-[13.5px] font-bold text-foreground">
                    {t({ ar: "الختم", en: "Seal" })} #{fmt(a.seq)}
                  </span>
                  <span dir="ltr" className="text-[12px] text-muted-foreground tnum">
                    {fmtTime(a.payload.issuedAt)}
                  </span>
                </div>
                <div dir="ltr" className="mt-1 truncate text-left font-mono text-[11.5px] text-muted-foreground">
                  {a.hash.slice(0, 24)}…
                </div>
              </div>
              <span
                className={`mt-0.5 inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-bold ${
                  ok
                    ? "text-sand-bright"
                    : ok === false
                      ? "text-primary"
                      : "text-muted-foreground"
                }`}
              >
                {ok ? <Check className="h-3.5 w-3.5" /> : ok === false ? <X className="h-3.5 w-3.5" /> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </GlassCard>
  );
}

// ── How it works + verify-it-yourself ────────────────────────────────────────
function HowItWorks({
  publicKey,
  t,
  lang,
}: {
  publicKey: PublicKey;
  t: (v: { ar: string; en: string }) => string;
  lang: string;
}) {
  const steps = [
    {
      icon: <FileCheck2 className="h-5 w-5" />,
      title: t({ ar: "نختم الأرقام", en: "We seal the numbers" }),
      body: t({
        ar: "كلّما تغيّرت أرقامنا الحقيقيّة، نوقّعها بمفتاحٍ خاصّ (Ed25519) ونربط الختم بالذي قبله.",
        en: "Whenever our real numbers change, we sign them with a private key (Ed25519) and link the seal to the previous one.",
      }),
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: t({ ar: "يتحقّق متصفّحك", en: "Your browser verifies" }),
      body: t({
        ar: "يعيد متصفّحك حساب الهاش ويتحقّق من التوقيع مقابل مفتاحنا العامّ المنشور — محليًّا، بلا خادم.",
        en: "Your browser recomputes the hash and checks the signature against our published public key — locally, no server.",
      }),
    },
    {
      icon: <Link2 className="h-5 w-5" />,
      title: t({ ar: "لا يمكن تزوير الماضي", en: "The past can't be forged" }),
      body: t({
        ar: "كلّ ختمٍ يشير إلى سابقه، فلا يمكن تغيير رقمٍ قديمٍ دون كسر السلسلة كلّها بشكلٍ ظاهر.",
        en: "Each seal references the one before it, so an old number can't be changed without visibly breaking the whole chain.",
      }),
    },
  ];
  return (
    <section aria-label={t({ ar: "كيف يعمل", en: "How it works" })} className="space-y-[clamp(1rem,2vw,1.5rem)]">
      <SectionHeading
        icon={<ShieldCheck className="h-4 w-4" />}
        title={t({ ar: "كيف يعمل هذا", en: "How this works" })}
      />
      <div className="grid grid-cols-1 gap-[clamp(0.75rem,1.5vw,1rem)] md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={i} index={i}>
            <div className="glass-panel h-full rounded-2xl p-6">
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary" aria-hidden>
                {s.icon}
              </span>
              <div className="text-[15px] font-bold text-foreground">{s.title}</div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <GlassCard className="p-[clamp(1.25rem,2.5vw,2rem)]">
        <div className="flex items-center gap-2 text-[13px] font-bold text-foreground">
          <KeyRound className="h-4 w-4 text-sand-bright" aria-hidden />
          {t({ ar: "تحقّق بنفسك", en: "Verify it yourself" })}
        </div>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
          {t({
            ar: "لا يوجد ما يدعوك لتصديقنا. مفتاحنا العامّ منشورٌ في هذا العنوان، ويمكنك التحقّق من أيّ ختمٍ بأيّ مكتبة Ed25519:",
            en: "There's nothing here you have to take on faith. Our public key is published at this address, and you can verify any seal with any Ed25519 library:",
          })}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <MiniCode label="GET" value="/.well-known/ih-pubkey" />
          <MiniCode label="GET" value="/api/attestations/latest" />
        </div>
      </GlassCard>
    </section>
  );
}

function MiniCode({ label, value }: { label: string; value: string }) {
  return (
    <div dir="ltr" className="flex items-center gap-2 rounded-xl border border-border-strong bg-[#0a0a0c]/70 px-3.5 py-2.5 text-left">
      <span className="rounded-md bg-sand/15 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-sand-bright">{label}</span>
      <span className="truncate font-mono text-[12.5px] text-foreground/80">{value}</span>
    </div>
  );
}

// ── Small shared section heading ─────────────────────────────────────────────
function SectionHeading({
  icon,
  title,
  hint,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border-strong bg-surface-2 text-sand-bright" aria-hidden>
          {icon}
        </span>
        <h2 className="font-display text-[clamp(1.15rem,2vw,1.5rem)] font-black text-foreground">{title}</h2>
      </div>
      {hint && <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}
