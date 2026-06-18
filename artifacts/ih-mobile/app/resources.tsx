import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
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
const EMERALD = "#10b981";

interface ResourceRow {
  id: number;
  title: string;
  summary: string;
  category: string;
  visibility?: string;
  externalUrl: string;
  fileUrl: string;
  featured: boolean;
}

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
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

export default function ResourcesScreen() {
  const colors = useColors();
  const reduce = useReduceMotion();

  const q = useQuery<{ resources: ResourceRow[]; gated?: boolean }>({
    queryKey: ["resources"],
    queryFn: () => api("/resources"),
  });
  const items = q.data?.resources ?? [];
  const sorted = [...items].sort((a, b) => Number(b.featured) - Number(a.featured));

  function open(r: ResourceRow) {
    const url = r.fileUrl || r.externalUrl;
    if (url) Linking.openURL(url).catch(() => {});
  }

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, gap: 14 }}>
        <T size={26} weight="bold">دليل الرّائد</T>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Empty icon="book-open" title="لا توجد موارد بعد" hint="سنضيف الأدلّة والقوالب قريبًا." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={sorted}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 6 }}>
              دليل الرّائد · The Playbook
            </T>
            <T size={28} weight="bold">دليل الرّائد</T>
            <T size={13.5} color={colors.mutedForeground} style={{ lineHeight: 22, marginTop: 6 }}>
              أدلّة وقوالب وأدوات وحوافز انتقيناها لتسريع مشروعك — من الفكرة إلى الإطلاق إلى النموّ.
            </T>
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              <Chip colors={colors}>{toArabicNum(items.length)} موردًا</Chip>
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item, index }) => (
          <AnimatedItem index={index} reduce={reduce}>
            <ResourceCard r={item} colors={colors} onPress={() => open(item)} />
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

function ResourceCard({
  r,
  colors,
  onPress,
}: {
  r: ResourceRow;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const hasLink = !!(r.fileUrl || r.externalUrl);
  const members = r.visibility === "members";
  return (
    <Pressable
      onPress={onPress}
      disabled={!hasLink}
      style={({ pressed }) => ({ transform: [{ scale: pressed && hasLink ? 0.99 : 1 }] })}
    >
      <Card
        style={{
          padding: 16,
          gap: 10,
          borderColor: r.featured ? "rgba(251,191,36,0.4)" : colors.border,
        }}
      >
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: colors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name={CATEGORY_ICONS[r.category] ?? "file"} size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
              <T size={15} weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
                {r.title}
              </T>
              {r.featured ? <Feather name="star" size={12} color="#f59e0b" /> : null}
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.muted }}>
                <T size={10} weight="bold" color={colors.mutedForeground}>
                  {CATEGORY_LABELS[r.category] ?? r.category}
                </T>
              </View>
            </View>
            {r.summary ? (
              <T size={12.5} color={colors.mutedForeground} numberOfLines={2} style={{ marginTop: 2, lineHeight: 19 }}>
                {r.summary}
              </T>
            ) : null}
          </View>
          {hasLink ? <Feather name="external-link" size={16} color={colors.mutedForeground} /> : null}
        </View>

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
          {members ? (
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
              <Feather name="lock" size={11} color="#d97706" />
              <T size={11} color="#d97706" weight="medium">للمنتسبين</T>
            </View>
          ) : (
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
              <Feather name="unlock" size={11} color={EMERALD} />
              <T size={11} color={EMERALD} weight="medium">للجميع</T>
            </View>
          )}
          {hasLink ? <T size={12} weight="bold" color={colors.primary}>فتح ←</T> : null}
        </View>
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
