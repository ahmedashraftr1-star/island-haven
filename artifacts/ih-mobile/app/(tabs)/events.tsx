import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { T, Card, Empty, SkeletonCard } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";
import type { DailyPost } from "@/lib/types";

const TYPE_AR: Record<DailyPost["type"], string> = {
  tip: "نصيحة",
  news: "خبر",
  quote: "اقتباس",
  story: "قصّة",
};
const FILTERS: Array<{ key: "" | DailyPost["type"]; label: string }> = [
  { key: "", label: "الكلّ" },
  { key: "news", label: "أخبار" },
  { key: "story", label: "قصص" },
  { key: "tip", label: "نصائح" },
  { key: "quote", label: "اقتباسات" },
];

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduce(v));
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

export default function EventsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const [type, setType] = useState<"" | DailyPost["type"]>("");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<{ posts: DailyPost[]; total: number; totalPages: number; page: number }>({
    queryKey: ["events", type],
    queryFn: ({ pageParam = 1 }) => api(`/daily?page=${pageParam}${type ? `&type=${type}` : ""}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingBottom: 6, paddingHorizontal: 20 }}>
        <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 4 }}>
          ما الجديد · Updates
        </T>
        <T size={26} weight="bold">فعاليّات آيلاند</T>
        <T size={13} color={colors.mutedForeground}>أحدث الأنشطة والأخبار والقصص</T>
      </View>

      <View style={{ paddingVertical: 8 }}>
        <FlatList
          horizontal
          inverted
          data={FILTERS}
          keyExtractor={(f) => f.key || "all"}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item: f }) => {
            const active = type === f.key;
            return (
              <Pressable
                onPress={() => setType(f.key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySoft : "transparent",
                }}
              >
                <T size={12} weight="medium" color={active ? colors.primary : colors.foreground}>
                  {f.label}
                </T>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 14, paddingTop: 6 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : posts.length === 0 ? (
        <Empty icon="calendar" title="لا توجد منشورات بعد" hint="ترقّب أوّل أخبارنا قريبًا — تابعنا." />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 6, gap: 14 }}
          showsVerticalScrollIndicator={false}
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
          renderItem={({ item, index }) => (
            <AnimatedItem index={index} reduce={reduce}>
              <Card style={{ padding: 0, overflow: "hidden" }}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: resolveMedia(item.imageUrl) }}
                    style={{ width: "100%", height: 180, backgroundColor: colors.muted }}
                    contentFit="cover"
                  />
                ) : null}
                <View style={{ padding: 16, gap: 7 }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                    <View style={{ backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 }}>
                      <T size={11} weight="bold" color={colors.primary}>{TYPE_AR[item.type]}</T>
                    </View>
                    <T size={12} color={colors.mutedForeground}>
                      {new Date(item.publishedAt).toLocaleDateString("ar-EG-u-ca-gregory", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </T>
                  </View>
                  <T size={17} weight="bold" style={{ lineHeight: 25 }}>{item.title}</T>
                  <T size={14} color={colors.mutedForeground} style={{ lineHeight: 23 }}>{item.body}</T>
                </View>
              </Card>
            </AnimatedItem>
          )}
        />
      )}
    </View>
  );
}

function AnimatedItem({
  index,
  reduce,
  children,
}: {
  index: number;
  reduce: boolean;
  children: React.ReactNode;
}) {
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, {
      toValue: 1,
      duration: 420,
      delay: Math.min(index, 6) * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reduce, index, v]);
  return (
    <Animated.View
      style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}
    >
      {children}
    </Animated.View>
  );
}
