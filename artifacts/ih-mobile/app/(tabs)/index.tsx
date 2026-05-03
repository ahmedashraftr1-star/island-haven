import React from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { T, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";
import type { DailyPost, Numbers, SiteContent } from "@/lib/types";

const HEBRON_TZ = "Asia/Hebron";

function getHebronHour(): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: HEBRON_TZ,
      hour: "numeric",
      hour12: false,
    });
    return Number(fmt.format(new Date()));
  } catch {
    return new Date().getHours();
  }
}

function greeting(content: SiteContent): { eyebrow: string; title: string; body: string } {
  const h = getHebronHour();
  const slot =
    h >= 5 && h < 12 ? "morning" : h >= 12 && h < 17 ? "afternoon" : h >= 17 && h < 22 ? "evening" : "night";
  const hero = content?.hero ?? {};
  const fallback = {
    morning: { eyebrow: "صباح الخير", title: "ابدأ يومك من المساحة", body: "قهوة دافئة، إنترنت ثابت، وزملاء بنفس الطموح." },
    afternoon: { eyebrow: "نهارك جميل", title: "بيئة عمل تليق بك", body: "مكاتب هادئة وقاعات مجهّزة في قلب غزة." },
    evening: { eyebrow: "مساء الخير", title: "أَنجِز أعمالك في راحة", body: "نُمدّد الساعات لمن يحتاج التركيز." },
    night: { eyebrow: "ليلة هادئة", title: "ساعات مرنة لأصحاب المشاريع", body: "قابلنا غدًا لجولة في المساحة." },
  }[slot];
  return {
    eyebrow: hero[`${slot}Eyebrow`] || fallback.eyebrow,
    title: hero[`${slot}Title`] || fallback.title,
    body: hero[`${slot}Body`] || fallback.body,
  };
}

export default function Home() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const contentQ = useQuery<{ content: SiteContent }>({
    queryKey: ["content"],
    queryFn: () => api("/content"),
  });
  const numbersQ = useQuery<Numbers>({
    queryKey: ["numbers"],
    queryFn: () => api("/numbers"),
  });
  const newsQ = useQuery<{ posts: DailyPost[] }>({
    queryKey: ["daily-news"],
    queryFn: () => api("/daily?type=news&limit=5"),
  });

  if (contentQ.isLoading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const content = contentQ.data?.content ?? {};
  const g = greeting(content);
  const numbers = numbersQ.data;
  const news = newsQ.data?.posts ?? [];

  return (
    <FlatList
      data={[0]}
      keyExtractor={() => "home"}
      contentContainerStyle={{ paddingBottom: 120, backgroundColor: colors.background }}
      style={{ backgroundColor: colors.background }}
      renderItem={() => (
        <View>
          {/* Hero */}
          <View style={[s.hero, { paddingTop: insets.top + 24, backgroundColor: colors.primary }]}>
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.15)"]}
              style={StyleSheet.absoluteFill}
            />
            <T size={13} weight="medium" color="rgba(255,255,255,0.85)">
              {g.eyebrow}
            </T>
            <T size={30} weight="bold" color="#fff" style={{ marginTop: 8, lineHeight: 38 }}>
              {g.title}
            </T>
            <T size={15} color="rgba(255,255,255,0.92)" style={{ marginTop: 10, lineHeight: 24 }}>
              {g.body}
            </T>
          </View>

          {/* News slider */}
          <View style={{ paddingTop: 24 }}>
            <View style={s.sectionHead}>
              <T size={20} weight="bold">آخر الأخبار</T>
              <Pressable onPress={() => router.push("/events")} hitSlop={8}>
                <T size={13} color={colors.primary} weight="medium">عرض المزيد</T>
              </Pressable>
            </View>
            {news.length === 0 ? (
              <View style={{ paddingHorizontal: 20 }}>
                <Card>
                  <T size={14} color={colors.mutedForeground}>لا توجد أخبار جديدة بعد.</T>
                </Card>
              </View>
            ) : (
              <FlatList
                horizontal
                data={news}
                keyExtractor={(p) => String(p.id)}
                showsHorizontalScrollIndicator={false}
                inverted
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                renderItem={({ item }) => (
                  <Pressable
                    style={{
                      width: 280,
                      borderRadius: colors.radius + 2,
                      overflow: "hidden",
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: resolveMedia(item.imageUrl) }}
                        style={{ width: "100%", height: 140, backgroundColor: colors.muted }}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={{ height: 140, backgroundColor: colors.primarySoft }} />
                    )}
                    <View style={{ padding: 14, gap: 6 }}>
                      <T size={15} weight="bold" numberOfLines={2}>{item.title}</T>
                      <T size={13} color={colors.mutedForeground} numberOfLines={2}>{item.body}</T>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>

          {/* Numbers */}
          <View style={{ paddingTop: 28, paddingHorizontal: 20 }}>
            <View style={s.sectionHead2}>
              <T size={20} weight="bold">مجتمعنا بالأرقام</T>
              <Pressable onPress={() => router.push("/members")} hitSlop={8}>
                <T size={13} color={colors.primary} weight="medium">عرض المزيد</T>
              </Pressable>
            </View>
            <View style={s.numbersGrid}>
              <NumberTile label="منتسب" value={numbers?.members ?? 0} />
              <NumberTile label="عمل منشور" value={numbers?.works ?? 0} />
              <NumberTile label="خرّيج" value={numbers?.graduates ?? 0} />
              <NumberTile label="فعالية" value={numbers?.events ?? 0} />
            </View>
          </View>

          {/* Audience */}
          <View style={{ paddingTop: 28, paddingHorizontal: 20 }}>
            <T size={20} weight="bold">لمن المساحة</T>
            <View style={{ marginTop: 12, gap: 10 }}>
              {[
                { icon: "briefcase", t: "للفريلانسرز", b: "إنترنت ثابت ومكاتب جاهزة." },
                { icon: "award", t: "لخرّيجي الجامعات", b: "بيئة لتعلّم ما بعد الشهادة." },
                { icon: "book-open", t: "للطلاب والباحثين", b: "تركيز كامل بعيدًا عن الضوضاء." },
              ].map((a) => (
                <Card key={a.t} style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colors.primarySoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name={a.icon as keyof typeof Feather.glyphMap} size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T size={15} weight="bold">{a.t}</T>
                    <T size={13} color={colors.mutedForeground}>{a.b}</T>
                  </View>
                </Card>
              ))}
            </View>
          </View>

          {/* Hours & location */}
          <View style={{ paddingTop: 28, paddingHorizontal: 20 }}>
            <T size={20} weight="bold">الساعات والموقع</T>
            <Card style={{ marginTop: 12, gap: 10 }}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                <Feather name="clock" size={18} color={colors.primary} />
                <T size={14} weight="medium">السبت – الخميس · 9:00 ص – 9:00 م</T>
              </View>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                <Feather name="map-pin" size={18} color={colors.primary} />
                <T size={14}>{content?.location?.address || "مدينة غزة"}</T>
              </View>
            </Card>
          </View>
        </View>
      )}
    />
  );
}

function NumberTile({ label, value }: { label: string; value: number }) {
  const colors = useColors();
  return (
    <View
      style={{
        flexBasis: "48%",
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: colors.radius + 2,
        padding: 16,
        alignItems: "flex-end",
      }}
    >
      <T size={28} weight="bold" color={colors.primary}>{value.toLocaleString("ar-EG")}</T>
      <T size={13} color={colors.mutedForeground}>{label}</T>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { paddingHorizontal: 20, paddingBottom: 28, gap: 4 },
  sectionHead: {
    paddingHorizontal: 20,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHead2: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  numbersGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 },
});

