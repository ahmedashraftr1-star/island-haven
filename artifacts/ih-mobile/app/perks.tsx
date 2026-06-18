import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";


import { T, Empty } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

type PerkCategory = "tool" | "course" | "cloud" | "design" | "finance" | "other";

const CATEGORY_LABELS: Record<PerkCategory, string> = {
  tool: "أدوات",
  course: "دورات",
  cloud: "خدمات سحابية",
  design: "تصميم",
  finance: "مالية",
  other: "متنوّع",
};

const CATEGORY_ICONS: Record<PerkCategory, keyof typeof Feather.glyphMap> = {
  tool: "tool",
  course: "book-open",
  cloud: "cloud",
  design: "pen-tool",
  finance: "dollar-sign",
  other: "gift",
};

interface Perk {
  id: number;
  title: string;
  partnerName: string;
  description: string;
  category: PerkCategory;
  code: string;
  url: string;
  logoUrl: string | null;
  featured: boolean;
}

const FILTERS: { key: "all" | PerkCategory; label: string }[] = [
  { key: "all", label: "الكلّ" },
  { key: "tool", label: CATEGORY_LABELS.tool },
  { key: "course", label: CATEGORY_LABELS.course },
  { key: "cloud", label: CATEGORY_LABELS.cloud },
  { key: "design", label: CATEGORY_LABELS.design },
  { key: "finance", label: CATEGORY_LABELS.finance },
  { key: "other", label: CATEGORY_LABELS.other },
];

export default function PerksScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<"all" | PerkCategory>("all");
  const [copied, setCopied] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["perks", filter],
    queryFn: () => {
      const q = filter === "all" ? "/perks" : `/perks?category=${filter}`;
      return api<{ perks: Perk[] }>(q);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const perks = data?.perks ?? [];

  const handleCopy = async (perk: Perk) => {
    try { await navigator.clipboard.writeText(perk.code); } catch { /* native: no clipboard API */ }
    setCopied(perk.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <T
          style={{
            fontSize: 26,
            fontFamily: "IBMPlexSansArabic_700Bold",
            color: colors.foreground,
            textAlign: "right",
          }}
        >
          مزايا الأعضاء
        </T>
        <T
          style={{
            fontSize: 13,
            color: colors.mutedForeground,
            textAlign: "right",
            marginTop: 4,
            lineHeight: 20,
          }}
        >
          امتيازات حصرية لأعضاء آيلاند هيفن من شركائنا.
        </T>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: filter === f.key ? colors.primary : colors.card,
              borderWidth: 1,
              borderColor: filter === f.key ? colors.primary : colors.border,
            }}
          >
            <T
              style={{
                fontSize: 13,
                fontFamily: "IBMPlexSansArabic_600SemiBold",
                color: filter === f.key ? "#fff" : colors.foreground,
              }}
            >
              {f.label}
            </T>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 16 }}>
        {isLoading && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        )}

        {error && <Empty icon="alert-circle" title="تعذّر تحميل المزايا" />}

        {!isLoading && perks.length === 0 && !error && (
          <Empty icon="gift" title="لا توجد مزايا متاحة حاليًا" />
        )}

        {perks.map((perk) => (
          <View
            key={perk.id}
            style={{
              backgroundColor: perk.featured ? colors.primary + "12" : colors.card,
              borderRadius: 18,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: perk.featured ? colors.primary + "40" : colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row-reverse",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  {perk.featured && (
                    <Feather name="star" size={12} color={colors.primary} />
                  )}
                  <T
                    style={{
                      fontSize: 15,
                      fontFamily: "IBMPlexSansArabic_700Bold",
                      color: colors.foreground,
                    }}
                  >
                    {perk.title}
                  </T>
                </View>
                <T style={{ fontSize: 12, color: colors.mutedForeground }}>
                  {perk.partnerName}
                </T>
              </View>
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderRadius: 8,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Feather
                  name={CATEGORY_ICONS[perk.category] ?? "gift"}
                  size={18}
                  color={colors.primary}
                />
              </View>
            </View>

            <T
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                textAlign: "right",
                lineHeight: 20,
                marginBottom: 12,
              }}
            >
              {perk.description}
            </T>

            <View style={{ flexDirection: "row-reverse", gap: 8 }}>
              {perk.code && (
                <Pressable
                  onPress={() => handleCopy(perk)}
                  style={{
                    flex: 1,
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: colors.muted,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Feather
                    name={copied === perk.id ? "check" : "copy"}
                    size={14}
                    color={copied === perk.id ? "#22C55E" : colors.foreground}
                  />
                  <T
                    style={{
                      fontSize: 13,
                      fontFamily: "IBMPlexSansArabic_600SemiBold",
                      color: copied === perk.id ? "#22C55E" : colors.foreground,
                    }}
                  >
                    {copied === perk.id ? "تم النسخ!" : perk.code}
                  </T>
                </Pressable>
              )}
              {perk.url && (
                <Pressable
                  onPress={() => Linking.openURL(perk.url)}
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                  }}
                >
                  <Feather name="external-link" size={14} color="#fff" />
                  <T
                    style={{
                      fontSize: 13,
                      fontFamily: "IBMPlexSansArabic_600SemiBold",
                      color: "#fff",
                    }}
                  >
                    فتح
                  </T>
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
