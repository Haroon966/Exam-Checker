import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors, radius, touch, type } from "../theme";

type Variant = "primary" | "cta" | "secondary" | "ghost" | "danger";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityHint?: string;
  haptic?: boolean;
  leftIcon?: React.ReactNode;
};

const bg: Record<Variant, string> = {
  primary: colors.primary,
  cta: colors.cta,
  secondary: colors.primarySoft,
  ghost: "transparent",
  danger: colors.bad,
};

const fg: Record<Variant, string> = {
  primary: colors.white,
  cta: colors.white,
  secondary: colors.primary,
  ghost: colors.primary,
  danger: colors.white,
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityHint,
  haptic = true,
  leftIcon,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={async () => {
        if (haptic) {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {
            /* ignore */
          }
        }
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg[variant] },
        variant === "ghost" && styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.label, { color: fg[variant] }, textStyle]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.min,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ghost: {
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  label: {
    ...type.bodyMed,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
});
