import React, { useEffect, useRef } from "react";
import { Animated, FlatList, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { T } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

// ─── What you get ────────────────────────────────────────────────────────────
//
// The incubator's core promise, stated plainly — mirrors the web's WhatYouGet
// block (YC/Antler bar). Four substantive pillars, each linking to the real
// surface that delivers it. Arabic-primary to match the rest of the mobile home.

interface Pillar {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
  href: string;
  cta: string;
}

const PILLARS: Pillar[] = [
  {
    icon: "home",
    title: "مساحة عمل مجّانيّة",
    body: "مقعد ثابت في مساحة هادئة بإنترنت موثوق وكهرباء — احجز مقعدك متى احتجت.",
    href: "/book",
    cta: "احجز مقعدك",
  },
  {
    icon: "users",
    title: "إرشاد من خبراء",
    body: "جلسات فرديّة مع مرشدين وروّاد أعمال ومتخصّصين — هندسةً وتصميمًا وأعمالًا.",
    href: "/experts",
    cta: "تعرّف على المرشدين",
  },
  {
    icon: "send",
    title: "برامج ودفعات + يوم العرض",
    body: "مسارات احتضان وتسريع منظّمة، تنتهي بيوم عرض أمام شبكة من الداعمين.",
    href: "/programs",
    cta: "استكشف البرامج",
  },
  {
    icon: "share-2",
    title: "شبكة ومجتمع",
    body: "انضمّ لمجتمع من المستقلّين والخرّيجين والمؤسّسين — تعاون، أعمال، وفرص.",
    href: "/members",
    cta: "تصفّح المجتمع",
  },
];

export function WhatYouGet() {
  const colors = useColors();
  const router = useRouter();

  return (
    <View style={{ paddingTop: 30, paddingHorizontal: 20 }}>
      <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 6 }}>
        ماذا تأخذ من آيلاند
      </T>
      <T size={22} weight="bold" accessibilityRole="header" style={{ lineHeight: 30 }}>
        كلّ ما تحتاجه لتبدأ وتنمو
      </T>
      <T size={13.5} color={colors.mutedForeground} style={{ lineHeight: 22, marginTop: 6 }}>
        حاضنة كاملة — مساحة، إرشاد، برامج، وشبكة — مجّانًا، من قلب غزّة.
      </T>

      <View style={{ marginTop: 16, gap: 12 }}>
        {PILLARS.map((p) => (
          <Pressable
            key={p.href}
            onPress={() => router.push(p.href as never)}
            accessibilityRole="button"
            accessibilityLabel={`${p.title} — ${p.cta}`}
            testID={`pillar-${p.href.slice(1)}`}
            style={({ pressed }) => ({
              backgroundColor: colors.card,
              borderRadius: colors.radius + 2,
              borderWidth: 1,
              borderColor: pressed ? colors.primary + "40" : colors.border,
              padding: 16,
              flexDirection: "row-reverse",
              gap: 13,
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 13,
                backgroundColor: colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name={p.icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <T size={16} weight="bold" style={{ lineHeight: 22 }}>{p.title}</T>
              <T size={13} color={colors.mutedForeground} style={{ lineHeight: 21, marginTop: 3 }}>
                {p.body}
              </T>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5, marginTop: 9 }}>
                <T size={12.5} weight="bold" color={colors.primary}>{p.cta}</T>
                <Feather name="chevron-left" size={15} color={colors.primary} />
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Ventures (portfolio) preview ────────────────────────────────────────────
//
// A horizontal preview of the incubator's portfolio — the substance that proves
// the program works. Mirrors the /ventures Venture shape; cards link to the full
// venture story. Renders nothing when there are no ventures (silent absence).

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
  founderName: string;
  sector: string;
  stage: string;
  featured: boolean;
}

function stageLine(v: Venture): string {
  const stage = VENTURE_STAGE_LABELS[v.stage] ?? v.stage;
  return v.sector ? `${stage} · ${v.sector}` : stage;
}

function VenturePreviewSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
    return () => shimmer.stopAnimation();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  return (
    <Animated.View
      style={{
        opacity,
        width: 250,
        borderRadius: colors.radius + 2,
        overflow: "hidden",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ height: 130, backgroundColor: colors.muted }} />
      <View style={{ padding: 14, gap: 8 }}>
        <View style={{ height: 15, borderRadius: 6, backgroundColor: colors.muted, width: "60%" }} />
        <View style={{ height: 12, borderRadius: 5, backgroundColor: colors.muted, width: "90%" }} />
      </View>
    </Animated.View>
  );
}

export function VenturesPreview() {
  const colors = useColors();
  const router = useRouter();

  const q = useQuery<{ ventures: Venture[] }>({
    queryKey: ["ventures"],
    queryFn: () => api("/ventures"),
  });

  const all = q.data?.ventures ?? [];
  // Featured first, then the rest — surface the strongest stories up top.
  const items = [...all].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 6);

  // Nothing yet and not loading → render nothing (no empty filler on the home).
  if (!q.isLoading && items.length === 0) return null;

  return (
    <View style={{ paddingTop: 30 }}>
      <View
        style={{
          paddingHorizontal: 20,
          marginBottom: 12,
        }}
      >
        <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 6 }}>
          صُنِع في آيلاند · Made in Gaza
        </T>
        <View
          style={{
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <T size={22} weight="bold" accessibilityRole="header">المشاريع الناشئة</T>
          {!q.isLoading && (
            <Pressable
              onPress={() => router.push("/ventures" as never)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="عرض كلّ المشاريع الناشئة"
            >
              <T size={13} color={colors.primary} weight="medium">عرض الكلّ</T>
            </Pressable>
          )}
        </View>
        <T size={13} color={colors.mutedForeground} style={{ lineHeight: 21, marginTop: 4 }}>
          مشاريع وُلدت ونمت داخل مساحتنا — من فكرة إلى منتج يخدم النّاس.
        </T>
      </View>

      {q.isLoading ? (
        <FlatList
          horizontal
          data={[0, 1, 2]}
          keyExtractor={(i) => String(i)}
          showsHorizontalScrollIndicator={false}
          inverted
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          renderItem={() => <VenturePreviewSkeleton colors={colors} />}
        />
      ) : (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(v) => String(v.id)}
          showsHorizontalScrollIndicator={false}
          inverted
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/venture/${item.id}` as never)}
              accessibilityRole="button"
              accessibilityLabel={[item.name, item.founderName, stageLine(item)].filter(Boolean).join("، ")}
              style={({ pressed }) => ({
                width: 250,
                borderRadius: colors.radius + 2,
                overflow: "hidden",
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View>
                {item.coverUrl ? (
                  <Image
                    source={{ uri: resolveMedia(item.coverUrl) }}
                    style={{ width: "100%", height: 130, backgroundColor: colors.muted }}
                    contentFit="cover"
                  />
                ) : (
                  <View style={{ width: "100%", height: 130, backgroundColor: colors.primarySoft }} />
                )}
                {item.featured ? (
                  <View
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 9,
                      paddingVertical: 3,
                      borderRadius: 999,
                      backgroundColor: "rgba(251,191,36,0.92)",
                    }}
                  >
                    <Feather name="star" size={10} color="#7c2d12" />
                    <T size={10} weight="bold" color="#7c2d12">مميّز</T>
                  </View>
                ) : null}
              </View>
              <View style={{ padding: 14, gap: 7 }}>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
                  {item.logoUrl ? (
                    <Image
                      source={{ uri: resolveMedia(item.logoUrl) }}
                      style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: colors.muted }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: colors.primarySoft,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <T size={16} weight="bold" color={colors.primary}>{item.name.charAt(0)}</T>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <T size={15} weight="bold" numberOfLines={1}>{item.name}</T>
                    <T size={11.5} color={colors.primary} weight="medium" numberOfLines={1}>
                      {stageLine(item)}
                    </T>
                  </View>
                </View>
                {item.founderName ? (
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                    <Feather name="user" size={11} color={colors.mutedForeground} />
                    <T size={11.5} color={colors.mutedForeground} numberOfLines={1}>{item.founderName}</T>
                  </View>
                ) : null}
                {item.tagline ? (
                  <T size={12.5} color={colors.mutedForeground} numberOfLines={2} style={{ lineHeight: 20 }}>
                    {item.tagline}
                  </T>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
