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

const PROGRAM_STATUS_LABELS: Record<string, string> = {
  draft: "مسوّدة",
  open: "التقديم مفتوح",
  in_progress: "جارٍ التنفيذ",
  done: "منتهٍ",
};
const EMERALD = "#10b981";

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
function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ar-EG-u-ca-gregory", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
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

export default function ProgramsScreen() {
  const colors = useColors();
  const router = useRouter();
  const reduce = useReduceMotion();

  const q = useQuery<{ programs: ProgramRow[] }>({
    queryKey: ["programs"],
    queryFn: () => api("/programs"),
  });

  const items = q.data?.programs ?? [];
  const sorted = [...items].sort(
    (a, b) => Number(b.status === "open") - Number(a.status === "open"),
  );
  const openCount = items.filter((p) => p.status === "open").length;

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, gap: 14 }}>
        <T size={26} weight="bold">برامج الاحتضان</T>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Empty icon="layers" title="لا توجد برامج منشورة بعد" hint="ترقّب الإعلان عن أوّل دفعة احتضان قريبًا." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={sorted}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 6 }}>
              احتضان · تسريع · نموّ
            </T>
            <T size={28} weight="bold">برامج الاحتضان</T>
            <T size={13.5} color={colors.mutedForeground} style={{ lineHeight: 22, marginTop: 6 }}>
              مسارات احتضان وتسريع منظَّمة تأخذ مشروعك من الفكرة إلى الإطلاق — إرشاد وموارد وشبكة علاقات في قلب غزّة.
            </T>
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              <Chip colors={colors}>{toArabicNum(items.length)} برامج</Chip>
              {openCount > 0 ? (
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
                    {toArabicNum(openCount)} مفتوحة للتقديم
                  </T>
                </View>
              ) : null}
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        renderItem={({ item, index }) => (
          <AnimatedItem index={index} reduce={reduce}>
            <ProgramCard
              p={item}
              colors={colors}
              reduce={reduce}
              onPress={() => router.push(`/program/${item.id}` as never)}
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

function ProgramCard({
  p,
  colors,
  reduce,
  onPress,
}: {
  p: ProgramRow;
  colors: ReturnType<typeof useColors>;
  reduce: boolean;
  onPress: () => void;
}) {
  const tags = splitTags(p.tags).slice(0, 3);
  const open = p.status === "open";
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <Card
        style={{
          padding: 0,
          overflow: "hidden",
          borderColor: open ? "rgba(16,185,129,0.4)" : colors.border,
        }}
      >
        {p.coverUrl ? (
          <Image
            source={{ uri: resolveMedia(p.coverUrl) }}
            style={{ width: "100%", height: 150, backgroundColor: colors.muted }}
            contentFit="cover"
          />
        ) : (
          <View style={{ width: "100%", height: 90, backgroundColor: colors.primarySoft }} />
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
              backgroundColor: open ? "rgba(16,185,129,0.12)" : colors.muted,
            }}
          >
            {open ? <PulseDot reduce={reduce} /> : null}
            <T size={11} weight="bold" color={open ? EMERALD : colors.mutedForeground}>
              {PROGRAM_STATUS_LABELS[p.status] ?? p.status}
            </T>
          </View>

          <T size={17} weight="bold" numberOfLines={2}>{p.title}</T>
          {p.summary ? (
            <T size={13} color={colors.mutedForeground} numberOfLines={3} style={{ lineHeight: 21 }}>
              {p.summary}
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
            {p.durationWeeks > 0 ? (
              <Meta colors={colors} icon="clock" label={`${toArabicNum(p.durationWeeks)} أسبوع`} />
            ) : null}
            <Meta colors={colors} icon="users" label={`${toArabicNum(p.applicants)} متقدّم`} />
            {p.applyDeadline ? (
              <Meta colors={colors} icon="calendar" label={`آخر موعد: ${formatDate(p.applyDeadline)}`} />
            ) : null}
          </View>

          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <T size={12.5} weight="bold" color={colors.primary}>
              {open ? "قدّم الآن ←" : "التفاصيل ←"}
            </T>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function Meta({
  colors,
  icon,
  label,
}: {
  colors: ReturnType<typeof useColors>;
  icon: keyof typeof Feather.glyphMap;
  label: string;
}) {
  return (
    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
      <Feather name={icon} size={12} color={colors.primary} />
      <T size={11.5} color={colors.mutedForeground}>{label}</T>
    </View>
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
