import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { T, Card, Btn, Field } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const PROGRAM_STATUS_LABELS: Record<string, string> = {
  draft: "مسوّدة",
  open: "التقديم مفتوح",
  in_progress: "جارٍ التنفيذ",
  done: "منتهٍ",
};

const APP_STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  reviewing: "قيد المراجعة",
  accepted: "مقبول",
  rejected: "مرفوض",
};

interface ProgramFull {
  id: number;
  title: string;
  summary: string;
  description: string;
  coverUrl: string | null;
  durationWeeks: number;
  seats: number;
  perks: string;
  tags: string;
  startsAt: string | null;
  applyDeadline: string | null;
  status: string;
}

interface Resp {
  program: ProgramFull;
  hasApplied: boolean;
  myStatus: string | null;
}

function splitTags(s: string | null | undefined): string[] {
  return (s || "").split(/[,،]/).map((p) => p.trim()).filter(Boolean);
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [ventureName, setVentureName] = useState("");
  const [idea, setIdea] = useState("");
  const [motivation, setMotivation] = useState("");
  const [busy, setBusy] = useState(false);

  const q = useQuery<Resp>({
    queryKey: ["program", id],
    queryFn: () => api(`/programs/${id}`),
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
        <T size={16}>تعذّر التحميل.</T>
      </View>
    );
  }

  const p = q.data.program;
  const perks = (p.perks || "")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const tags = splitTags(p.tags);

  async function apply() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (idea.trim().length < 10) {
      Alert.alert("ناقص", "اكتب فكرتك بإيجاز (10 أحرف فأكثر)");
      return;
    }
    setBusy(true);
    try {
      await api(`/programs/${id}/apply`, {
        method: "POST",
        body: {
          ventureName: ventureName.trim(),
          idea: idea.trim(),
          motivation: motivation.trim(),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["program", id] });
    } catch (err) {
      Alert.alert("تعذّر الإرسال", err instanceof ApiError ? err.message : "حاول لاحقًا");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      {p.coverUrl ? (
        <Image
          source={{ uri: resolveMedia(p.coverUrl) }}
          style={{ width: "100%", height: 220, backgroundColor: colors.muted }}
          contentFit="cover"
        />
      ) : (
        <View style={{ width: "100%", height: 120, backgroundColor: colors.primarySoft }} />
      )}

      <View style={{ padding: 20, gap: 16 }}>
        <View
          style={{
            alignSelf: "flex-end",
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: p.status === "open" ? colors.primarySoft : colors.muted,
          }}
        >
          <T size={11} weight="bold" color={p.status === "open" ? colors.primary : colors.mutedForeground}>
            {PROGRAM_STATUS_LABELS[p.status] ?? p.status}
          </T>
        </View>

        <T size={24} weight="bold">{p.title}</T>
        {p.summary ? (
          <T size={15} color={colors.mutedForeground} style={{ lineHeight: 26 }}>{p.summary}</T>
        ) : null}

        {p.description ? (
          <Card>
            <T size={14} style={{ lineHeight: 24 }}>{p.description}</T>
          </Card>
        ) : null}

        {perks.length > 0 ? (
          <Card style={{ gap: 10 }}>
            <T size={12} color={colors.primary} weight="bold">ماذا تكسب</T>
            {perks.map((perk, i) => (
              <View key={i} style={{ flexDirection: "row-reverse", alignItems: "flex-start", gap: 8 }}>
                <Feather name="check-circle" size={14} color={colors.primary} style={{ marginTop: 4 }} />
                <T size={14} style={{ flex: 1, lineHeight: 22 }}>{perk}</T>
              </View>
            ))}
          </Card>
        ) : null}

        <Card style={{ gap: 12 }}>
          <T size={12} color={colors.primary} weight="bold">تفاصيل البرنامج</T>
          {p.durationWeeks > 0 ? (
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
              <Feather name="clock" size={14} color={colors.primary} />
              <T size={13}>المدّة: {p.durationWeeks} أسبوع</T>
            </View>
          ) : null}
          {p.seats > 0 ? (
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
              <Feather name="users" size={14} color={colors.primary} />
              <T size={13}>المقاعد: {p.seats}</T>
            </View>
          ) : null}
          {p.startsAt ? (
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
              <Feather name="calendar" size={14} color={colors.primary} />
              <T size={13}>يبدأ: {formatDate(p.startsAt)}</T>
            </View>
          ) : null}
          {p.applyDeadline ? (
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
              <Feather name="calendar" size={14} color={colors.primary} />
              <T size={13}>آخر موعد: {formatDate(p.applyDeadline)}</T>
            </View>
          ) : null}
        </Card>

        {tags.length > 0 ? (
          <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 }}>
            {tags.map((t, i) => (
              <View key={i} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.muted }}>
                <T size={12} weight="medium" color={colors.mutedForeground}>{t}</T>
              </View>
            ))}
          </View>
        ) : null}

        <Card style={{ gap: 12 }}>
          <T size={12} color={colors.primary} weight="bold">التقديم على البرنامج</T>

          {q.data.hasApplied ? (
            <View style={{ alignItems: "center", paddingVertical: 12, gap: 8 }}>
              <Feather name="check-circle" size={36} color={colors.primary} />
              <T size={14} weight="bold" align="center">قدّمت على هذا البرنامج</T>
              <T size={12} color={colors.mutedForeground} align="center">
                الحالة: {q.data.myStatus ? APP_STATUS_LABELS[q.data.myStatus] ?? q.data.myStatus : "—"}
              </T>
            </View>
          ) : p.status !== "open" ? (
            <T size={13} color={colors.mutedForeground} align="center" style={{ paddingVertical: 12 }}>
              التقديم على هذا البرنامج مغلق حاليًا.
            </T>
          ) : !user ? (
            <>
              <T size={13} color={colors.mutedForeground} style={{ lineHeight: 22 }}>
                سجّل دخولك لتقديم مشروعك.
              </T>
              <Btn title="تسجيل الدخول" onPress={() => router.push("/login")} />
            </>
          ) : (
            <>
              <Field
                label="اسم المشروع (اختياري)"
                value={ventureName}
                onChangeText={setVentureName}
                maxLength={200}
              />
              <Field
                label="فكرة المشروع"
                value={idea}
                onChangeText={setIdea}
                maxLength={4000}
                multiline
                numberOfLines={4}
              />
              <Field
                label="لماذا تريد الانضمام؟ (اختياري)"
                value={motivation}
                onChangeText={setMotivation}
                maxLength={4000}
                multiline
                numberOfLines={3}
              />
              <Btn title="إرسال طلب التقديم" loading={busy} onPress={apply} />
            </>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}
