import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { T, Card, Empty, SkeletonCard } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

const COURSE_TYPE_LABELS: Record<string, string> = {
  course: "كورس",
  workshop: "ورشة",
};

const COURSE_STATUS_LABELS: Record<string, string> = {
  draft: "مسوّدة",
  open: "تسجيل مفتوح",
  closed: "مكتمل العدد",
  done: "منتهٍ",
};

interface CourseRow {
  id: number;
  type: string;
  title: string;
  summary: string;
  instructor: string;
  coverUrl: string | null;
  location: string;
  startsAt: string | null;
  capacity: number;
  status: string;
  enrolled: number;
}

const FILTERS: Array<{ key: "" | "course" | "workshop"; label: string }> = [
  { key: "", label: "الكلّ" },
  { key: "course", label: "كورسات" },
  { key: "workshop", label: "ورشات" },
];

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function CoursesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<"" | "course" | "workshop">("");

  const q = useQuery<{ courses: CourseRow[] }>({
    queryKey: ["courses", filter],
    queryFn: () => api(`/courses${filter ? `?type=${filter}` : ""}`),
  });

  const items = q.data?.courses ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingBottom: 8, paddingHorizontal: 20 }}>
        <T size={26} weight="bold">الكورسات والورشات</T>
        <T size={13} color={colors.mutedForeground}>
          فرص تدريبيّة مَجّانيّة في آيلاند
        </T>
      </View>

      <View style={{ flexDirection: "row-reverse", paddingHorizontal: 20, paddingVertical: 8, gap: 8 }}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key || "all"}
              onPress={() => setFilter(f.key)}
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
        })}
      </View>

      {q.isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <Empty icon="book-open" title="لا توجد فعاليّات منشورة بعد" hint="ترقّب الإعلان عن أوّل دفعة قريبًا." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 14 }}
          refreshControl={
            <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const isFull = item.capacity > 0 && item.enrolled >= item.capacity;
            const isOpen = item.status === "open" && !isFull;
            return (
              <Pressable onPress={() => router.push(`/course/${item.id}` as never)}>
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  {item.coverUrl ? (
                    <Image
                      source={{ uri: resolveMedia(item.coverUrl) }}
                      style={{ width: "100%", height: 150, backgroundColor: colors.muted }}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={{ width: "100%", height: 80, backgroundColor: colors.primarySoft }} />
                  )}
                  <View style={{ padding: 14, gap: 8 }}>
                    <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 }}>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                          backgroundColor: colors.primarySoft,
                        }}
                      >
                        <T size={10} weight="bold" color={colors.primary}>
                          {COURSE_TYPE_LABELS[item.type] ?? item.type}
                        </T>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                          backgroundColor: isOpen ? colors.primarySoft : colors.muted,
                        }}
                      >
                        <T size={10} weight="bold" color={isOpen ? colors.primary : colors.mutedForeground}>
                          {isFull ? "مكتمل العدد" : COURSE_STATUS_LABELS[item.status] ?? item.status}
                        </T>
                      </View>
                    </View>
                    <T size={16} weight="bold" numberOfLines={2}>{item.title}</T>
                    {item.summary ? (
                      <T size={13} color={colors.mutedForeground} numberOfLines={2} style={{ lineHeight: 21 }}>
                        {item.summary}
                      </T>
                    ) : null}
                    <View style={{ gap: 4, paddingTop: 4 }}>
                      {item.startsAt ? (
                        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                          <Feather name="calendar" size={12} color={colors.primary} />
                          <T size={11.5} color={colors.mutedForeground}>{formatDateTime(item.startsAt)}</T>
                        </View>
                      ) : null}
                      {item.location ? (
                        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                          <Feather name="map-pin" size={12} color={colors.primary} />
                          <T size={11.5} color={colors.mutedForeground} numberOfLines={1}>{item.location}</T>
                        </View>
                      ) : null}
                      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                        <Feather name="users" size={12} color={colors.primary} />
                        <T size={11.5} color={colors.mutedForeground}>
                          {item.enrolled}
                          {item.capacity > 0 ? ` / ${item.capacity}` : ""} مشترك
                        </T>
                      </View>
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
