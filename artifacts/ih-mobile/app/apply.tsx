import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { T, Card, Btn, Field } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError } from "@/lib/api";

type CategoryId = "freelancer" | "graduate" | "student" | "other";

const CATEGORIES: Array<{ id: CategoryId; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: "freelancer", label: "مستقلّ", icon: "briefcase" },
  { id: "graduate", label: "خرّيج", icon: "award" },
  { id: "student", label: "طالب", icon: "book-open" },
  { id: "other", label: "أخرى", icon: "user" },
];

export default function ApplyScreen() {
  const colors = useColors();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<CategoryId>("freelancer");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: number } | null>(null);

  const canSubmit =
    fullName.trim().length >= 2 &&
    email.trim().length > 3 &&
    phone.trim().length >= 6 &&
    bio.trim().length >= 10;

  async function submit() {
    if (!canSubmit) {
      Alert.alert("ناقص", "املأ كلّ الحقول بشكل صحيح");
      return;
    }
    setBusy(true);
    try {
      const r = await api<{ ok: boolean; id: number }>("/applications", {
        method: "POST",
        body: { fullName, email, phone, category, bio },
      });
      setDone({ id: r.id });
    } catch (err) {
      Alert.alert("تعذّر الإرسال", err instanceof ApiError ? err.message : "حاول لاحقًا");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: "center" }}
      >
        <View style={{ alignItems: "center", gap: 16 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="check-circle" size={42} color={colors.primary} />
          </View>
          <T size={12} color={colors.primary} weight="bold" align="center">وصل طلبك</T>
          <T size={26} weight="bold" align="center">
            شكرًا يا {fullName.trim().split(" ")[0] || "صديقنا"}
          </T>
          <T size={14} color={colors.mutedForeground} align="center" style={{ lineHeight: 24 }}>
            استلمنا طلبك بأمان. سنراجعه ونتواصل معك على واتساب خلال أيّام.{"\n"}
            مرحبًا بك في عائلة آيلاند هيفن.
          </T>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: colors.muted,
            }}
          >
            <T size={11} weight="bold" color={colors.mutedForeground}>
              رقم الطلب · #{String(done.id).padStart(5, "0")}
            </T>
          </View>
          <Btn title="العودة للرئيسيّة" fullWidth onPress={() => router.replace("/")} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 80 }}
    >
      <View style={{ alignItems: "center", gap: 8 }}>
        <T size={11} color={colors.primary} weight="bold">طلب انتساب · مجّاناً</T>
        <T size={26} weight="bold" align="center">انضمّ إلى آيلاند هيفن</T>
        <T size={13} color={colors.mutedForeground} align="center" style={{ lineHeight: 22 }}>
          حاضنة أعمال مجّانيّة تتّسع لأحلامك في غزّة. املأ الطلب وسنتواصل معك خلال أيّام.
        </T>
      </View>

      <Card style={{ gap: 14 }}>
        <T size={12} color={colors.primary} weight="bold">٠١ · مَن أنت</T>
        <Field label="الاسم الكامل" value={fullName} onChangeText={setFullName} placeholder="مثال: ياسمين الغزّاوي" />
        <Field
          label="البريد الإلكتروني"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="رقم الواتساب"
          value={phone}
          onChangeText={setPhone}
          placeholder="+970 …"
          keyboardType="phone-pad"
        />
      </Card>

      <Card style={{ gap: 12 }}>
        <T size={12} color={colors.primary} weight="bold">٠٢ · ما تصنيفك</T>
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={{
                  flex: 1,
                  minWidth: 110,
                  paddingVertical: 14,
                  paddingHorizontal: 10,
                  borderRadius: colors.radius,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySoft : "transparent",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Feather name={cat.icon} size={20} color={active ? colors.primary : colors.mutedForeground} />
                <T size={13} weight="medium" color={active ? colors.primary : colors.foreground}>
                  {cat.label}
                </T>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ gap: 10 }}>
        <T size={12} color={colors.primary} weight="bold">٠٣ · حدّثنا عنك</T>
        <Field
          label="نبذة ومجال عملك"
          value={bio}
          onChangeText={setBio}
          placeholder="ماذا تعمل أو تدرس؟ ما الذي تنوي تحقيقه في آيلاند هيفن؟"
          multiline
          numberOfLines={5}
          maxLength={2000}
        />
        <T size={11} color={colors.mutedForeground} align="left">{bio.length}/2000</T>
      </Card>

      <Btn title="أرسل طلب الانتساب" loading={busy} fullWidth onPress={submit} />
      <T size={11.5} color={colors.mutedForeground} align="center" style={{ lineHeight: 18 }}>
        بإرسالك الطلب، توافق على أن نتواصل معك بشأنه فقط.
      </T>
    </ScrollView>
  );
}
