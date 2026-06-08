import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";

import { T, Field, Btn, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError } from "@/lib/api";

export default function ForgotPassword() {
  const colors = useColors();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim().toLowerCase() },
      });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر إرسال طلب استعادة كلمة السرّ");
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
      <T size={24} weight="bold">استعادة كلمة السرّ</T>
      <T size={13} color={colors.mutedForeground}>أدخل بريدك الإلكتروني للحصول على رمز إعادة التعيين.</T>

      {success ? (
        <Card style={{ gap: 12 }}>
          <T size={15} weight="bold" color={colors.primary}>✓ تمّ إرسال رمز استعادة كلمة السرّ</T>
          <T size={13} color={colors.mutedForeground}>
            إذا كان البريد مسجّلًا لدينا، فستجد رمز إعادة التعيين في صندوق الوارد (أو مجلد الرسائل غير المرغوب فيها).
          </T>
          <Btn
            title="إدخال رمز التعيين"
            onPress={() => router.replace("/reset-password" as never)}
            fullWidth
          />
        </Card>
      ) : (
        <Card style={{ gap: 12 }}>
          <Field
            label="البريد الإلكتروني"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoComplete="email"
            error={error ?? undefined}
          />
          <Btn title="إرسال طلب التعيين" loading={loading} onPress={submit} fullWidth />
        </Card>
      )}

      <View style={{ alignItems: "center", marginTop: 8 }}>
        <Btn title="العودة لتسجيل الدخول" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}
