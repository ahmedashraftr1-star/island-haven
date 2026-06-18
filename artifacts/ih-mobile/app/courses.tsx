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
const EMERALD = "#10b981";

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

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ar-EG-u-ca-gregory", {
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
function isCourseOpen(c: CourseRow): boolean {
  return c.status === "open" && !(c.capacity > 0 && c.enrolled >= c.capacity);
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

export default function CoursesScreen() {
  const colors = useColors();
  const router = useRouter();
  const reduce = useReduceMotion();
  const [filter, setFilter] = useState<"" | "course" | "workshop">("");

  const q = useQuery<{ courses: CourseRow[] }>({
    queryKey: ["courses", filter],
    queryFn: () => api(`/courses${filter ? `?type=${filter}` : ""}`),
  });

  const items = q.data?.courses ?? [];
  const sorted = [...items].sort((a, b) => Number(isCourseOpen(b)) - Number(isCourseOpen(a)));
  const openCount = items.filter(isCourseOpen).length;

  const Header = (
    <View style={{ marginBottom: 12 }}>
      <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 6 }}>
        تَعلّم · شارِك · انْمُ
      </T>
      <T size={28} weight="bold">الكورسات والورشات</T>
      <T size={13.5} color={colors.mutedForeground} style={{ lineHeight: 22, marginTop: 6 }}>
        فرص تدريبيّة مَجّانيّة متجدّدة في آيلاند — صُمِّمت لتحويل المعرفة إلى دخل وأثر.
      </T>

      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 14, alignItems: "center" }}>
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
              {toArabicNum(openCount)} تسجيل مفتوح
            </T>
          </View>
        ) : null}
      </View>
    </View>
  );

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, gap: 14 }}>
        <T size={26} weight="bold">الكورسات والورشات</T>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
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
        ListHeaderComponent={Header}
        ListEmptyComponent={
          <Empty icon="book-open" title="لا توجد فعاليّات منشورة بعد" hint="ترقّب الإعلان عن أوّل دفعة قريبًا." />
        }
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        refreshControl={
          <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />
        }
        renderItem={({ item, index }) => (
          <AnimatedItem index={index} reduce={reduce}>
            <CourseCard
              c={item}
              colors={colors}
              reduce={reduce}
              onPress={() => router.push(`/course/${item.id}` as never)}
            />
          </AnimatedItem>
        )}
      />
    </View>
  );
}

function CourseCard({
  c,
  colors,
  reduce,
  onPress,
}: {
  c: CourseRow;
  colors: ReturnType<typeof useColors>;
  reduce: boolean;
  onPress: () => void;
}) {
  const isFull = c.capacity > 0 && c.enrolled >= c.capacity;
  const isOpen = isCourseOpen(c);
  const pct = c.capacity > 0 ? Math.min(100, Math.round((c.enrolled / c.capacity) * 100)) : 0;
  const remaining = c.capacity - c.enrolled;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <Card
        style={{
          padding: 0,
          overflow: "hidden",
          borderColor: isOpen ? "rgba(16,185,129,0.4)" : colors.border,
        }}
      >
        {c.coverUrl ? (
          <Image
            source={{ uri: resolveMedia(c.coverUrl) }}
            style={{ width: "100%", height: 150, backgroundColor: colors.muted }}
            contentFit="cover"
          />
        ) : (
          <View style={{ width: "100%", height: 80, backgroundColor: colors.primarySoft }} />
        )}
        <View style={{ padding: 14, gap: 8 }}>
          <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.primarySoft }}>
              <T size={10} weight="bold" color={colors.primary}>
                {COURSE_TYPE_LABELS[c.type] ?? c.type}
              </T>
            </View>
            <View
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: isOpen ? "rgba(16,185,129,0.12)" : colors.muted,
              }}
            >
              {isOpen ? <PulseDot reduce={reduce} /> : null}
              <T size={10} weight="bold" color={isOpen ? EMERALD : colors.mutedForeground}>
                {isFull ? "مكتمل العدد" : COURSE_STATUS_LABELS[c.status] ?? c.status}
              </T>
            </View>
          </View>

          <T size={16} weight="bold" numberOfLines={2}>{c.title}</T>
          {c.summary ? (
            <T size={13} color={colors.mutedForeground} numberOfLines={2} style={{ lineHeight: 21 }}>
              {c.summary}
            </T>
          ) : null}

          <View style={{ gap: 4, paddingTop: 4 }}>
            {c.startsAt ? (
              <Meta colors={colors} icon="calendar" label={formatDateTime(c.startsAt)} />
            ) : null}
            {c.location ? <Meta colors={colors} icon="map-pin" label={c.location} /> : null}
            <Meta
              colors={colors}
              icon="users"
              label={`${toArabicNum(c.enrolled)}${c.capacity > 0 ? ` / ${toArabicNum(c.capacity)}` : ""} مشترك${
                isOpen && c.capacity > 0 && remaining <= 5 ? ` · ${toArabicNum(remaining)} مقعد متبقٍّ` : ""
              }`}
            />
          </View>

          {c.capacity > 0 ? (
            <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.muted, overflow: "hidden", marginTop: 2 }}>
              <View
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  borderRadius: 3,
                  backgroundColor: isFull ? colors.mutedForeground : isOpen ? EMERALD : colors.primary,
                }}
              />
            </View>
          ) : null}

          <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <T size={12.5} weight="bold" color={colors.primary}>
              {isOpen ? "سجّل الآن ←" : "عرض التفاصيل ←"}
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
      <T size={11.5} color={colors.mutedForeground} numberOfLines={1} style={{ flex: 1 }}>
        {label}
      </T>
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
