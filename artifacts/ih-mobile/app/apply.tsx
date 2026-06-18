import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

import { T, Card, Btn, Field } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, ApiError, API_BASE } from "@/lib/api";

type CategoryId = "freelancer" | "graduate" | "student" | "other";

const CATEGORIES: Array<{ id: CategoryId; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: "freelancer", label: "مستقلّ", icon: "briefcase" },
  { id: "graduate", label: "خرّيج", icon: "award" },
  { id: "student", label: "طالب", icon: "book-open" },
  { id: "other", label: "أخرى", icon: "user" },
];

const HOURS_OPTIONS = [5, 10, 15, 20, 30, 40];

export default function ApplyScreen() {
  const colors = useColors();
  const router = useRouter();

  // ─── Identity ─────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<CategoryId>("freelancer");

  // ─── About ────────────────────────────────────────────────────────────────
  const [bio, setBio] = useState("");
  const [motivation, setMotivation] = useState("");
  const [previousWork, setPreviousWork] = useState("");

  // ─── Professional ─────────────────────────────────────────────────────────
  const [skills, setSkills] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [yearsExperience, setYearsExperience] = useState<number | "">("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // ─── Availability ─────────────────────────────────────────────────────────
  const [weeklyHours, setWeeklyHours] = useState<number | null>(null);
  const [isEmployed, setIsEmployed] = useState<boolean | null>(null);

  // ─── CV ───────────────────────────────────────────────────────────────────
  const [cvUrl, setCvUrl] = useState("");
  const [cvName, setCvName] = useState("");
  const [cvUploading, setCvUploading] = useState(false);

  // ─── UI ───────────────────────────────────────────────────────────────────
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: number } | null>(null);

  const canSubmit =
    fullName.trim().length >= 2 &&
    email.trim().length > 3 &&
    phone.trim().length >= 6 &&
    bio.trim().length >= 10 &&
    motivation.trim().length >= 10;

  async function pickCv() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset?.uri) return;
      setCvUploading(true);
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: asset.name ?? "cv.pdf",
        type: "application/pdf",
      } as unknown as Blob);
      const resp = await fetch(`${API_BASE}/uploads/cv`, {
        method: "POST",
        body: formData,
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "تعذّر رفع الملف");
      setCvUrl(json.url);
      setCvName(asset.name ?? "cv.pdf");
    } catch (err) {
      Alert.alert("خطأ", err instanceof Error ? err.message : "تعذّر رفع السيرة الذاتية");
    } finally {
      setCvUploading(false);
    }
  }

  async function submit() {
    if (!canSubmit) {
      Alert.alert("ناقص", "الاسم والبريد والهاتف والنبذة والدوافع كلّها مطلوبة");
      return;
    }
    setBusy(true);
    try {
      const r = await api<{ ok: boolean; id: number }>("/applications", {
        method: "POST",
        body: {
          fullName, email, phone, category, bio, motivation,
          previousWork: previousWork || undefined,
          skills: skills || undefined,
          specialization: specialization || undefined,
          yearsExperience: yearsExperience !== "" ? Number(yearsExperience) : undefined,
          linkedinUrl: linkedinUrl || undefined,
          portfolioUrl: portfolioUrl || undefined,
          weeklyHours: weeklyHours ?? undefined,
          isEmployed: isEmployed ?? undefined,
          cvUrl: cvUrl || undefined,
        },
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
          <T size={12} color={colors.primary} weight="bold">وصل طلبك</T>
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
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <View style={{ alignItems: "center", gap: 8 }}>
        <T size={11} color={colors.primary} weight="bold">طلب انتساب · مجّاناً</T>
        <T size={26} weight="bold" align="center">انضمّ إلى آيلاند هيفن</T>
        <T size={13} color={colors.mutedForeground} align="center" style={{ lineHeight: 22 }}>
          مساحة عمل مَجّانيّة تتّسع لأحلامك في غزّة. املأ الطلب وسنتواصل معك خلال أيّام.
        </T>
      </View>

      {/* ─── 01 Identity ─────────────────────────────────────────────────── */}
      <Card style={{ gap: 14 }}>
        <T size={12} color={colors.primary} weight="bold">٠١ · مَن أنت</T>
        <Field label="الاسم الكامل *" value={fullName} onChangeText={setFullName} placeholder="مثال: ياسمين الغزّاوي" />
        <Field
          label="البريد الإلكتروني *"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="رقم الواتساب *"
          value={phone}
          onChangeText={setPhone}
          placeholder="+970 …"
          keyboardType="phone-pad"
        />
      </Card>

      {/* ─── 02 Category ─────────────────────────────────────────────────── */}
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

      {/* ─── 03 About ────────────────────────────────────────────────────── */}
      <Card style={{ gap: 10 }}>
        <T size={12} color={colors.primary} weight="bold">٠٣ · حدّثنا عنك</T>
        <Field
          label="نبذة ومجال عملك *"
          value={bio}
          onChangeText={setBio}
          placeholder="ماذا تعمل أو تدرس؟ ما الذي تنوي تحقيقه في آيلاند هيفن؟"
          multiline
          numberOfLines={4}
          maxLength={2000}
        />
        <T size={11} color={colors.mutedForeground} align="left">{bio.length}/2000</T>
        <Field
          label="دوافعك للانضمام *"
          value={motivation}
          onChangeText={setMotivation}
          placeholder="لماذا تريد الانضمام إلى آيلاند هيفن؟ ما الذي تأمل تحقيقه؟"
          multiline
          numberOfLines={4}
          maxLength={2000}
        />
        <T size={11} color={colors.mutedForeground} align="left">{motivation.length}/2000</T>
      </Card>

      {/* ─── 04 Professional ─────────────────────────────────────────────── */}
      <Card style={{ gap: 14 }}>
        <T size={12} color={colors.primary} weight="bold">٠٤ · خبرتك المهنيّة</T>
        <Field
          label="المهارات التقنية"
          value={skills}
          onChangeText={setSkills}
          placeholder="مثال: React، Node.js، Figma، Python …"
          maxLength={500}
        />
        <Field
          label="التخصص الأكاديمي / الجامعة"
          value={specialization}
          onChangeText={setSpecialization}
          placeholder="مثال: هندسة الحاسوب — الجامعة الإسلامية"
          maxLength={200}
        />
        <View>
          <T size={12} weight="medium" style={{ marginBottom: 8, textAlign: "right" }}>سنوات الخبرة</T>
          <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
            {[0, 1, 2, 3, 5, 7, 10, 15].map((yr) => {
              const active = yearsExperience === yr;
              return (
                <Pressable
                  key={yr}
                  onPress={() => setYearsExperience(active ? "" : yr)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primarySoft : "transparent",
                  }}
                >
                  <T size={13} weight="medium" color={active ? colors.primary : colors.foreground}>
                    {yr === 0 ? "أقل من سنة" : yr === 15 ? "+15 سنة" : `${yr}+`}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      {/* ─── 05 Links ────────────────────────────────────────────────────── */}
      <Card style={{ gap: 14 }}>
        <T size={12} color={colors.primary} weight="bold">٠٥ · روابط احترافيّة</T>
        <Field
          label="رابط LinkedIn"
          value={linkedinUrl}
          onChangeText={setLinkedinUrl}
          placeholder="https://linkedin.com/in/username"
          keyboardType="url"
          autoCapitalize="none"
        />
        <Field
          label="GitHub / Portfolio / موقعك"
          value={portfolioUrl}
          onChangeText={setPortfolioUrl}
          placeholder="https://github.com/username"
          keyboardType="url"
          autoCapitalize="none"
        />
      </Card>

      {/* ─── 06 Previous Work ────────────────────────────────────────────── */}
      <Card style={{ gap: 10 }}>
        <T size={12} color={colors.primary} weight="bold">٠٦ · أعمالك السابقة</T>
        <Field
          label="مشاريع أو أعمال سابقة (وصف أو رابط)"
          value={previousWork}
          onChangeText={setPreviousWork}
          placeholder="اذكر مشروعًا أنجزته أو عملاً تفخر به، أو ضع رابطًا لأعمالك …"
          multiline
          numberOfLines={3}
          maxLength={1000}
        />
      </Card>

      {/* ─── 07 Availability ─────────────────────────────────────────────── */}
      <Card style={{ gap: 14 }}>
        <T size={12} color={colors.primary} weight="bold">٠٧ · توفّرك الأسبوعي</T>
        <View>
          <T size={12} weight="medium" style={{ marginBottom: 8, textAlign: "right" }}>
            ساعات العمل المتاحة في الأسبوع
          </T>
          <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
            {HOURS_OPTIONS.map((h) => {
              const active = weeklyHours === h;
              return (
                <Pressable
                  key={h}
                  onPress={() => setWeeklyHours(active ? null : h)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primarySoft : "transparent",
                  }}
                >
                  <T size={13} weight="medium" color={active ? colors.primary : colors.foreground}>
                    {h}+ س/أسبوع
                  </T>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View>
          <T size={12} weight="medium" style={{ marginBottom: 8, textAlign: "right" }}>
            هل تعمل حالياً؟
          </T>
          <View style={{ flexDirection: "row-reverse", gap: 10 }}>
            {[{ v: true, l: "نعم، أعمل" }, { v: false, l: "لا، أبحث عن عمل" }].map((opt) => {
              const active = isEmployed === opt.v;
              return (
                <Pressable
                  key={String(opt.v)}
                  onPress={() => setIsEmployed(active ? null : opt.v)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: colors.radius,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primarySoft : "transparent",
                    alignItems: "center",
                  }}
                >
                  <T size={13} weight="medium" color={active ? colors.primary : colors.foreground}>
                    {opt.l}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      {/* ─── 08 CV Upload ────────────────────────────────────────────────── */}
      <Card style={{ gap: 12 }}>
        <T size={12} color={colors.primary} weight="bold">٠٨ · السيرة الذاتية (PDF)</T>
        <T size={12} color={colors.mutedForeground}>اختياري — يساعد الفريق على تقييم طلبك أسرع.</T>
        <Pressable
          onPress={pickCv}
          disabled={cvUploading}
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            paddingVertical: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: cvUrl ? colors.primary : colors.border,
            backgroundColor: cvUrl ? colors.primarySoft : "transparent",
          }}
        >
          {cvUploading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Feather name={cvUrl ? "check-circle" : "upload"} size={18} color={cvUrl ? colors.primary : colors.mutedForeground} />
          )}
          <T size={13} weight="medium" color={cvUrl ? colors.primary : colors.mutedForeground}>
            {cvUploading ? "جاري الرفع…" : cvUrl ? cvName || "تم رفع السيرة الذاتية" : "ارفع سيرتك الذاتية (PDF)"}
          </T>
        </Pressable>
        {cvUrl ? (
          <Pressable onPress={() => { setCvUrl(""); setCvName(""); }}>
            <T size={11} color={colors.mutedForeground} align="center">إزالة الملف</T>
          </Pressable>
        ) : null}
      </Card>

      {/* ─── Submit ──────────────────────────────────────────────────────── */}
      <Btn title="أرسل طلب الانتساب" loading={busy} fullWidth onPress={submit} disabled={!canSubmit || busy} />
      <T size={11.5} color={colors.mutedForeground} align="center" style={{ lineHeight: 18 }}>
        بإرسالك الطلب، توافق على أن نتواصل معك بشأنه فقط.
      </T>
    </ScrollView>
  );
}
