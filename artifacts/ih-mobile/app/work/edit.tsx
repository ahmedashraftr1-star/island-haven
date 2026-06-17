import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { T, Btn, Field } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth-context";
import { api, API_BASE, getToken, resolveMedia, ApiError } from "@/lib/api";
import type { Work } from "@/lib/types";

// Upload an image via the member upload endpoint (multipart — the JSON api()
// client can't do this, so a raw fetch with the Bearer token).
async function uploadImage(uri: string): Promise<string> {
  const token = await getToken();
  const name = uri.split("/").pop() || "image.jpg";
  const ext = (name.split(".").pop() || "jpg").toLowerCase();
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const fd = new FormData();
  // React Native's FormData file shape.
  fd.append("file", { uri, name, type } as unknown as Blob);
  const res = await fetch(`${API_BASE}/uploads/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok || !data?.url) throw new Error(data?.error || "تعذّر رفع الصورة");
  return data.url;
}

export default function WorkEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const colors = useColors();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const q = useQuery<{ work: Work }>({
    queryKey: ["work-edit", id],
    queryFn: () => api(`/works/${id}`),
    enabled: editing,
  });
  // Populate the form from the loaded work exactly ONCE, so a background
  // refetch (e.g. on focus) can't clobber the user's unsaved edits.
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    const w = q.data?.work;
    if (!w) return;
    hydrated.current = true;
    setTitle(w.title ?? "");
    setSummary(w.summary ?? "");
    setDescription(w.description ?? "");
    setLink(w.link ?? "");
    setVideoUrl(w.videoUrl ?? "");
    setTags(w.tags ?? "");
    setCoverUrl(w.coverUrl ?? "");
  }, [q.data]);

  async function pickCover() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("الإذن مرفوض", "نحتاج إذن الوصول إلى الصور لرفع صورة العمل.");
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (r.canceled || !r.assets?.[0]) return;
    setUploading(true);
    setErr(null);
    try {
      const url = await uploadImage(r.assets[0].uri);
      setCoverUrl(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذّر رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!title.trim()) {
      setErr("العنوان مطلوب");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      // The backend requires http(s):// on link/videoUrl — add it so a user who
      // types "youtube.com/…" doesn't hit a confusing 400.
      const withScheme = (v: string) => {
        const t = v.trim();
        return t && !/^https?:\/\//i.test(t) ? `https://${t}` : t;
      };
      const payload = {
        title: title.trim(),
        summary: summary.trim(),
        description: description.trim(),
        link: withScheme(link),
        videoUrl: withScheme(videoUrl),
        tags: tags.trim(),
        coverUrl: coverUrl || null,
      };
      const r = await api<{ work: Work }>(editing ? `/works/${id}` : "/works", {
        method: editing ? "PATCH" : "POST",
        body: payload,
      });
      router.replace(`/work/${r.work.id}`);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "تعذّر الحفظ");
    } finally {
      setBusy(false);
    }
  }

  if (!loading && !user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24, backgroundColor: colors.background }}>
        <T size={16} weight="bold" align="center">سجّل الدخول لإضافة عملك</T>
        <Btn title="تسجيل الدخول" onPress={() => router.push("/login")} />
      </View>
    );
  }
  if (editing && q.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 80 }}>
      <T size={22} weight="bold">{editing ? "تعديل العمل" : "عمل جديد"}</T>

      {/* Cover image picker */}
      <Pressable onPress={pickCover} disabled={uploading}>
        {coverUrl ? (
          <Image source={{ uri: resolveMedia(coverUrl) }} style={{ width: "100%", height: 200, borderRadius: colors.radius + 2, backgroundColor: colors.muted }} contentFit="cover" />
        ) : (
          <View style={{ width: "100%", height: 200, borderRadius: colors.radius + 2, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 8 }}>
            {uploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Feather name="image" size={26} color={colors.mutedForeground} />
                <T size={13} color={colors.mutedForeground}>أضف صورة رئيسيّة</T>
              </>
            )}
          </View>
        )}
      </Pressable>
      {coverUrl ? (
        <Pressable onPress={() => setCoverUrl("")} style={{ alignSelf: "flex-start" }} hitSlop={8}>
          <T size={12} color={colors.destructive}>إزالة الصورة</T>
        </Pressable>
      ) : null}

      <Field label="العنوان *" value={title} onChangeText={setTitle} maxLength={200} placeholder="اسم العمل" />
      <Field label="نبذة مختصرة" value={summary} onChangeText={setSummary} maxLength={400} placeholder="وصف من سطر" />
      <Field label="الوصف" value={description} onChangeText={setDescription} multiline maxLength={8000} placeholder="تفاصيل العمل…" />
      <Field label="رابط العمل" value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" placeholder="https://" />
      <Field label="رابط فيديو (YouTube)" value={videoUrl} onChangeText={setVideoUrl} autoCapitalize="none" keyboardType="url" placeholder="https://youtube.com/…" />
      <Field label="وسوم (افصل بفواصل)" value={tags} onChangeText={setTags} maxLength={400} placeholder="تصميم، برمجة" />

      {err ? <T size={13} color={colors.destructive}>{err}</T> : null}

      <Btn title={editing ? "حفظ التعديلات" : "نشر العمل"} loading={busy} disabled={uploading} onPress={save} fullWidth />
    </ScrollView>
  );
}
