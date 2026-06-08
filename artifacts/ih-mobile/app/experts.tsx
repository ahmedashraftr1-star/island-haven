import React from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { T, Card, Empty, SkeletonRow } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

interface ExpertCard {
  id: number;
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  expertise: string;
  bio: string;
  yearsExperience: number;
  languages: string;
  sessionMinutes: number;
  availabilityNote: string;
  acceptingSessions: boolean;
  featured: boolean;
}

function splitTags(s: string | null | undefined): string[] {
  return (s || "").split(/[,،]/).map((p) => p.trim()).filter(Boolean);
}

export default function ExpertsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const q = useQuery<{ experts: ExpertCard[] }>({
    queryKey: ["experts"],
    queryFn: () => api("/experts"),
  });

  const items = q.data?.experts ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 20 }}>
        <T size={26} weight="bold">الخبراء والمرشدون</T>
        <T size={13} color={colors.mutedForeground}>
          احجز جلسة إرشاد فرديّة مَجّانًا
        </T>
      </View>

      {q.isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <Empty icon="award" title="سيُعلَن عن الخبراء قريبًا" hint="نُجهّز شبكة من أفضل المرشدين لمجتمع آيلاند." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const areas = splitTags(item.expertise).slice(0, 4);
            return (
              <Pressable onPress={() => router.push(`/expert/${item.id}` as never)}>
                <Card style={{ gap: 12 }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
                    {item.avatarUrl ? (
                      <Image
                        source={{ uri: resolveMedia(item.avatarUrl) }}
                        style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.muted }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: colors.primarySoft,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <T size={22} weight="bold" color={colors.primary}>
                          {item.fullName.trim().slice(0, 1)}
                        </T>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                        <T size={16} weight="bold">{item.fullName}</T>
                        {item.featured ? (
                          <Feather name="star" size={14} color={colors.primary} />
                        ) : null}
                      </View>
                      {item.headline ? (
                        <T size={13} color={colors.primary} numberOfLines={2} weight="medium">
                          {item.headline}
                        </T>
                      ) : null}
                    </View>
                  </View>

                  {item.bio ? (
                    <T size={13} color={colors.mutedForeground} numberOfLines={3} style={{ lineHeight: 20 }}>
                      {item.bio}
                    </T>
                  ) : null}

                  {areas.length > 0 ? (
                    <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 }}>
                      {areas.map((a, i) => (
                        <View
                          key={i}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 999,
                            backgroundColor: colors.muted,
                          }}
                        >
                          <T size={11} weight="medium" color={colors.mutedForeground}>{a}</T>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <View
                    style={{
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <T size={12} color={item.acceptingSessions ? colors.primary : colors.mutedForeground}>
                      {item.acceptingSessions ? "✦ يستقبل جلسات" : "غير متاح حاليًا"}
                    </T>
                    <T size={12} weight="medium" color={colors.primary}>
                      عرض الملف ←
                    </T>
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
