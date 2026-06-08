import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { T, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

interface Numbers {
  members: number;
  freelancers: number;
  graduates: number;
  students: number;
  works: number;
  courses: number;
  enrollments: number;
  bookings: number;
  seatsHosted: number;
  applications: number;
  events: number;
}

interface StatItem {
  label: string;
  value: number;
  icon: keyof typeof Feather.glyphMap;
}

export default function NumbersScreen() {
  const colors = useColors();
  const q = useQuery<{ numbers: Numbers }>({
    queryKey: ["numbers"],
    queryFn: () => api("/numbers"),
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
        <T size={16}>تعذّر تحميل الأرقام.</T>
      </View>
    );
  }
  const n = q.data.numbers;

  const groups: Array<{ title: string; subtitle: string; items: StatItem[] }> = [
    {
      title: "المجتمع",
      subtitle: "Community",
      items: [
        { label: "إجمالي المنتسبين", value: n.members, icon: "users" },
        { label: "مُستقلّون", value: n.freelancers, icon: "briefcase" },
        { label: "خرّيجون", value: n.graduates, icon: "award" },
        { label: "طلّاب", value: n.students, icon: "book-open" },
      ],
    },
    {
      title: "الإنتاج",
      subtitle: "Output",
      items: [
        { label: "عمل في المعرض", value: n.works, icon: "image" },
        { label: "برنامج تدريبيّ", value: n.courses, icon: "layers" },
        { label: "تسجيل في برامج", value: n.enrollments, icon: "trending-up" },
        { label: "فعاليّات منشورة", value: n.events, icon: "calendar" },
      ],
    },
    {
      title: "الاستضافة",
      subtitle: "Hospitality",
      items: [
        { label: "حجز نشط", value: n.bookings, icon: "check-circle" },
        { label: "مقعد استضفناه", value: n.seatsHosted, icon: "users" },
        { label: "طلب انتساب", value: n.applications, icon: "inbox" },
      ],
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 80 }}
    >
      <View style={{ alignItems: "center", gap: 8 }}>
        <T size={11} color={colors.primary} weight="bold">BY THE NUMBERS</T>
        <T size={26} weight="bold" align="center">مُجتمعنا بالأرقام</T>
        <T size={13} color={colors.mutedForeground} align="center" style={{ lineHeight: 22 }}>
          كلّ رقم يُحسب الآن من قاعدة بياناتنا — يتغيّر تلقائيًّا مع كلّ منتسب جديد، كلّ عمل، وكلّ مقعد محجوز.
        </T>
      </View>

      {groups.map((g) => (
        <View key={g.title} style={{ gap: 10 }}>
          <View style={{ flexDirection: "row-reverse", alignItems: "baseline", gap: 8 }}>
            <T size={14} weight="bold" color={colors.primary}>{g.title}</T>
            <T size={11} color={colors.mutedForeground}>· {g.subtitle}</T>
          </View>
          <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 }}>
            {g.items.map((it) => (
              <Card key={it.label} style={{ flex: 1, minWidth: 150, gap: 8 }}>
                <Feather name={it.icon} size={18} color={colors.primary} />
                <T size={26} weight="bold">
                  {it.value.toLocaleString("ar-EG")}
                </T>
                <T size={12} color={colors.mutedForeground}>{it.label}</T>
              </Card>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
