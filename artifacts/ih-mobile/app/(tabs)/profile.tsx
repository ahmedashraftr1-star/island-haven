import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { T, Card, Btn } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth-context";
import { resolveMedia, api, ApiError } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MyStoryData {
  id: number;
  quote: string;
  story: string;
  ventureName: string;
  projectUrl: string | null;
  status: "draft" | "published" | "hidden" | "rejected";
  rejectionNote: string | null;
}

// ─── Profile Screen ───────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 24, gap: 16 }}
      >
        <T size={26} weight="bold">حسابي</T>
        <Card style={{ alignItems: "center", paddingVertical: 32, gap: 14 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="user" size={32} color={colors.primary} />
          </View>
          <T size={17} weight="bold" align="center">سجّل دخولك للوصول لكامل المنصّة</T>
          <T size={13} color={colors.mutedForeground} align="center">
            أعمالك، حجوزاتك، وملفّك الشخصي في مكان واحد.
          </T>
          <View style={{ alignSelf: "stretch", gap: 8 }}>
            <Btn title="تسجيل الدخول" fullWidth onPress={() => router.push("/login")} />
            <Btn title="إنشاء حساب جديد" variant="ghost" fullWidth onPress={() => router.push("/register")} />
          </View>
        </Card>
        <Btn title="دخول الإدارة" variant="ghost" fullWidth onPress={() => router.push("/admin")} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 24, paddingBottom: 120, gap: 16 }}
    >
      <View style={{ alignItems: "center", gap: 12 }}>
        {user.avatarUrl ? (
          <Image source={{ uri: resolveMedia(user.avatarUrl) }} style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.muted }} />
        ) : (
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
            <T size={32} weight="bold" color={colors.primary}>{user.fullName.trim().slice(0, 1)}</T>
          </View>
        )}
        <T size={22} weight="bold">{user.fullName}</T>
        {user.jobTitle ? <T size={14} color={colors.mutedForeground}>{user.jobTitle}</T> : null}
      </View>

      <Card style={{ gap: 10 }}>
        <Row icon="mail" label="البريد" value={user.email} />
        {user.phone ? <Row icon="phone" label="الهاتف" value={user.phone} /> : null}
        {user.skills ? <Row icon="tag" label="المهارات" value={user.skills} /> : null}
      </Card>

      {user.bio ? (
        <Card>
          <T size={13} weight="medium" color={colors.mutedForeground}>نبذة</T>
          <T size={14} style={{ marginTop: 6, lineHeight: 22 }}>{user.bio}</T>
        </Card>
      ) : null}

      <MyStorySection />

      <Btn
        title="تغيير كلمة السرّ"
        variant="ghost"
        fullWidth
        style={{ borderColor: colors.border, marginBottom: 8 }}
        onPress={() => router.push("/change-password" as never)}
      />
      <Btn title="تسجيل الخروج" variant="ghost" fullWidth onPress={signOut} />
      <Btn title="دخول الإدارة" variant="ghost" fullWidth onPress={() => router.push("/admin")} />
    </ScrollView>
  );
}

// ─── My Story Section ─────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  draft: "بانتظار المراجعة",
  published: "منشورة",
  hidden: "مخفيّة",
  rejected: "مرفوضة",
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#f59e0b20", text: "#f59e0b" },
  published: { bg: "#10b98120", text: "#10b981" },
  hidden: { bg: "#6b728020", text: "#6b7280" },
  rejected: { bg: "#ef444420", text: "#ef4444" },
};

function MyStorySection() {
  const colors = useColors();

  const [story, setStory] = useState<MyStoryData | null | undefined>(undefined);
  const [form, setForm] = useState({ quote: "", fullStory: "", ventureName: "", projectUrl: "" });
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
      const isEdit = story !== null && story !== undefined;
      const r = await api<{ story: MyStoryData }>("/me/story", {
        method: isEdit ? "PATCH" : "POST",
        body: {
          quote: form.quote,
          story: form.fullStory,
          ventureName: form.ventureName,
          projectUrl: form.projectUrl || null,
        },
      });
      setStory(r.story);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
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
              setStory(null);
              setForm({ quote: "", fullStory: "", ventureName: "", projectUrl: "" });
            } catch (e) {
              setError(e instanceof ApiError ? e.message : "تعذّر سحب القصّة");
            } finally {
              setWithdrawing(false);
            }
          },
        },
      ]
    );
  }

  const isDraft = story?.status === "draft";
  const isPublished = story?.status === "published";
  const isRejected = story?.status === "rejected";

  async function handleResubmit() {
    setResubmitting(true);
    setError(null);
    try {
      const r = await api<{ story: MyStoryData }>("/me/story/resubmit", { method: "POST" });
      setStory(r.story);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر إعادة التقديم");
    } finally {
      setResubmitting(false);
    }
  }

  const badgeColor = story ? (STATUS_COLOR[story.status] ?? { bg: colors.muted, text: colors.mutedForeground }) : null;

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
        <Feather name="book-open" size={16} color={colors.mutedForeground} />
        <T size={14} weight="bold">قصّتي في الحاضنة</T>
        {story !== undefined && story !== null && badgeColor && (
          <View
            style={{
              backgroundColor: badgeColor.bg,
              borderRadius: 20,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <T size={11} weight="medium" color={badgeColor.text}>
              {STATUS_LABEL[story.status] ?? story.status}
            </T>
          </View>
        )}
      </View>

      {story === undefined ? (
        <View style={{ alignItems: "center", paddingVertical: 12 }}>
          <ActivityIndicator color={colors.primary} />
        </View>

      ) : isPublished ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
            <Feather name="check-circle" size={14} color="#10b981" />
            <T size={13} color="#10b981">قصّتك منشورة في صفحة قصص النجاح</T>
          </View>
          <View
            style={{
              backgroundColor: colors.muted,
              borderRadius: colors.radius,
              padding: 12,
            }}
          >
            <T size={13} color={colors.mutedForeground} style={{ lineHeight: 20, fontStyle: "italic" }}>
              "{story.quote}"
            </T>
          </View>
        </View>

      ) : isRejected ? (
        <View style={{ gap: 12 }}>
          <View
            style={{
              backgroundColor: "#ef444412",
              borderWidth: 1,
              borderColor: "#ef444430",
              borderRadius: colors.radius,
              padding: 12,
              gap: 6,
            }}
          >
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
              <Feather name="x-circle" size={14} color="#ef4444" />
              <T size={13} weight="medium" color="#ef4444">لم تُقبَل قصّتك هذه المرّة</T>
            </View>
            {story.rejectionNote ? (
              <T size={12} color={colors.mutedForeground} style={{ lineHeight: 20 }}>
                {story.rejectionNote}
              </T>
            ) : (
              <T size={12} color={colors.mutedForeground}>
                يمكنك تعديل قصّتك وإعادة تقديمها للمراجعة.
              </T>
            )}
          </View>

          {error ? (
            <View
              style={{
                backgroundColor: "#ef444420",
                borderWidth: 1,
                borderColor: "#ef444440",
                borderRadius: colors.radius,
                padding: 12,
              }}
            >
              <T size={13} color="#ef4444">{error}</T>
            </View>
          ) : null}

          <Btn
            title={resubmitting ? "جارٍ المعالجة…" : "إعادة تقديم القصّة"}
            fullWidth
            loading={resubmitting}
            disabled={resubmitting}
            onPress={handleResubmit}
          />
        </View>

      ) : (
        <View style={{ gap: 12 }}>
          {story !== null && (
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#f59e0b" }} />
              <T size={12} color={colors.mutedForeground}>
                قصّتك بانتظار مراجعة الإدارة — يمكنك تعديلها حتى ذلك الحين.
              </T>
            </View>
          )}

          {done && (
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
              <Feather name="check-circle" size={14} color="#10b981" />
              <T size={13} color="#10b981">تمّ إرسال قصّتك بنجاح — ستُراجَع قريبًا وتُنشَر!</T>
            </View>
          )}

          <View style={{ gap: 4 }}>
            <T size={12} weight="medium" color={colors.mutedForeground}>
              اقتباسك <T size={11} color={colors.mutedForeground}>(مطلوب)</T>
            </T>
            <TextInput
              value={form.quote}
              onChangeText={(v) => setForm((f) => ({ ...f, quote: v }))}
              placeholder="ما الذي أضافه آيلاند هيفن لمسيرتك؟"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              maxLength={600}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.background,
                borderRadius: colors.radius,
                padding: 12,
                fontSize: 14,
                color: colors.foreground,
                textAlign: "right",
                writingDirection: "rtl",
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <T size={12} weight="medium" color={colors.mutedForeground}>
              قصّتك كاملة <T size={11} color={colors.mutedForeground}>(اختياريّ)</T>
            </T>
            <TextInput
              value={form.fullStory}
              onChangeText={(v) => setForm((f) => ({ ...f, fullStory: v }))}
              placeholder="شارك رحلتك بشكل أوسع…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              maxLength={8000}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.background,
                borderRadius: colors.radius,
                padding: 12,
                fontSize: 14,
                color: colors.foreground,
                textAlign: "right",
                writingDirection: "rtl",
                minHeight: 96,
                textAlignVertical: "top",
              }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <T size={12} weight="medium" color={colors.mutedForeground}>اسم مشروعك (اختياريّ)</T>
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
                padding: 12,
                fontSize: 14,
                color: colors.foreground,
                textAlign: "right",
                writingDirection: "rtl",
                height: 48,
              }}
            />
          </View>

          {error ? (
            <View
              style={{
                backgroundColor: "#ef444420",
                borderWidth: 1,
                borderColor: "#ef444440",
                borderRadius: colors.radius,
                padding: 12,
              }}
            >
              <T size={13} color="#ef4444">{error}</T>
            </View>
          ) : null}

          <Btn
            title={saving ? "جارٍ الإرسال…" : story ? "تحديث القصّة" : "إرسال قصّتي"}
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
        </View>
      )}
    </Card>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function Row({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
      <Feather name={icon} size={16} color={colors.mutedForeground} />
      <T size={13} color={colors.mutedForeground} style={{ width: 64 }}>{label}</T>
      <T size={14} style={{ flex: 1 }}>{value}</T>
    </View>
  );
}
