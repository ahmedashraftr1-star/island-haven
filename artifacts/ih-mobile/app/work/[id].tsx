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
  author?: { id: number; fullName: string; avatarUrl: string | null };
  isOwner: boolean;
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
  savedByMe: boolean;
}

interface WorkComment {
  id: number;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  parentId?: number | null;
  author: { id: number; fullName: string; avatarUrl: string | null; role: string };
  canEdit?: boolean;
  canDelete: boolean;
  replies?: WorkComment[];
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
  const [saving, setSaving] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editBusy, setEditBusy] = useState(false);

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

  async function toggleSave() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await api(`/works/${id}/save`, { method: "POST" });
      await qc.invalidateQueries({ queryKey: ["work", id] });
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
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

  async function postReply(parentId: number) {
    const body = replyText.trim();
    if (!body || replyBusy) return;
    setReplyBusy(true);
    try {
      await api(`/works/${id}/comments`, { method: "POST", body: { body, parentId } });
      setReplyText("");
      setReplyTo(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["work-comments", id] }),
        qc.invalidateQueries({ queryKey: ["work", id] }),
      ]);
    } catch {
      /* ignore */
    } finally {
      setReplyBusy(false);
    }
  }

  async function saveEdit(cid: number) {
    const body = editText.trim();
    if (!body || editBusy) return;
    setEditBusy(true);
    try {
      await api(`/works/${id}/comments/${cid}`, { method: "PATCH", body: { body } });
      setEditId(null);
      setEditText("");
      await qc.invalidateQueries({ queryKey: ["work-comments", id] });
    } catch {
      /* ignore */
    } finally {
      setEditBusy(false);
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
  const savedByMe = q.data.savedByMe ?? false;
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
            accessibilityRole="button"
            accessibilityLabel="تعديل العمل"
            style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border }}
          >
            <Feather name="edit-2" size={13} color={colors.foreground} />
            <T size={13} weight="medium">تعديل</T>
          </Pressable>
        ) : null}
      </View>
      {q.data.author?.fullName ? <T size={13} color={colors.mutedForeground}>{q.data.author.fullName}</T> : null}

      {/* Engagement: like toggle + comment count */}
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 14 }}>
        <Pressable
          onPress={toggleLike}
          disabled={liking}
          accessibilityRole="button"
          accessibilityLabel={likedByMe ? "إلغاء الإعجاب" : "إعجاب"}
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
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={toggleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={savedByMe ? "إلغاء الحفظ" : "حفظ العمل"}
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: colors.radius,
            borderWidth: 1,
            borderColor: savedByMe ? colors.primary : colors.border,
            backgroundColor: savedByMe ? colors.primary + "1A" : colors.card,
          }}
        >
          <Feather name="bookmark" size={16} color={savedByMe ? colors.primary : colors.mutedForeground} />
          <T size={13} weight="medium" color={savedByMe ? colors.primary : colors.mutedForeground}>
            {savedByMe ? "محفوظ" : "حفظ"}
          </T>
        </Pressable>
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
          comments.map((c) => {
            const replies = c.replies ?? [];
            const threadIds = [c.id, ...replies.map((r) => r.id)];
            const composerOpen = replyTo !== null && threadIds.includes(replyTo);
            return (
              <Card key={c.id} style={{ gap: 8 }}>
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
                  {c.editedAt ? <T size={10} color={colors.mutedForeground}>(عُدّل)</T> : null}
                  <View style={{ flex: 1 }} />
                  {c.canEdit ? (
                    <Pressable onPress={() => { setEditId(c.id); setEditText(c.body); setReplyTo(null); }} hitSlop={8} accessibilityRole="button" accessibilityLabel="تعديل التعليق">
                      <Feather name="edit-2" size={14} color={colors.mutedForeground} />
                    </Pressable>
                  ) : null}
                  {c.canDelete ? (
                    <Pressable onPress={() => deleteComment(c.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="حذف التعليق">
                      <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                    </Pressable>
                  ) : null}
                </View>
                {editId === c.id ? (
                  <EditRow value={editText} onChange={setEditText} onSave={() => saveEdit(c.id)} onCancel={() => { setEditId(null); setEditText(""); }} busy={editBusy} colors={colors} />
                ) : (
                  <>
                    <T size={14} style={{ lineHeight: 22 }}>{c.body}</T>
                    {user ? (
                      <Pressable
                        onPress={() => { setReplyTo(c.id); setReplyText(""); }}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel="رد على التعليق"
                        style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}
                      >
                        <Feather name="corner-up-left" size={13} color={colors.primary} />
                        <T size={12} weight="medium" color={colors.primary}>رد</T>
                      </Pressable>
                    ) : null}
                  </>
                )}

                {replies.length > 0 ? (
                  <View style={{ gap: 10, paddingRight: 12, borderRightWidth: 2, borderRightColor: colors.border, marginTop: 2 }}>
                    {replies.map((rep) => (
                      <View key={rep.id} style={{ gap: 4 }}>
                        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                          <View style={{ width: 24, height: 24, borderRadius: 12, overflow: "hidden", backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                            {rep.author.avatarUrl ? (
                              <Image source={{ uri: resolveMedia(rep.author.avatarUrl) }} style={{ width: 24, height: 24 }} contentFit="cover" />
                            ) : (
                              <T size={11} weight="bold">{(rep.author.fullName || "·").slice(0, 1)}</T>
                            )}
                          </View>
                          <T size={12} weight="bold">{rep.author.fullName}</T>
                          <T size={10} color={colors.mutedForeground}>{timeAgo(rep.createdAt)}</T>
                          {rep.editedAt ? <T size={9} color={colors.mutedForeground}>(عُدّل)</T> : null}
                          <View style={{ flex: 1 }} />
                          {rep.canEdit ? (
                            <Pressable onPress={() => { setEditId(rep.id); setEditText(rep.body); setReplyTo(null); }} hitSlop={8} accessibilityRole="button" accessibilityLabel="تعديل الرد">
                              <Feather name="edit-2" size={12} color={colors.mutedForeground} />
                            </Pressable>
                          ) : null}
                          {rep.canDelete ? (
                            <Pressable onPress={() => deleteComment(rep.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="حذف الرد">
                              <Feather name="trash-2" size={13} color={colors.mutedForeground} />
                            </Pressable>
                          ) : null}
                        </View>
                        {editId === rep.id ? (
                          <EditRow value={editText} onChange={setEditText} onSave={() => saveEdit(rep.id)} onCancel={() => { setEditId(null); setEditText(""); }} busy={editBusy} colors={colors} />
                        ) : (
                          <>
                            <T size={13} style={{ lineHeight: 20 }}>{rep.body}</T>
                            {user ? (
                              <Pressable
                                onPress={() => { setReplyTo(rep.id); setReplyText(""); }}
                                hitSlop={6}
                                accessibilityRole="button"
                                accessibilityLabel="رد"
                                style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}
                              >
                                <Feather name="corner-up-left" size={12} color={colors.primary} />
                                <T size={11} weight="medium" color={colors.primary}>رد</T>
                              </Pressable>
                            ) : null}
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                ) : null}

                {composerOpen && user ? (
                  <View style={{ gap: 6, marginTop: 2 }}>
                    <TextInput
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline
                      maxLength={1000}
                      autoFocus
                      placeholder="اكتب ردًّا…"
                      placeholderTextColor={colors.mutedForeground}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.card,
                        borderRadius: colors.radius,
                        padding: 10,
                        minHeight: 52,
                        fontSize: 14,
                        color: colors.foreground,
                        textAlign: "right",
                        writingDirection: "rtl",
                      }}
                    />
                    <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                      <Btn title="رد" loading={replyBusy} disabled={!replyText.trim()} onPress={() => postReply(replyTo!)} style={{ flex: 1 }} />
                      <Btn title="إلغاء" variant="secondary" onPress={() => { setReplyTo(null); setReplyText(""); }} />
                    </View>
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

function EditRow({
  value,
  onChange,
  onSave,
  onCancel,
  busy,
  colors,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ gap: 6 }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline
        maxLength={1000}
        autoFocus
        placeholder="عدّل تعليقك…"
        placeholderTextColor={colors.mutedForeground}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          padding: 10,
          minHeight: 52,
          fontSize: 14,
          color: colors.foreground,
          textAlign: "right",
          writingDirection: "rtl",
        }}
      />
      <View style={{ flexDirection: "row-reverse", gap: 8 }}>
        <Btn title="حفظ" loading={busy} disabled={!value.trim()} onPress={onSave} style={{ flex: 1 }} />
        <Btn title="إلغاء" variant="secondary" onPress={onCancel} />
      </View>
    </View>
  );
}
