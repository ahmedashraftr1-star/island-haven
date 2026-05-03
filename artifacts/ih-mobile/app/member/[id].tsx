import React from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { T, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";
import type { CurrentUser, Work } from "@/lib/types";

export default function MemberDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const userQ = useQuery<{ user: CurrentUser; works: Work[] }>({
    queryKey: ["member", id],
    queryFn: () => api(`/users/${id}`),
    enabled: !!id,
  });

  if (userQ.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (userQ.isError || !userQ.data) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 20 }}>
        <T size={16}>تعذّر تحميل الملف.</T>
      </View>
    );
  }
  const { user, works = [] } = userQ.data;

  const links: { label: string; url: string; icon: keyof typeof Feather.glyphMap }[] = [];
  if (user.portfolioUrl) links.push({ label: "الموقع", url: user.portfolioUrl, icon: "globe" });
  if (user.linkedinUrl) links.push({ label: "LinkedIn", url: user.linkedinUrl, icon: "linkedin" });
  if (user.behanceUrl) links.push({ label: "Behance", url: user.behanceUrl, icon: "feather" });
  if (user.githubUrl) links.push({ label: "GitHub", url: user.githubUrl, icon: "github" });
  for (const l of user.otherLinks ?? []) links.push({ label: l.label, url: l.url, icon: "link" });

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 80 }}>
      <View style={{ alignItems: "center", gap: 10 }}>
        {user.avatarUrl ? (
          <Image source={{ uri: resolveMedia(user.avatarUrl) }} style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.muted }} />
        ) : (
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
            <T size={36} weight="bold" color={colors.primary}>{user.fullName.trim().slice(0, 1)}</T>
          </View>
        )}
        <T size={22} weight="bold" align="center">{user.fullName}</T>
        {user.jobTitle ? <T size={14} color={colors.mutedForeground} align="center">{user.jobTitle}</T> : null}
      </View>

      {user.bio ? (
        <Card>
          <T size={14} style={{ lineHeight: 22 }}>{user.bio}</T>
        </Card>
      ) : null}

      {user.skills ? (
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 }}>
          {user.skills.split(",").map((s, i) => s.trim() ? (
            <View key={i} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.primarySoft }}>
              <T size={12} weight="medium" color={colors.primary}>{s.trim()}</T>
            </View>
          ) : null)}
        </View>
      ) : null}

      {links.length > 0 ? (
        <Card style={{ gap: 10 }}>
          <T size={13} weight="medium" color={colors.mutedForeground}>روابط</T>
          {links.map((l) => (
            <Pressable key={l.url} onPress={() => Linking.openURL(l.url)} style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
              <Feather name={l.icon} size={16} color={colors.primary} />
              <T size={14} color={colors.primary}>{l.label}</T>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {works.length > 0 ? (
        <View style={{ gap: 10 }}>
          <T size={17} weight="bold">الأعمال</T>
          {works.map((w) => (
            <Card key={w.id} style={{ padding: 0, overflow: "hidden" }}>
              {w.coverUrl ? (
                <Image source={{ uri: resolveMedia(w.coverUrl) }} style={{ width: "100%", height: 160, backgroundColor: colors.muted }} contentFit="cover" />
              ) : null}
              <View style={{ padding: 14 }}>
                <T size={15} weight="bold">{w.title}</T>
                {w.description ? <T size={13} color={colors.mutedForeground} numberOfLines={2} style={{ marginTop: 4 }}>{w.description}</T> : null}
              </View>
            </Card>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
