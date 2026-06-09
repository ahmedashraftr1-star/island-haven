import React from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { T, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  announced: "معلَنة",
  open: "التسجيل مفتوح",
  in_progress: "جارية الآن",
  demo_day: "يوم العرض",
  completed: "مكتملة",
};
const VSTAGE: Record<string, string> = {
  idea: "فكرة",
  mvp: "نموذج أوّليّ",
  launched: "أُطلِق",
  scaling: "في توسّع",
};

interface Resp {
  cohort: {
    id: number;
    name: string;
    slug: string;
    summary: string;
    description: string;
    coverUrl: string | null;
    status: string;
    demoDayAt: string | null;
    demoDayLocation: string;
  };
  program: { id: number; title: string };
  ventures: {
    membership: { status: string };
    venture: {
      id: number;
      name: string;
      tagline: string;
      logoUrl: string | null;
      stage: string;
      sector: string;
    };
  }[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function CohortDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const q = useQuery<Resp>({
    queryKey: ["cohort", slug],
    queryFn: () => api(`/cohorts/${slug}`),
    enabled: !!slug,
  });

  if (q.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!q.data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <T color={colors.mutedForeground}>تعذّر تحميل الدفعة</T>
      </View>
    );
  }

  const { cohort: c, program, ventures } = q.data;
  const shown = ventures.filter(
    (v) => v.membership.status === "active" || v.membership.status === "graduated",
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {c.coverUrl ? (
        <Image
          source={{ uri: resolveMedia(c.coverUrl) }}
          style={{ width: "100%", height: 190, backgroundColor: colors.muted }}
          contentFit="cover"
        />
      ) : (
        <View style={{ width: "100%", height: 120, backgroundColor: colors.primarySoft }} />
      )}

      <View style={{ padding: 20, gap: 12 }}>
        <View
          style={{
            alignSelf: "flex-end",
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: colors.primarySoft,
          }}
        >
          <T size={11} weight="bold" color={colors.primary}>
            {STATUS_LABELS[c.status] ?? c.status}
          </T>
        </View>

        <T size={24} weight="bold">{c.name}</T>
        {program?.title ? <T size={13} color={colors.primary}>{program.title}</T> : null}
        {c.summary ? (
          <T size={14} color={colors.mutedForeground} style={{ lineHeight: 23 }}>
            {c.summary}
          </T>
        ) : null}
        {c.description ? (
          <T size={13.5} style={{ lineHeight: 24 }}>{c.description}</T>
        ) : null}

        {c.demoDayAt ? (
          <Card style={{ padding: 14 }}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
              <Feather name="award" size={16} color={colors.primary} />
              <T size={13.5} weight="bold">يوم العرض (Demo Day)</T>
            </View>
            <T size={12.5} color={colors.mutedForeground} style={{ marginTop: 4 }}>
              {formatDate(c.demoDayAt)}
              {c.demoDayLocation ? ` · ${c.demoDayLocation}` : ""}
            </T>
          </Card>
        ) : null}

        {shown.length > 0 ? (
          <View style={{ gap: 10, marginTop: 6 }}>
            <T size={16} weight="bold">المشاريع المشارِكة ({shown.length})</T>
            {shown.map((row) => {
              const v = row.venture;
              return (
                <Pressable key={v.id} onPress={() => router.push(`/venture/${v.id}` as never)}>
                  <Card style={{ padding: 14 }}>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
                      {v.logoUrl ? (
                        <Image
                          source={{ uri: resolveMedia(v.logoUrl) }}
                          style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.muted }}
                          contentFit="cover"
                        />
                      ) : (
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
                          <T size={18} weight="bold" color={colors.primary}>{v.name.charAt(0)}</T>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <T size={15} weight="bold" numberOfLines={1}>{v.name}</T>
                        <T size={11.5} color={colors.primary}>
                          {VSTAGE[v.stage] ?? v.stage}
                          {v.sector ? ` · ${v.sector}` : ""}
                        </T>
                        {v.tagline ? (
                          <T size={12} color={colors.mutedForeground} numberOfLines={2} style={{ marginTop: 2 }}>
                            {v.tagline}
                          </T>
                        ) : null}
                      </View>
                      <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <CohortJourney slug={String(slug)} />
      </View>
    </ScrollView>
  );
}

interface Week {
  id: number;
  weekNumber: number;
  title: string;
  theme: string;
}
interface Update {
  id: number;
  title: string;
  body: string;
  weekNumber: number | null;
}

function CohortJourney({ slug }: { slug: string }) {
  const colors = useColors();
  const q = useQuery<{ weeks: Week[]; updates: Update[] }>({
    queryKey: ["cohort-journey", slug],
    queryFn: () => api(`/cohorts/${slug}/journey`),
    enabled: !!slug,
  });
  const weeks = q.data?.weeks ?? [];
  const updates = q.data?.updates ?? [];
  if (weeks.length === 0 && updates.length === 0) return null;

  return (
    <View style={{ gap: 10, marginTop: 6 }}>
      <T size={16} weight="bold">رحلة الدفعة</T>
      {weeks.map((w, idx) => (
        <View key={w.id} style={{ flexDirection: "row-reverse", gap: 10 }}>
          <View style={{ alignItems: "center", width: 12 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 5 }} />
            {idx < weeks.length - 1 ? (
              <View style={{ flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 }} />
            ) : null}
          </View>
          <Card style={{ flex: 1, padding: 12 }}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.primarySoft }}>
                <T size={10} weight="bold" color={colors.primary}>الأسبوع {w.weekNumber}</T>
              </View>
              <T size={13.5} weight="bold" numberOfLines={2} style={{ flexShrink: 1 }}>{w.title}</T>
            </View>
            {w.theme ? (
              <T size={12.5} color={colors.mutedForeground} style={{ marginTop: 4, lineHeight: 20 }}>{w.theme}</T>
            ) : null}
          </Card>
        </View>
      ))}
      {updates.length > 0 ? (
        <View style={{ gap: 8, marginTop: 4 }}>
          <T size={14} weight="bold">آخر التحديثات</T>
          {updates.map((u) => (
            <Card key={u.id} style={{ padding: 12 }}>
              <T size={13} weight="bold">{u.title}</T>
              {u.body ? (
                <T size={12} color={colors.mutedForeground} style={{ marginTop: 3, lineHeight: 19 }}>{u.body}</T>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}
    </View>
  );
}
