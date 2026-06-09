import React from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { T, Card, Empty, SkeletonCard } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

const COHORT_STATUS_LABELS: Record<string, string> = {
  announced: "معلَنة",
  open: "التسجيل مفتوح",
  in_progress: "جارية الآن",
  demo_day: "يوم العرض",
  completed: "مكتملة",
};

interface CohortRow {
  id: number;
  name: string;
  slug: string;
  summary: string;
  coverUrl: string | null;
  programTitle: string;
  status: string;
  ventureCount: number;
  demoDayAt: string | null;
}

export default function CohortsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const q = useQuery<{ cohorts: CohortRow[] }>({
    queryKey: ["cohorts"],
    queryFn: () => api("/cohorts"),
  });
  const items = q.data?.cohorts ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 20 }}>
        <T size={26} weight="bold">دفعات الاحتضان</T>
        <T size={13} color={colors.mutedForeground}>
          فِرَق تعمل معًا نحو يوم العرض (Demo Day)
        </T>
      </View>

      {q.isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <Empty icon="layers" title="لا توجد دفعات بعد" hint="ترقّب الإعلان عن أوّل دفعة احتضان قريبًا." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 14 }}
          refreshControl={
            <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const live = item.status === "in_progress" || item.status === "open";
            return (
              <Pressable onPress={() => router.push(`/cohort/${item.slug}` as never)}>
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  {item.coverUrl ? (
                    <Image
                      source={{ uri: resolveMedia(item.coverUrl) }}
                      style={{ width: "100%", height: 150, backgroundColor: colors.muted }}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={{ width: "100%", height: 90, backgroundColor: colors.primarySoft }} />
                  )}
                  <View style={{ padding: 16, gap: 8 }}>
                    <View
                      style={{
                        alignSelf: "flex-end",
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 999,
                        backgroundColor: live ? colors.primarySoft : colors.muted,
                      }}
                    >
                      <T size={11} weight="bold" color={live ? colors.primary : colors.mutedForeground}>
                        {COHORT_STATUS_LABELS[item.status] ?? item.status}
                      </T>
                    </View>
                    <T size={17} weight="bold" numberOfLines={2}>{item.name}</T>
                    {item.programTitle ? (
                      <T size={12} color={colors.primary}>{item.programTitle}</T>
                    ) : null}
                    {item.summary ? (
                      <T size={13} color={colors.mutedForeground} numberOfLines={3} style={{ lineHeight: 21 }}>
                        {item.summary}
                      </T>
                    ) : null}
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        gap: 14,
                        paddingTop: 10,
                        marginTop: 4,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                        <Feather name="trending-up" size={12} color={colors.primary} />
                        <T size={11.5} color={colors.mutedForeground}>{item.ventureCount} مشروع</T>
                      </View>
                      {item.demoDayAt ? (
                        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                          <Feather name="award" size={12} color={colors.primary} />
                          <T size={11.5} color={colors.mutedForeground}>يوم عرض</T>
                        </View>
                      ) : null}
                    </View>
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
