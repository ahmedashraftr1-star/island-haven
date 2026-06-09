import React from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { T, Card } from "@/components/Branded";
import { useColors } from "@/hooks/useColors";

const PRESS_EMAIL = "island-haven@nastonas.org";
const BOILERPLATE =
  "آيلاند هيفن حاضنة أعمال غزّاويّة مجّانيّة تابعة لمبادرة «من النّاس إلى النّاس». نَحتضن المشاريع الناشئة والمستقلّين والخرّيجين عبر الإرشاد، وبرامج الاحتضان، ومكتبة موارد، وشبكة من الخبراء والشركاء. رؤيتنا: تمكين الشباب واختصار المسافة بينهم وبين سوق العمل العالميّ عبر الاقتصاد الرقميّ — عقولٌ تقهر الركام.";

const FACTS: { icon: keyof typeof Feather.glyphMap; value: string; label: string }[] = [
  { icon: "zap", value: "١٥", label: "فكرة ريادية في هاكثون البنّائين" },
  { icon: "gift", value: "١٠٠٪", label: "مجّانيّ للمنتسبين" },
  { icon: "map-pin", value: "غزّة", label: "تأسّس ٢٠٢٤" },
  { icon: "users", value: "٣", label: "شركاء: Replit · عوالم · ناس تو ناس" },
];

export default function PressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: insets.top + 12, gap: 16 }}
    >
      <View>
        <T size={26} weight="bold">المركز الإعلاميّ</T>
        <T size={13} color={colors.mutedForeground}>
          حقائق واقتباسات وجهة تواصل لتغطية قصّة آيلاند هيفن
        </T>
      </View>

      <Card style={{ gap: 8 }}>
        <T size={14} weight="bold">نبذة للنشر</T>
        <T size={13.5} color={colors.mutedForeground} style={{ lineHeight: 24 }}>
          {BOILERPLATE}
        </T>
      </Card>

      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 }}>
        {FACTS.map((f, i) => (
          <Card key={i} style={{ width: "47%", gap: 4 }}>
            <Feather name={f.icon} size={18} color={colors.primary} />
            <T size={22} weight="bold">{f.value}</T>
            <T size={11.5} color={colors.mutedForeground} style={{ lineHeight: 17 }}>{f.label}</T>
          </Card>
        ))}
      </View>

      <Card style={{ gap: 6 }}>
        <Feather name="message-circle" size={18} color={colors.primary} />
        <T size={15} weight="bold" style={{ lineHeight: 26 }}>
          «تنظيم فعاليّة بهذا الحجم تحت هذه الظروف تحدٍّ مباشر — عقولٌ تقهر الركام وتبني مستقبلًا رقميًّا لغزّة.»
        </T>
        <T size={12.5} color={colors.primary} weight="bold">مهنّد جندية</T>
        <T size={11.5} color={colors.mutedForeground}>المدير ومؤسّس آيلاند هيفن</T>
      </Card>

      <Pressable onPress={() => Linking.openURL("https://felesteen.news/post/181271").catch(() => {})}>
        <Card style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
          <Feather name="external-link" size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <T size={13} weight="bold">في الإعلام: «هاكثون البنّائين»</T>
            <T size={11.5} color={colors.mutedForeground}>فلسطين أون لاين</T>
          </View>
        </Card>
      </Pressable>

      <Pressable onPress={() => Linking.openURL(`mailto:${PRESS_EMAIL}`).catch(() => {})}>
        <Card style={{ alignItems: "center", gap: 6, paddingVertical: 18 }}>
          <Feather name="mail" size={22} color={colors.primary} />
          <T size={14} weight="bold">للاستفسارات الإعلاميّة</T>
          <T size={13} color={colors.primary}>{PRESS_EMAIL}</T>
        </Card>
      </Pressable>
    </ScrollView>
  );
}
