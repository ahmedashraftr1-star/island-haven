import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { T, Card, Btn } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth-context";
import { resolveMedia } from "@/lib/api";

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
