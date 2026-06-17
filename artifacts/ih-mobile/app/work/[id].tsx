import React from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { T, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";
import type { Work } from "@/lib/types";

interface WorkAuthor {
  id: number;
  fullName: string;
  role: string;
  avatarUrl: string | null;
}

export default function WorkDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const q = useQuery<{ work: Work; author?: WorkAuthor }>({
    queryKey: ["work", id],
    queryFn: () => api(`/works/${id}`),
    enabled: !!id,
  });

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!q.data) return null;
  const w = q.data.work;
  const author = q.data.author;
  const gallery = Array.isArray(w.galleryUrls) ? w.galleryUrls : [];
  const displayName = author?.fullName || w.authorName;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 80 }}>
      {w.coverUrl ? (
        <Image source={{ uri: resolveMedia(w.coverUrl) }} style={{ width: "100%", height: 220, borderRadius: colors.radius + 2, backgroundColor: colors.muted }} contentFit="cover" />
      ) : null}
      <T size={22} weight="bold">{w.title}</T>
      {displayName ? (
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
          {author?.avatarUrl ? (
            <Image
              source={{ uri: resolveMedia(author.avatarUrl) }}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted }}
              contentFit="cover"
            />
          ) : (
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary + "33", alignItems: "center", justifyContent: "center" }}>
              <T size={13} weight="bold" color={colors.primary}>{(displayName || "·").slice(0, 1)}</T>
            </View>
          )}
          <T size={13} color={colors.mutedForeground}>{displayName}</T>
        </View>
      ) : null}
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
    </ScrollView>
  );
}
