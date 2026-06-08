import React, { useState, useEffect } from "react";
import { ScrollView, View, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { T, Field, Btn, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

type Step = 0 | 1 | 2;

export default function Onboarding() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading, refresh } = useAuth();

  const [step, setStep] = useState<Step>(0);
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login" as never);
    }
  }, [loading, user]);

  if (loading || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const firstName = user.fullName.split(" ")[0] || "";

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      await api("/auth/me", {
        method: "PATCH",
        body: {
          jobTitle: jobTitle.trim(),
          bio: bio.trim(),
          skills: skills.trim(),
        },
      });
      await refresh();
      router.replace("/(tabs)/profile" as never);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر حفظ البيانات");
      setSaving(false);
    }
  }

  const steps = [
    { title: "أهلًا", sub: "Welcome" },
    { title: "عرّف بنفسك", sub: "Tell us about you" },
    { title: "مهاراتك", sub: "Your skills" },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 24,
        paddingBottom: 60,
        gap: 16,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header and Step indicator */}
      <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <View style={{ gap: 2 }}>
          <T size={17} weight="bold">آيلاند هيفن</T>
          <T size={10} color={colors.mutedForeground} style={{ letterSpacing: 1 }}>ISLAND HAVEN</T>
        </View>
        <View style={{ flexDirection: "row-reverse", gap: 6 }}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === step ? 20 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === step ? colors.primary : i < step ? "#10b981" : colors.border,
              }}
            />
          ))}
        </View>
      </View>

      {/* Step 0 - Welcome */}
      {step === 0 && (
        <View style={{ gap: 24, alignItems: "center", marginTop: 20 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 30,
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <T size={36} align="center">👋</T>
          </View>
          <View style={{ gap: 8 }}>
            <T size={24} weight="bold" align="center">أهلًا، {firstName}</T>
            <T size={14} color={colors.mutedForeground} align="center" style={{ lineHeight: 22 }}>
              خصّص ملفّك الشخصيّ حتى يتعرّف عليك أعضاء المساحة. لن يأخذ هذا أكثر من دقيقة!
            </T>
          </View>
          <Btn title="ابدأ الآن" onPress={() => setStep(1)} fullWidth />
          <Pressable
            onPress={() => router.replace("/(tabs)/profile" as never)}
            style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <T size={13} color={colors.mutedForeground} align="center">
              تخطّى، سأكمل لاحقًا
            </T>
          </Pressable>
        </View>
      )}

      {/* Step 1 - Job title + Bio */}
      {step === 1 && (
        <View style={{ gap: 20 }}>
          <View>
            <T size={22} weight="bold">عرّف بنفسك</T>
            <T size={13} color={colors.mutedForeground} style={{ marginTop: 2 }}>هذا ما يراه الأعضاء في ملفّك العامّ</T>
          </View>

          <Card style={{ gap: 14 }}>
            <Field
              label="المسمّى الوظيفيّ (Job title)"
              placeholder="مثال: مصمّم جرافيك مستقلّ"
              maxLength={120}
              value={jobTitle}
              onChangeText={setJobTitle}
            />

            <Field
              label="نبذة عنك (Bio)"
              placeholder="حدّثنا عن مجال عملك وما تطمح لتحقيقه…"
              maxLength={500}
              multiline
              numberOfLines={4}
              value={bio}
              onChangeText={setBio}
            />
            <T size={11} color={colors.mutedForeground} align="left">{bio.length}/500</T>
          </Card>

          <View style={{ flexDirection: "row-reverse", gap: 12 }}>
            <View style={{ flex: 2 }}>
              <Btn title="التالي" onPress={() => setStep(2)} fullWidth />
            </View>
            <View style={{ flex: 1 }}>
              <Btn title="السابق" variant="secondary" onPress={() => setStep(0)} fullWidth />
            </View>
          </View>
        </View>
      )}

      {/* Step 2 - Skills */}
      {step === 2 && (
        <View style={{ gap: 20 }}>
          <View>
            <T size={22} weight="bold">مهاراتك</T>
            <T size={13} color={colors.mutedForeground} style={{ marginTop: 2 }}>افصل المهارات بفاصلة — ستظهر على ملفّك العامّ</T>
          </View>

          <Card style={{ gap: 14 }}>
            <Field
              label="المهارات (Skills)"
              placeholder="مثال: تصميم، React، تصوير، تسويق"
              maxLength={400}
              value={skills}
              onChangeText={setSkills}
              error={error ?? undefined}
            />
            {skills.trim().length > 0 && (
              <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {skills
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((s, i) => (
                    <View
                      key={i}
                      style={{
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.primary,
                        borderWidth: 0.5,
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <T size={12} weight="medium" color={colors.primary}>{s}</T>
                    </View>
                  ))}
              </View>
            )}
          </Card>

          <View style={{ flexDirection: "row-reverse", gap: 12 }}>
            <View style={{ flex: 2 }}>
              <Btn title={saving ? "جارٍ الحفظ…" : "أنهِ الإعداد"} loading={saving} onPress={finish} fullWidth />
            </View>
            <View style={{ flex: 1 }}>
              <Btn title="السابق" variant="secondary" onPress={() => setStep(1)} fullWidth />
            </View>
          </View>

          <Pressable
            onPress={() => router.replace("/(tabs)/profile" as never)}
            style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.7 : 1, marginTop: 4 })}
          >
            <T size={13} color={colors.mutedForeground} align="center">
              تخطّى
            </T>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
