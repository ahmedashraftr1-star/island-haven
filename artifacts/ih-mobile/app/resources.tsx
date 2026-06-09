import React from "react";
import { FlatList, Linking, Pressable, RefreshControl, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { T, Card, Empty, SkeletonCard } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  template: "قالب",
  guide: "دليل",
  tool: "أداة",
  perk: "ميزة",
  recording: "تسجيل",
  legal: "قانونيّ",
};
const CATEGORY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  template: "file-text",
  guide: "book-open",
  tool: "tool",
  perk: "gift",
  recording: "video",
  legal: "shield",
};

interface ResourceRow {
  id: number;
  title: string;
  summary: string;
  category: string;
  externalUrl: string;
  fileUrl: string;
  featured: boolean;
}

export default function ResourcesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const q = useQuery<{ resources: ResourceRow[] }>({
    queryKey: ["resources"],
    queryFn: () => api("/resources"),
  });
  const items = q.data?.resources ?? [];

  function open(r: ResourceRow) {
    const url = r.fileUrl || r.externalUrl;
    if (url) Linking.openURL(url).catch(() => {});
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 20 }}>
        <T size={26} weight="bold">دليل الرّائد</T>
        <T size={13} color={colors.mutedForeground}>
          أدلّة وقوالب وأدوات تساعدك على بناء مشروعك
        </T>
      </View>

      {q.isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <Empty icon="book-open" title="لا توجد موارد بعد" hint="سنضيف الأدلّة والقوالب قريبًا." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const hasLink = !!(item.fileUrl || item.externalUrl);
            return (
              <Pressable onPress={() => open(item)} disabled={!hasLink}>
                <Card style={{ padding: 16 }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        backgroundColor: colors.primarySoft,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather
                        name={CATEGORY_ICONS[item.category] ?? "file"}
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                        <T size={15} weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
                          {item.title}
                        </T>
                        <View
                          style={{
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 999,
                            backgroundColor: colors.muted,
                          }}
                        >
                          <T size={10} weight="bold" color={colors.mutedForeground}>
                            {CATEGORY_LABELS[item.category] ?? item.category}
                          </T>
                        </View>
                      </View>
                      {item.summary ? (
                        <T size={12.5} color={colors.mutedForeground} numberOfLines={2} style={{ marginTop: 2, lineHeight: 19 }}>
                          {item.summary}
                        </T>
                      ) : null}
                    </View>
                    {hasLink ? (
                      <Feather name="external-link" size={16} color={colors.mutedForeground} />
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
