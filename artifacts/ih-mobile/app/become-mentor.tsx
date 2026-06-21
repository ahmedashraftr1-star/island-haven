import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { T, Btn, Field } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError } from "@/lib/api";

const STEPS = [
  { id: "identity", label: "هويّتك", number: "٠١" },
  { id: "expertise", label: "خبرتك", number: "٠٢" },
  { id: "about", label: "نبذتك", number: "٠٣" },
];

interface FormState {
  fullName: string;
  email: string;
  expertise: string;
  yearsExperience: string;
  bio: string;
  linkedinUrl: string;
}

const EMPTY: FormState = {
  fullName: "",
  email: "",
  expertise: "",
  yearsExperience: "",
  bio: "",
  linkedinUrl: "",
};

function validateStep(step: number, form: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  if (step === 0) {
    if (!form.fullName.trim() || form.fullName.trim().length < 2)
      errs.fullName = "أدخل الاسم الكامل";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "أدخل بريدًا إلكترونيًّا صحيحًا";
  }
  if (step === 1) {
    if (!form.expertise.trim() || form.expertise.trim().length < 2)
      errs.expertise = "أدخل مجالات خبرتك";
  }
  if (step === 2) {
    if (!form.bio.trim() || form.bio.trim().length < 20)
      errs.bio = "النبذة قصيرة جدًّا (20 حرفًا فأكثر)";
    if (
      form.linkedinUrl.trim() &&
      !/^https?:\/\//i.test(form.linkedinUrl.trim())
    )
      errs.linkedinUrl = "الرابط يجب أن يبدأ بـ https://";
  }
  return errs;
}

export default function BecomeMentorScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function setField<K extends keyof FormState>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
    setFieldErrors((e) => {
      const n = { ...e };
      delete n[k];
      return n;
    });
  }

  function goNext() {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setStep((s) => s + 1);
  }

  function goBack() {
    setFieldErrors({});
    if (step === 0) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  }

  async function submit() {
    const errs = validateStep(2, form);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await api("/experts/apply", {
        method: "POST",
        body: {
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          expertise: form.expertise.trim(),
          yearsExperience: Number(form.yearsExperience) || 0,
          bio: form.bio.trim(),
          linkedinUrl: form.linkedinUrl.trim(),
          ref: "mobile-become-mentor",
        },
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.body && typeof err.body === "object") {
        const d = err.body as {
          error?: string;
          details?: Array<{ field: string; message: string }>;
        };
        if (Array.isArray(d.details)) {
          const m: Record<string, string> = {};
          for (const item of d.details) m[item.field] = item.message;
          setFieldErrors(m);
          if (m.fullName || m.email) setStep(0);
          else if (m.expertise || m.yearsExperience) setStep(1);
        }
        Alert.alert("تعذّر الإرسال", d.error || "حاول مجدّدًا");
      } else {
        Alert.alert("تعذّر الاتّصال", "تعذّر الاتّصال بالخادم. حاول مجدّدًا بعد قليل.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 28,
          gap: 18,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colors.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="check-circle" size={46} color={colors.primary} />
        </View>

        <T size={11} weight="bold" color={colors.primary} align="center" style={{ letterSpacing: 1 }}>
          وصل طلبك
        </T>

        <T size={26} weight="bold" align="center" style={{ lineHeight: 36 }}>
          شكرًا لك يا {form.fullName.trim().split(" ")[0] || "صديقنا"}
        </T>

        <T size={14} color={colors.mutedForeground} align="center" style={{ lineHeight: 24 }}>
          استلمنا طلبك بأمان وسيراجعه فريقنا قريبًا. ستصلك رسالة تأكيد على بريدك الإلكترونيّ، وسنتواصل معك بمجرّد البتّ في الطلب.
        </T>

        <Btn
          title="العودة للرئيسيّة"
          fullWidth
          onPress={() => router.replace("/(tabs)")}
        />
      </ScrollView>
    );
  }

  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Progress bar */}
      <View style={{ height: 3, backgroundColor: colors.border }}>
        <View
          style={{
            height: 3,
            width: `${progressPct}%`,
            backgroundColor: colors.primary,
            borderRadius: 2,
          }}
        />
      </View>

      {/* Step tabs */}
      <View
        style={{
          flexDirection: "row-reverse",
          gap: 6,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 4,
        }}
      >
        {STEPS.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <Pressable
              key={s.id}
              onPress={() => done && setStep(i)}
              disabled={!done}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 999,
                alignItems: "center",
                backgroundColor: active
                  ? colors.primary
                  : done
                  ? colors.primarySoft
                  : colors.muted,
              }}
            >
              <T
                size={12}
                weight="bold"
                color={
                  active ? "#fff" : done ? colors.primary : colors.mutedForeground
                }
              >
                {s.label}
              </T>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + 60,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 0 — Identity */}
        {step === 0 && (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 4 }}>
              <T size={11} weight="bold" color={colors.primary}>
                {STEPS[0].number} · {STEPS[0].label}
              </T>
              <T size={26} weight="bold" style={{ lineHeight: 34 }}>
                كُن مرشدًا في{"\u00A0"}
                <T size={26} weight="bold" color={colors.primary}>
                  آيلاند هيفن
                </T>
              </T>
              <T size={13} color={colors.mutedForeground} style={{ lineHeight: 22 }}>
                شارك خبرتك مع رواد الأعمال الشباب في غزّة. طلبك سيُراجَع ونتواصل معك قريبًا.
              </T>
            </View>

            <Field
              label="الاسم الكامل"
              value={form.fullName}
              onChangeText={(v) => setField("fullName", v)}
              placeholder="مثال: أحمد الفرّا"
              maxLength={120}
              error={fieldErrors.fullName}
            />
            <Field
              label="البريد الإلكترونيّ"
              value={form.email}
              onChangeText={(v) => setField("email", v)}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={fieldErrors.email}
            />

            <View style={{ flexDirection: "row-reverse", gap: 10 }}>
              <Btn title="رجوع" variant="secondary" onPress={goBack} />
              <View style={{ flex: 1 }}>
                <Btn title="التالي ←" fullWidth onPress={goNext} />
              </View>
            </View>
          </View>
        )}

        {/* Step 1 — Expertise */}
        {step === 1 && (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 4 }}>
              <T size={11} weight="bold" color={colors.primary}>
                {STEPS[1].number} · {STEPS[1].label}
              </T>
              <T size={26} weight="bold" style={{ lineHeight: 34 }}>
                ما هي{"\u00A0"}
                <T size={26} weight="bold" color={colors.primary}>
                  تخصّصاتك؟
                </T>
              </T>
              <T size={13} color={colors.mutedForeground} style={{ lineHeight: 22 }}>
                أخبرنا بمجالات خبرتك حتى نضعك في المكان الصحيح.
              </T>
            </View>

            <Field
              label="مجالات الخبرة (مفصولة بفاصلة)"
              value={form.expertise}
              onChangeText={(v) => setField("expertise", v)}
              placeholder="مثال: ريادة أعمال، تسويق رقميّ، تصميم"
              maxLength={400}
              error={fieldErrors.expertise}
            />

            <YearsField
              value={form.yearsExperience}
              onChange={(v) => setField("yearsExperience", v)}
              error={fieldErrors.yearsExperience}
              colors={colors}
            />

            <View style={{ flexDirection: "row-reverse", gap: 10 }}>
              <Btn title="→ السابق" variant="secondary" onPress={goBack} />
              <View style={{ flex: 1 }}>
                <Btn title="التالي ←" fullWidth onPress={goNext} />
              </View>
            </View>
          </View>
        )}

        {/* Step 2 — About */}
        {step === 2 && (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 4 }}>
              <T size={11} weight="bold" color={colors.primary}>
                {STEPS[2].number} · {STEPS[2].label}
              </T>
              <T size={26} weight="bold" style={{ lineHeight: 34 }}>
                أخبرنا{"\u00A0"}
                <T size={26} weight="bold" color={colors.primary}>
                  عن نفسك
                </T>
              </T>
              <T size={13} color={colors.mutedForeground} style={{ lineHeight: 22 }}>
                نبذة عن تجربتك وما يمكنك تقديمه للمنتسبين.
              </T>
            </View>

            <Field
              label="نبذة تعريفيّة"
              value={form.bio}
              onChangeText={(v) => setField("bio", v)}
              placeholder="ماذا تعمل؟ ما الذي يمكنك مساعدة الرياديّين به؟ ما الذي جعلك خبيرًا في مجالك؟"
              multiline
              numberOfLines={5}
              maxLength={4000}
              error={fieldErrors.bio}
            />
            <T size={11} color={colors.mutedForeground} align="left">
              {form.bio.length}/4000
            </T>

            <Field
              label="رابط LinkedIn (اختياريّ)"
              value={form.linkedinUrl}
              onChangeText={(v) => setField("linkedinUrl", v)}
              placeholder="https://linkedin.com/in/username"
              keyboardType="url"
              autoCapitalize="none"
              error={fieldErrors.linkedinUrl}
            />

            <View style={{ flexDirection: "row-reverse", gap: 10 }}>
              <Btn title="→ السابق" variant="secondary" onPress={goBack} />
              <View style={{ flex: 1 }}>
                <Btn
                  title={submitting ? "جارِ الإرسال…" : "أرسل الطلب"}
                  fullWidth
                  loading={submitting}
                  onPress={submit}
                />
              </View>
            </View>

            <T size={11} color={colors.mutedForeground} align="center" style={{ lineHeight: 18 }}>
              بإرسالك الطلب توافق على أن نتواصل معك بشأنه فقط.
            </T>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function YearsField({
  value,
  onChange,
  error,
  colors,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  colors: ReturnType<typeof useColors>;
}) {
  const hasError = !!error;
  return (
    <View style={{ gap: 4 }}>
      <T size={12} weight="bold" color={colors.mutedForeground}>
        سنوات الخبرة
      </T>
      <View
        style={{
          borderWidth: 1,
          borderColor: hasError ? "#f87171" : colors.border,
          borderRadius: colors.radius,
          backgroundColor: hasError ? "rgba(254,242,242,0.4)" : colors.muted + "30",
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.mutedForeground + "80"}
          style={{
            fontFamily: "IBMPlexSansArabic_400Regular",
            fontSize: 14,
            color: colors.foreground,
            textAlign: "left",
          }}
          maxLength={2}
        />
      </View>
      {hasError && (
        <T size={11} color="#dc2626">{error}</T>
      )}
    </View>
  );
}
