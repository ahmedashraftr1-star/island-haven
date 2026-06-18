import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";

import { T, Card, Btn, Field } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Rating {
  rating: number;
  feedback: string;
}

const HINTS = ["", "ضعيفة", "مقبولة", "جيّدة", "ممتازة", "استثنائيّة"] as const;
const AMBER = "#f59e0b";

export default function RateSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    let alive = true;
    api<{ rating: Rating | null }>(`/me/sessions/${id}/rating`)
      .then((r) => {
        if (!alive) return;
        if (r.rating) {
          setRating(r.rating.rating);
          setFeedback(r.rating.feedback ?? "");
        }
        setReady(true);
      })
      .catch(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [id, user, loading, router]);

  async function submit() {
    if (rating < 1) {
      setErr("اختر عدد النجوم أوّلًا.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await api(`/me/sessions/${id}/rating`, {
        method: "POST",
        body: { rating, feedback: feedback.trim() },
      });
      setDone(true);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "تعذّر إرسال التقييم");
    } finally {
      setBusy(false);
    }
  }

  if (loading || (!ready && user)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 28, gap: 12 }}>
        <Feather name="check-circle" size={48} color="#10b981" />
        <T size={18} weight="bold" align="center">شكرًا لك على تقييمك</T>
        <T size={13.5} color={colors.mutedForeground} align="center" style={{ lineHeight: 22, maxWidth: 300 }}>
          وصلنا رأيك. ملاحظاتك تساعد المرشدين على التحسّن وغيرك على الاختيار.
        </T>
        <Btn title="عودة لحسابي" onPress={() => router.back()} style={{ marginTop: 8 }} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }}
    >
      <View>
        <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 4 }}>
          رأيك يصنع الفرق
        </T>
        <T size={24} weight="bold">قيّم جلستك</T>
        <T size={13} color={colors.mutedForeground} style={{ lineHeight: 21, marginTop: 4 }}>
          تقييمك سرّيّ ويُحتسب ضمن متوسّط الخبير.
        </T>
      </View>

      <Card style={{ gap: 16, alignItems: "center", paddingVertical: 24 }}>
        <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1 }}>
          كيف كانت الجلسة؟
        </T>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => { setRating(n); setErr(null); }} hitSlop={4}>
              <Ionicons
                name={n <= rating ? "star" : "star-outline"}
                size={38}
                color={n <= rating ? AMBER : colors.border}
              />
            </Pressable>
          ))}
        </View>
        <T size={13.5} weight="bold" color={AMBER} style={{ height: 18 }}>
          {HINTS[rating] || ""}
        </T>
      </Card>

      <Field
        label="ملاحظات (اختياريّ)"
        value={feedback}
        onChangeText={setFeedback}
        maxLength={2000}
        multiline
        numberOfLines={5}
        placeholder="ما الذي أعجبك؟ وما الذي يمكن تحسينه؟"
      />

      {err ? <T size={12.5} color={colors.destructive} align="center">{err}</T> : null}

      <Btn title="إرسال التقييم" loading={busy} onPress={submit} fullWidth />
    </ScrollView>
  );
}
