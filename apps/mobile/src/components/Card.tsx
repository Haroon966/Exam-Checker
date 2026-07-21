import React from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { colors, radius, space } from "../theme";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Card({ children, onPress, style, accessibilityLabel, accessibilityHint }: Props) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: space.lg,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
    opacity: 0.95,
  },
});
