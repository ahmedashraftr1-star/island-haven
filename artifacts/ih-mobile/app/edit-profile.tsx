import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";

import { T, Field, Btn, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { CurrentUser } from "@/lib/types";

export default function EditProfile() {
  const colors = useColors();
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!fullName.trim()) {
      setError("الاسم مطلوب");
      return;
    }
    setLoading(true);
    try {
      await api<{ user: CurrentUser }>("/auth/me", {
        method: "PATCH",
        body: {
          fullName: fullName.trim(),
          jobTitle: jobTitle.trim() || undefined,
          bio: bio.trim() || undefined,
        },
      });
      await refresh();
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر حفظ التغييرات، يرجى المحاولة مرّة أخرى.");
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
      <T size={24} weight="bold">تعديل الملف الشخصي</T>
      <T size={13} color={colors.mutedForeground}>حدّث معلوماتك الشخصية الظاهرة في ملفّك.</T>

      <Card style={{ gap: 14 }}>
        <Field
          label="الاسم الكامل"
          value={fullName}
          onChangeText={setFullName}
          placeholder="اسمك الكامل"
          maxLength={200}
          error={!fullName.trim() && error ? error : undefined}
        />
        <Field
          label="المسمّى الوظيفي"
          value={jobTitle}
          onChangeText={setJobTitle}
          placeholder="مثال: مصمّم جرافيك، مطوّر تطبيقات…"
          maxLength={120}
        />
        <Field
          label="نبذة شخصية"
          value={bio}
          onChangeText={setBio}
          placeholder="اكتب نبذة مختصرة عنك…"
          multiline
          numberOfLines={4}
          maxLength={2000}
          hint={`${bio.length} / 2000`}
        />

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

        <Btn title={loading ? "جارٍ الحفظ…" : "حفظ التغييرات"} loading={loading} disabled={loading} onPress={submit} fullWidth />
      </Card>

      <View style={{ alignItems: "center" }}>
        <Btn title="إلغاء" variant="ghost" onPress={() => router.back()} disabled={loading} />
      </View>
    </ScrollView>
  );
}
