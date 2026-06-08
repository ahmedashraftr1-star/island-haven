import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const ARABIC_FONT = "IBMPlexSansArabic_500Medium";
const ARABIC_FONT_BOLD = "IBMPlexSansArabic_700Bold";

interface TProps {
  children: React.ReactNode;
  size?: number;
  weight?: "regular" | "medium" | "bold";
  color?: string;
  align?: TextStyle["textAlign"];
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
}
export function T({ children, size = 15, weight = "regular", color, align = "right", style, numberOfLines }: TProps) {
  const colors = useColors();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: size,
          color: color ?? colors.foreground,
          textAlign: align,
          writingDirection: "rtl",
          fontFamily: weight === "bold" ? ARABIC_FONT_BOLD : ARABIC_FONT,
          fontWeight: weight === "bold" ? "700" : weight === "medium" ? "500" : "400",
        },
        style as TextStyle,
      ]}
    >
      {children}
    </Text>
  );
}

interface BtnProps extends Omit<PressableProps, "style" | "children"> {
  title: string;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}
export function Btn({ title, variant = "primary", loading, fullWidth, onPress, disabled, style, ...rest }: BtnProps) {
  const colors = useColors();
  const bg =
    variant === "primary" ? colors.primary : variant === "secondary" ? colors.muted : "transparent";
  const fg =
    variant === "primary" ? colors.primaryForeground : colors.foreground;
  const border = variant === "ghost" ? colors.border : "transparent";

  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      onPress={(e) => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: colors.radius,
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderWidth: 1,
          borderColor: border,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "auto",
        },
        style as ViewStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text
          style={{
            color: fg,
            fontSize: 16,
            fontWeight: "700",
            fontFamily: ARABIC_FONT_BOLD,
            writingDirection: "rtl",
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

interface FieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  hint?: string;
  error?: string;
}
export function Field({ label, hint, error, ...rest }: FieldProps) {
  const colors = useColors();
  return (
    <View style={{ gap: 6 }}>
      {label ? <T size={13} weight="medium" color={colors.mutedForeground}>{label}</T> : null}
      <TextInput
        {...rest}
        placeholderTextColor={colors.mutedForeground}
        style={{
          borderWidth: 1,
          borderColor: error ? colors.destructive : colors.border,
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          padding: 14,
          fontSize: 15,
          color: colors.foreground,
          textAlign: "right",
          writingDirection: "rtl",
          fontFamily: ARABIC_FONT,
        }}
      />
      {error ? <T size={12} color={colors.destructive}>{error}</T> : hint ? <T size={12} color={colors.mutedForeground}>{hint}</T> : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius + 2,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Empty({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const colors = useColors();
  return (
    <View style={s.empty}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.muted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon ? <Feather name={icon} size={30} color={colors.mutedForeground} /> : null}
      </View>
      <T size={17} weight="bold" align="center">{title}</T>
      {hint ? (
        <T size={14} color={colors.mutedForeground} align="center" style={{ lineHeight: 22, maxWidth: 320 }}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

// ─── Skeletons ──────────────────────────────────────────────────────────────
//
// Subtle pulse animation. Driven by Animated to stay on the JS thread-light side;
// useNativeDriver=true keeps it 60fps even on lower-end devices.

import { Animated, Easing } from "react-native";

function useSkeletonPulse() {
  const v = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.85, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.4, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return v;
}

export function SkeletonBlock({
  width,
  height,
  radius,
  style,
}: {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const colors = useColors();
  const opacity = useSkeletonPulse();
  return (
    <Animated.View
      style={[
        {
          width: width ?? "100%",
          height,
          borderRadius: radius ?? 8,
          backgroundColor: colors.muted,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: colors.radius + 2,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        gap: 10,
      }}
    >
      <SkeletonBlock height={140} radius={colors.radius} />
      <SkeletonBlock height={16} width={"70%"} />
      <SkeletonBlock height={12} width={"90%"} />
      <SkeletonBlock height={12} width={"50%"} />
    </View>
  );
}

export function SkeletonRow() {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.card,
        borderRadius: colors.radius + 2,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
      }}
    >
      <SkeletonBlock width={56} height={56} radius={28} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBlock height={14} width={"60%"} />
        <SkeletonBlock height={12} width={"85%"} />
      </View>
    </View>
  );
}

export function SkeletonNewsSlider() {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row-reverse", gap: 12, paddingHorizontal: 20 }}>
      {[0, 1].map((i) => (
        <View
          key={i}
          style={{
            width: 280,
            borderRadius: colors.radius + 2,
            overflow: "hidden",
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <SkeletonBlock height={140} radius={0} />
          <View style={{ padding: 14, gap: 6 }}>
            <SkeletonBlock height={14} width={"75%"} />
            <SkeletonBlock height={12} width={"95%"} />
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
});
