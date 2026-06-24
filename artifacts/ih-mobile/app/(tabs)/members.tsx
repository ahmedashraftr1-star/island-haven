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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { T, Card, Empty, SkeletonRow } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";
import type { PublicMember } from "@/lib/types";

const ROLE_AR: Record<string, string> = {
  freelancer: "فريلانسر",
  graduate: "خرّيج",
  student: "طالب",
  other: "أخرى",
};
const ROLE_FILTERS: Array<{ key: "" | string; label: string }> = [
  { key: "", label: "الكلّ" },
  { key: "freelancer", label: "مستقلّون" },
  { key: "graduate", label: "خرّيجون" },
  { key: "student", label: "طلّاب" },
  { key: "other", label: "أعضاء" },
];

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
function splitTags(s: string | null | undefined): string[] {
  return (s || "").split(/[,،]/).map((p) => p.trim()).filter(Boolean);
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

export default function MembersScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const [role, setRole] = useState("");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<{ members: PublicMember[]; total: number; totalPages: number; page: number }>({
    queryKey: ["members", role],
    queryFn: ({ pageParam = 1 }) => api(`/members?page=${pageParam}${role ? `&role=${role}` : ""}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const members = data?.pages.flatMap((page) => page.members) ?? [];
  const totalCount = data?.pages[0]?.total ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 6 }}>
        <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 4 }}>
          مجتمع آيلاند · Members
        </T>
        <View style={{ flexDirection: "row-reverse", alignItems: "baseline", gap: 8 }}>
          <T size={26} weight="bold" accessibilityRole="header">منتسبو المساحة</T>
          {totalCount > 0 ? (
            <T size={13} color={colors.mutedForeground}>{toArabicNum(totalCount)} عضوًا</T>
          ) : null}
        </View>
      </View>

      <View style={{ paddingVertical: 8 }}>
        <FlatList
          horizontal
          inverted
          data={ROLE_FILTERS}
          keyExtractor={(f) => f.key || "all"}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item: f }) => {
            const active = role === f.key;
            return (
              <Pressable
                onPress={() => setRole(f.key)}
                accessibilityRole="button"
                accessibilityLabel={f.label}
                accessibilityState={{ selected: active }}
                hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  minHeight: 36,
                  justifyContent: "center",
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySoft : "transparent",
                  opacity: pressed ? 0.7 : 1,
                })}
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
        <View style={{ paddingHorizontal: 20, gap: 10, paddingTop: 6 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : members.length === 0 ? (
        <Empty icon="users" title="لا نتائج" hint="جرّب فلترًا آخر، أو كن أوّل من ينضمّ." />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 6, gap: 12 }}
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
              <MemberCard m={item} colors={colors} onPress={() => router.push(`/member/${item.id}`)} />
            </AnimatedItem>
          )}
        />
      )}
    </View>
  );
}

function MemberCard({
  m,
  colors,
  onPress,
}: {
  m: PublicMember;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const skills = splitTags(m.skills).slice(0, 3);
  const hasSocial = !!(m.linkedinUrl || m.githubUrl || m.portfolioUrl || m.behanceUrl);
  const a11yLabel = [ROLE_AR[m.role] || "عضو", m.fullName, m.jobTitle].filter(Boolean).join("، ");
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }], opacity: pressed ? 0.92 : 1 })}
    >
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
          {m.avatarUrl ? (
            <Image
              source={{ uri: resolveMedia(m.avatarUrl) }}
              style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.muted }}
            />
          ) : (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <T size={20} weight="bold" color={colors.primary}>
                {m.fullName.trim().slice(0, 1)}
              </T>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <T size={11} weight="bold" color={colors.primary} style={{ marginBottom: 1 }}>
              {ROLE_AR[m.role] || "عضو"}
            </T>
            <T size={15.5} weight="bold" numberOfLines={1}>{m.fullName}</T>
            {m.jobTitle ? (
              <T size={12.5} color={colors.mutedForeground} numberOfLines={1} style={{ marginTop: 1 }}>
                {m.jobTitle}
              </T>
            ) : null}
          </View>
          {m.worksCount ? (
            <View style={{ alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: colors.primarySoft }}>
              <T size={15} weight="bold" color={colors.primary}>{toArabicNum(m.worksCount)}</T>
              <T size={11} weight="medium" color={colors.primary}>عمل</T>
            </View>
          ) : null}
        </View>

        {(skills.length > 0 || hasSocial) ? (
          <View style={{ flexDirection: "row-reverse", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            {skills.map((s, i) => (
              <View
                key={i}
                style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.muted }}
              >
                <T size={10.5} weight="medium" color={colors.mutedForeground}>{s}</T>
              </View>
            ))}
            {m.linkedinUrl ? <Feather name="linkedin" size={12} color={colors.mutedForeground} /> : null}
            {m.githubUrl ? <Feather name="github" size={12} color={colors.mutedForeground} /> : null}
            {m.portfolioUrl ? <Feather name="globe" size={12} color={colors.mutedForeground} /> : null}
          </View>
        ) : null}
      </Card>
    </Pressable>
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
      duration: 400,
      delay: Math.min(index, 8) * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reduce, index, v]);
  return (
    <Animated.View
      style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}
    >
      {children}
    </Animated.View>
  );
}
