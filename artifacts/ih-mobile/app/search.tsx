import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { T, Empty } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api, resolveMedia } from "@/lib/api";

interface Hit {
  id: number;
  title: string;
  subtitle: string;
  avatarUrl?: string | null;
}
interface Results {
  experts: Hit[];
  ventures: Hit[];
  programs: Hit[];
  courses: Hit[];
  members: Hit[];
}

const CATEGORIES: {
  key: keyof Results;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: (h: Hit) => string;
}[] = [
  { key: "experts", label: "الخبراء", icon: "award", route: (h) => `/expert/${h.id}` },
  { key: "ventures", label: "المشاريع", icon: "trending-up", route: (h) => `/venture/${h.id}` },
  { key: "programs", label: "البرامج", icon: "layers", route: (h) => `/program/${h.id}` },
  { key: "courses", label: "الكورسات والورشات", icon: "book-open", route: (h) => `/course/${h.id}` },
  { key: "members", label: "المنتسبون", icon: "users", route: (h) => `/member/${h.id}` },
];

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const [q, setQ] = useState(typeof params.q === "string" ? params.q : "");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(() => {
      api<Results>(`/search?q=${encodeURIComponent(term)}`)
        .then((r) => {
          if (cancelled) return;
          setResults({
            experts: r.experts ?? [],
            ventures: r.ventures ?? [],
            programs: r.programs ?? [],
            courses: r.courses ?? [],
            members: r.members ?? [],
          });
        })
        .catch(() => !cancelled && setResults(null))
        .finally(() => !cancelled && setLoading(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const total = results ? CATEGORIES.reduce((n, c) => n + (results[c.key]?.length ?? 0), 0) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 }}>
        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 14,
            height: 50,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            ref={inputRef}
            value={q}
            onChangeText={setQ}
            placeholder="ابحث في الخبراء، المشاريع، المنتسبين…"
            placeholderTextColor={colors.mutedForeground}
            style={{ flex: 1, fontSize: 15, color: colors.foreground, textAlign: "right", writingDirection: "rtl" }}
            returnKeyType="search"
            autoCorrect={false}
          />
          {q.length > 0 ? (
            <Pressable onPress={() => setQ("")} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {q.trim().length < 2 ? (
        <Empty icon="search" title="ابدأ البحث" hint="اكتب حرفين على الأقلّ لعرض النتائج." />
      ) : loading && !results ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : results && total === 0 ? (
        <Empty icon="search" title="لا نتائج" hint={`لم نجد شيئًا لـ «${q.trim()}». جرّب كلمة أخرى.`} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 22 }} keyboardShouldPersistTaps="handled">
          {CATEGORIES.map((c) => {
            const items = results?.[c.key] ?? [];
            if (!items.length) return null;
            return (
              <View key={c.key} style={{ gap: 10 }}>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                  <Feather name={c.icon} size={15} color={colors.primary} />
                  <T size={14.5} weight="bold">{c.label}</T>
                  <T size={12} color={colors.mutedForeground}>({items.length})</T>
                </View>
                {items.map((h) => (
                  <Pressable
                    key={`${c.key}-${h.id}`}
                    onPress={() => router.push(c.route(h) as never)}
                    style={({ pressed }) => ({
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: pressed ? colors.muted : colors.card,
                    })}
                  >
                    {h.avatarUrl ? (
                      <Image source={{ uri: resolveMedia(h.avatarUrl) }} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.muted }} />
                    ) : (
                      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                        <Feather name={c.icon} size={18} color={colors.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <T size={14} weight="bold" numberOfLines={1}>{h.title}</T>
                      {h.subtitle ? (
                        <T size={12} color={colors.mutedForeground} numberOfLines={1}>{h.subtitle}</T>
                      ) : null}
                    </View>
                    <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
