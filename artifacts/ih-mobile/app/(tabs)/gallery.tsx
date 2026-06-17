import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { T, Empty, SkeletonBlock } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

interface GalleryItem {
  id: string;
  url: string;
  title: string;
  author?: string;
  authorId?: number;
  workId?: number;
  kind: "work" | "post";
  at: string;
}
interface GalleryResponse {
  items: GalleryItem[];
}

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

export default function GalleryScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const { width } = useWindowDimensions();
  const cols = width >= 700 ? 4 : 3;
  const gap = 6;
  const sidePad = 20;
  const tile = Math.floor((width - sidePad * 2 - gap * (cols - 1)) / cols);

  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const q = useQuery<GalleryResponse>({
    queryKey: ["gallery"],
    queryFn: () => api("/gallery"),
  });
  const items = q.data?.items ?? [];

  function open(it: GalleryItem) {
    if (it.workId) router.push(`/work/${it.workId}` as never);
    else if (it.authorId) router.push(`/member/${it.authorId}` as never);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 20 }}>
        <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 4 }}>
          لقطات · Gallery
        </T>
        <T size={26} weight="bold">معرض الصور</T>
        <T size={13} color={colors.mutedForeground}>لقطات من المساحة وأعمال المنتسبين</T>
      </View>

      {q.isLoading ? (
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", paddingHorizontal: sidePad, gap }}>
          {Array.from({ length: cols * 4 }).map((_, i) => (
            <SkeletonBlock key={i} height={tile} width={tile} radius={12} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <Empty icon="image" title="لا توجد صور بعد" hint="سنبدأ بنشر صور من المساحة والفعاليّات قريبًا." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          numColumns={cols}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap, paddingHorizontal: sidePad }}
          contentContainerStyle={{ paddingBottom: 120, gap }}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
          renderItem={({ item, index }) => (
            <Tile index={index} reduce={reduce}>
              <Pressable onPress={() => open(item)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                {failed[item.id] ? (
                  <View
                    style={{
                      width: tile,
                      height: tile,
                      borderRadius: 12,
                      backgroundColor: colors.primarySoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="image" size={Math.max(18, tile * 0.28)} color={colors.primary} />
                  </View>
                ) : (
                  <Image
                    source={{ uri: resolveMedia(item.url) }}
                    style={{ width: tile, height: tile, borderRadius: 12, backgroundColor: colors.muted }}
                    contentFit="cover"
                    onError={() => setFailed((f) => (f[item.id] ? f : { ...f, [item.id]: true }))}
                  />
                )}
              </Pressable>
            </Tile>
          )}
        />
      )}
    </View>
  );
}

function Tile({ index, reduce, children }: { index: number; reduce: boolean; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, {
      toValue: 1,
      duration: 360,
      delay: Math.min(index, 11) * 35,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reduce, index, v]);
  return (
    <Animated.View
      style={{ opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }}
    >
      {children}
    </Animated.View>
  );
}
