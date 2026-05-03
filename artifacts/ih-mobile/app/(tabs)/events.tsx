import React from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { T, Card, Empty } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";
import type { DailyPost } from "@/lib/types";

const TYPE_AR: Record<DailyPost["type"], string> = {
  tip: "نصيحة",
  news: "خبر",
  quote: "اقتباس",
  story: "قصّة",
};

export default function EventsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const q = useQuery<{ posts: DailyPost[] }>({
    queryKey: ["events"],
    queryFn: () => api("/daily?limit=50"),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 20 }}>
        <T size={26} weight="bold">فعاليات آيلاند</T>
        <T size={13} color={colors.mutedForeground}>أحدث الأنشطة والتحديثات</T>
      </View>
      {q.isLoading ? (
        <View style={{ padding: 32, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : q.data?.posts.length === 0 ? (
        <Empty title="لا توجد فعاليات بعد" />
      ) : (
        <FlatList
          data={q.data?.posts ?? []}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 14 }}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: resolveMedia(item.imageUrl) }}
                  style={{ width: "100%", height: 180, backgroundColor: colors.muted }}
                  contentFit="cover"
                />
              ) : null}
              <View style={{ padding: 16, gap: 6 }}>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                  <View
                    style={{
                      backgroundColor: colors.primarySoft,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 999,
                    }}
                  >
                    <T size={11} weight="bold" color={colors.primary}>{TYPE_AR[item.type]}</T>
                  </View>
                  <T size={12} color={colors.mutedForeground}>
                    {new Date(item.publishedAt).toLocaleDateString("ar-EG-u-ca-gregory", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </T>
                </View>
                <T size={17} weight="bold">{item.title}</T>
                <T size={14} color={colors.mutedForeground}>{item.body}</T>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}
