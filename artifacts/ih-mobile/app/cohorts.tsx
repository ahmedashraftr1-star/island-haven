import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { T, Card, Empty, SkeletonCard } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

const COHORT_STATUS_LABELS: Record<string, string> = {
  announced: "معلَنة",
  open: "التسجيل مفتوح",
  in_progress: "جارية الآن",
  demo_day: "يوم العرض",
  completed: "مكتملة",
};
const EMERALD = "#10b981";

interface CohortRow {
  id: number;
  name: string;
  slug: string;
  summary: string;
  coverUrl: string | null;
  programTitle: string;
  status: string;
  ventureCount: number;
  demoDayAt: string | null;
}

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
function isLive(s: string): boolean {
  return s === "in_progress" || s === "demo_day" || s === "open";
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

export default function CohortsScreen() {
  const colors = useColors();
  const router = useRouter();
  const reduce = useReduceMotion();

  const q = useQuery<{ cohorts: CohortRow[] }>({
    queryKey: ["cohorts"],
    queryFn: () => api("/cohorts"),
  });
  const items = q.data?.cohorts ?? [];
  const sorted = [...items].sort((a, b) => Number(isLive(b.status)) - Number(isLive(a.status)));
  const liveCount = items.filter((c) => isLive(c.status)).length;

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, gap: 14 }}>
        <T size={26} weight="bold">دفعات الاحتضان</T>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Empty icon="layers" title="لا توجد دفعات بعد" hint="ترقّب الإعلان عن أوّل دفعة احتضان قريبًا." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={sorted}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 6 }}>
              دَفعات الاحتضان · Cohorts
            </T>
            <T size={28} weight="bold">دفعات الاحتضان</T>
            <T size={13.5} color={colors.mutedForeground} style={{ lineHeight: 22, marginTop: 6 }}>
              كلّ دفعة تجمع مشاريع ناشئة لرحلة محدّدة بزمن، تنتهي بيوم العرض (Demo Day).
            </T>
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              <Chip colors={colors}>{toArabicNum(items.length)} دفعات</Chip>
              {liveCount > 0 ? (
                <View
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 7,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: "rgba(16,185,129,0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(16,185,129,0.3)",
                  }}
                >
                  <PulseDot reduce={reduce} />
                  <T size={12} weight="medium" color={EMERALD}>
                    {toArabicNum(liveCount)} جارية الآن
                  </T>
                </View>
              ) : null}
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        renderItem={({ item, index }) => (
          <AnimatedItem index={index} reduce={reduce}>
            <CohortCard
              c={item}
              colors={colors}
              reduce={reduce}
              onPress={() => router.push(`/cohort/${item.slug}` as never)}
            />
          </AnimatedItem>
        )}
      />
    </View>
  );
}

function Chip({ children, colors }: { children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: colors.muted,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <T size={12} weight="medium" color={colors.mutedForeground}>
        {children}
      </T>
    </View>
  );
}

function CohortCard({
  c,
  colors,
  reduce,
  onPress,
}: {
  c: CohortRow;
  colors: ReturnType<typeof useColors>;
  reduce: boolean;
  onPress: () => void;
}) {
  const live = isLive(c.status);
  const done = c.status === "completed";
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <Card
        style={{
          padding: 0,
          overflow: "hidden",
          borderColor: live ? "rgba(16,185,129,0.4)" : colors.border,
        }}
      >
        {c.coverUrl ? (
          <Image
            source={{ uri: resolveMedia(c.coverUrl) }}
            style={{ width: "100%", height: 150, backgroundColor: colors.muted }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: 90,
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="layers" size={28} color={colors.primary} />
          </View>
        )}
        <View style={{ padding: 16, gap: 8 }}>
          <View
            style={{
              alignSelf: "flex-end",
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: live ? "rgba(16,185,129,0.12)" : done ? colors.muted : colors.primarySoft,
            }}
          >
            {live ? <PulseDot reduce={reduce} /> : null}
            <T size={11} weight="bold" color={live ? EMERALD : done ? colors.mutedForeground : colors.primary}>
              {COHORT_STATUS_LABELS[c.status] ?? c.status}
            </T>
          </View>

          <T size={17} weight="bold" numberOfLines={2}>{c.name}</T>
          {c.programTitle ? <T size={12} color={colors.primary}>{c.programTitle}</T> : null}
          {c.summary ? (
            <T size={13} color={colors.mutedForeground} numberOfLines={3} style={{ lineHeight: 21 }}>
              {c.summary}
            </T>
          ) : null}

          <View
            style={{
              flexDirection: "row-reverse",
              gap: 14,
              paddingTop: 10,
              marginTop: 4,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
              <Feather name="trending-up" size={12} color={colors.primary} />
              <T size={11.5} color={colors.mutedForeground}>{toArabicNum(c.ventureCount)} مشروع</T>
            </View>
            {c.demoDayAt ? (
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                <Feather name="award" size={12} color={colors.primary} />
                <T size={11.5} color={colors.mutedForeground}>يوم عرض</T>
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: "row-reverse", marginTop: 4 }}>
            <T size={12.5} weight="bold" color={colors.primary}>تفاصيل الدّفعة ←</T>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function PulseDot({ reduce }: { reduce: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.delay(400),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, v]);
  return (
    <View style={{ width: 9, height: 9, alignItems: "center", justifyContent: "center" }}>
      {!reduce ? (
        <Animated.View
          style={{
            position: "absolute",
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: EMERALD,
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
            transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
          }}
        />
      ) : null}
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: EMERALD }} />
    </View>
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
      duration: 420,
      delay: Math.min(index, 6) * 65,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reduce, index, v]);
  return (
    <Animated.View
      style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}
    >
      {children}
    </Animated.View>
  );
}
