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
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { T, Card, Empty, SkeletonCard } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

const TYPE_LABELS: Record<string, string> = {
  job: "وظيفة",
  internship: "تدريب",
  freelance: "عمل حرّ",
  gig: "مهمّة قصيرة",
  volunteer: "تطوّع",
};
const LOCATION_LABELS: Record<string, string> = {
  onsite: "حضوريّ",
  remote: "عن بُعد",
  hybrid: "مَزيج",
};

interface Opportunity {
  id: number;
  title: string;
  organization: string;
  type: string;
  locationType: string;
  city: string;
  description: string;
  skills: string;
  compensation: string;
  deadline: string | null;
  featured: boolean;
}

const FILTERS: Array<{ key: "" | string; label: string }> = [
  { key: "", label: "الكلّ" },
  { key: "job", label: "وظائف" },
  { key: "internship", label: "تدريب" },
  { key: "freelance", label: "عمل حرّ" },
  { key: "gig", label: "مهامّ" },
  { key: "volunteer", label: "تطوّع" },
];

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
function splitTags(s: string | null | undefined): string[] {
  return (s || "").split(/[,،]/).map((p) => p.trim()).filter(Boolean);
}
function fmtDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ar-EG-u-ca-gregory", { day: "numeric", month: "long" });
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

export default function OpportunitiesScreen() {
  const colors = useColors();
  const router = useRouter();
  const reduce = useReduceMotion();
  const [type, setType] = useState("");

  const q = useQuery<{ opportunities: Opportunity[] }>({
    queryKey: ["opportunities", type],
    queryFn: () => api(`/opportunities${type ? `?type=${type}` : ""}`),
  });

  const items = q.data?.opportunities ?? [];
  const sorted = [...items].sort((a, b) => Number(b.featured) - Number(a.featured));

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, gap: 14 }}>
        <T size={26} weight="bold">الفرص والوظائف</T>
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
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 14 }}>
            <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 6 }}>
              جسرك لسوق العمل · Opportunities
            </T>
            <T size={28} weight="bold">الفرص والوظائف</T>
            <T size={13.5} color={colors.mutedForeground} style={{ lineHeight: 22, marginTop: 6 }}>
              وظائف وتدريب وأعمال حرّة من شركائنا والمشاريع الناشئة — مختارة لتقرّبك خطوة من سوق العمل.
            </T>
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              {FILTERS.map((f) => {
                const active = type === f.key;
                return (
                  <Pressable
                    key={f.key || "all"}
                    onPress={() => setType(f.key)}
                    style={{
                      paddingHorizontal: 13,
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
          </View>
        }
        ListEmptyComponent={
          <Empty icon="briefcase" title="لا فرص ضمن هذا التصنيف" hint="نضيف فرصًا جديدة باستمرار — جرّب تصنيفًا آخر." />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item, index }) => (
          <AnimatedItem index={index} reduce={reduce}>
            <OpportunityCard
              o={item}
              colors={colors}
              onPress={() => router.push(`/opportunity/${item.id}` as never)}
            />
          </AnimatedItem>
        )}
      />
    </View>
  );
}

function OpportunityCard({
  o,
  colors,
  onPress,
}: {
  o: Opportunity;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const tags = splitTags(o.skills).slice(0, 3);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <Card
        style={{
          gap: 8,
          borderColor: o.featured ? "rgba(251,191,36,0.4)" : colors.border,
        }}
      >
        <View style={{ flexDirection: "row-reverse", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 9,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: colors.primarySoft,
            }}
          >
            <Feather name="briefcase" size={11} color={colors.primary} />
            <T size={10.5} weight="bold" color={colors.primary}>{TYPE_LABELS[o.type] ?? o.type}</T>
          </View>
          {o.featured ? (
            <View
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 9,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: "rgba(251,191,36,0.12)",
              }}
            >
              <Feather name="star" size={10} color="#f59e0b" />
              <T size={10} weight="bold" color="#b45309">مميّزة</T>
            </View>
          ) : null}
        </View>

        <T size={16} weight="bold" numberOfLines={2}>{o.title}</T>
        {o.organization ? (
          <T size={12.5} color={colors.primary} weight="medium">{o.organization}</T>
        ) : null}
        {o.description ? (
          <T size={13} color={colors.mutedForeground} numberOfLines={2} style={{ lineHeight: 21 }}>
            {o.description}
          </T>
        ) : null}

        {tags.length > 0 ? (
          <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 }}>
            {tags.map((t, i) => (
              <View key={i} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.muted }}>
                <T size={10.5} weight="medium" color={colors.mutedForeground}>{t}</T>
              </View>
            ))}
          </View>
        ) : null}

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
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
            <Feather name="map-pin" size={12} color={colors.primary} />
            <T size={11.5} color={colors.mutedForeground} numberOfLines={1}>
              {LOCATION_LABELS[o.locationType] ?? o.locationType}{o.city ? ` · ${o.city}` : ""}
              {o.deadline ? ` · حتّى ${fmtDate(o.deadline)}` : ""}
            </T>
          </View>
          <T size={12} weight="bold" color={colors.primary}>التفاصيل ←</T>
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
