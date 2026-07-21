import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, radius, space, touch, type } from "../theme";

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  multilineTall?: boolean;
};

export function Field({ label, hint, error, multilineTall, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        placeholderTextColor={colors.mutedSoft}
        accessibilityLabel={label || rest.placeholder}
        style={[
          styles.input,
          multilineTall && styles.tall,
          error ? styles.inputError : null,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  label: { ...type.label, color: colors.muted, marginBottom: space.xs },
  hint: { ...type.caption, color: colors.muted, marginBottom: space.sm, lineHeight: 18 },
  input: {
    minHeight: touch.min,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    color: colors.text,
    ...type.body,
  },
  tall: {
    minHeight: 140,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: colors.bad,
  },
  error: {
    ...type.caption,
    color: colors.bad,
    marginTop: space.xs,
  },
});
