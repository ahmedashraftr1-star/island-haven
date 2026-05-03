import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";

import { T, Field, Btn, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const ROLES: { value: "freelancer" | "graduate" | "student" | "other"; label: string }[] = [
  { value: "freelancer", label: "فريلانسر" },
  { value: "graduate", label: "خرّيج" },
  { value: "student", label: "طالب" },
  { value: "other", label: "أخرى" },
];

export default function Register() {
  const colors = useColors();
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<typeof ROLES[number]["value"]>("freelancer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await signUp({ email: email.trim(), password, fullName: fullName.trim(), role });
      router.dismissAll();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <T size={24} weight="bold">أنشئ حسابك</T>
      <T size={13} color={colors.mutedForeground}>انضمّ لمجتمع آيلاند هيفن.</T>
      <Card style={{ gap: 12 }}>
        <Field label="الاسم الكامل" value={fullName} onChangeText={setFullName} />
        <Field
          label="البريد الإلكتروني"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoComplete="email"
        />
        <Field
          label="كلمة السرّ"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          hint="٨ أحرف على الأقلّ."
        />
        <View>
          <T size={13} weight="medium" color={colors.mutedForeground}>أنا</T>
          <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {ROLES.map((r) => (
              <Pressable
                key={r.value}
                onPress={() => setRole(r.value)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: role === r.value ? colors.primary : colors.muted,
                  borderWidth: 1,
                  borderColor: role === r.value ? colors.primary : colors.border,
                }}
              >
                <T size={13} weight="medium" color={role === r.value ? colors.primaryForeground : colors.foreground}>
                  {r.label}
                </T>
              </Pressable>
            ))}
          </View>
        </View>
        {error ? <T size={13} color={colors.destructive}>{error}</T> : null}
        <Btn title="إنشاء الحساب" loading={loading} onPress={submit} fullWidth />
      </Card>
      <View style={{ alignItems: "center", marginTop: 8 }}>
        <T size={13} color={colors.mutedForeground}>لديك حساب؟</T>
        <Btn title="تسجيل الدخول" variant="ghost" onPress={() => router.replace("/login")} />
      </View>
    </ScrollView>
  );
}
