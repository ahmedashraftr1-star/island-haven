import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  useColorScheme,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { T, Card, Empty, SkeletonCard } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

const VENTURE_STAGE_LABELS: Record<string, string> = {
  idea: "فكرة",
  mvp: "نموذج أوّليّ",
  launched: "أُطلِق",
  scaling: "في توسّع",
};

interface Venture {
  id: number;
  name: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string;
  founderName: string;
  sector: string;
  stage: string;
  foundedYear: number;
  teamSize: number;
  featured: boolean;
}

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
function stageLine(v: Venture): string {
  const stage = VENTURE_STAGE_LABELS[v.stage] ?? v.stage;
  return v.sector ? `${stage} · ${v.sector}` : stage;
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

export default function VenturesScreen() {
  const colors = useColors();
  const scheme = useColorScheme();
  const router = useRouter();
  const reduce = useReduceMotion();
  const faint = scheme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(10,14,26,0.045)";

  const q = useQuery<{ ventures: Venture[] }>({
    queryKey: ["ventures"],
    queryFn: () => api("/ventures"),
  });

  const items = q.data?.ventures ?? [];
  const featured = items.filter((v) => v.featured);
  const rest = items.filter((v) => !v.featured);

  const open = (id: number) => router.push(`/venture/${id}` as never);

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, gap: 14 }}>
        <T size={26} weight="bold">المشاريع الناشئة</T>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Empty icon="trending-up" title="قريبًا — أوّل دفعة مشاريع" hint="نعمل مع روّاد الأعمال على إطلاق مشاريعهم. تابعنا." />
      </View>
    );
  }

  let idx = 0;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />
        }
      >
        <View style={{ marginBottom: 8 }}>
          <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 6 }}>
            صُنِع في آيلاند · Made in Gaza
          </T>
          <T size={28} weight="bold">المشاريع الناشئة</T>
          <T size={13.5} color={colors.mutedForeground} style={{ lineHeight: 22, marginTop: 6 }}>
            مشاريع وُلدت ونمت داخل مساحتنا — من فكرة على ورقة إلى منتجات تخدم النّاس وتصنع فرص عمل في غزّة.
          </T>
          <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            <Chip colors={colors}>{toArabicNum(items.length)} مشروعًا ناشئًا</Chip>
            <Chip colors={colors}>صُنعت داخل الحاضنة</Chip>
          </View>
        </View>

        {featured.length > 0 ? (
          <>
            <SectionHeader colors={colors} faint={faint} index="٠١" title="في الواجهة" blurb="مشاريع تركت أثرًا — قصص بدأت بفكرة وانتهت بمنتج حيّ." />
            <View style={{ gap: 14 }}>
              {featured.map((v) => (
                <AnimatedItem key={v.id} index={idx++} reduce={reduce}>
                  <SpotlightCard v={v} colors={colors} onPress={() => open(v.id)} />
                </AnimatedItem>
              ))}
            </View>
          </>
        ) : null}

        {rest.length > 0 ? (
          <>
            {featured.length > 0 ? (
              <SectionHeader colors={colors} faint={faint} index="٠٢" title="كلّ المشاريع" blurb="المحفظة الكاملة للمشاريع التي تنمو في آيلاند." />
            ) : null}
            <View style={{ gap: 14, marginTop: featured.length > 0 ? 0 : 8 }}>
              {rest.map((v) => (
                <AnimatedItem key={v.id} index={idx++} reduce={reduce}>
                  <VentureCard v={v} colors={colors} onPress={() => open(v.id)} />
                </AnimatedItem>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
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

function SectionHeader({
  colors,
  faint,
  index,
  title,
  blurb,
}: {
  colors: ReturnType<typeof useColors>;
  faint: string;
  index: string;
  title: string;
  blurb: string;
}) {
  return (
    <View style={{ marginTop: 26, marginBottom: 12 }}>
      <T
        weight="bold"
        align="left"
        style={{ position: "absolute", top: -20, right: -2, fontSize: 70, lineHeight: 76, color: faint }}
      >
        {index}
      </T>
      <T size={19} weight="bold">{title}</T>
      <T size={12.5} color={colors.mutedForeground} style={{ lineHeight: 19, marginTop: 4, maxWidth: 320 }}>
        {blurb}
      </T>
    </View>
  );
}

function SpotlightCard({
  v,
  colors,
  onPress,
}: {
  v: Venture;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <Card
        style={{
          padding: 0,
          overflow: "hidden",
          borderColor: colors.primary.replace("hsl(", "hsla(").replace(")", ", 0.4)"),
        }}
      >
        <View>
          {v.coverUrl ? (
            <Image
              source={{ uri: resolveMedia(v.coverUrl) }}
              style={{ width: "100%", height: 170, backgroundColor: colors.muted }}
              contentFit="cover"
            />
          ) : (
            <View style={{ width: "100%", height: 120, backgroundColor: colors.primarySoft }} />
          )}
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: "rgba(251,191,36,0.92)",
            }}
          >
            <Feather name="star" size={11} color="#7c2d12" />
            <T size={10.5} weight="bold" color="#7c2d12">مشروع مميّز</T>
          </View>
        </View>

        <View style={{ padding: 16, gap: 10 }}>
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 11 }}>
            {v.logoUrl ? (
              <Image
                source={{ uri: resolveMedia(v.logoUrl) }}
                style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.muted }}
              />
            ) : (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: colors.primarySoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <T size={20} weight="bold" color={colors.primary}>{v.name.charAt(0)}</T>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <T size={18} weight="bold">{v.name}</T>
              <T size={12} color={colors.primary} weight="medium" style={{ marginTop: 1 }}>
                {stageLine(v)}
              </T>
            </View>
          </View>

          {v.tagline ? (
            <T size={13.5} color={colors.foreground} style={{ lineHeight: 22 }}>
              {v.tagline}
            </T>
          ) : null}

          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
              <Feather name="users" size={12} color={colors.primary} />
              <T size={11.5} color={colors.mutedForeground}>
                {toArabicNum(v.teamSize)} في الفريق
                {v.foundedYear ? ` · ${toArabicNum(v.foundedYear)}` : ""}
              </T>
            </View>
            <T size={12.5} weight="bold" color={colors.primary}>القصّة الكاملة ←</T>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function VentureCard({
  v,
  colors,
  onPress,
}: {
  v: Venture;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }] })}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {v.coverUrl ? (
          <Image
            source={{ uri: resolveMedia(v.coverUrl) }}
            style={{ width: "100%", height: 130, backgroundColor: colors.muted }}
            contentFit="cover"
          />
        ) : (
          <View style={{ width: "100%", height: 80, backgroundColor: colors.primarySoft }} />
        )}
        <View style={{ padding: 14, gap: 8 }}>
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
            {v.logoUrl ? (
              <Image
                source={{ uri: resolveMedia(v.logoUrl) }}
                style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.muted }}
              />
            ) : (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: colors.primarySoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <T size={18} weight="bold" color={colors.primary}>{v.name.charAt(0)}</T>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <T size={16} weight="bold">{v.name}</T>
              <T size={11.5} color={colors.primary} weight="medium">
                {stageLine(v)}
              </T>
            </View>
          </View>

          {v.tagline ? (
            <T size={13} color={colors.foreground} style={{ lineHeight: 21 }}>
              {v.tagline}
            </T>
          ) : null}
          {v.description ? (
            <T size={12} color={colors.mutedForeground} numberOfLines={3} style={{ lineHeight: 20 }}>
              {v.description}
            </T>
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
              <Feather name="users" size={12} color={colors.primary} />
              <T size={11.5} color={colors.mutedForeground}>
                {toArabicNum(v.teamSize)} في الفريق
                {v.foundedYear ? ` · ${toArabicNum(v.foundedYear)}` : ""}
              </T>
            </View>
            <T size={12} weight="medium" color={colors.primary}>التفاصيل ←</T>
          </View>
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
