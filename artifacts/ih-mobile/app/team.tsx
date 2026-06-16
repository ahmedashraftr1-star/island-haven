import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Linking,
  Pressable,
  SectionList,
  useColorScheme,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { T, Card, Empty, SkeletonCard } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

interface Member {
  id: number;
  fullName: string;
  role: string;
  bio: string;
  avatarUrl: string | null;
  linkedinUrl: string;
  websiteUrl: string;
  email: string;
  group: string;
  featured: boolean;
}

interface TeamSection {
  key: string;
  index: string;
  title: string;
  en: string;
  blurb: string;
  data: Member[];
}

const GROUPS: Omit<TeamSection, "data">[] = [
  { key: "leadership", index: "٠١", title: "القيادة", en: "Leadership", blurb: "الفريق المؤسّس الذي يبني الحاضنة، ويرسم رؤيتها، ويقف خلف كلّ رائد." },
  { key: "mentors", index: "٠٢", title: "المرشدون", en: "Mentors", blurb: "خبراء يرافقون الفرق في رحلتها التقنيّة وبناء المنتج خطوةً بخطوة." },
  { key: "advisors", index: "٠٣", title: "المستشارون", en: "Advisors", blurb: "مستشارو الأعمال والتمويل والقانون الذين يفتحون الأبواب الصعبة." },
  { key: "support", index: "٠٤", title: "الدّعم والتشغيل", en: "Support", blurb: "الفريق الذي يُبقي المجتمع يعمل يومًا بيوم، خلف الكواليس." },
];

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

export default function TeamScreen() {
  const colors = useColors();
  const scheme = useColorScheme();
  const reduce = useReduceMotion();
  const faint = scheme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(10,14,26,0.045)";

  const q = useQuery<{ team: Member[] }>({
    queryKey: ["team"],
    queryFn: () => api("/team"),
  });
  const items = q.data?.team ?? [];

  const sections = useMemo<TeamSection[]>(() => {
    return GROUPS.map((g) => ({ ...g, data: items.filter((m) => m.group === g.key) })).filter(
      (s) => s.data.length > 0,
    );
  }, [items]);

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, gap: 14 }}>
        <T size={26} weight="bold">فريق آيلاند</T>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Empty icon="users" title="سيُعلن الفريق قريبًا" hint="تابعنا للتعرّف على فريق آيلاند." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SectionList
        sections={sections}
        keyExtractor={(m) => String(m.id)}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, marginBottom: 6 }}>
              من يقف خلف الحاضنة · The Team
            </T>
            <T size={28} weight="bold">فريق آيلاند</T>
            <T size={13.5} color={colors.mutedForeground} style={{ lineHeight: 22, marginTop: 6 }}>
              فريق غزّاويّ-دوليّ يؤمن بأنّ المواهب هنا تستحقّ بيئة عمل وإرشادًا ودعمًا حقيقيّاً. نَنمو معكم خطوةً بخطوة.
            </T>
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              <Chip colors={colors}>{toArabicNum(items.length)} عضوًا</Chip>
              <Chip colors={colors}>{toArabicNum(sections.length)} فِرَق</Chip>
              <Chip colors={colors}>من النّاس إلى النّاس</Chip>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => {
          const s = section as TeamSection;
          return (
            <View style={{ marginTop: 26, marginBottom: 12 }}>
              <T
                weight="bold"
                align="left"
                style={{ position: "absolute", top: -20, right: -2, fontSize: 70, lineHeight: 76, color: faint }}
              >
                {s.index}
              </T>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                <T size={19} weight="bold">{s.title}</T>
                <T size={10} weight="bold" color={colors.mutedForeground} style={{ letterSpacing: 1 }}>
                  {s.en.toUpperCase()}
                </T>
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
                    {toArabicNum(s.data.length)}
                  </T>
                </View>
              </View>
              <T size={12.5} color={colors.mutedForeground} style={{ lineHeight: 19, marginTop: 4, maxWidth: 320 }}>
                {s.blurb}
              </T>
            </View>
          );
        }}
        renderItem={({ item, index }) => (
          <AnimatedItem index={index} reduce={reduce}>
            <MemberCard m={item} colors={colors} />
          </AnimatedItem>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListFooterComponent={<JoinCard colors={colors} />}
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

function MemberCard({ m, colors }: { m: Member; colors: ReturnType<typeof useColors> }) {
  return (
    <Card
      style={{
        gap: 10,
        borderColor: m.featured ? colors.primary.replace("hsl(", "hsla(").replace(")", ", 0.4)") : colors.border,
      }}
    >
      {m.featured ? (
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
          <Feather name="star" size={11} color="#f59e0b" />
          <T size={10.5} weight="bold" color="#b45309">
            مميَّز
          </T>
        </View>
      ) : null}

      <View style={{ flexDirection: "row-reverse", gap: 12 }}>
        {m.avatarUrl ? (
          <Image
            source={{ uri: resolveMedia(m.avatarUrl) }}
            style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.muted }}
            contentFit="cover"
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
            <T size={22} weight="bold" color={colors.primary}>
              {m.fullName.charAt(0)}
            </T>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <T size={16} weight="bold">{m.fullName}</T>
          {m.role ? (
            <T size={12.5} color={colors.primary} weight="medium" style={{ marginTop: 2 }}>
              {m.role}
            </T>
          ) : null}
          {m.bio ? (
            <T size={12.5} color={colors.mutedForeground} style={{ marginTop: 6, lineHeight: 20 }}>
              {m.bio}
            </T>
          ) : null}
          {(m.linkedinUrl || m.websiteUrl || m.email) ? (
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 14, marginTop: 10 }}>
              {m.linkedinUrl ? (
                <Pressable
                  onPress={() => Linking.openURL(m.linkedinUrl).catch(() => {})}
                  style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}
                >
                  <Feather name="linkedin" size={13} color={colors.primary} />
                  <T size={11.5} color={colors.primary}>LinkedIn</T>
                </Pressable>
              ) : null}
              {m.websiteUrl ? (
                <Pressable
                  onPress={() => Linking.openURL(m.websiteUrl).catch(() => {})}
                  style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}
                >
                  <Feather name="globe" size={13} color={colors.primary} />
                  <T size={11.5} color={colors.primary}>الموقع</T>
                </Pressable>
              ) : null}
              {m.email ? (
                <Pressable
                  onPress={() => Linking.openURL(`mailto:${m.email}`).catch(() => {})}
                  style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}
                >
                  <Feather name="mail" size={13} color={colors.primary} />
                  <T size={11.5} color={colors.primary}>البريد</T>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function JoinCard({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <Card style={{ marginTop: 28, alignItems: "center", gap: 10, paddingVertical: 24 }}>
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name="zap" size={20} color={colors.primary} />
      </View>
      <T size={17} weight="bold" align="center">هل تريد الانضمام إلى الفريق؟</T>
      <T size={13} color={colors.mutedForeground} align="center" style={{ lineHeight: 21, maxWidth: 300 }}>
        نَبحث دائمًا عن مرشدين وخبراء قطاع ومتطوّعين يؤمنون بريادة الأعمال في غزّة.
      </T>
      <Pressable
        onPress={() =>
          Linking.openURL(
            "mailto:island-haven@nastonas.org?subject=الانضمام%20لفريق%20آيلاند",
          ).catch(() => {})
        }
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          gap: 7,
          marginTop: 4,
          paddingHorizontal: 22,
          paddingVertical: 11,
          borderRadius: 999,
          backgroundColor: colors.primary,
        }}
      >
        <Feather name="mail" size={15} color={colors.primaryForeground} />
        <T size={13.5} weight="bold" color={colors.primaryForeground}>راسلنا</T>
      </Pressable>
    </Card>
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
