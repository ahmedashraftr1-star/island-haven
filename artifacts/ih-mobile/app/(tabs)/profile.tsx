import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { T, Card, Btn } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth-context";
import { api, resolveMedia } from "@/lib/api";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading, signOut } = useAuth();
  const [isExpert, setIsExpert] = useState(false);

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

      <MyMentorshipSessions colors={colors} />

      {isExpert ? (
        <Btn title="لوحة الخبير" fullWidth onPress={() => router.push("/expert-dashboard" as never)} />
      ) : null}
      <Btn title="أضف عملاً" fullWidth onPress={() => router.push("/work/edit" as never)} />
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

// ─── A member's own mentorship sessions (mirrors web Profile) ──────────────────

type SStatus = "requested" | "confirmed" | "completed" | "declined" | "cancelled";
const SS_AR: Record<SStatus, string> = {
  requested: "بانتظار",
  confirmed: "مؤكّدة",
  completed: "تمّت",
  declined: "مرفوضة",
  cancelled: "ملغاة",
};
const SM_AR: Record<"online" | "onsite", string> = { online: "عن بُعد", onsite: "في المساحة" };

interface MySession {
  session: {
    id: number;
    topic: string;
    mode: "online" | "onsite";
    preferredAt: string | null;
    status: SStatus;
    createdAt: string;
  };
  expertName: string;
  expertHeadline: string;
}

function fmtWhen(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ar-EG-u-ca-gregory", {
      weekday: "short",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function MyMentorshipSessions({ colors }: { colors: ReturnType<typeof useColors> }) {
  const [rows, setRows] = useState<MySession[] | null>(null);

  useEffect(() => {
    let alive = true;
    api<{ sessions: MySession[] }>("/me/sessions")
      .then((r) => alive && setRows(r.sessions))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, []);

  if (!rows || rows.length === 0) return null;

  function cancel(id: number) {
    Alert.alert("إلغاء طلب الجلسة؟", "", [
      { text: "تراجع", style: "cancel" },
      {
        text: "إلغاء الجلسة",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/me/sessions/${id}`, { method: "DELETE" });
            setRows((rs) =>
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

  const badge: Record<SStatus, { bg: string; fg: string }> = {
    requested: { bg: "rgba(251,191,36,0.14)", fg: "#b45309" },
    confirmed: { bg: "rgba(16,185,129,0.14)", fg: "#059669" },
    completed: { bg: colors.primarySoft, fg: colors.primary },
    declined: { bg: colors.muted, fg: colors.mutedForeground },
    cancelled: { bg: colors.muted, fg: colors.mutedForeground },
  };

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
        <Feather name="calendar" size={16} color={colors.primary} />
        <T size={15} weight="bold">جلسات الإرشاد</T>
        <T size={12} color={colors.mutedForeground}>({rows.length})</T>
      </View>
      {rows.map((r) => {
        const s = r.session;
        const canCancel = s.status === "requested" || s.status === "confirmed";
        const c = badge[s.status];
        return (
          <View
            key={s.id}
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 10,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <T size={13.5} weight="bold" numberOfLines={1}>{s.topic}</T>
              <T size={11.5} color={colors.mutedForeground} numberOfLines={1}>
                مع {r.expertName} · {SM_AR[s.mode]}
                {s.preferredAt ? ` · ${fmtWhen(s.preferredAt)}` : ""}
              </T>
            </View>
            <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: c.bg }}>
              <T size={10} weight="bold" color={c.fg}>{SS_AR[s.status]}</T>
            </View>
            {canCancel ? (
              <Pressable onPress={() => cancel(s.id)} hitSlop={8}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}
