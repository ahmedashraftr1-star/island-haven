import React from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { T, Card, Empty, SkeletonCard } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

const GROUP_LABELS: Record<string, string> = {
  leadership: "القيادة",
  mentors: "المرشدون",
  advisors: "المستشارون",
  support: "فريق الدعم",
};
const GROUP_ORDER = ["leadership", "mentors", "advisors", "support"];

interface Member {
  id: number;
  fullName: string;
  role: string;
  bio: string;
  avatarUrl: string | null;
  linkedinUrl: string;
  websiteUrl: string;
  group: string;
  featured: boolean;
}

export default function TeamScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const q = useQuery<{ team: Member[] }>({
    queryKey: ["team"],
    queryFn: () => api("/team"),
  });
  const items = q.data?.team ?? [];

  const groups = GROUP_ORDER.map((g) => ({
    key: g,
    label: GROUP_LABELS[g] ?? g,
    members: items.filter((m) => m.group === g),
  })).filter((grp) => grp.members.length > 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingBottom: 4, paddingHorizontal: 20 }}>
        <T size={26} weight="bold">فريق آيلاند</T>
        <T size={13} color={colors.mutedForeground}>
          الأشخاص الذين يبنون المساحة ويحتضنون المشاريع
        </T>
      </View>

      {q.isLoading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <Empty icon="users" title="سيُعلن الفريق قريبًا" hint="تابعنا للتعرّف على فريق آيلاند." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 12, gap: 18 }}>
          {groups.map((grp) => (
            <View key={grp.key} style={{ gap: 10 }}>
              <T size={13} weight="bold" color={colors.primary}>{grp.label}</T>
              {grp.members.map((m) => (
                <Card key={m.id} style={{ padding: 14 }}>
                  <View style={{ flexDirection: "row-reverse", gap: 12 }}>
                    {m.avatarUrl ? (
                      <Image
                        source={{ uri: resolveMedia(m.avatarUrl) }}
                        style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.muted }}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 26,
                          backgroundColor: colors.primarySoft,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <T size={20} weight="bold" color={colors.primary}>{m.fullName.charAt(0)}</T>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <T size={15.5} weight="bold">{m.fullName}</T>
                      {m.role ? <T size={12.5} color={colors.primary}>{m.role}</T> : null}
                      {m.bio ? (
                        <T size={12.5} color={colors.mutedForeground} style={{ marginTop: 4, lineHeight: 20 }}>
                          {m.bio}
                        </T>
                      ) : null}
                      {(m.linkedinUrl || m.websiteUrl) ? (
                        <View style={{ flexDirection: "row-reverse", gap: 14, marginTop: 8 }}>
                          {m.linkedinUrl ? (
                            <Pressable
                              onPress={() => Linking.openURL(m.linkedinUrl).catch(() => {})}
                              style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}
                            >
                              <Feather name="linkedin" size={13} color={colors.primary} />
                              <T size={11.5} color={colors.primary}>LinkedIn</T>
                            </Pressable>
                          ) : null}
                          {m.websiteUrl ? (
                            <Pressable
                              onPress={() => Linking.openURL(m.websiteUrl).catch(() => {})}
                              style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}
                            >
                              <Feather name="globe" size={13} color={colors.primary} />
                              <T size={11.5} color={colors.primary}>الموقع</T>
                            </Pressable>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
