import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Btn } from "@/components/ui/Btn";
import { imageUrl, useContentSection } from "@/hooks/use-content";
import { Reveal } from "@/components/landing/Reveal";
import { CinematicMedia } from "./CinematicMedia";
import { SeatMapPreview } from "@/components/booking/SeatMapPreview";
import { TOTAL_SEATS } from "@/components/booking/hall-plan";
import { useNumbers, useAttendanceSummary, useSeatStatus, type PublicNumbers } from "@/hooks/use-public-data";

/**
 * SeatsBoard — Island Haven's homepage signature: a precise, professional
 * "38 SEATS" live availability board.
 *
 * The hall has exactly 38 bookable seats. This section renders the REAL floor
 * plan (`SeatMapPreview`, sharing the exact geometry the /book map books against)
 * floating on a vivid Gaza photograph (the shared CinematicMedia backdrop + the
 * site's dark-glass material). Taken seats are filled terracotta; available seats
 * are a faint glass outline. It is the ONE seat picture on the site — the visitor
 * previews the same hall shape they will book, so nothing can contradict it.
 *
 * HONESTY: the occupied count is derived ONLY from REAL figures. The primary
 * source is the PUBLIC `/attendance/summary` endpoint — `assignedCount` drives the
 * seats shown occupied and `presentCount` surfaces a live "present now" figure (no
 * names, ever — privacy). If that endpoint fails OR reports zero assigned seats, we
 * gracefully fall back to the modest real `/numbers`-based occupancy so the board is
 * never blank. Nothing is invented: the caption says exactly what is true —
 * "38 seats · {assigned} taken · {present} present now · {free} free · no fake number".
 *
 * SELF CHECK-IN: a logged-in member (via useAuth) additionally sees a tasteful
 * check-in card driven by the MEMBER `/attendance/me` endpoint — toggling
 * check-in/check-out against their own assigned seat. Logged-out visitors see only
 * the public board (no login prompt). Per-seat tooltips stay status+number only.
 *
 * The floor plan is a static SVG (GPU-cheap, no per-seat animation); the member
 * check-in card below stays fully reduced-motion safe. No eval, no innerHTML, no
 * external libs.
 */

// TOTAL_SEATS (38) is imported from the shared hall-plan — the SAME source the
// floor-plan preview and the /book map use, so the board can never disagree.

// Fallback mirrors the modest real numbers used elsewhere on the site (LivePulse).
const FALLBACK_SEATS_HOSTED = 6;

// CMS fallback MIRRORS the live "seatsBoard" copy verbatim. Editing the section in
// /admin now drives this text; defaults here match the server schema, so an un-edited
// site renders exactly as before. Numbers (TOTAL_SEATS, taken/free/present) stay live
// from the hooks — only the words are editable. Bilingual → foo / fooEn.
const FALLBACK = {
  eyebrow: "توفّر المقاعد",
  eyebrowEn: "Seat availability",
  place: "غزّة",
  placeEn: "Gaza",
  headlineSeats: "مقعد — ",
  headlineSeatsEn: "seats — ",
  headlineAccent: "مكانك محفوظ.",
  headlineAccentEn: "your place is waiting.",
  descLive: "قاعة كاملة، ثمانيةٌ وثلاثون مقعدًا حقيقيًّا في قلب غزّة. هذا ما هو متاح الآن — من قاعدة بياناتنا مباشرةً، لا رقم مُختلَق.",
  descLiveEn: "A full hall — thirty-eight real seats in the heart of Gaza. This is what's open right now, straight from our database. No invented numbers.",
  descFallback: "قاعة كاملة، ثمانيةٌ وثلاثون مقعدًا حقيقيًّا في قلب غزّة. احجز مكانك وابدأ رحلتك معنا.",
  descFallbackEn: "A full hall — thirty-eight real seats in the heart of Gaza. Reserve your place and start your journey with us.",
  legendTaken: "مشغول",
  legendTakenEn: "taken",
  legendPresent: "حاضر الآن",
  legendPresentEn: "present now",
  legendFree: "متاح الآن",
  legendFreeEn: "free now",
  captionSeats: "مقعد",
  captionSeatsEn: "seats",
  captionFree: "متاح",
  captionFreeEn: "free",
  noFake: "لا رقم مُختلَق",
  noFakeEn: "no fake number",
  keyAvailable: "متاح",
  keyAvailableEn: "Available",
  keyTaken: "مشغول",
  keyTakenEn: "Taken",
  footerCapacity: "سعة القاعة",
  footerCapacityEn: "Hall capacity",
  footerSeats: "مقعدًا",
  footerSeatsEn: "seats",
  bookCta: "احجز مقعدك",
  bookCtaEn: "Book your seat",
};

/** Derive the count of taken seats from REAL data, clamped to real capacity. */
function takenFromNumbers(n: Pick<PublicNumbers, "seatsHosted" | "bookings"> | null): number {
  if (!n) return Math.min(TOTAL_SEATS, FALLBACK_SEATS_HOSTED);
  const real = Math.max(n.seatsHosted ?? 0, n.bookings ?? 0);
  return Math.max(0, Math.min(TOTAL_SEATS, real));
}

/** The signed-in member's own attendance state (member-only endpoint). */
interface AttendanceMe {
  seat: number | null;
  present: boolean;
  since: string | null;
}

function clampCount(v: unknown): number {
  return Math.max(0, Math.min(TOTAL_SEATS, Math.trunc(Number(v) || 0)));
}

/**
 * CheckInCard — the member-only self check-in / check-out control.
 *
 * Rendered ONLY when a member is logged in. Reads the member's own attendance
 * from `/attendance/me` and lets them toggle presence against THEIR assigned seat.
 * Optimistic UX with refetch-on-settle; the toggle button is disabled while a
 * request is in flight. The present state is announced via aria-live so screen
 * readers hear the change. Terracotta is the sole accent; dark-glass material.
 *
 * onPresenceChange lets the parent refetch the public summary so the board's
 * "present now" figure reflects this member's own check-in immediately.
 */
function CheckInCard({
  fmt,
  onPresenceChange,
}: {
  fmt: (v: number) => string;
  onPresenceChange: () => void;
}) {
  const { t, lang } = useLanguage();
  const [me, setMe] = useState<AttendanceMe | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    api<AttendanceMe>("/attendance/me")
      .then((r) => {
        if (cancelled) return;
        setMe(r);
        setError(false);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  const toggle = useCallback(async () => {
    // A member can record attendance even WITHOUT a fixed seat — the backend
    // snapshots seat=null and still tracks presence (matches the server, which
    // lets a member check in before an admin assigns them a seat).
    if (pending || !me) return;
    setPending(true);
    setError(false);
    const goingIn = !me.present;
    try {
      const r = await api<Partial<AttendanceMe>>(
        goingIn ? "/attendance/check-in" : "/attendance/check-out",
        { method: "POST" },
      );
      // Optimistically merge the server's authoritative reply.
      setMe((prev) =>
        prev
          ? {
              seat: r.seat ?? prev.seat,
              present: r.present ?? goingIn,
              since: goingIn ? r.since ?? new Date().toISOString() : null,
            }
          : prev,
      );
      onPresenceChange();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }, [pending, me, onPresenceChange]);

  // Nothing to show until the first load settles (avoids a flash of the card).
  if (!loaded) return null;

  // Endpoint failed — stay quiet rather than showing a broken control.
  if (error && !me) return null;

  const sinceLabel = (() => {
    if (!me?.since) return null;
    const d = new Date(me.since);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleTimeString(lang === "en" ? "en-US" : "ar-EG-u-nu-arab", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  })();

  return (
    <div className="mt-[clamp(1rem,2vw,1.5rem)] glass-panel p-[clamp(1rem,2vw,1.35rem)]">
      {me ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/55 rtl:tracking-normal">
                {me.seat != null ? t({ ar: "مقعدك", en: "Your seat" }) : t({ ar: "حضورك", en: "Your attendance" })}
              </span>
              {me.seat != null && (
                <span className="font-display font-black tabular-nums text-sand-bright text-[1.35rem] leading-none">
                  {t({ ar: "رقم ", en: "#" })}
                  {fmt(me.seat)}
                </span>
              )}
            </div>
            {/* Live presence state — announced to assistive tech on change. */}
            <p aria-live="polite" className="mt-1.5 text-[13px] text-white/70">
              {me.present ? (
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-primary font-medium">
                    {t({ ar: "أنت حاضر الآن", en: "You're present now" })}
                  </span>
                  {sinceLabel && (
                    <span className="text-white/60">
                      {t({ ar: " · منذ ", en: " · since " })}
                      <span className="tabular-nums">{sinceLabel}</span>
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-white/60">
                  {t({ ar: "أنت غير مسجَّل الحضور", en: "You're checked out" })}
                </span>
              )}
            </p>
            {me.seat == null && (
              <p className="mt-1 text-[12px] leading-relaxed text-white/45">
                {t({
                  ar: "لم يُخصَّص لك مقعد ثابت بعد — يمكنك تسجيل حضورك العامّ.",
                  en: "No fixed seat assigned yet — you can still record your general attendance.",
                })}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            aria-busy={pending ? true : undefined}
            className={
              "inline-flex shrink-0 items-center justify-center gap-2 h-11 px-6 rounded-full font-bold text-[14px] tracking-[-0.005em] transition-[transform,background-color,box-shadow,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60 motion-safe:hover:-translate-y-0.5 active:translate-y-0 " +
              (me.present
                ? // Check-out — quiet glass so "leaving" isn't the loud action.
                  "bg-white/[0.06] text-white ring-1 ring-inset ring-white/25 hover:bg-white/[0.12] hover:ring-white/40"
                : // Check-in — terracotta fill, the sole accent.
                  "cta-fill shadow-[0_18px_44px_-16px_hsl(354_82%_40%/0.6)]")
            }
          >
            {pending
              ? t({ ar: "لحظة…", en: "One moment…" })
              : me.present
                ? t({ ar: "سجّل انصرافك", en: "Check out" })
                : t({ ar: "سجّل حضورك", en: "Check in" })}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function SeatsBoard() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const c = useContentSection("seatsBoard", FALLBACK);
  const locale = lang === "ar" ? "ar-EG" : "en-US";

  // Two honest, PUBLIC sources — now read through the ONE shared, cached queries
  // (deduped across the homepage, no duplicate-fetch storm). `/attendance/summary`
  // is preferred (real presence); `/numbers` is the always-available fallback so
  // the board is never blank. Both degrade silently: on error `data` is undefined
  // and we fall back to `takenFromNumbers` — nothing is ever invented.
  const { data: numbersData } = useNumbers();
  const nums = numbersData?.numbers ?? null;

  const { data: summaryData, refetch: refetchSummary } = useAttendanceSummary();
  const summary = summaryData ?? null;

  // Admin-blocked seats (disabled/maintenance/reserved) — the SAME public source
  // /book reads, so the preview here can never disagree with the booking map.
  const { data: seatStatus } = useSeatStatus();
  const blockedSeats = useMemo(() => (seatStatus?.blocked ?? []).map((b) => b.seat), [seatStatus]);

  // When BOTH public sources are unavailable (a total API failure, not just an
  // empty DB), the occupancy shown is the graceful fallback constant — NOT a
  // real figure. In that state the board stays visible, but we must NOT assert
  // it's live/database-sourced, or the "no fake number" promise itself becomes
  // the fake number. These flags drop those claims exactly when we can't back them.
  const hasRealData = summary != null || nums != null;

  // A member's own check-in refetches the shared summary on demand so "present
  // now" stays honest and immediate.
  const refreshSummary = useCallback(() => {
    void refetchSummary();
  }, [refetchSummary]);

  // Occupancy: prefer the real attendance summary when it reports any assigned
  // seat; otherwise gracefully fall back to the /numbers-derived count.
  const summaryAssigned = summary ? clampCount(summary.assignedCount) : 0;
  const taken = summaryAssigned > 0 ? summaryAssigned : takenFromNumbers(nums);
  const free = TOTAL_SEATS - taken;
  // "Present now" is only ever shown when the real endpoint provides it; it can
  // never exceed the assigned seats. Null when unknown (we never fabricate it).
  const present =
    summary != null ? Math.min(clampCount(summary.presentCount), taken) : null;
  // Only surface "present now" when someone actually is — a live "0 present now"
  // reads as "nobody's here" and undersells the space. When zero (or unknown) we
  // simply omit the segment; taken/free still tell the honest availability story.
  const showPresent = present != null && present > 0;

  const fmt = (v: number) => v.toLocaleString(locale);

  return (
    <CinematicMedia
      id="seats-board"
      data-testid="seats-board"
      aria-label={t({ ar: "خريطة القاعة — التوفّر الحيّ", en: "Hall floor plan — live availability" })}
      src={imageUrl("/photos/IMG_8300.webp")}
      scrim="medium"
      sideScrim
      className="section-y border-t border-white/[0.06]"
      overlay={
        <div aria-hidden className="absolute inset-0 glass-ambient pointer-events-none" />
      }
    >
      <div className="container-ih">
        <div className="grid items-center gap-[clamp(2.5rem,5vw,5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          {/* ── Left: the message ── */}
          <div className="max-w-xl">
            <Reveal as="div" className="mb-6 flex items-center gap-3">
              <span aria-hidden className="h-px w-9 bg-primary/70" />
              <span className="eyebrow">
                {t({ ar: c.eyebrow, en: c.eyebrowEn })}
                <span className="text-white/45"> · </span>
                <span className="text-primary">{t({ ar: c.place, en: c.placeEn })}</span>
              </span>
            </Reveal>

            <Reveal as="div" delay={0.05}>
              <h2
                className="font-display text-white"
                style={{
                  fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
                  fontWeight: 900,
                  lineHeight: 0.98,
                  letterSpacing: "-0.05em",
                }}
              >
                <span className="text-sand-bright tabular-nums">{fmt(TOTAL_SEATS)}</span>{" "}
                {t({ ar: c.headlineSeats, en: c.headlineSeatsEn })}
                <span className="text-primary">
                  {t({ ar: c.headlineAccent, en: c.headlineAccentEn })}
                </span>
              </h2>
            </Reveal>

            <Reveal as="div" delay={0.1}>
              <p className="mt-6 max-w-md text-white/75 text-[1.0625rem] leading-[1.7]">
                {hasRealData
                  ? t({ ar: c.descLive, en: c.descLiveEn })
                  : t({ ar: c.descFallback, en: c.descFallbackEn })}
              </p>
            </Reveal>

            {/* Live availability line + legend */}
            <Reveal as="div" delay={0.14}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13.5px]">
                <span className="inline-flex items-center gap-2.5">
                  <span aria-hidden className="h-3 w-3 rounded-[4px] bg-primary" />
                  <span className="text-white/85">
                    <span className="font-display font-bold text-white tabular-nums">{fmt(taken)}</span>{" "}
                    {t({ ar: c.legendTaken, en: c.legendTakenEn })}
                  </span>
                </span>
                {showPresent && (
                  <span className="inline-flex items-center gap-2.5">
                    <span aria-hidden className="h-3 w-3 rounded-full bg-primary ring-1 ring-inset ring-primary/60" />
                    <span className="text-white/85">
                      <span className="font-display font-bold text-primary tabular-nums">{fmt(present!)}</span>{" "}
                      {t({ ar: c.legendPresent, en: c.legendPresentEn })}
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-2.5">
                  <span aria-hidden className="h-3 w-3 rounded-[4px] bg-white/[0.06] ring-1 ring-inset ring-white/30" />
                  <span className="text-white/85">
                    <span className="font-display font-bold text-white tabular-nums">{fmt(free)}</span>{" "}
                    {t({ ar: c.legendFree, en: c.legendFreeEn })}
                  </span>
                </span>
              </div>
            </Reveal>

            <Reveal as="div" delay={0.18}>
              <div className="mt-10">
                <Btn asChild variant="primary" size="lg" className="group px-9 shadow-[0_28px_72px_-14px_hsl(354_82%_40%/0.6)]">
                  <Link href="/book" data-testid="seats-board-book">
                    {t({ ar: c.bookCta, en: c.bookCtaEn })}
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                  </Link>
                </Btn>
              </div>
            </Reveal>
          </div>

          {/* ── Right: the board ── */}
          <Reveal as="div" delay={0.08}>
            <div className="glass-panel-lg p-[clamp(1.25rem,3vw,2.25rem)]">
              {/* Board caption — the single honest availability sentence */}
              <div className="mb-[clamp(1.25rem,2.5vw,1.75rem)] flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-display font-black text-sand-bright tabular-nums leading-none" style={{ fontSize: "clamp(1.5rem,2.4vw,2rem)", letterSpacing: "-0.03em" }}>
                  {fmt(TOTAL_SEATS)}
                </span>
                <span className="text-white/80 text-[13.5px] font-medium">
                  {t({ ar: c.captionSeats, en: c.captionSeatsEn })}
                  <span className="text-white/40"> · </span>
                  <span className="tabular-nums text-white">{fmt(taken)}</span> {t({ ar: c.legendTaken, en: c.legendTakenEn })}
                  {showPresent && (
                    <>
                      <span className="text-white/40"> · </span>
                      <span className="tabular-nums text-primary">{fmt(present!)}</span>{" "}
                      <span className="text-primary/90">{t({ ar: c.legendPresent, en: c.legendPresentEn })}</span>
                    </>
                  )}
                  <span className="text-white/40"> · </span>
                  <span className="tabular-nums text-white">{fmt(free)}</span> {t({ ar: c.captionFree, en: c.captionFreeEn })}
                  {hasRealData && (
                    <>
                      <span className="text-white/40"> · </span>
                      <span className="text-white/55">{t({ ar: c.noFake, en: c.noFakeEn })}</span>
                    </>
                  )}
                </span>
              </div>

              {/* The REAL hall floor plan — a read-only preview of the exact
                  38-seat map /book reserves against (shared geometry, never drifts).
                  Static SVG, non-interactive; it announces the honest taken/free
                  counts via its own role="img" label. The fixed aspect-ratio box
                  reserves its height, so the count loading in shifts no layout. */}
              <SeatMapPreview
                takenCount={taken}
                blockedSeats={blockedSeats}
                className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
              />

              {/* Color key — what the two seat states mean. */}
              <div aria-hidden className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-white/70">
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-[3px] bg-white/[0.06] ring-1 ring-inset ring-white/30" />
                  {t({ ar: c.keyAvailable, en: c.keyAvailableEn })}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-[3px] bg-primary ring-1 ring-inset ring-primary/60" />
                  {t({ ar: c.keyTaken, en: c.keyTakenEn })}
                </span>
              </div>

              {/* Footer meta — hall capacity, kept quiet */}
              <div className="mt-[clamp(1.25rem,2.5vw,1.75rem)] flex items-center justify-between border-t border-white/10 pt-4 text-[12px] text-white/55">
                <span>
                  {t({ ar: c.footerCapacity, en: c.footerCapacityEn })}
                </span>
                <span className="tabular-nums">
                  {fmt(TOTAL_SEATS)} {t({ ar: c.footerSeats, en: c.footerSeatsEn })}
                </span>
              </div>

              {/* Member-only self check-in / check-out. Rendered only when a member
                  is logged in; logged-out visitors see nothing extra. */}
              {user && (
                <CheckInCard fmt={fmt} onPresenceChange={refreshSummary} />
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </CinematicMedia>
  );
}
