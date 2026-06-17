import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
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
  status: "draft" | "published" | "hidden" | "rejected" | "deleted";
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
  deleted: "محذوفة من قِبَل الإدارة",
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#f59e0b20", text: "#f59e0b" },
  published: { bg: "#10b98120", text: "#10b981" },
  hidden: { bg: "#6b728020", text: "#6b7280" },
  rejected: { bg: "#ef444420", text: "#ef4444" },
  deleted: { bg: "#6b728020", text: "#6b7280" },
};

function MyStorySection() {
  const colors = useColors();
  const router = useRouter();

  const [story, setStory] = useState<MyStoryData | null | undefined>(undefined);
  const [resubmitting, setResubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ story: MyStoryData | null }>("/me/story")
      .then((r) => setStory(r.story))
      .catch(() => setStory(null));
  }, []);

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

  const isPublished = story?.status === "published";
  const isRejected = story?.status === "rejected";
  const isDeleted = story?.status === "deleted";
  const hasStory = story !== null && story !== undefined;

  const badgeColor = story ? (STATUS_COLOR[story.status] ?? { bg: colors.muted, text: colors.mutedForeground }) : null;

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
        <Feather name="book-open" size={16} color={colors.mutedForeground} />
        <T size={14} weight="bold">قصّتي في الحاضنة</T>
        {hasStory && badgeColor && (
          <View
            style={{
              backgroundColor: badgeColor.bg,
              borderRadius: 20,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <T size={11} weight="medium" color={badgeColor.text}>
              {STATUS_LABEL[story!.status] ?? story!.status}
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
          <Btn
            title="تعديل القصّة"
            variant="ghost"
            fullWidth
            onPress={() => router.push("/story-form" as never)}
          />
        </View>

      ) : isDeleted ? (
        <View style={{ gap: 12 }}>
          <View
            style={{
              backgroundColor: "#6b728012",
              borderWidth: 1,
              borderColor: "#6b728030",
              borderRadius: colors.radius,
              padding: 12,
              gap: 6,
            }}
          >
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
              <Feather name="trash-2" size={14} color="#9ca3af" />
              <T size={13} weight="medium" color="#9ca3af">حذفت الإدارة قصّتك</T>
            </View>
            <T size={12} color={colors.mutedForeground} style={{ lineHeight: 20 }}>
              يمكنك كتابة قصّة جديدة وتقديمها مرّة أخرى للمراجعة.
            </T>
          </View>

          <Btn
            title="شارك قصّتك من جديد"
            fullWidth
            onPress={() => router.push("/story-form" as never)}
          />
        </View>

      ) : hasStory ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#f59e0b" }} />
            <T size={12} color={colors.mutedForeground}>
              قصّتك بانتظار مراجعة الإدارة — يمكنك تعديلها حتى ذلك الحين.
            </T>
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
          <Btn
            title="تعديل القصّة"
            variant="ghost"
            fullWidth
            onPress={() => router.push("/story-form" as never)}
          />
        </View>

      ) : (
        <View style={{ gap: 10 }}>
          <T size={13} color={colors.mutedForeground} style={{ lineHeight: 20 }}>
            شارك تجربتك مع آيلاند هيفن وكن مصدر إلهام لأعضاء الحاضنة.
          </T>
          <Btn
            title="شارك قصّتك"
            fullWidth
            onPress={() => router.push("/story-form" as never)}
          />
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
