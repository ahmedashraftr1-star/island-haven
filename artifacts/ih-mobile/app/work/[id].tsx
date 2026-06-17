import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { T, Card, Btn } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth-context";
import { api, resolveMedia } from "@/lib/api";
import type { Work } from "@/lib/types";

interface WorkResp {
  work: Work;
  isOwner: boolean;
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
}

interface WorkComment {
  id: number;
  body: string;
  createdAt: string;
  author: { id: number; fullName: string; avatarUrl: string | null; role: string };
  canDelete: boolean;
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  return `قبل ${Math.floor(h / 24)} ي`;
}

export default function WorkDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery<WorkResp>({
    queryKey: ["work", id],
    queryFn: () => api(`/works/${id}`),
    enabled: !!id,
  });
  const commentsQ = useQuery<{ comments: WorkComment[] }>({
    queryKey: ["work-comments", id],
    queryFn: () => api(`/works/${id}/comments`),
    enabled: !!id,
  });

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [liking, setLiking] = useState(false);

  async function toggleLike() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (liking) return;
    setLiking(true);
    try {
      await api(`/works/${id}/like`, { method: "POST" });
      await qc.invalidateQueries({ queryKey: ["work", id] });
    } catch {
      /* ignore */
    } finally {
      setLiking(false);
    }
  }

  async function postComment() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await api(`/works/${id}/comments`, { method: "POST", body: { body } });
      setText("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["work-comments", id] }),
        qc.invalidateQueries({ queryKey: ["work", id] }),
      ]);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  async function deleteComment(cid: number) {
    try {
      await api(`/works/${id}/comments/${cid}`, { method: "DELETE" });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["work-comments", id] }),
        qc.invalidateQueries({ queryKey: ["work", id] }),
      ]);
    } catch {
      /* ignore */
    }
  }

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!q.data) return null;
  const w = q.data.work;
  const likesCount = q.data.likesCount ?? 0;
  const likedByMe = q.data.likedByMe ?? false;
  const commentsCount = q.data.commentsCount ?? 0;
  const comments = commentsQ.data?.comments ?? [];
  const gallery = Array.isArray(w.galleryUrls) ? w.galleryUrls : [];

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 80 }}>
      {w.coverUrl ? (
        <Image source={{ uri: resolveMedia(w.coverUrl) }} style={{ width: "100%", height: 220, borderRadius: colors.radius + 2, backgroundColor: colors.muted }} contentFit="cover" />
      ) : null}
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
        <T size={22} weight="bold" style={{ flex: 1 }}>{w.title}</T>
        {q.data.isOwner ? (
          <Pressable
            onPress={() => router.push(`/work/edit?id=${id}`)}
            hitSlop={8}
            style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border }}
          >
            <Feather name="edit-2" size={13} color={colors.foreground} />
            <T size={13} weight="medium">تعديل</T>
          </Pressable>
        ) : null}
      </View>
      {w.authorName ? <T size={13} color={colors.mutedForeground}>{w.authorName}</T> : null}

      {/* Engagement: like toggle + comment count */}
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 14 }}>
        <Pressable
          onPress={toggleLike}
          disabled={liking}
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: colors.radius,
            borderWidth: 1,
            borderColor: likedByMe ? colors.primary : colors.border,
            backgroundColor: likedByMe ? colors.primary + "1A" : colors.card,
          }}
        >
          <Feather name="heart" size={16} color={likedByMe ? colors.primary : colors.mutedForeground} />
          <T size={14} weight="medium" color={likedByMe ? colors.primary : colors.mutedForeground}>{likesCount}</T>
        </Pressable>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
          <Feather name="message-circle" size={16} color={colors.mutedForeground} />
          <T size={14} color={colors.mutedForeground}>{commentsCount}</T>
        </View>
      </View>

      {w.description ? (
        <Card>
          <T size={14} style={{ lineHeight: 23 }}>{w.description}</T>
        </Card>
      ) : null}
      {w.videoUrl ? (
        <Pressable onPress={() => Linking.openURL(w.videoUrl)}>
          <Card style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
            <Feather name="play-circle" size={22} color={colors.primary} />
            <T size={14} color={colors.primary} weight="medium">شاهد الفيديو على YouTube</T>
          </Card>
        </Pressable>
      ) : null}
      {gallery.length > 0 ? (
        <View style={{ gap: 8 }}>
          <T size={15} weight="bold">معرض الصور</T>
          {gallery.map((url, i) => (
            <Image key={i} source={{ uri: resolveMedia(url) }} style={{ width: "100%", height: 220, borderRadius: colors.radius, backgroundColor: colors.muted }} contentFit="cover" />
          ))}
        </View>
      ) : null}

      {/* Comments */}
      <View style={{ gap: 12, marginTop: 8 }}>
        <T size={16} weight="bold">التعليقات — {commentsCount}</T>

        {user ? (
          <View style={{ gap: 8 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
              placeholder="شاركنا رأيك في هذا العمل…"
              placeholderTextColor={colors.mutedForeground}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                borderRadius: colors.radius,
                padding: 12,
                minHeight: 72,
                fontSize: 15,
                color: colors.foreground,
                textAlign: "right",
                writingDirection: "rtl",
              }}
            />
            <Btn title="نشر" loading={busy} disabled={!text.trim()} onPress={postComment} />
          </View>
        ) : (
          <Btn title="سجّل الدخول للتعليق" variant="secondary" onPress={() => router.push("/login")} />
        )}

        {comments.length === 0 ? (
          <T size={13} color={colors.mutedForeground} align="center" style={{ paddingVertical: 12 }}>
            لا توجد تعليقات بعد — كن أول من يعلّق.
          </T>
        ) : (
          comments.map((c) => (
            <Card key={c.id} style={{ gap: 6 }}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                <View style={{ width: 30, height: 30, borderRadius: 15, overflow: "hidden", backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                  {c.author.avatarUrl ? (
                    <Image source={{ uri: resolveMedia(c.author.avatarUrl) }} style={{ width: 30, height: 30 }} contentFit="cover" />
                  ) : (
                    <T size={13} weight="bold">{(c.author.fullName || "·").slice(0, 1)}</T>
                  )}
                </View>
                <T size={13} weight="bold">{c.author.fullName}</T>
                <T size={11} color={colors.mutedForeground}>{timeAgo(c.createdAt)}</T>
                <View style={{ flex: 1 }} />
                {c.canDelete ? (
                  <Pressable onPress={() => deleteComment(c.id)} hitSlop={8}>
                    <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                  </Pressable>
                ) : null}
              </View>
              <T size={14} style={{ lineHeight: 22 }}>{c.body}</T>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}
