import React from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { T, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

const VENTURE_STAGE_LABELS: Record<string, string> = {
  idea: "فكرة",
  mvp: "نموذج أوّليّ",
  launched: "أُطلِق",
  scaling: "في توسّع",
};

const STAGE_STEPS = ["idea", "mvp", "launched", "scaling"];

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

function Fact({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  const colors = useColors();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 130,
        backgroundColor: colors.muted,
        borderRadius: colors.radius,
        padding: 12,
        gap: 4,
      }}
    >
      <Feather name={icon} size={14} color={colors.primary} />
      <T size={10.5} color={colors.mutedForeground}>{label}</T>
      <T size={13} weight="bold">{value}</T>
    </View>
  );
}

export default function VentureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const q = useQuery<{ venture: Venture }>({
    queryKey: ["venture", id],
    queryFn: () => api(`/ventures/${id}`),
    enabled: !!id,
  });

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (q.isError || !q.data) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 20 }}>
        <T size={16}>تعذّر التحميل.</T>
      </View>
    );
  }
  const v = q.data.venture;
  const stageIx = STAGE_STEPS.indexOf(v.stage);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 80 }}>
      {v.coverUrl ? (
        <Image
          source={{ uri: resolveMedia(v.coverUrl) }}
          style={{ width: "100%", height: 200, backgroundColor: colors.muted }}
          contentFit="cover"
        />
      ) : (
        <View style={{ width: "100%", height: 120, backgroundColor: colors.primarySoft }} />
      )}

      <View style={{ padding: 20, gap: 16 }}>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
          {v.logoUrl ? (
            <Image
              source={{ uri: resolveMedia(v.logoUrl) }}
              style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: colors.muted, marginTop: -40 }}
            />
          ) : (
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginTop: -40,
              }}
            >
              <T size={26} weight="bold" color={colors.primaryForeground}>{v.name.charAt(0)}</T>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View
              style={{
                alignSelf: "flex-end",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: colors.primarySoft,
                marginBottom: 4,
              }}
            >
              <T size={10} weight="bold" color={colors.primary}>
                {VENTURE_STAGE_LABELS[v.stage] ?? v.stage}
              </T>
            </View>
            <T size={22} weight="bold">{v.name}</T>
          </View>
        </View>

        {v.tagline ? (
          <T size={15} color={colors.primary} weight="medium" style={{ lineHeight: 24 }}>{v.tagline}</T>
        ) : null}

        <View style={{ flexDirection: "row-reverse", gap: 6 }}>
          {STAGE_STEPS.map((s, i) => (
            <View key={s} style={{ flex: 1, gap: 4 }}>
              <View
                style={{
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: i <= stageIx ? colors.primary : colors.muted,
                }}
              />
              <T
                size={10}
                weight="bold"
                align="center"
                color={i === stageIx ? colors.primary : colors.mutedForeground}
              >
                {VENTURE_STAGE_LABELS[s]}
              </T>
            </View>
          ))}
        </View>

        {v.description ? (
          <Card>
            <T size={14} style={{ lineHeight: 24 }}>{v.description}</T>
          </Card>
        ) : null}

        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
          <Fact icon="layers" label="المرحلة" value={VENTURE_STAGE_LABELS[v.stage] ?? v.stage} />
          {v.sector ? <Fact icon="briefcase" label="القطاع" value={v.sector} /> : null}
          {v.foundedYear > 0 ? <Fact icon="calendar" label="التأسيس" value={String(v.foundedYear)} /> : null}
          <Fact icon="users" label="الفريق" value={`${v.teamSize} أعضاء`} />
        </View>

        {v.founderName ? (
          <T size={13} color={colors.mutedForeground}>
            المؤسِّس: <T size={13} weight="bold" color={colors.foreground}>{v.founderName}</T>
          </T>
        ) : null}

        {v.websiteUrl ? (
          <Pressable
            onPress={() => Linking.openURL(v.websiteUrl)}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              borderRadius: colors.radius,
              alignItems: "center",
              flexDirection: "row-reverse",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <T size={15} weight="bold" color={colors.primaryForeground}>زيارة المشروع</T>
            <Feather name="external-link" size={16} color={colors.primaryForeground} />
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}
