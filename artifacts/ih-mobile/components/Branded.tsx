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

export function Empty({ title, hint }: { title: string; hint?: string }) {
  const colors = useColors();
  return (
    <View style={s.empty}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.muted,
          alignItems: "center",
          justifyContent: "center",
        }}
      />
      <T size={17} weight="bold" align="center">{title}</T>
      {hint ? <T size={14} color={colors.mutedForeground} align="center">{hint}</T> : null}
    </View>
  );
}

const s = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
});
