import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { T, Card, Empty, SkeletonBlock } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";
import type { WorkListItem } from "@/lib/types";

interface WorksPage {
  works: WorkListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export default function WorksScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<WorksPage>({
    queryKey: ["works-list"],
    queryFn: ({ pageParam = 1 }) => api(`/works?page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const items = data?.pages.flatMap((p) => p.works) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 20,
        }}
      >
        <T size={26} weight="bold">أعمال المنتسبين</T>
        <T size={13} color={colors.mutedForeground}>
          {total} عمل منشور
        </T>
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ gap: 8 }}>
              <SkeletonBlock height={160} radius={colors.radius + 2} />
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                <SkeletonBlock height={32} radius={16} />
                <SkeletonBlock height={14} radius={6} />
              </View>
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <Empty
          icon="layers"
          title="لا توجد أعمال بعد"
          hint="سيظهر هنا أعمال المنتسبين بمجرد نشرها."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.work.id)}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 120,
            gap: 12,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isFetchingNextPage}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const { work, author } = item;
            const initial = (author.fullName || "·").trim().slice(0, 1);
            return (
              <Pressable onPress={() => router.push(`/work/${work.id}` as never)}>
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  {work.coverUrl ? (
                    <Image
                      source={{ uri: resolveMedia(work.coverUrl) }}
                      style={{
                        width: "100%",
                        height: 180,
                        backgroundColor: colors.muted,
                      }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: 80,
                        backgroundColor: colors.primarySoft,
                      }}
                    />
                  )}

                  <View style={{ padding: 14, gap: 10 }}>
                    <T size={16} weight="bold" numberOfLines={2}>
                      {work.title}
                    </T>

                    {(work.summary || work.description) ? (
                      <T
                        size={13}
                        color={colors.mutedForeground}
                        numberOfLines={2}
                        style={{ lineHeight: 20 }}
                      >
                        {work.summary || work.description}
                      </T>
                    ) : null}

                    {author.fullName ? (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/member/${author.id}` as never);
                        }}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel={author.fullName}
                        style={{
                          flexDirection: "row-reverse",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 2,
                          alignSelf: "flex-start",
                        }}
                      >
                        {author.avatarUrl ? (
                          <Image
                            source={{ uri: resolveMedia(author.avatarUrl) }}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: colors.muted,
                            }}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: colors.primarySoft,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <T size={12} weight="bold" color={colors.primary}>
                              {initial}
                            </T>
                          </View>
                        )}
                        <T size={13} color={colors.mutedForeground} numberOfLines={1}>
                          {author.fullName}
                        </T>
                      </Pressable>
                    ) : null}
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
