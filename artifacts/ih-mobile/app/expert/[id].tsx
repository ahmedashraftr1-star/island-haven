import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { T, Card, Btn, Field } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface ExpertProfile {
  id: number;
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  expertise: string;
  bio: string;
  yearsExperience: number;
  languages: string;
  sessionMinutes: number;
  availabilityNote: string;
  acceptingSessions: boolean;
  featured: boolean;
  linkedinUrl: string;
  websiteUrl: string;
}

interface Slot {
  id: number;
  startAt: string;
  endAt: string;
  mode: "online" | "onsite";
  location: string | null;
  status: string;
  note: string | null;
}

const TEAM_LABELS: Record<string, string> = {
  leadership: "فريق القيادة",
  mentors: "فريق الإرشاد التقنيّ والمنتج",
  advisors: "فريق الاستشارات والأعمال",
};

function splitTags(s: string | null | undefined): string[] {
  return (s || "").split(/[,،]/).map((p) => p.trim()).filter(Boolean);
}
function fmtDayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG-u-ca-gregory", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
function fmtSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduce(v));
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

export default function ExpertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const reduce = useReduceMotion();

  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"online" | "onsite">("online");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const q = useQuery<{ expert: ExpertProfile }>({
    queryKey: ["expert", id],
    queryFn: () => api(`/experts/${id}`),
    enabled: !!id,
  });
  const tq = useQuery<{ team: { fullName: string; group: string }[] }>({
    queryKey: ["team"],
    queryFn: () => api("/team"),
  });

  // Intro fade — triggers once the profile data arrives.
  const intro = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!q.data) return;
    if (reduce) {
      intro.setValue(1);
      return;
    }
    intro.setValue(0);
    Animated.timing(intro, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [q.data, reduce, intro]);

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (q.isError || !q.data) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 20 }}>
        <T size={16}>تعذّر تحميل ملف الخبير.</T>
      </View>
    );
  }
  const e = q.data.expert;
  const areas = splitTags(e.expertise);
  const langs = splitTags(e.languages);
  const teamMember = tq.data?.team.find((t) => t.fullName.trim() === e.fullName.trim());
  const teamLabel = teamMember ? TEAM_LABELS[teamMember.group] ?? null : null;

  async function submitRequest() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (topic.trim().length < 3) {
      Alert.alert("ناقص", "اكتب موضوع الجلسة (3 أحرف فأكثر)");
      return;
    }
    setBusy(true);
    try {
      await api(`/experts/${id}/sessions`, {
        method: "POST",
        body: { topic: topic.trim(), message: message.trim(), mode, preferredAt: null },
      });
      setDone(true);
      setTopic("");
      setMessage("");
    } catch (err) {
      Alert.alert("تعذّر الإرسال", err instanceof ApiError ? err.message : "حاول لاحقًا");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 90 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          gap: 16,
          opacity: intro,
          transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        }}
      >
        {/* ── Profile hero ── */}
        <View style={{ alignItems: "center", gap: 10 }}>
          {e.featured ? (
            <View
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: "rgba(251,191,36,0.12)",
                borderWidth: 1,
                borderColor: "rgba(251,191,36,0.3)",
              }}
            >
              <Feather name="star" size={11} color="#f59e0b" />
              <T size={11} weight="bold" color="#b45309">
                خبير مميّز
              </T>
            </View>
          ) : null}

          {e.avatarUrl ? (
            <Image
              source={{ uri: resolveMedia(e.avatarUrl) }}
              style={{ width: 104, height: 104, borderRadius: 28, backgroundColor: colors.muted }}
            />
          ) : (
            <View
              style={{
                width: 104,
                height: 104,
                borderRadius: 28,
                backgroundColor: colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <T size={40} weight="bold" color={colors.primary}>
                {e.fullName.trim().slice(0, 1)}
              </T>
            </View>
          )}
          <T size={23} weight="bold" align="center">{e.fullName}</T>
          {e.headline ? (
            <T size={14} color={colors.primary} weight="medium" align="center">{e.headline}</T>
          ) : null}
          {teamLabel ? (
            <View
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 11,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: colors.primarySoft,
              }}
            >
              <Feather name="users" size={12} color={colors.primary} />
              <T size={11.5} weight="bold" color={colors.primary}>
                {teamLabel}
              </T>
            </View>
          ) : null}
        </View>

        {e.bio ? (
          <Card>
            <T size={14} style={{ lineHeight: 24 }}>{e.bio}</T>
          </Card>
        ) : null}

        {areas.length > 0 ? (
          <View style={{ gap: 8 }}>
            <T size={12} color={colors.primary} weight="bold">مجالات الخبرة</T>
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 }}>
              {areas.map((a, i) => (
                <View
                  key={i}
                  style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.primarySoft }}
                >
                  <T size={12} weight="medium" color={colors.primary}>{a}</T>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Facts as pills ── */}
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
          {e.yearsExperience > 0 ? <StatPill colors={colors} icon="award" label={`${e.yearsExperience}+ سنة خبرة`} /> : null}
          {langs.length > 0 ? <StatPill colors={colors} icon="globe" label={langs.join("، ")} /> : null}
          <StatPill colors={colors} icon="clock" label={`جلسة ~${e.sessionMinutes} دقيقة`} />
        </View>

        {(e.linkedinUrl || e.websiteUrl) ? (
          <View style={{ flexDirection: "row-reverse", gap: 14 }}>
            {e.linkedinUrl ? (
              <Pressable
                hitSlop={8}
                onPress={() => Linking.openURL(e.linkedinUrl)}
                style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}
              >
                <Feather name="linkedin" size={14} color={colors.primary} />
                <T size={12} color={colors.primary}>LinkedIn</T>
              </Pressable>
            ) : null}
            {e.websiteUrl ? (
              <Pressable
                hitSlop={8}
                onPress={() => Linking.openURL(e.websiteUrl)}
                style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}
              >
                <Feather name="external-link" size={14} color={colors.primary} />
                <T size={12} color={colors.primary}>الموقع</T>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <OfficeHours expertId={Number(id)} expertName={e.fullName} reduce={reduce} />

        <Card style={{ gap: 12 }}>
          <T size={15} weight="bold">احجز جلسة إرشاد</T>
          {e.availabilityNote ? (
            <T size={12} color={colors.mutedForeground} style={{ lineHeight: 20 }}>
              {e.availabilityNote}
            </T>
          ) : null}

          {done ? (
            <View style={{ alignItems: "center", paddingVertical: 16, gap: 8 }}>
              <Feather name="check-circle" size={36} color={colors.primary} />
              <T size={15} weight="bold" align="center">تمّ إرسال طلبك</T>
              <T size={13} color={colors.mutedForeground} align="center" style={{ lineHeight: 20 }}>
                سيراجع الخبير طلبك ويؤكّد موعد الجلسة. تابع حالتها من ملفّك.
              </T>
            </View>
          ) : !e.acceptingSessions ? (
            <T size={13} color={colors.mutedForeground} align="center" style={{ paddingVertical: 12 }}>
              هذا الخبير لا يستقبل طلبات جلسات حاليًا.
            </T>
          ) : !user ? (
            <>
              <T size={13} color={colors.mutedForeground} style={{ lineHeight: 22 }}>
                سجّل دخولك لحجز جلسة إرشاد مَجّانيّة مع {e.fullName}.
              </T>
              <Btn title="تسجيل الدخول" onPress={() => router.push("/login")} />
            </>
          ) : (
            <>
              <Field
                label="موضوع الجلسة"
                value={topic}
                onChangeText={setTopic}
                maxLength={200}
                placeholder="مثال: مراجعة نموذج عمل مشروعي"
              />
              <Field
                label="نبذة عمّا تحتاجه (اختياري)"
                value={message}
                onChangeText={setMessage}
                maxLength={2000}
                multiline
                numberOfLines={3}
              />
              <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                {(["online", "onsite"] as const).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: colors.radius,
                      borderWidth: 1,
                      borderColor: mode === m ? colors.primary : colors.border,
                      backgroundColor: mode === m ? colors.primarySoft : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <T size={13} weight="medium" color={mode === m ? colors.primary : colors.foreground}>
                      {m === "online" ? "عن بُعد" : "في المساحة"}
                    </T>
                  </Pressable>
                ))}
              </View>
              <Btn title="إرسال طلب الجلسة" loading={busy} onPress={submitRequest} />
              <T size={11} color={colors.mutedForeground} align="center">
                مَجّاني — الخبير يؤكّد الموعد بعد المراجعة.
              </T>
            </>
          )}
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

function StatPill({
  colors,
  icon,
  label,
}: {
  colors: ReturnType<typeof useColors>;
  icon: keyof typeof Feather.glyphMap;
  label: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 7,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.muted,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Feather name={icon} size={14} color={colors.primary} />
      <T size={12.5} color={colors.foreground}>{label}</T>
    </View>
  );
}

function OfficeHours({
  expertId,
  expertName,
  reduce,
}: {
  expertId: number;
  expertName: string;
  reduce: boolean;
}) {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [picked, setPicked] = useState<number | null>(null);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const q = useQuery<{ slots: Slot[] }>({
    queryKey: ["expert-slots", expertId],
    queryFn: () => api(`/experts/${expertId}/slots`),
    enabled: !!expertId,
  });

  const slots = q.data?.slots ?? [];
  // Nothing to show until we know there are open slots (keeps the card hidden
  // for experts who only take ad-hoc requests).
  if (q.isLoading || slots.length === 0) return null;

  // Group slots by calendar day for a calendar-like time picker.
  const days: { key: string; label: string; slots: Slot[] }[] = [];
  for (const s of slots) {
    const key = new Date(s.startAt).toISOString().slice(0, 10);
    let day = days.find((d) => d.key === key);
    if (!day) {
      day = { key, label: fmtDayLabel(s.startAt), slots: [] };
      days.push(day);
    }
    day.slots.push(s);
  }

  async function book() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (picked == null) return;
    if (topic.trim().length < 3) {
      Alert.alert("ناقص", "اكتب موضوع الجلسة (3 أحرف فأكثر)");
      return;
    }
    setBusy(true);
    try {
      await api(`/slots/${picked}/book`, {
        method: "POST",
        body: { topic: topic.trim(), message: message.trim() },
      });
      setDone(true);
    } catch (err) {
      Alert.alert("تعذّر الحجز", err instanceof ApiError ? err.message : "حاول لاحقًا");
      void q.refetch();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
        <Feather name="calendar" size={15} color={colors.primary} />
        <T size={12.5} color={colors.primary} weight="bold">مواعيد متاحة · Office Hours</T>
      </View>
      <T size={12} color={colors.mutedForeground} style={{ lineHeight: 20, marginTop: -4 }}>
        احجز فورًا فترة مفتوحة من تقويم {expertName}.
      </T>

      {done ? (
        <View style={{ alignItems: "center", paddingVertical: 16, gap: 8 }}>
          <Feather name="check-circle" size={36} color={colors.primary} />
          <T size={15} weight="bold" align="center">تمّ الحجز ✓</T>
          <T size={13} color={colors.mutedForeground} align="center" style={{ lineHeight: 20 }}>
            ستصلك رسالة بريديّة بتفاصيل الجلسة. تابعها من ملفّك.
          </T>
        </View>
      ) : (
        <>
          <View style={{ gap: 14 }}>
            {days.map((day) => (
              <View key={day.key} style={{ gap: 8 }}>
                <T size={12.5} weight="bold">{day.label}</T>
                <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
                  {day.slots.map((s) => {
                    const isPicked = picked === s.id;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => setPicked(s.id)}
                        style={({ pressed }) => ({
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: isPicked ? colors.primary : colors.border,
                          backgroundColor: isPicked ? colors.primarySoft : "transparent",
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          alignItems: "center",
                          transform: [{ scale: !reduce && pressed ? 0.96 : 1 }],
                        })}
                      >
                        <T size={13} weight="bold" color={isPicked ? colors.primary : colors.foreground}>
                          {fmtSlotTime(s.startAt)}
                        </T>
                        <T size={10} color={colors.mutedForeground}>
                          {s.mode === "online" ? "عن بُعد" : "في المساحة"}
                        </T>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {picked != null ? (
            <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
              <Field
                label="موضوع الجلسة"
                value={topic}
                onChangeText={setTopic}
                maxLength={200}
                placeholder="ماذا تريد أن نناقش؟"
              />
              <Field
                label="تفاصيل إضافيّة (اختياري)"
                value={message}
                onChangeText={setMessage}
                maxLength={2000}
                multiline
                numberOfLines={3}
              />
              {!user ? (
                <Btn title="تسجيل الدخول للحجز" onPress={() => router.push("/login")} />
              ) : (
                <Btn title="تأكيد الحجز" loading={busy} onPress={book} />
              )}
              <T size={11} color={colors.mutedForeground} align="center">
                مَجّاني — يصلك إيميل التأكيد فورًا.
              </T>
            </View>
          ) : null}
        </>
      )}
    </Card>
  );
}
