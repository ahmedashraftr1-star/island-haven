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

const VENTURE_STAGE_LABELS: Record<string, string> = {
  idea: "فكرة",
  mvp: "نموذج أوّليّ",
  launched: "أُطلِق",
  scaling: "في توسّع",
};

interface Venture {
  id: number;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string;
  founderName: string;
  sector: string;
  stage: string;
  foundedYear: number;
  teamSize: number;
  featured: boolean;
}

export default function VenturesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const q = useQuery<{ ventures: Venture[] }>({
    queryKey: ["ventures"],
    queryFn: () => api("/ventures"),
  });

  const items = q.data?.ventures ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 20 }}>
        <T size={26} weight="bold">المشاريع الناشئة</T>
        <T size={13} color={colors.mutedForeground}>
          صُنِع في آيلاند — من فكرة إلى منتج
        </T>
      </View>

      {q.isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <Empty icon="trending-up" title="قريبًا — أوّل دفعة مشاريع" hint="نعمل مع روّاد الأعمال على إطلاق مشاريعهم. تابعنا." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 14 }}
          refreshControl={
            <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/venture/${item.id}` as never)}>
              <Card style={{ padding: 0, overflow: "hidden" }}>
                {item.coverUrl ? (
                  <Image
                    source={{ uri: resolveMedia(item.coverUrl) }}
                    style={{ width: "100%", height: 140, backgroundColor: colors.muted }}
                    contentFit="cover"
                  />
                ) : (
                  <View style={{ width: "100%", height: 80, backgroundColor: colors.primarySoft }} />
                )}
                <View style={{ padding: 14, gap: 8 }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
                    {item.logoUrl ? (
                      <Image
                        source={{ uri: resolveMedia(item.logoUrl) }}
                        style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.muted }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          backgroundColor: colors.primarySoft,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <T size={18} weight="bold" color={colors.primary}>{item.name.charAt(0)}</T>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                        <T size={16} weight="bold">{item.name}</T>
                        {item.featured ? <Feather name="star" size={13} color={colors.primary} /> : null}
                      </View>
                      <T size={11.5} color={colors.primary} weight="medium">
                        {VENTURE_STAGE_LABELS[item.stage] ?? item.stage}
                        {item.sector ? ` · ${item.sector}` : ""}
                      </T>
                    </View>
                  </View>

                  {item.tagline ? (
                    <T size={13} color={colors.foreground} style={{ lineHeight: 21 }}>
                      {item.tagline}
                    </T>
                  ) : null}

                  {item.description ? (
                    <T size={12} color={colors.mutedForeground} numberOfLines={3} style={{ lineHeight: 20 }}>
                      {item.description}
                    </T>
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
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                      <Feather name="users" size={12} color={colors.primary} />
                      <T size={11.5} color={colors.mutedForeground}>
                        {item.teamSize} في الفريق
                        {item.foundedYear ? ` · ${item.foundedYear}` : ""}
                      </T>
                    </View>
                    <T size={12} weight="medium" color={colors.primary}>التفاصيل ←</T>
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
