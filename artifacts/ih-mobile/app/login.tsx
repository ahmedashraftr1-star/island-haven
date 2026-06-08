import React, { useState } from "react";
import { ScrollView, View, Pressable } from "react-native";
import { useRouter } from "expo-router";

import { T, Field, Btn, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function Login() {
  const colors = useColors();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر تسجيل الدخول");
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
      <T size={24} weight="bold">أهلًا بعودتك</T>
      <T size={13} color={colors.mutedForeground}>سجّل دخولك بالبريد وكلمة السرّ.</T>
      <Card style={{ gap: 12 }}>
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
          autoComplete="password"
          error={error ?? undefined}
        />
        <Pressable
          onPress={() => router.push("/forgot-password" as never)}
          style={({ pressed }: { pressed: boolean }) => ({
            alignSelf: "flex-start",
            paddingVertical: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <T size={13} color={colors.primary} weight="medium">
            نسيت كلمة السرّ؟
          </T>
        </Pressable>
        <Btn title="دخول" loading={loading} onPress={submit} fullWidth />
      </Card>
      <View style={{ alignItems: "center", marginTop: 8 }}>
        <T size={13} color={colors.mutedForeground}>ليس لديك حساب؟</T>
        <Btn title="إنشاء حساب جديد" variant="ghost" onPress={() => router.replace("/register")} />
      </View>
    </ScrollView>
  );
}
