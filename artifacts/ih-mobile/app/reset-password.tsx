import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";

import { T, Field, Btn, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError } from "@/lib/api";

export default function ResetPassword() {
  const colors = useColors();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: {
          token: token.trim(),
          newPassword: newPassword,
        },
      });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر إعادة تعيين كلمة السرّ");
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
      <T size={24} weight="bold">تعيين كلمة السرّ</T>
      <T size={13} color={colors.mutedForeground}>أدخل رمز التعيين المرسل إليك وكلمة السرّ الجديدة.</T>

      {success ? (
        <Card style={{ gap: 12 }}>
          <T size={15} weight="bold" color={colors.primary}>✓ تمّت إعادة تعيين كلمة السرّ بنجاح</T>
          <T size={13} color={colors.mutedForeground}>
            يمكنك الآن تسجيل الدخول باستخدام كلمة السرّ الجديدة.
          </T>
          <Btn
            title="تسجيل الدخول"
            onPress={() => router.replace("/login" as never)}
            fullWidth
          />
        </Card>
      ) : (
        <Card style={{ gap: 12 }}>
          <Field
            label="رمز استعادة كلمة السرّ"
            autoCapitalize="none"
            value={token}
            onChangeText={setToken}
          />
          <Field
            label="كلمة السرّ الجديدة"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            hint="٨ أحرف على الأقلّ."
            error={error ?? undefined}
          />
          <Btn title="تحديث كلمة السرّ" loading={loading} onPress={submit} fullWidth />
        </Card>
      )}

      <View style={{ alignItems: "center", marginTop: 8 }}>
        <Btn title="إلغاء" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}
