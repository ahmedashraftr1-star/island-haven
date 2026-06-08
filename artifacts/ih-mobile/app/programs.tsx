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

const PROGRAM_STATUS_LABELS: Record<string, string> = {
  draft: "مسوّدة",
  open: "التقديم مفتوح",
  in_progress: "جارٍ التنفيذ",
  done: "منتهٍ",
};

interface ProgramRow {
  id: number;
  title: string;
  summary: string;
  coverUrl: string | null;
  durationWeeks: number;
  seats: number;
  tags: string;
  startsAt: string | null;
  applyDeadline: string | null;
  status: string;
  applicants: number;
}

function splitTags(s: string | null | undefined): string[] {
  return (s || "").split(/[,،]/).map((p) => p.trim()).filter(Boolean);
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default function ProgramsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const q = useQuery<{ programs: ProgramRow[] }>({
    queryKey: ["programs"],
    queryFn: () => api("/programs"),
  });

  const items = q.data?.programs ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 20 }}>
        <T size={26} weight="bold">برامج الاحتضان</T>
        <T size={13} color={colors.mutedForeground}>
          مسارات تأخذ مشروعك من الفكرة إلى الإطلاق
        </T>
      </View>

      {q.isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <Empty icon="layers" title="لا توجد برامج منشورة بعد" hint="ترقّب الإعلان عن أوّل دفعة احتضان قريبًا." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 14 }}
          refreshControl={
            <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const tags = splitTags(item.tags).slice(0, 3);
            const open = item.status === "open";
            return (
              <Pressable onPress={() => router.push(`/program/${item.id}` as never)}>
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  {item.coverUrl ? (
                    <Image
                      source={{ uri: resolveMedia(item.coverUrl) }}
                      style={{ width: "100%", height: 160, backgroundColor: colors.muted }}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={{ width: "100%", height: 100, backgroundColor: colors.primarySoft }} />
                  )}
                  <View style={{ padding: 16, gap: 8 }}>
                    <View
                      style={{
                        alignSelf: "flex-end",
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 999,
                        backgroundColor: open ? colors.primarySoft : colors.muted,
                      }}
                    >
                      <T size={11} weight="bold" color={open ? colors.primary : colors.mutedForeground}>
                        {PROGRAM_STATUS_LABELS[item.status] ?? item.status}
                      </T>
                    </View>
                    <T size={17} weight="bold" numberOfLines={2}>{item.title}</T>
                    {item.summary ? (
                      <T size={13} color={colors.mutedForeground} numberOfLines={3} style={{ lineHeight: 21 }}>
                        {item.summary}
                      </T>
                    ) : null}

                    {tags.length > 0 ? (
                      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                        {tags.map((t, i) => (
                          <View
                            key={i}
                            style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.muted }}
                          >
                            <T size={11} weight="medium" color={colors.mutedForeground}>{t}</T>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <View
                      style={{
                        flexDirection: "row-reverse",
                        flexWrap: "wrap",
                        gap: 12,
                        paddingTop: 10,
                        marginTop: 4,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      {item.durationWeeks > 0 ? (
                        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                          <Feather name="clock" size={12} color={colors.primary} />
                          <T size={11.5} color={colors.mutedForeground}>{item.durationWeeks} أسبوع</T>
                        </View>
                      ) : null}
                      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                        <Feather name="users" size={12} color={colors.primary} />
                        <T size={11.5} color={colors.mutedForeground}>{item.applicants} متقدّم</T>
                      </View>
                      {item.applyDeadline ? (
                        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                          <Feather name="calendar" size={12} color={colors.primary} />
                          <T size={11.5} color={colors.mutedForeground}>آخر موعد: {formatDate(item.applyDeadline)}</T>
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
