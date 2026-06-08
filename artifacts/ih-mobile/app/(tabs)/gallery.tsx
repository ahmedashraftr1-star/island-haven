import React from "react";
import { FlatList, RefreshControl, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

export default function GalleryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cols = width >= 700 ? 4 : 3;
  const gap = 4;
  const tile = Math.floor((width - gap * (cols - 1)) / cols);

  const q = useQuery<GalleryResponse>({
    queryKey: ["gallery"],
    queryFn: () => api("/gallery"),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 20 }}>
        <T size={26} weight="bold">معرض الصور</T>
        <T size={13} color={colors.mutedForeground}>لقطات من المساحة وأعمال المنتسبين</T>
      </View>
      {q.isLoading ? (
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", paddingHorizontal: gap }}>
          {Array.from({ length: cols * 3 }).map((_, i) => (
            <View key={i} style={{ width: tile, height: tile, padding: gap / 2 }}>
              <SkeletonBlock height={tile - gap} radius={6} />
            </View>
          ))}
        </View>
      ) : (q.data?.items?.length ?? 0) === 0 ? (
        <Empty icon="image" title="لا توجد صور بعد" hint="سنبدأ بنشر صور من المساحة والفعاليّات قريبًا." />
      ) : (
        <FlatList
          data={q.data?.items ?? []}
          keyExtractor={(it) => it.id}
          numColumns={cols}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
          renderItem={({ item, index }) => (
            <Image
              source={{ uri: resolveMedia(item.url) }}
              style={{
                width: tile,
                height: tile,
                marginEnd: (index + 1) % cols === 0 ? 0 : gap,
                marginBottom: gap,
                backgroundColor: colors.muted,
              }}
              contentFit="cover"
            />
          )}
        />
      )}
    </View>
  );
}
