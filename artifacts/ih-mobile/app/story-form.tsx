import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { T, Card, Btn } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MyStoryData {
  id: number;
  quote: string;
  story: string;
  ventureName: string;
  projectUrl: string | null;
  status: "draft" | "published" | "hidden" | "rejected" | "deleted";
  rejectionNote: string | null;
}

// ─── Story Form Screen ─────────────────────────────────────────────────────────

export default function StoryFormScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [story, setStory] = useState<MyStoryData | null | undefined>(undefined);
  const [form, setForm] = useState({
    quote: "",
    fullStory: "",
    ventureName: "",
    projectUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ story: MyStoryData | null }>("/me/story")
      .then((r) => {
        setStory(r.story);
        if (r.story) {
          setForm({
            quote: r.story.quote,
            fullStory: r.story.story,
            ventureName: r.story.ventureName,
            projectUrl: r.story.projectUrl ?? "",
          });
        }
      })
      .catch(() => setStory(null));
  }, []);

  async function handleSubmit() {
    setError(null);
    if (form.quote.trim().length < 10) {
      setError("الاقتباس قصير جدًّا (10 أحرف على الأقل)");
      return;
    }
    setSaving(true);
    try {
      // Use PATCH only when an active draft exists; deleted stories resubmit via POST
      const isDraftEdit = story !== null && story !== undefined && story.status === "draft";
      await api<{ story: MyStoryData }>("/me/story", {
        method: isDraftEdit ? "PATCH" : "POST",
        body: {
          quote: form.quote,
          story: form.fullStory,
          ventureName: form.ventureName,
          projectUrl: form.projectUrl || null,
        },
      });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر إرسال القصّة");
    } finally {
      setSaving(false);
    }
  }

  function handleWithdraw() {
    Alert.alert(
      "سحب القصّة",
      "هل أنت متأكّد؟ ستُحذف قصّتك نهائيًّا ولا يمكن التراجع عن هذا الإجراء.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "سحب القصّة",
          style: "destructive",
          onPress: async () => {
            setWithdrawing(true);
            setError(null);
            try {
              await api("/me/story", { method: "DELETE" });
              router.back();
            } catch (e) {
              setError(e instanceof ApiError ? e.message : "تعذّر سحب القصّة");
              setWithdrawing(false);
            }
          },
        },
      ]
    );
  }

  const isDraft = story?.status === "draft";
  const isDeleted = story?.status === "deleted";
  const isEditing = isDraft;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 40,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Feather name="book-open" size={20} color={colors.primary} />
          <T size={22} weight="bold">
            {isEditing ? "تعديل قصّتي" : isDeleted ? "شارك قصّتك من جديد" : "شارك قصّتك"}
          </T>
        </View>

        <T size={13} color={colors.mutedForeground} style={{ lineHeight: 20 }}>
          قصّتك مصدر إلهام لكثيرين. شارك تجربتك مع آيلاند هيفن وكيف أسهمت في مسيرتك.
        </T>

        {story === undefined ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            {isDraft && (
              <View
                style={{
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "#f59e0b12",
                  borderWidth: 1,
                  borderColor: "#f59e0b30",
                  borderRadius: colors.radius,
                  padding: 12,
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#f59e0b" }} />
                <T size={12} color="#f59e0b">
                  قصّتك بانتظار مراجعة الإدارة — يمكنك تعديلها حتى ذلك الحين.
                </T>
              </View>
            )}

            <Card style={{ gap: 16 }}>
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                  <T size={13} weight="medium">اقتباسك</T>
                  <T size={12} color={colors.mutedForeground}>(مطلوب)</T>
                </View>
                <T size={12} color={colors.mutedForeground} style={{ lineHeight: 18 }}>
                  جملة أو جملتان تلخّصان ما أضافه آيلاند هيفن لمسيرتك.
                </T>
                <TextInput
                  value={form.quote}
                  onChangeText={(v) => setForm((f) => ({ ...f, quote: v }))}
                  placeholder="ما الذي أضافه آيلاند هيفن لمسيرتك؟"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  maxLength={600}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    borderRadius: colors.radius,
                    padding: 14,
                    fontSize: 14,
                    color: colors.foreground,
                    textAlign: "right",
                    writingDirection: "rtl",
                    minHeight: 100,
                    textAlignVertical: "top",
                    lineHeight: 22,
                  }}
                />
                <T size={11} color={colors.mutedForeground} style={{ textAlign: "left" }}>
                  {form.quote.length} / 600
                </T>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border }} />

              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                  <T size={13} weight="medium">قصّتك كاملة</T>
                  <T size={12} color={colors.mutedForeground}>(اختياريّ)</T>
                </View>
                <T size={12} color={colors.mutedForeground} style={{ lineHeight: 18 }}>
                  شارك رحلتك بتفاصيل أوسع — التحدّيات التي واجهتها، والإنجازات التي حقّقتها.
                </T>
                <TextInput
                  value={form.fullStory}
                  onChangeText={(v) => setForm((f) => ({ ...f, fullStory: v }))}
                  placeholder="شارك رحلتك بشكل أوسع…"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  maxLength={8000}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    borderRadius: colors.radius,
                    padding: 14,
                    fontSize: 14,
                    color: colors.foreground,
                    textAlign: "right",
                    writingDirection: "rtl",
                    minHeight: 160,
                    textAlignVertical: "top",
                    lineHeight: 22,
                  }}
                />
                <T size={11} color={colors.mutedForeground} style={{ textAlign: "left" }}>
                  {form.fullStory.length} / 8000
                </T>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border }} />

              <View style={{ gap: 6 }}>
                <T size={13} weight="medium">اسم مشروعك</T>
                <T size={12} color={colors.mutedForeground}>(اختياريّ)</T>
                <TextInput
                  value={form.ventureName}
                  onChangeText={(v) => setForm((f) => ({ ...f, ventureName: v }))}
                  placeholder="مثال: Tamkeen App"
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={200}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    borderRadius: colors.radius,
                    padding: 14,
                    fontSize: 14,
                    color: colors.foreground,
                    textAlign: "right",
                    writingDirection: "rtl",
                    height: 50,
                  }}
                />
              </View>

              <View style={{ gap: 6 }}>
                <T size={13} weight="medium">رابط المشروع</T>
                <T size={12} color={colors.mutedForeground}>(اختياريّ)</T>
                <TextInput
                  value={form.projectUrl}
                  onChangeText={(v) => setForm((f) => ({ ...f, projectUrl: v }))}
                  placeholder="https://example.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={500}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    borderRadius: colors.radius,
                    padding: 14,
                    fontSize: 14,
                    color: colors.foreground,
                    textAlign: "left",
                    writingDirection: "ltr",
                    height: 50,
                  }}
                />
              </View>
            </Card>

            {error ? (
              <View
                style={{
                  backgroundColor: "#ef444420",
                  borderWidth: 1,
                  borderColor: "#ef444440",
                  borderRadius: colors.radius,
                  padding: 14,
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Feather name="alert-circle" size={14} color="#ef4444" />
                <T size={13} color="#ef4444" style={{ flex: 1 }}>{error}</T>
              </View>
            ) : null}

            <Btn
              title={saving ? "جارٍ الإرسال…" : isEditing ? "تحديث القصّة" : "إرسال قصّتي"}
              fullWidth
              loading={saving}
              disabled={saving || withdrawing}
              onPress={handleSubmit}
            />

            {isDraft && (
              <Btn
                title={withdrawing ? "جارٍ السحب…" : "سحب القصّة"}
                variant="ghost"
                fullWidth
                loading={withdrawing}
                disabled={saving || withdrawing}
                style={{ borderColor: "#ef444440" }}
                onPress={handleWithdraw}
              />
            )}

            <Btn
              title="إلغاء"
              variant="ghost"
              fullWidth
              disabled={saving || withdrawing}
              onPress={() => router.back()}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
