import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { T, Card, Btn, Field, SkeletonRow } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// ─────────────────────────────────────────────────────────────────────────────
// Mirrors the web booking flow (ih-haven/src/pages/Book.tsx) and the backend
// contract (api-server/src/routes/bookings.ts → insertBookingSchema):
//   POST /bookings { fullName, phone, email?, visitDate, timeSlot, purpose,
//                    attendees, notes, expertId? }
// The endpoint is public (no auth required) but we prefill from the signed-in
// user when available. The space is in Asia/Gaza, open Sat–Thu, closed Friday.
// visitDate MUST be ASCII "YYYY-MM-DD" (the backend regex rejects Arabic digits),
// so we build the value from ASCII while displaying Arabic-Indic digits.
// ─────────────────────────────────────────────────────────────────────────────

type SlotId = "morning" | "midday" | "afternoon" | "fullday";
type PurposeId = "work" | "study" | "meeting" | "event" | "tour" | "other";

const TIME_SLOTS: Array<{ id: SlotId; label: string; time: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: "morning", label: "صباحًا", time: "٩ – ١٢", icon: "sunrise" },
  { id: "midday", label: "ظهرًا", time: "١٢ – ٣", icon: "sun" },
  { id: "afternoon", label: "بعد الظهر", time: "٣ – ٥", icon: "sunset" },
  { id: "fullday", label: "اليوم الكامل", time: "٩ – ٥", icon: "star" },
];

const PURPOSES: Array<{ id: PurposeId; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: "work", label: "عمل مستقلّ", icon: "briefcase" },
  { id: "study", label: "دراسة", icon: "book-open" },
  { id: "meeting", label: "اجتماع", icon: "users" },
  { id: "event", label: "فعّاليّة", icon: "gift" },
  { id: "tour", label: "زيارة استكشافيّة", icon: "eye" },
  { id: "other", label: "غير ذلك", icon: "more-horizontal" },
];

const FRIDAY = 5; // Asia/Gaza working week is Sat–Thu; Friday is closed.
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toArabicDigits(s: string | number): string {
  return String(s).replace(/\d/g, (d) => AR_DIGITS[Number(d)]!);
}

// ASCII "YYYY-MM-DD" anchored to the device local calendar day.
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEKDAY_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTH_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

interface DayOption {
  iso: string;
  weekday: string;
  dayNum: string;
  month: string;
}

// Next ~28 calendar days minus Fridays → the soonest 18 bookable days.
function buildDays(): DayOption[] {
  const out: DayOption[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < 28 && out.length < 18; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    if (d.getDay() === FRIDAY) continue;
    out.push({
      iso: ymd(d),
      weekday: WEEKDAY_AR[d.getDay()]!,
      dayNum: toArabicDigits(d.getDate()),
      month: MONTH_AR[d.getMonth()]!,
    });
  }
  return out;
}

interface ExpertOption {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  acceptingSessions: boolean;
}

export default function BookScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

  const days = useMemo(buildDays, []);

  const [visitDate, setVisitDate] = useState<string>("");
  const [timeSlot, setTimeSlot] = useState<SlotId | "">("");
  const [purpose, setPurpose] = useState<PurposeId | "">("");
  const [attendees, setAttendees] = useState<number>(1);
  const [expertId, setExpertId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const [experts, setExperts] = useState<ExpertOption[] | null>(null);
  const [expertsLoading, setExpertsLoading] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ id: number } | null>(null);

  useEffect(() => {
    setExpertsLoading(true);
    api<{ experts: ExpertOption[] }>("/experts")
      .then((r) => {
        // Only show experts that are accepting sessions
        setExperts(r.experts.filter((e) => e.acceptingSessions));
      })
      .catch(() => setExperts([]))
      .finally(() => setExpertsLoading(false));
  }, []);

  const canSubmit =
    !!visitDate &&
    !!timeSlot &&
    !!purpose &&
    attendees >= 1 &&
    fullName.trim().length >= 2 &&
    phone.trim().length >= 6;

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    setIssues({});
    try {
      const r = await api<{ ok: boolean; id: number }>("/bookings", {
        method: "POST",
        body: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          visitDate,
          timeSlot,
          purpose,
          attendees,
          notes: notes.trim(),
          expertId: expertId ?? undefined,
        },
      });
      setDone({ id: r.id });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        const body = err.body as { issues?: Array<{ path: string; message: string }> } | null;
        if (body && Array.isArray(body.issues)) {
          const m: Record<string, string> = {};
          for (const i of body.issues) m[i.path] = i.message;
          setIssues(m);
        }
      } else {
        setError("تعذّر إتمام الحجز. حاول لاحقًا.");
      }
    } finally {
      setBusy(false);
    }
  }

  // ─── Success state ─────────────────────────────────────────────────────────
  if (done) {
    const slot = TIME_SLOTS.find((s) => s.id === timeSlot);
    const day = days.find((d) => d.iso === visitDate);
    const chosenExpert = experts?.find((e) => e.id === expertId) ?? null;
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: "center" }}
      >
        <View style={{ alignItems: "center", gap: 16 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="check-circle" size={42} color={colors.primary} />
          </View>
          <T size={12} color={colors.primary} weight="bold" align="center">تمّ بنجاح</T>
          <T size={26} weight="bold" align="center">
            مقعدك محجوز يا {fullName.trim().split(" ")[0] || "صديقنا"}
          </T>
          <T size={14} color={colors.mutedForeground} align="center" style={{ lineHeight: 24 }}>
            {day ? `نراك يوم ${day.weekday} ${day.dayNum} ${day.month}` : "استلمنا حجزك"}
            {slot ? ` · ${slot.label}` : ""}.
            {"\n"}سنرسل لك رسالة تأكيد على واتساب قريبًا.
          </T>

          {/* Expert mini-card — shown when user selected an expert */}
          {chosenExpert ? (
            <View
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 10,
                alignSelf: "stretch",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: colors.radius,
                backgroundColor: colors.primarySoft,
                borderWidth: 1,
                borderColor: colors.primary + "33",
              }}
            >
              {chosenExpert.avatarUrl ? (
                <Image
                  source={{ uri: resolveMedia(chosenExpert.avatarUrl) }}
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.primary + "22",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <T size={18} weight="bold" color={colors.primary}>
                    {chosenExpert.fullName.trim().slice(0, 1)}
                  </T>
                </View>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <T size={13} weight="bold" color={colors.primary}>
                  {chosenExpert.fullName}
                </T>
                {chosenExpert.headline ? (
                  <T size={11.5} color={colors.primary} numberOfLines={1} style={{ opacity: 0.75 }}>
                    {chosenExpert.headline}
                  </T>
                ) : null}
                <T size={11} color={colors.mutedForeground} style={{ marginTop: 1 }}>
                  سنُعلمه بموعدك
                </T>
              </View>
            </View>
          ) : null}

          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: colors.muted,
            }}
          >
            <T size={11} weight="bold" color={colors.mutedForeground}>
              رقم الحجز · #{toArabicDigits(String(done.id).padStart(5, "0"))}
            </T>
          </View>
          <Btn title="العودة للرئيسيّة" fullWidth onPress={() => router.replace("/")} />
        </View>
      </ScrollView>
    );
  }

  // ─── Form ──────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 80 }}
    >
      <View style={{ alignItems: "center", gap: 8 }}>
        <T size={11} color={colors.primary} weight="bold">احجز مقعدك · مجّاني تمامًا</T>
        <T size={26} weight="bold" align="center">مقعدك في آيلاند هيفن ينتظرك</T>
        <T size={13} color={colors.mutedForeground} align="center" style={{ lineHeight: 22 }}>
          اختَر يومًا وفترة وسنُجهّز لك مساحتك. مفتوحون السبت – الخميس · مغلقون يوم الجمعة · توقيت غزّة.
        </T>
      </View>

      {/* 01 · Day */}
      <Card style={{ gap: 12 }}>
        <T size={12} color={colors.primary} weight="bold">٠١ · اختَر اليوم</T>
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
          {days.map((d) => {
            const active = visitDate === d.iso;
            return (
              <Pressable
                key={d.iso}
                onPress={() => setVisitDate(d.iso)}
                style={{
                  width: 78,
                  paddingVertical: 10,
                  borderRadius: colors.radius,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySoft : "transparent",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <T size={11} weight="medium" color={active ? colors.primary : colors.mutedForeground}>
                  {d.weekday}
                </T>
                <T size={18} weight="bold" color={active ? colors.primary : colors.foreground}>
                  {d.dayNum}
                </T>
                <T size={10} color={active ? colors.primary : colors.mutedForeground}>
                  {d.month}
                </T>
              </Pressable>
            );
          })}
        </View>
        {issues.visitDate ? (
          <T size={12} color={colors.destructive}>{issues.visitDate}</T>
        ) : null}
      </Card>

      {/* 02 · Time slot */}
      <Card style={{ gap: 12 }}>
        <T size={12} color={colors.primary} weight="bold">٠٢ · اختَر الفترة</T>
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
          {TIME_SLOTS.map((s) => {
            const active = timeSlot === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setTimeSlot(s.id)}
                style={{
                  flex: 1,
                  minWidth: 140,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  borderRadius: colors.radius,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySoft : "transparent",
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Feather name={s.icon} size={20} color={active ? colors.primary : colors.mutedForeground} />
                <View>
                  <T size={14} weight="bold" color={active ? colors.primary : colors.foreground}>
                    {s.label}
                  </T>
                  <T size={11} color={colors.mutedForeground}>{s.time}</T>
                </View>
              </Pressable>
            );
          })}
        </View>
        {issues.timeSlot ? (
          <T size={12} color={colors.destructive}>{issues.timeSlot}</T>
        ) : null}
      </Card>

      {/* 03 · Purpose */}
      <Card style={{ gap: 12 }}>
        <T size={12} color={colors.primary} weight="bold">٠٣ · ما هدف زيارتك</T>
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
          {PURPOSES.map((p) => {
            const active = purpose === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPurpose(p.id)}
                style={{
                  flex: 1,
                  minWidth: 100,
                  paddingVertical: 14,
                  paddingHorizontal: 10,
                  borderRadius: colors.radius,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySoft : "transparent",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Feather name={p.icon} size={20} color={active ? colors.primary : colors.mutedForeground} />
                <T size={12.5} weight="medium" color={active ? colors.primary : colors.foreground} align="center">
                  {p.label}
                </T>
              </Pressable>
            );
          })}
        </View>
        {issues.purpose ? (
          <T size={12} color={colors.destructive}>{issues.purpose}</T>
        ) : null}
      </Card>

      {/* 04 · Attendees */}
      <Card style={{ gap: 12 }}>
        <T size={12} color={colors.primary} weight="bold">٠٤ · عدد الأشخاص</T>
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
            const active = attendees === n;
            return (
              <Pressable
                key={n}
                onPress={() => setAttendees(n)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <T size={15} weight="bold" color={active ? colors.primaryForeground : colors.foreground}>
                  {toArabicDigits(n)}
                </T>
              </Pressable>
            );
          })}
        </View>
        {issues.attendees ? (
          <T size={12} color={colors.destructive}>{issues.attendees}</T>
        ) : null}
      </Card>

      {/* 05 · Expert (optional) */}
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }}>
          <T size={12} color={colors.primary} weight="bold">٠٥ · هل تودّ لقاء خبير؟</T>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: colors.muted,
            }}
          >
            <T size={11} color={colors.mutedForeground}>اختياريّ</T>
          </View>
        </View>
        <T size={12.5} color={colors.mutedForeground} style={{ lineHeight: 19 }}>
          اختَر خبيرًا متاحًا تودّ التواصل معه خلال زيارتك، أو اتركه فارغًا للعمل المستقلّ.
        </T>

        {expertsLoading ? (
          <View style={{ gap: 10 }}>
            <SkeletonRow />
            <SkeletonRow />
          </View>
        ) : !experts || experts.length === 0 ? (
          <View
            style={{
              padding: 16,
              borderRadius: colors.radius,
              backgroundColor: colors.muted,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Feather name="users" size={22} color={colors.mutedForeground} />
            <T size={13} color={colors.mutedForeground} align="center">
              لا يوجد خبراء متاحون حاليًا
            </T>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {experts.map((e) => {
              const active = expertId === e.id;
              return (
                <Pressable
                  key={e.id}
                  onPress={() => setExpertId(active ? null : e.id)}
                  style={({ pressed }) => ({
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderRadius: colors.radius,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primarySoft : "transparent",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  {/* Avatar */}
                  {e.avatarUrl ? (
                    <Image
                      source={{ uri: resolveMedia(e.avatarUrl) }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: colors.muted,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: colors.primarySoft,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <T size={20} weight="bold" color={colors.primary}>
                        {e.fullName.trim().slice(0, 1)}
                      </T>
                    </View>
                  )}

                  {/* Info */}
                  <View style={{ flex: 1, gap: 2 }}>
                    <T size={14.5} weight="bold" color={active ? colors.primary : colors.foreground}>
                      {e.fullName}
                    </T>
                    {e.headline ? (
                      <T size={12} color={active ? colors.primary : colors.mutedForeground} numberOfLines={1}>
                        {e.headline}
                      </T>
                    ) : null}
                  </View>

                  {/* Checkmark / indicator */}
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 1.5,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {active ? (
                      <Feather name="check" size={13} color={colors.primaryForeground} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Show selected expert summary */}
        {expertId ? (
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: colors.radius,
              backgroundColor: colors.primarySoft,
            }}
          >
            <Feather name="check-circle" size={15} color={colors.primary} />
            <T size={12.5} weight="medium" color={colors.primary} style={{ flex: 1 }}>
              اخترتَ {experts?.find((e) => e.id === expertId)?.fullName ?? "خبيرًا"} — سنُعلمه بموعدك
            </T>
            <Pressable onPress={() => setExpertId(null)}>
              <Feather name="x" size={16} color={colors.primary} />
            </Pressable>
          </View>
        ) : null}
      </Card>

      {/* 06 · Your details */}
      <Card style={{ gap: 14 }}>
        <T size={12} color={colors.primary} weight="bold">٠٦ · بياناتك</T>
        <Field
          label="الاسم الكامل"
          value={fullName}
          onChangeText={setFullName}
          placeholder="مثال: لانا الشريف"
          error={issues.fullName}
        />
        <Field
          label="رقم الواتساب"
          value={phone}
          onChangeText={setPhone}
          placeholder="+970 …"
          keyboardType="phone-pad"
          error={issues.phone}
        />
        <Field
          label="البريد الإلكتروني (اختياريّ)"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={issues.email}
        />
        <Field
          label="ملاحظات إضافيّة (اختياريّ)"
          value={notes}
          onChangeText={setNotes}
          placeholder="مثلًا: أحتاج مقعدًا قرب النافذة، أو منفذ شاشة…"
          multiline
          numberOfLines={4}
          maxLength={1000}
          error={issues.notes}
        />
      </Card>

      {error ? (
        <View
          style={{
            padding: 14,
            borderRadius: colors.radius,
            borderWidth: 1,
            borderColor: colors.destructive,
            backgroundColor: colors.primarySoft,
          }}
        >
          <T size={13} color={colors.destructive} align="center">{error}</T>
        </View>
      ) : null}

      <Btn title="أكِّد الحجز" loading={busy} disabled={!canSubmit} fullWidth onPress={submit} />
      <T size={11.5} color={colors.mutedForeground} align="center" style={{ lineHeight: 18 }}>
        بإرسالك الحجز توافق على أن نتواصل معك لتأكيد الزيارة فقط. قهوة وشاي وإنترنت سريع · على حسابنا دائمًا.
      </T>
    </ScrollView>
  );
}
