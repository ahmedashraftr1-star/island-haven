import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { T, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { CurrentUser, DailyPost, Numbers, SiteContent } from "@/lib/types";

interface ExpertCard {
  id: number;
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  headline: string;
  expertise: string;
  featured: boolean;
}
interface StoryCard {
  id: number;
  personName: string;
  role: string;
  quote: string;
  avatarUrl: string | null;
  featured: boolean;
}
interface PartnerCard {
  id: number;
  name: string;
  logoUrl: string | null;
  description: string;
  tier: "partner" | "supporter" | "sponsor";
}

const TIER_LABEL: Record<PartnerCard["tier"], string> = {
  sponsor: "راعٍ",
  partner: "شريك",
  supporter: "داعم",
};

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

function ExpertCardSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
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
  const bg = colors.muted;
  return (
    <Animated.View
      style={{
        opacity,
        width: 220,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: colors.radius + 2,
        padding: 14,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: bg }} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ height: 13, borderRadius: 6, backgroundColor: bg, width: "70%" }} />
          <View style={{ height: 11, borderRadius: 5, backgroundColor: bg, width: "50%" }} />
        </View>
      </View>
      <View style={{ gap: 5 }}>
        <View style={{ height: 11, borderRadius: 5, backgroundColor: bg, width: "100%" }} />
        <View style={{ height: 11, borderRadius: 5, backgroundColor: bg, width: "80%" }} />
      </View>
    </Animated.View>
  );
}

export default function Home() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const contentQ = useQuery<{ content: SiteContent }>({
    queryKey: ["content"],
    queryFn: () => api("/content"),
  });
  const numbersQ = useQuery<{ numbers: Numbers }>({
    queryKey: ["numbers"],
    queryFn: () => api("/numbers"),
  });
  const newsQ = useQuery<{ posts: DailyPost[] }>({
    queryKey: ["daily-news"],
    queryFn: () => api("/daily?type=news&limit=5"),
  });
  const expertsQ = useQuery<{ experts: ExpertCard[] }>({
    queryKey: ["experts-featured"],
    queryFn: () => api("/experts"),
  });
  const storiesQ = useQuery<{ stories: StoryCard[] }>({
    queryKey: ["stories-featured"],
    queryFn: () => api("/stories"),
  });
  const partnersQ = useQuery<{ partners: PartnerCard[] }>({
    queryKey: ["partners"],
    queryFn: () => api("/partners"),
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
  const numbers = numbersQ.data?.numbers;
  const news = newsQ.data?.posts ?? [];
  const experts = (expertsQ.data?.experts ?? []).slice(0, 6);
  const stories = (storiesQ.data?.stories ?? []).filter((s) => s.featured).slice(0, 4);
  const partners = partnersQ.data?.partners ?? [];

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

          {/* Quick shortcuts */}
          <View style={{ paddingTop: 22 }}>
            <FlatList
              horizontal
              data={
                [
                  { key: "programs", label: "برامج الاحتضان", icon: "layers" },
                  { key: "cohorts", label: "دفعات الاحتضان", icon: "git-branch" },
                  { key: "experts", label: "خبراء ومرشدون", icon: "award" },
                  { key: "courses", label: "كورسات وورشات", icon: "book-open" },
                  { key: "ventures", label: "مشاريع ناشئة", icon: "trending-up" },
                  { key: "resources", label: "دليل الرّائد", icon: "book" },
                  { key: "team", label: "فريق آيلاند", icon: "users" },
                  { key: "numbers", label: "أرقامنا", icon: "bar-chart-2" },
                  { key: "about", label: "من نحن", icon: "info" },
                  { key: "press", label: "المركز الإعلاميّ", icon: "radio" },
                  { key: "apply", label: "انتسب", icon: "user-plus" },
                ] as Array<{ key: string; label: string; icon: keyof typeof Feather.glyphMap }>
              }
              keyExtractor={(it) => it.key}
              inverted
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => router.push(`/${item.key}` as never)}
                  hitSlop={6}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Feather name={item.icon} size={14} color={colors.primary} />
                  <T size={13} weight="medium">{item.label}</T>
                </Pressable>
              )}
            />
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
                  <T size={14} color={colors.mutedForeground}>
                    سننشر أوّل أخبارنا قريبًا — تابعنا للاطّلاع على إطلاقاتنا.
                  </T>
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

          {/* Featured Experts */}
          {(expertsQ.isLoading || experts.length > 0) && (
            <View style={{ paddingTop: 28 }}>
              <View style={s.sectionHead}>
                <T size={20} weight="bold">الخبراء والمرشدون</T>
                {!expertsQ.isLoading && (
                  <Pressable onPress={() => router.push("/experts" as never)} hitSlop={8}>
                    <T size={13} color={colors.primary} weight="medium">عرض الكلّ</T>
                  </Pressable>
                )}
              </View>
              {expertsQ.isLoading ? (
                <FlatList
                  horizontal
                  data={[0, 1, 2, 3]}
                  keyExtractor={(i) => String(i)}
                  showsHorizontalScrollIndicator={false}
                  inverted
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                  renderItem={() => <ExpertCardSkeleton colors={colors} />}
                />
              ) : (
              <FlatList
                horizontal
                data={experts}
                keyExtractor={(e) => String(e.id)}
                showsHorizontalScrollIndicator={false}
                inverted
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => router.push(`/expert/${item.id}` as never)}
                    style={{
                      width: 220,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: colors.radius + 2,
                      padding: 14,
                      gap: 10,
                    }}
                  >
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
                      {item.avatarUrl ? (
                        <Image
                          source={{ uri: resolveMedia(item.avatarUrl) }}
                          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.muted }}
                        />
                      ) : (
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
                          <Feather name="user" size={20} color={colors.primary} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <T size={14} weight="bold" numberOfLines={1}>{item.fullName}</T>
                        <T size={12} color={colors.mutedForeground} numberOfLines={1}>{item.headline}</T>
                      </View>
                    </View>
                    <T size={12} color={colors.mutedForeground} numberOfLines={2}>
                      {item.expertise}
                    </T>
                  </Pressable>
                )}
              />
              )}
            </View>
          )}

          {/* Success Stories */}
          {stories.length > 0 && (
            <View style={{ paddingTop: 28 }}>
              <View style={s.sectionHead}>
                <T size={20} weight="bold">قصص نجاح</T>
              </View>
              <FlatList
                horizontal
                data={stories}
                keyExtractor={(s) => String(s.id)}
                showsHorizontalScrollIndicator={false}
                inverted
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                renderItem={({ item }) => (
                  <View
                    style={{
                      width: 300,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: colors.radius + 2,
                      padding: 16,
                      gap: 12,
                    }}
                  >
                    <Feather name="message-square" size={18} color={colors.primary} />
                    <T size={14} numberOfLines={4} style={{ lineHeight: 22 }}>
                      "{item.quote}"
                    </T>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
                      {item.avatarUrl ? (
                        <Image
                          source={{ uri: resolveMedia(item.avatarUrl) }}
                          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.muted }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: colors.primarySoft,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <T size={13} weight="bold" color={colors.primary}>
                            {item.personName.charAt(0)}
                          </T>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <T size={13} weight="bold" numberOfLines={1}>{item.personName}</T>
                        <T size={11} color={colors.mutedForeground} numberOfLines={1}>{item.role}</T>
                      </View>
                    </View>
                  </View>
                )}
              />
            </View>
          )}

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

          {/* Partners */}
          {partners.length > 0 && (
            <View style={{ paddingTop: 28, paddingHorizontal: 20 }}>
              <T size={20} weight="bold">شركاؤنا</T>
              <View style={{ marginTop: 12, gap: 10 }}>
                {partners.map((p) => (
                  <Card
                    key={p.id}
                    style={{
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {p.logoUrl ? (
                      <Image
                        source={{ uri: resolveMedia(p.logoUrl) }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: colors.muted,
                        }}
                        contentFit="contain"
                      />
                    ) : (
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: colors.primarySoft,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather name="award" size={20} color={colors.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                        <T size={15} weight="bold">{p.name}</T>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 10,
                            backgroundColor: colors.primarySoft,
                          }}
                        >
                          <T size={10} weight="medium" color={colors.primary}>
                            {TIER_LABEL[p.tier]}
                          </T>
                        </View>
                      </View>
                      {p.description ? (
                        <T size={12} color={colors.mutedForeground} numberOfLines={2}>
                          {p.description}
                        </T>
                      ) : null}
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          )}

          {/* Become a Mentor CTA */}
          <BecomeMentorBanner user={user} />
        </View>
      )}
    />
  );
}

function BecomeMentorBanner({ user }: { user: CurrentUser | null }) {
  const colors = useColors();
  const router = useRouter();

  if (user?.role === "expert") {
    return (
      <View style={{ paddingTop: 28, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => router.push("/experts" as never)}
          style={({ pressed }) => ({
            borderRadius: colors.radius + 4,
            borderWidth: 1,
            borderColor: colors.primary + "40",
            backgroundColor: colors.primarySoft,
            padding: 20,
            opacity: pressed ? 0.85 : 1,
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 14,
          })}
          testID="cta-manage-availability"
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="calendar" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <T size={15} weight="bold" style={{ textAlign: "right" }}>
              أنت مرشد في المجتمع
            </T>
            <T size={13} color={colors.mutedForeground} style={{ textAlign: "right" }}>
              تحقّق من ملفّك وأدِر توافرك للجلسات
            </T>
          </View>
          <Feather name="chevron-left" size={18} color={colors.primary} />
        </Pressable>
      </View>
    );
  }

  const badges = [
    { icon: "star" as const, label: "شارك خبرتك" },
    { icon: "clock" as const, label: "ساعة أسبوعيًّا" },
    { icon: "heart" as const, label: "أثّر في الجيل القادم" },
  ];

  return (
    <View style={{ paddingTop: 28, paddingHorizontal: 20 }}>
      <Pressable
        onPress={() => router.push("/become-mentor" as never)}
        style={({ pressed }) => ({
          borderRadius: colors.radius + 4,
          borderWidth: 1,
          borderColor: colors.primary + "40",
          backgroundColor: colors.primarySoft,
          padding: 20,
          opacity: pressed ? 0.85 : 1,
          gap: 12,
        })}
        testID="cta-become-mentor"
      >
        <View style={{ alignItems: "flex-end" }}>
          <T size={11} weight="bold" color={colors.primary} style={{ letterSpacing: 1, textTransform: "uppercase" }}>
            هل أنت خبير؟
          </T>
        </View>

        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <T size={24} weight="bold" style={{ textAlign: "right", lineHeight: 32 }}>
            انضم كمرشد
          </T>
          <T size={13} color={colors.mutedForeground} style={{ textAlign: "right", lineHeight: 20 }}>
            ساعد رواد الأعمال في غزة بمشاركة خبرتك ووقتك — جلسة واحدة قد تُغيّر مسار مشروع.
          </T>
        </View>

        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
          {badges.map((b) => (
            <View
              key={b.label}
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.primary + "30",
                backgroundColor: colors.card,
              }}
            >
              <Feather name={b.icon} size={12} color={colors.primary} />
              <T size={12} weight="medium" color={colors.primary}>{b.label}</T>
            </View>
          ))}
        </View>

        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 6,
            marginTop: 4,
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 999,
            backgroundColor: colors.primary,
            alignSelf: "flex-end",
          }}
        >
          <Feather name="chevron-left" size={16} color="#fff" />
          <T size={14} weight="bold" color="#fff">كُن مرشدًا</T>
        </View>
      </Pressable>
    </View>
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

