import React, { useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, View } from "react-native";
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

function splitTags(s: string | null | undefined): string[] {
  return (s || "").split(/[,،]/).map((p) => p.trim()).filter(Boolean);
}

export default function ExpertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

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
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 80 }}
    >
      <View style={{ alignItems: "center", gap: 10 }}>
        {e.avatarUrl ? (
          <Image
            source={{ uri: resolveMedia(e.avatarUrl) }}
            style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.muted }}
          />
        ) : (
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T size={36} weight="bold" color={colors.primary}>{e.fullName.trim().slice(0, 1)}</T>
          </View>
        )}
        <T size={22} weight="bold" align="center">{e.fullName}</T>
        {e.headline ? (
          <T size={14} color={colors.primary} weight="medium" align="center">{e.headline}</T>
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

      <Card style={{ gap: 10 }}>
        {e.yearsExperience > 0 ? (
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
            <Feather name="award" size={16} color={colors.primary} />
            <T size={13}>{e.yearsExperience}+ سنة خبرة</T>
          </View>
        ) : null}
        {langs.length > 0 ? (
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
            <Feather name="globe" size={16} color={colors.primary} />
            <T size={13}>{langs.join("، ")}</T>
          </View>
        ) : null}
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
          <Feather name="clock" size={16} color={colors.primary} />
          <T size={13}>جلسة ~{e.sessionMinutes} دقيقة</T>
        </View>
        {(e.linkedinUrl || e.websiteUrl) ? (
          <View style={{ flexDirection: "row-reverse", gap: 14, paddingTop: 6 }}>
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
      </Card>

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
    </ScrollView>
  );
}
