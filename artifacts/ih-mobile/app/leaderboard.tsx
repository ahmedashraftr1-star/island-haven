import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { T, Empty } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

interface LeaderRow {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  score: number;
  badgeCount: number;
  worksCount: number;
}

const MEDAL_COLORS = ["#F59E0B", "#9CA3AF", "#D97706"];
const MEDAL_ICONS: ("award" | "award" | "award")[] = ["award", "award", "award"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default function LeaderboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api<{ leaderboard: LeaderRow[] }>("/leaderboard"),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const rows = data?.leaderboard ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={{ marginBottom: 20 }}>
        <T
          style={{
            fontSize: 26,
            fontFamily: "IBMPlexSansArabic_700Bold",
            color: colors.foreground,
            textAlign: "right",
          }}
        >
          لوحة الصدارة
        </T>
        <T
          style={{
            fontSize: 13,
            color: colors.mutedForeground,
            textAlign: "right",
            marginTop: 4,
            lineHeight: 20,
          }}
        >
          أكثر المنتسبين تأثيرًا — مرتّبون حسب الأعمال المنشورة والشارات المكتسبة.
        </T>
      </View>

      {isLoading && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      )}

      {error && (
        <Empty icon="alert-circle" title="تعذّر تحميل الصدارة" />
      )}

      {!isLoading && rows.length === 0 && !error && (
        <Empty icon="award" title="لا توجد بيانات بعد" />
      )}

      {rows.map((row, i) => {
        const medal = i < 3 ? MEDAL_COLORS[i] : null;
        const avatar = row.avatarUrl ? resolveMedia(row.avatarUrl) : null;
        return (
          <View
            key={row.userId}
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 14,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: medal ? medal + "40" : colors.border,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 32,
                alignItems: "center",
              }}
            >
              {medal ? (
                <Feather name="award" size={22} color={medal} />
              ) : (
                <T
                  style={{
                    fontSize: 15,
                    fontFamily: "IBMPlexSansArabic_600SemiBold",
                    color: colors.mutedForeground,
                  }}
                >
                  {i + 1}
                </T>
              )}
            </View>

            {avatar ? (
              <Image
                source={avatar}
                style={{ width: 46, height: 46, borderRadius: 23 }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: colors.primary + "25",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <T
                  style={{
                    color: colors.primary,
                    fontFamily: "IBMPlexSansArabic_700Bold",
                    fontSize: 15,
                  }}
                >
                  {initials(row.fullName)}
                </T>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <T
                style={{
                  fontSize: 15,
                  fontFamily: "IBMPlexSansArabic_600SemiBold",
                  color: colors.foreground,
                  textAlign: "right",
                }}
              >
                {row.fullName}
              </T>
              <View
                style={{
                  flexDirection: "row-reverse",
                  gap: 12,
                  marginTop: 4,
                }}
              >
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                  <Feather name="briefcase" size={12} color={colors.mutedForeground} />
                  <T style={{ fontSize: 12, color: colors.mutedForeground }}>{row.worksCount} عمل</T>
                </View>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                  <Feather name="star" size={12} color={colors.mutedForeground} />
                  <T style={{ fontSize: 12, color: colors.mutedForeground }}>{row.badgeCount} شارة</T>
                </View>
              </View>
            </View>

            <View
              style={{
                backgroundColor: medal ? medal + "20" : colors.muted,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: medal ? medal + "50" : colors.border,
              }}
            >
              <T
                style={{
                  fontSize: 15,
                  fontFamily: "IBMPlexSansArabic_700Bold",
                  color: medal ?? colors.foreground,
                }}
              >
                {row.score}
              </T>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
