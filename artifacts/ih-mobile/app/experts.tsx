import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  SectionList,
  useColorScheme,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";

import { T, Card, Empty, SkeletonCard } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

interface ExpertCard {
  id: number;
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  expertise: string;
  bio: string;
  yearsExperience: number;
  languages: string;
  sessionMinutes: number;
  availabilityNote: string;
  acceptingSessions: boolean;
  featured: boolean;
  ratingAvg: number | null;
  ratingCount: number;
}

interface TeamMember {
  fullName: string;
  group: string;
}

interface TeamSection {
  key: string;
  index: string;
  title: string;
  blurb: string;
  data: ExpertCard[];
}

const TEAMS: Omit<TeamSection, "data">[] = [
  {
    key: "leadership",
    index: "٠١",
    title: "القيادة",
    blurb: "الفريق المؤسّس الذي يقود الحاضنة، ويرافقك من الفكرة إلى الأثر.",
  },
  {
    key: "mentors",
    index: "٠٢",
    title: "الإرشاد التقنيّ والمنتج",
    blurb: "مرشدون يبنون معك المنتج — هندسةً وتصميمًا ونموًّا.",
  },
  {
    key: "advisors",
    index: "٠٣",
    title: "الاستشارات والأعمال",
    blurb: "مستشارون يفتحون لك أبواب التمويل والقانون والاستراتيجيّة.",
  },
];
const EMERALD = "#34d399";

function splitTags(s: string | null | undefined): string[] {
  return (s || "").split(/[,،]/).map((p) => p.trim()).filter(Boolean);
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

export default function ExpertsScreen() {
  const colors = useColors();
  const scheme = useColorScheme();
  const router = useRouter();
  const reduce = useReduceMotion();
  const faint = scheme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(10,14,26,0.045)";

  const eq = useQuery<{ experts: ExpertCard[] }>({
    queryKey: ["experts"],
    queryFn: () => api("/experts"),
  });
  const tq = useQuery<{ team: TeamMember[] }>({
    queryKey: ["team"],
    queryFn: () => api("/team"),
  });

  const experts = eq.data?.experts ?? [];

  const sections = useMemo<TeamSection[]>(() => {
    const groupOf = new Map<string, string>();
    for (const t of tq.data?.team ?? []) groupOf.set(t.fullName.trim(), t.group);
    const buckets: Record<string, ExpertCard[]> = {};
    const extra: ExpertCard[] = [];
    for (const e of experts) {
      const g = groupOf.get(e.fullName.trim());
      if (g && TEAMS.some((t) => t.key === g)) (buckets[g] ??= []).push(e);
      else extra.push(e);
    }
    const out = TEAMS.filter((t) => (buckets[t.key]?.length ?? 0) > 0).map((t) => ({
      ...t,
      data: buckets[t.key],
    }));
    if (extra.length)
      out.push({ key: "_other", index: "٠٤", title: "خبراء آخرون", blurb: "نخبة إضافيّة من شبكة آيلاند.", data: extra });
    return out;
  }, [experts, tq.data]);

  if (eq.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, gap: 14 }}>
        <T size={26} weight="bold">الخبراء والمرشدون</T>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  if (experts.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Empty icon="award" title="سيُعلَن عن الخبراء قريبًا" hint="نُجهّز شبكة من أفضل المرشدين لمجتمع آيلاند." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SectionList
        sections={sections}
        keyExtractor={(e) => String(e.id)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={eq.isFetching}
            onRefresh={() => {
              eq.refetch();
              tq.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 6 }}>
              شبكة الخبراء · إرشاد فرديّ مَجّانيّ
            </T>
            <T size={28} weight="bold">الخبراء والمرشدون</T>
            <T size={13.5} color={colors.mutedForeground} style={{ lineHeight: 22, marginTop: 6 }}>
              ثلاثة فِرَق من المرشدين وروّاد الأعمال — يرافقونك جلسةً بعد جلسة حتّى تتحوّل فكرتك إلى أثر.
            </T>
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              <Chip colors={colors}>{toArabicNum(experts.length)} خبيرًا ومرشدًا</Chip>
              <Chip colors={colors}>{toArabicNum(sections.length)} فِرَق</Chip>
              <Chip colors={colors}>جلسات مَجّانيّة</Chip>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={{ marginTop: 26, marginBottom: 12 }}>
            <T
              weight="bold"
              align="left"
              style={{
                position: "absolute",
                top: -20,
                right: -2,
                fontSize: 70,
                lineHeight: 76,
                color: faint,
              }}
            >
              {(section as TeamSection).index}
            </T>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
              <T size={19} weight="bold">{section.title}</T>
              <View
                style={{
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 9,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: colors.primarySoft,
                }}
              >
                <Feather name="users" size={11} color={colors.primary} />
                <T size={11} weight="bold" color={colors.primary}>
                  {toArabicNum(section.data.length)}
                </T>
              </View>
            </View>
            <T size={12.5} color={colors.mutedForeground} style={{ lineHeight: 19, marginTop: 4, maxWidth: 320 }}>
              {(section as TeamSection).blurb}
            </T>
          </View>
        )}
        renderItem={({ item, index }) => (
          <AnimatedItem index={index} reduce={reduce}>
            <ExpertCardView
              e={item}
              colors={colors}
              reduce={reduce}
              onPress={() => router.push(`/expert/${item.id}` as never)}
            />
          </AnimatedItem>
        )}
        SectionSeparatorComponent={() => <View style={{ height: 0 }} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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

function ExpertCardView({
  e,
  colors,
  reduce,
  onPress,
}: {
  e: ExpertCard;
  colors: ReturnType<typeof useColors>;
  reduce: boolean;
  onPress: () => void;
}) {
  const areas = splitTags(e.expertise).slice(0, 4);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <Card
        style={{
          gap: 12,
          borderColor: e.featured
            ? colors.primary.replace("hsl(", "hsla(").replace(")", ", 0.4)")
            : colors.border,
        }}
      >
        {e.featured ? (
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 5,
              alignSelf: "flex-end",
              paddingHorizontal: 9,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: "rgba(251,191,36,0.12)",
              borderWidth: 1,
              borderColor: "rgba(251,191,36,0.3)",
            }}
          >
            <Feather name="star" size={11} color="#fcd34d" />
            <T size={10.5} weight="bold" color="#fcd34d">
              خبير مميّز
            </T>
          </View>
        ) : null}

        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
          {e.avatarUrl ? (
            <Image
              source={{ uri: resolveMedia(e.avatarUrl) }}
              style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: colors.muted }}
            />
          ) : (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                backgroundColor: colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <T size={24} weight="bold" color={colors.primary}>
                {e.fullName.trim().slice(0, 1)}
              </T>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <T size={16.5} weight="bold">{e.fullName}</T>
            {e.headline ? (
              <T size={12.5} color={colors.primary} numberOfLines={2} weight="medium" style={{ marginTop: 2 }}>
                {e.headline}
              </T>
            ) : null}
            {e.ratingCount > 0 ? (
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Ionicons name="star" size={12} color="#f59e0b" />
                <T size={11.5} weight="bold">{e.ratingAvg?.toFixed(1)}</T>
                <T size={10.5} color={colors.mutedForeground}>({toArabicNum(e.ratingCount)})</T>
              </View>
            ) : null}
          </View>
        </View>

        {e.bio ? (
          <T size={13} color={colors.mutedForeground} numberOfLines={2} style={{ lineHeight: 20 }}>
            {e.bio}
          </T>
        ) : null}

        {areas.length > 0 ? (
          <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 }}>
            {areas.map((a, i) => (
              <View
                key={i}
                style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.muted }}
              >
                <T size={11} weight="medium" color={colors.mutedForeground}>
                  {a}
                </T>
              </View>
            ))}
          </View>
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
          {e.acceptingSessions ? (
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 7 }}>
              <PulseDot reduce={reduce} />
              <T size={12} weight="medium" color={EMERALD}>
                متاح للحجز
              </T>
            </View>
          ) : (
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
              <Feather name="clock" size={12} color={colors.mutedForeground} />
              <T size={12} color={colors.mutedForeground}>
                غير متاح حاليًا
              </T>
            </View>
          )}
          <T size={12.5} weight="medium" color={colors.primary}>
            عرض الملف ←
          </T>
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
