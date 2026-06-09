import React from "react";
import { ScrollView, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { T, Card, Btn } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";

const PILLARS = [
  {
    icon: "home" as const,
    title: "حاضنة أعمال",
    body: "مكاتب وإنترنت وقاعات اجتماع لكلّ منتسب — لتعمل وتلتقي وتتعلّم دون أيّ تكلفة.",
  },
  {
    icon: "users" as const,
    title: "مجتمع روّاد",
    body: "مستقلّون، خرّيجون، وطلّاب يلتقون في مكان واحد — يتبادلون الفرص والمعرفة كلّ يوم.",
  },
  {
    icon: "trending-up" as const,
    title: "احتضان وتسريع",
    body: "برامج احتضان تنقل فكرتك من ورقة إلى منتج، مع إرشاد من أفضل الخبراء.",
  },
  {
    icon: "award" as const,
    title: "تدريب نوعيّ",
    body: "كورسات وورشات منتقاة تُمَكِّنُك من تحويل المعرفة إلى دخل وأثَر.",
  },
];

export default function AboutScreen() {
  const colors = useColors();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 80 }}
    >
      <View style={{ alignItems: "center", gap: 10, paddingVertical: 12 }}>
        <T size={11} color={colors.primary} weight="bold">آيلاند هيفن · ISLAND HAVEN</T>
        <T size={28} weight="bold" align="center">من نحن</T>
        <T size={14} color={colors.mutedForeground} align="center" style={{ lineHeight: 24 }}>
          حاضنة أعمال في قلب غزّة — تأخذ المواهب من الفكرة إلى المنتج،
          ومن المهارة إلى الدخل، ومن العزلة إلى المجتمع.
        </T>
      </View>

      <Card style={{ gap: 10 }}>
        <T size={12} color={colors.primary} weight="bold">قصّتنا</T>
        <T size={14} style={{ lineHeight: 26 }}>
          آيلاند هيفن وُلِدت من إيمان بأنّ غزّة تستحقّ مساحة تليق بأحلام أبنائها — مكانًا
          آمنًا، إنترنتًا يعمل، وزملاء يدفعونك للأمام.
          {"\n\n"}
          بدأنا بطاولة وكرسيّين، وكبرنا اليوم إلى عائلة من المستقلّين وروّاد الأعمال
          والمتعلّمين — كلّهم يبنون في غزّة شيئًا يستحقّ الحياة.
        </T>
      </Card>

      <View style={{ gap: 12 }}>
        <T size={14} weight="bold" color={colors.primary}>ما نقدّمه</T>
        {PILLARS.map((p) => (
          <Card key={p.title} style={{ flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 }}>
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
              <Feather name={p.icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <T size={15} weight="bold">{p.title}</T>
              <T size={13} color={colors.mutedForeground} style={{ lineHeight: 22 }}>
                {p.body}
              </T>
            </View>
          </Card>
        ))}
      </View>

      <Card style={{ gap: 10 }}>
        <T size={12} color={colors.primary} weight="bold">تواصل معنا</T>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
          <Feather name="mail" size={16} color={colors.primary} />
          <T size={14}>island-haven@nastonas.org</T>
        </View>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
          <Feather name="map-pin" size={16} color={colors.primary} />
          <T size={14}>غزّة، فلسطين</T>
        </View>
      </Card>
    </ScrollView>
  );
}
