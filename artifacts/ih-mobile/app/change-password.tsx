import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";

import { T, Field, Btn, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError } from "@/lib/api";

export default function ChangePassword() {
  const colors = useColors();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await api("/auth/me/change-password", {
        method: "POST",
        body: {
          currentPassword,
          newPassword,
        },
      });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر تغيير كلمة السرّ");
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
      <T size={24} weight="bold">تغيير كلمة السرّ</T>
      <T size={13} color={colors.mutedForeground}>حدّث كلمة السرّ الخاصّة بحسابك.</T>

      {success ? (
        <Card style={{ gap: 12 }}>
          <T size={15} weight="bold" color={colors.primary}>✓ تمّ تغيير كلمة السرّ بنجاح</T>
          <Btn
            title="العودة"
            onPress={() => router.back()}
            fullWidth
          />
        </Card>
      ) : (
        <Card style={{ gap: 12 }}>
          <Field
            label="كلمة السرّ الحالية"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
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

      {!success && (
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <Btn title="إلغاء" variant="ghost" onPress={() => router.back()} />
        </View>
      )}
    </ScrollView>
  );
}
