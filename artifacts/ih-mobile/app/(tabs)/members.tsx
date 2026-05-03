import React from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { T, Card, Empty } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";
import type { PublicMember } from "@/lib/types";

const ROLE_AR: Record<string, string> = {
  freelancer: "فريلانسر",
  graduate: "خرّيج",
  student: "طالب",
  other: "أخرى",
};

export default function MembersScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const q = useQuery<{ members: PublicMember[] }>({
    queryKey: ["members"],
    queryFn: () => api("/members"),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 20 }}>
        <T size={26} weight="bold">منتسبو المساحة</T>
        <T size={13} color={colors.mutedForeground}>
          {q.data?.members.length ?? 0} عضوًا فاعلًا
        </T>
      </View>
      {q.isLoading ? (
        <View style={{ padding: 32, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : q.data?.members.length === 0 ? (
        <Empty title="لم يلتحق منتسبون بعد" />
      ) : (
        <FlatList
          data={q.data?.members ?? []}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 10 }}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/member/${item.id}`)}>
              <Card style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
                {item.avatarUrl ? (
                  <Image
                    source={{ uri: resolveMedia(item.avatarUrl) }}
                    style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.muted }}
                  />
                ) : (
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: colors.primarySoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <T size={20} weight="bold" color={colors.primary}>
                      {item.fullName.trim().slice(0, 1)}
                    </T>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <T size={15} weight="bold">{item.fullName}</T>
                  <T size={13} color={colors.mutedForeground} numberOfLines={1}>
                    {item.jobTitle || ROLE_AR[item.role] || "—"}
                  </T>
                </View>
                {item.worksCount ? (
                  <View
                    style={{
                      backgroundColor: colors.primarySoft,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                    }}
                  >
                    <T size={12} weight="bold" color={colors.primary}>{item.worksCount} عمل</T>
                  </View>
                ) : null}
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
