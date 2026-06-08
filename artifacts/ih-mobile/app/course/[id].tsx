import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { T, Card, Btn } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const COURSE_TYPE_LABELS: Record<string, string> = {
  course: "كورس",
  workshop: "ورشة",
};

const COURSE_STATUS_LABELS: Record<string, string> = {
  draft: "مسوّدة",
  open: "تسجيل مفتوح",
  closed: "مكتمل العدد",
  done: "منتهٍ",
};

interface CourseFull {
  id: number;
  type: string;
  title: string;
  summary: string;
  description: string;
  instructor: string;
  coverUrl: string | null;
  location: string;
  startsAt: string | null;
  endsAt: string | null;
  capacity: number;
  status: string;
  enrolled: number;
}

interface Resp {
  course: CourseFull;
  isEnrolled: boolean;
  myEnrollmentStatus: string | null;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const q = useQuery<Resp>({
    queryKey: ["course", id],
    queryFn: () => api(`/courses/${id}`),
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

  const c = q.data.course;
  const isFull = c.capacity > 0 && c.enrolled >= c.capacity;

  async function enroll() {
    if (!user) { router.push("/login"); return; }
    setBusy(true);
    try {
      await api(`/courses/${id}/enroll`, { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["course", id] });
      Alert.alert("تمّ", "سنتواصل معك لتأكيد المقعد.");
    } catch (err) {
      Alert.alert("تعذّر التسجيل", err instanceof ApiError ? err.message : "حاول لاحقًا");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    Alert.alert("إلغاء الحجز", "هل تريد إلغاء تسجيلك؟", [
      { text: "تراجع", style: "cancel" },
      {
        text: "نعم، ألغِ",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await api(`/courses/${id}/enroll`, { method: "DELETE" });
            await queryClient.invalidateQueries({ queryKey: ["course", id] });
          } catch (err) {
            Alert.alert("تعذّر", err instanceof ApiError ? err.message : "حاول لاحقًا");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 80 }}>
      {c.coverUrl ? (
        <Image
          source={{ uri: resolveMedia(c.coverUrl) }}
          style={{ width: "100%", height: 200, backgroundColor: colors.muted }}
          contentFit="cover"
        />
      ) : (
        <View style={{ width: "100%", height: 120, backgroundColor: colors.primarySoft }} />
      )}

      <View style={{ padding: 20, gap: 16 }}>
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.primarySoft }}>
            <T size={10} weight="bold" color={colors.primary}>
              {COURSE_TYPE_LABELS[c.type] ?? c.type}
            </T>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.muted }}>
            <T size={10} weight="bold" color={colors.mutedForeground}>
              {COURSE_STATUS_LABELS[c.status] ?? c.status}
            </T>
          </View>
        </View>

        <T size={24} weight="bold">{c.title}</T>
        {c.summary ? (
          <T size={15} color={colors.mutedForeground} style={{ lineHeight: 26 }}>{c.summary}</T>
        ) : null}

        {c.description ? (
          <Card>
            <T size={14} style={{ lineHeight: 24 }}>{c.description}</T>
          </Card>
        ) : null}

        <Card style={{ gap: 12 }}>
          <T size={12} color={colors.primary} weight="bold">التفاصيل</T>
          {c.instructor ? (
            <View style={{ flexDirection: "row-reverse", alignItems: "flex-start", gap: 10 }}>
              <Feather name="user" size={14} color={colors.primary} style={{ marginTop: 3 }} />
              <View style={{ flex: 1 }}>
                <T size={11} color={colors.mutedForeground}>المُدرِّب</T>
                <T size={14} weight="bold">{c.instructor}</T>
              </View>
            </View>
          ) : null}
          {c.startsAt ? (
            <View style={{ flexDirection: "row-reverse", alignItems: "flex-start", gap: 10 }}>
              <Feather name="calendar" size={14} color={colors.primary} style={{ marginTop: 3 }} />
              <View style={{ flex: 1 }}>
                <T size={11} color={colors.mutedForeground}>يبدأ</T>
                <T size={13} weight="bold">{formatDateTime(c.startsAt)}</T>
                {c.endsAt ? (
                  <T size={12} color={colors.mutedForeground}>ينتهي: {formatDateTime(c.endsAt)}</T>
                ) : null}
              </View>
            </View>
          ) : null}
          {c.location ? (
            <View style={{ flexDirection: "row-reverse", alignItems: "flex-start", gap: 10 }}>
              <Feather name="map-pin" size={14} color={colors.primary} style={{ marginTop: 3 }} />
              <View style={{ flex: 1 }}>
                <T size={11} color={colors.mutedForeground}>المكان</T>
                <T size={14} weight="bold">{c.location}</T>
              </View>
            </View>
          ) : null}
          <View style={{ flexDirection: "row-reverse", alignItems: "flex-start", gap: 10 }}>
            <Feather name="users" size={14} color={colors.primary} style={{ marginTop: 3 }} />
            <View style={{ flex: 1 }}>
              <T size={11} color={colors.mutedForeground}>المُسجَّلون</T>
              <T size={14} weight="bold">
                {c.enrolled}{c.capacity > 0 ? ` من أصل ${c.capacity}` : ""}
              </T>
            </View>
          </View>
        </Card>

        <Card style={{ gap: 12 }}>
          {!user ? (
            <>
              <T size={13} color={colors.mutedForeground} style={{ lineHeight: 22 }}>
                سجّل دخولك لحجز مقعدك في هذه الفعاليّة.
              </T>
              <Btn title="تسجيل الدخول" onPress={() => router.push("/login")} />
            </>
          ) : q.data.isEnrolled ? (
            <>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                <Feather name="check-circle" size={18} color={colors.primary} />
                <T size={14} weight="bold" color={colors.primary}>
                  أنت مسجَّل
                  {q.data.myEnrollmentStatus === "confirmed" ? " (مؤكَّد)" : " (بانتظار التأكيد)"}
                </T>
              </View>
              <Btn title="إلغاء الحجز" variant="ghost" loading={busy} onPress={cancel} />
            </>
          ) : c.status === "done" ? (
            <T size={13} color={colors.mutedForeground} align="center" style={{ paddingVertical: 8 }}>
              هذه الفعاليّة منتهية.
            </T>
          ) : isFull || c.status === "closed" ? (
            <T size={13} color={colors.mutedForeground} align="center" style={{ paddingVertical: 8 }}>
              اكتمل العدد. ترقّب الدفعة القادمة.
            </T>
          ) : (
            <>
              <T size={13} color={colors.mutedForeground} style={{ lineHeight: 22 }}>
                مَجّاني تمامًا — احجز مقعدك الآن.
              </T>
              <Btn title="احجز مقعدي" loading={busy} onPress={enroll} />
            </>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}
