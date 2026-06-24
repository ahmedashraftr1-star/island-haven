import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { T, Card, Btn } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/lib/i18n";

/** Compact language toggle pill (AR ⇄ EN). */
function LangPill() {
  const { lang, toggleLang } = useLanguage();
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={toggleLang}
      accessibilityRole="button"
      accessibilityLabel={lang === "ar" ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.primarySoft,
        borderWidth: 1,
        borderColor: colors.primary + "40",
      }}
    >
      <Feather name="globe" size={13} color={colors.primary} />
      <T size={12} weight="bold" color={colors.primary}>
        {lang === "ar" ? "English" : "العربية"}
      </T>
    </TouchableOpacity>
  );
}
import { useAuth } from "@/lib/auth-context";
import { resolveMedia, api, ApiError, API_BASE, getToken } from "@/lib/api";
import type { CurrentUser } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionStatus = "requested" | "confirmed" | "completed" | "declined" | "cancelled";

interface MySession {
  session: {
    id: number;
    topic: string;
    message: string;
    mode: "online" | "onsite";
    status: SessionStatus;
    createdAt: string;
    preferredAt: string | null;
  };
  expertName: string;
  expertAvatar: string | null;
  expertHeadline: string | null;
}

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
  const { lang } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading, signOut, refresh } = useAuth();
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pendingAsset, setPendingAsset] = useState<{ uri: string; name: string; mime: string } | null>(null);
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [isExpert, setIsExpert] = useState(false);

  useEffect(() => {
    api<{ value: string }>("/settings/contact-email")
      .then((r) => setContactEmail(r.value || ""))
      .catch(() => setContactEmail(""));
  }, []);

  useEffect(() => {
    if (!user) {
      setIsExpert(false);
      return;
    }
    let alive = true;
    api("/experts/me/profile")
      .then(() => alive && setIsExpert(true))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user]);

  function confirmAvatarDelete() {
    Alert.alert(
      "حذف الصورة الشخصيّة",
      "هل أنت متأكّد من حذف صورتك الشخصيّة؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: handleAvatarDelete,
        },
      ]
    );
  }

  async function handleAvatarDelete() {
    if (avatarDeleting) return;
    setAvatarDeleting(true);
    try {
      await api<{ user: CurrentUser }>("/auth/me", {
        method: "PATCH",
        body: { avatarUrl: null },
      });
      await refresh();
    } catch {
      Alert.alert("خطأ", "تعذّر حذف الصورة الشخصيّة، يرجى المحاولة مرّة أخرى.");
    } finally {
      setAvatarDeleting(false);
    }
  }

  async function handleAvatarUpload() {
    if (avatarUploading || avatarDeleting) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("إذن مطلوب", "يرجى السماح بالوصول إلى مكتبة الصور من إعدادات الجهاز.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const uriParts = asset.uri.split(".");
    const ext = uriParts[uriParts.length - 1]?.toLowerCase() ?? "jpg";
    const mimeMap: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
    const mime = mimeMap[ext] ?? "image/jpeg";
    setPendingAsset({ uri: asset.uri, name: `avatar.${ext}`, mime });
  }

  async function handleAvatarConfirm() {
    if (!pendingAsset || avatarUploading) return;
    setAvatarUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", { uri: pendingAsset.uri, name: pendingAsset.name, type: pendingAsset.mime } as unknown as Blob);
      const uploadRes = await fetch(`${API_BASE}/uploads/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!uploadRes.ok) {
        const d = await uploadRes.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? "تعذّر رفع الصورة");
      }
      const { url } = await uploadRes.json() as { url: string };
      await api<{ user: CurrentUser }>("/auth/me", {
        method: "PATCH",
        body: { avatarUrl: url },
      });
      await refresh();
      setPendingAsset(null);
    } catch (err) {
      Alert.alert("خطأ", err instanceof Error ? err.message : "تعذّر رفع الصورة الشخصيّة، يرجى المحاولة مرّة أخرى.");
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleAvatarCancelPreview() {
    setPendingAsset(null);
  }

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
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <T size={26} weight="bold" accessibilityRole="header">{lang === "ar" ? "حسابي" : "Account"}</T>
          <LangPill />
        </View>
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
        <ContactRow email={contactEmail} colors={colors} />
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
        <View style={{ position: "absolute", top: 0, right: 0, zIndex: 5 }}>
          <LangPill />
        </View>
        <TouchableOpacity
          onPress={() => router.push("/edit-profile" as never)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: colors.radius,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
          }}
          accessibilityRole="button"
          accessibilityLabel="تعديل الملف الشخصي"
        >
          <Feather name="edit-2" size={13} color={colors.mutedForeground} />
          <T size={12} color={colors.mutedForeground}>تعديل</T>
        </TouchableOpacity>
        <View style={{ position: "relative" }}>
          <TouchableOpacity
            onPress={handleAvatarUpload}
            disabled={avatarUploading || avatarDeleting}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="تغيير الصورة الشخصيّة"
            accessibilityState={{ disabled: avatarUploading || avatarDeleting }}
          >
            {user.avatarUrl ? (
              <Image source={{ uri: resolveMedia(user.avatarUrl) }} style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.muted }} />
            ) : (
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                <T size={32} weight="bold" color={colors.primary}>{user.fullName.trim().slice(0, 1)}</T>
              </View>
            )}
            <View style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              opacity: avatarUploading ? 0.5 : 1,
            }}>
              {avatarUploading ? (
                <ActivityIndicator size="small" color="#fff" style={{ transform: [{ scale: 0.6 }] }} />
              ) : (
                <Feather name="camera" size={13} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          {user.avatarUrl ? (
            <TouchableOpacity
              onPress={confirmAvatarDelete}
              disabled={avatarDeleting || avatarUploading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: "#ef444450",
                alignItems: "center",
                justifyContent: "center",
                opacity: avatarDeleting ? 0.5 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel="حذف الصورة الشخصيّة"
              accessibilityState={{ disabled: avatarDeleting || avatarUploading }}
            >
              {avatarDeleting ? (
                <ActivityIndicator size="small" color="#ef4444" style={{ transform: [{ scale: 0.6 }] }} />
              ) : (
                <Feather name="trash-2" size={13} color="#ef4444" />
              )}
            </TouchableOpacity>
          ) : null}
        </View>
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

      <MySessionsSection />

      {isExpert ? (
        <Btn title="لوحة الخبير" fullWidth onPress={() => router.push("/expert-dashboard" as never)} />
      ) : null}
      <Btn title="أضف عملاً" fullWidth onPress={() => router.push("/work/edit" as never)} />

      <Card style={{ gap: 0 }}>
        {[
          { icon: "award" as const, label: "لوحة الصدارة", route: "/leaderboard" },
          { icon: "gift" as const, label: "مزايا الأعضاء", route: "/perks" },
          { icon: "message-circle" as const, label: "الرسائل", route: "/messages" },
        ].map((item, i, arr) => (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.push(item.route as never)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 14,
              borderBottomWidth: i < arr.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
              <Feather name={item.icon} size={18} color={colors.primary} />
              <T size={14} weight="medium">{item.label}</T>
            </View>
            <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </Card>

      <Btn
        title="تغيير كلمة السرّ"
        variant="ghost"
        fullWidth
        style={{ borderColor: colors.border, marginBottom: 8 }}
        onPress={() => router.push("/change-password" as never)}
      />
      <Btn title="تسجيل الخروج" variant="ghost" fullWidth onPress={signOut} />
      <ContactRow email={contactEmail} colors={colors} />
      <Btn title="دخول الإدارة" variant="ghost" fullWidth onPress={() => router.push("/admin")} />

      <Modal
        visible={!!pendingAsset}
        transparent
        animationType="fade"
        onRequestClose={handleAvatarCancelPreview}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "#00000080", alignItems: "center", justifyContent: "center", padding: 24 }}
          onPress={handleAvatarCancelPreview}
        >
          <Pressable
            style={{
              backgroundColor: colors.background,
              borderRadius: colors.radius + 4,
              padding: 24,
              width: "100%",
              gap: 20,
            }}
            onPress={() => {}}
          >
            <T size={17} weight="bold" align="center">تغيير الصورة الشخصيّة</T>
            <T size={13} color={colors.mutedForeground} align="center">
              مقارنة الصورة الحاليّة بالصورة الجديدة
            </T>

            <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <View style={{ alignItems: "center", gap: 8 }}>
                <T size={11} weight="medium" color={colors.mutedForeground}>الحاليّة</T>
                {user?.avatarUrl ? (
                  <Image
                    source={{ uri: resolveMedia(user.avatarUrl) }}
                    style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.muted }}
                  />
                ) : (
                  <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                    <T size={30} weight="bold" color={colors.primary}>{user?.fullName.trim().slice(0, 1) ?? "؟"}</T>
                  </View>
                )}
              </View>

              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
              </View>

              <View style={{ alignItems: "center", gap: 8 }}>
                <T size={11} weight="medium" color={colors.primary}>الجديدة</T>
                {pendingAsset ? (
                  <Image
                    source={{ uri: pendingAsset.uri }}
                    style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.muted, borderWidth: 2, borderColor: colors.primary }}
                  />
                ) : null}
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Btn
                title={avatarUploading ? "جارٍ الرفع…" : "تأكيد الصورة الجديدة"}
                fullWidth
                loading={avatarUploading}
                disabled={avatarUploading}
                onPress={handleAvatarConfirm}
              />
              <Btn
                title="إلغاء"
                variant="ghost"
                fullWidth
                disabled={avatarUploading}
                onPress={handleAvatarCancelPreview}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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

// Lighter text tones so badges read on the dark cinematic surfaces.
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#f59e0b22", text: "#fbbf24" },
  published: { bg: "#10b98122", text: "#34d399" },
  hidden: { bg: "#94a3b822", text: "#94a3b8" },
  rejected: { bg: "#ef444422", text: "#f87171" },
  deleted: { bg: "#94a3b822", text: "#94a3b8" },
};

function MyStorySection() {
  const colors = useColors();
  const router = useRouter();

  const [story, setStory] = useState<MyStoryData | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Inline edit-before-resubmit state
  const [editingBeforeResubmit, setEditingBeforeResubmit] = useState(false);
  const [resubmitForm, setResubmitForm] = useState({
    quote: "",
    fullStory: "",
    ventureName: "",
    projectUrl: "",
  });
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    api<{ story: MyStoryData | null }>("/me/story")
      .then((r) => setStory(r.story))
      .catch(() => setStory(null));
  }, []);

  function startEditing() {
    if (!story) return;
    setResubmitForm({
      quote: story.quote,
      fullStory: story.story,
      ventureName: story.ventureName,
      projectUrl: story.projectUrl ?? "",
    });
    setError(null);
    setEditingBeforeResubmit(true);
  }

  async function handleResubmitWithEdits() {
    setError(null);
    if (resubmitForm.quote.trim().length < 10) {
      setError("الاقتباس قصير جدًّا (10 أحرف على الأقل)");
      return;
    }
    setResubmitting(true);
    try {
      const r = await api<{ story: MyStoryData }>("/me/story/resubmit", {
        method: "POST",
        body: {
          quote: resubmitForm.quote,
          story: resubmitForm.fullStory,
          ventureName: resubmitForm.ventureName,
          projectUrl: resubmitForm.projectUrl || null,
        },
      });
      setStory(r.story);
      setEditingBeforeResubmit(false);
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

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: colors.radius,
    padding: 12,
    fontSize: 14,
    color: colors.foreground,
    textAlign: "right" as const,
    writingDirection: "rtl" as const,
    lineHeight: 22,
  };

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
            <Feather name="check-circle" size={14} color="#34d399" />
            <T size={13} color="#34d399">قصّتك منشورة في صفحة قصص النجاح</T>
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
        editingBeforeResubmit ? (
          <View style={{ gap: 12 }}>
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                <T size={13} weight="medium">اقتباسك</T>
                <T size={12} color={colors.mutedForeground}>(مطلوب)</T>
              </View>
              <TextInput
                value={resubmitForm.quote}
                onChangeText={(v) => setResubmitForm((f) => ({ ...f, quote: v }))}
                placeholder="ما الذي أضافه آيلاند هيفن لمسيرتك؟"
                placeholderTextColor={colors.mutedForeground}
                multiline
                maxLength={600}
                style={{ ...inputStyle, minHeight: 90, textAlignVertical: "top" }}
              />
              <T size={11} color={colors.mutedForeground} style={{ textAlign: "left" }}>
                {resubmitForm.quote.length} / 600
              </T>
            </View>

            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                <T size={13} weight="medium">قصّتك كاملة</T>
                <T size={12} color={colors.mutedForeground}>(اختياريّ)</T>
              </View>
              <TextInput
                value={resubmitForm.fullStory}
                onChangeText={(v) => setResubmitForm((f) => ({ ...f, fullStory: v }))}
                placeholder="شارك رحلتك بشكل أوسع…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                maxLength={8000}
                style={{ ...inputStyle, minHeight: 130, textAlignVertical: "top" }}
              />
              <T size={11} color={colors.mutedForeground} style={{ textAlign: "left" }}>
                {resubmitForm.fullStory.length} / 8000
              </T>
            </View>

            <View style={{ gap: 6 }}>
              <T size={13} weight="medium">اسم مشروعك</T>
              <T size={12} color={colors.mutedForeground}>(اختياريّ)</T>
              <TextInput
                value={resubmitForm.ventureName}
                onChangeText={(v) => setResubmitForm((f) => ({ ...f, ventureName: v }))}
                placeholder="مثال: Tamkeen App"
                placeholderTextColor={colors.mutedForeground}
                maxLength={200}
                style={{ ...inputStyle, height: 48 }}
              />
            </View>

            <View style={{ gap: 6 }}>
              <T size={13} weight="medium">رابط المشروع</T>
              <T size={12} color={colors.mutedForeground}>(اختياريّ)</T>
              <TextInput
                value={resubmitForm.projectUrl}
                onChangeText={(v) => setResubmitForm((f) => ({ ...f, projectUrl: v }))}
                placeholder="https://example.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={500}
                style={{ ...inputStyle, height: 48, textAlign: "left", writingDirection: "ltr" }}
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
              title={resubmitting ? "جارٍ الإرسال…" : "إرسال وإعادة التقديم"}
              fullWidth
              loading={resubmitting}
              disabled={resubmitting}
              onPress={handleResubmitWithEdits}
            />
            <Btn
              title="إلغاء"
              variant="ghost"
              fullWidth
              disabled={resubmitting}
              onPress={() => { setEditingBeforeResubmit(false); setError(null); }}
            />
          </View>
        ) : (
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
                <Feather name="x-circle" size={14} color="#f87171" />
                <T size={13} weight="medium" color="#f87171">لم تُقبَل قصّتك هذه المرّة</T>
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

            <Btn
              title="إعادة تقديم القصّة"
              fullWidth
              onPress={startEditing}
            />
          </View>
        )

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

// ─── My Sessions Section ──────────────────────────────────────────────────────

const SESSION_STATUS_AR: Record<SessionStatus, string> = {
  requested: "بانتظار التأكيد",
  confirmed: "مؤكّدة",
  completed: "تمّت",
  declined: "مرفوضة",
  cancelled: "ملغاة",
};

// Text tones chosen to read on the dark cinematic surfaces (lighter than the
// web's dark-on-light variants); backgrounds stay translucent tints.
const SESSION_STATUS_COLOR: Record<SessionStatus, { bg: string; text: string }> = {
  requested: { bg: "rgba(251,191,36,0.16)", text: "#fbbf24" },
  confirmed: { bg: "rgba(16,185,129,0.16)", text: "#34d399" },
  completed: { bg: "rgba(129,140,248,0.16)", text: "#a5b4fc" },
  declined: { bg: "rgba(148,163,184,0.16)", text: "#94a3b8" },
  cancelled: { bg: "rgba(148,163,184,0.16)", text: "#94a3b8" },
};

function fmtSessionDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-EG-u-ca-gregory", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function MySessionsSection() {
  const colors = useColors();
  const router = useRouter();
  const [sessions, setSessions] = useState<MySession[] | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      const r = await api<{ sessions: MySession[] }>("/me/sessions");
      setSessions(r.sessions);
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function cancel(id: number) {
    Alert.alert("إلغاء طلب الجلسة؟", "", [
      { text: "تراجع", style: "cancel" },
      {
        text: "إلغاء الجلسة",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/me/sessions/${id}`, { method: "DELETE" });
            setSessions((rs) =>
              rs
                ? rs.map((r) =>
                    r.session.id === id ? { ...r, session: { ...r.session, status: "cancelled" } } : r,
                  )
                : rs,
            );
          } catch {
            Alert.alert("تعذّر", "حاول لاحقًا");
          }
        },
      },
    ]);
  }

  if (sessions === undefined) {
    return (
      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
          <Feather name="calendar" size={16} color={colors.mutedForeground} />
          <T size={14} weight="bold">جلسات الإرشاد</T>
        </View>
        <View style={{ alignItems: "center", paddingVertical: 12 }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Card>
    );
  }

  if (sessions.length === 0) return null;

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
        <Feather name="calendar" size={16} color={colors.mutedForeground} />
        <T size={14} weight="bold">جلسات الإرشاد</T>
      </View>

      {sessions.map((row) => {
        const s = row.session;
        const badge = SESSION_STATUS_COLOR[s.status] ?? { bg: colors.muted, text: colors.mutedForeground };
        const canRate = s.status === "completed";
        const canCancel = s.status === "requested" || s.status === "confirmed";

        return (
          <View
            key={s.id}
            style={{
              gap: 10,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
              {row.expertAvatar ? (
                <Image
                  source={{ uri: resolveMedia(row.expertAvatar) }}
                  style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.muted }}
                />
              ) : (
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: colors.primarySoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <T size={17} weight="bold" color={colors.primary}>
                    {row.expertName.trim().slice(0, 1)}
                  </T>
                </View>
              )}
              <View style={{ flex: 1, gap: 1 }}>
                <T size={13.5} weight="bold">{row.expertName}</T>
                {row.expertHeadline ? (
                  <T size={11.5} color={colors.mutedForeground} numberOfLines={1}>{row.expertHeadline}</T>
                ) : null}
              </View>
              <View
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: badge.bg,
                }}
              >
                <T size={10.5} weight="bold" color={badge.text}>
                  {SESSION_STATUS_AR[s.status]}
                </T>
              </View>
            </View>

            <T size={13.5} weight="bold">{s.topic}</T>

            <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }}>
              <T size={11} color={colors.mutedForeground}>
                {fmtSessionDate(s.createdAt)} · {s.mode === "online" ? "عن بُعد" : "في المساحة"}
              </T>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                {canRate ? (
                  <Pressable
                    onPress={() => router.push(`/sessions/${s.id}/rate` as never)}
                    accessibilityRole="button"
                    accessibilityLabel="تقييم الجلسة"
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    style={({ pressed }) => ({
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: colors.radius,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      backgroundColor: pressed ? colors.primarySoft : "transparent",
                    })}
                  >
                    <Feather name="star" size={12} color={colors.primary} />
                    <T size={12} weight="medium" color={colors.primary}>تقييم</T>
                  </Pressable>
                ) : null}
                {canCancel ? (
                  <Pressable
                    onPress={() => cancel(s.id)}
                    accessibilityRole="button"
                    accessibilityLabel="إلغاء الجلسة"
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    style={({ pressed }) => ({
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: colors.radius,
                      borderWidth: 1,
                      borderColor: "#ef444450",
                      backgroundColor: pressed ? "#ef444412" : "transparent",
                    })}
                  >
                    <Feather name="x" size={12} color="#ef4444" />
                    <T size={12} weight="medium" color="#ef4444">إلغاء</T>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

// ─── Contact Row ──────────────────────────────────────────────────────────────

function ContactRow({ email, colors }: { email: string | null; colors: ReturnType<typeof useColors> }) {
  const display = email === null ? "…" : email || "غير متاح";
  const tappable = !!email;

  return (
    <TouchableOpacity
      disabled={!tappable}
      onPress={() => tappable ? Linking.openURL(`mailto:${email}`) : undefined}
      activeOpacity={tappable ? 0.7 : 1}
      accessibilityRole={tappable ? "link" : "text"}
      accessibilityLabel={tappable ? `تواصل معنا: ${email}` : "تواصل معنا"}
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: colors.radius,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      <Feather name="mail" size={16} color={colors.primary} />
      <T size={13} color={colors.mutedForeground} style={{ width: 80 }}>تواصل معنا</T>
      <T size={14} color={tappable ? colors.primary : colors.mutedForeground} style={{ flex: 1 }}>
        {display}
      </T>
      {tappable ? <Feather name="external-link" size={14} color={colors.mutedForeground} /> : null}
    </TouchableOpacity>
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
