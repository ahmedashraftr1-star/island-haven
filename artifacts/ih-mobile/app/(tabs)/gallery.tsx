import React from "react";
import { ActivityIndicator, FlatList, RefreshControl, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { T, Empty } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

interface GalleryItem {
  url: string;
  source?: string;
}
interface GalleryResponse {
  images: (string | GalleryItem)[];
}

function asUrl(it: string | GalleryItem): string {
  return typeof it === "string" ? it : it.url;
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
        <View style={{ padding: 32, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (q.data?.images?.length ?? 0) === 0 ? (
        <Empty title="لا توجد صور بعد" />
      ) : (
        <FlatList
          data={q.data?.images ?? []}
          keyExtractor={(it, i) => `${asUrl(it)}-${i}`}
          numColumns={cols}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
          renderItem={({ item, index }) => (
            <Image
              source={{ uri: resolveMedia(asUrl(item)) }}
              style={{
                width: tile,
                height: tile,
                marginRight: (index + 1) % cols === 0 ? 0 : gap,
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
