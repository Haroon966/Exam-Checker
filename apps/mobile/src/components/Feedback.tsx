import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "../theme";

type Tone = "ok" | "warn" | "bad" | "info" | "neutral";

const tones: Record<Tone, { bg: string; fg: string }> = {
  ok: { bg: colors.okSoft, fg: colors.ok },
  warn: { bg: colors.warnSoft, fg: colors.warn },
  bad: { bg: colors.badSoft, fg: colors.bad },
  info: { bg: colors.primarySoft, fg: colors.primary },
  neutral: { bg: colors.bgDeep, fg: colors.muted },
};

export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]} accessibilityRole="text">
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.empty} accessible>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    </View>
  );
}

export function ScreenSkeleton() {
  return (
    <View style={styles.skelWrap} accessibilityLabel="Loading">
      <View style={styles.skelHero} />
      <View style={styles.skelLine} />
      <View style={[styles.skelLine, { width: "60%" }]} />
      <View style={styles.skelCard} />
      <View style={styles.skelCard} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  text: { ...type.caption, fontFamily: "PlusJakartaSans_600SemiBold" },
  section: {
    ...type.label,
    color: colors.muted,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  empty: { paddingVertical: space.lg },
  emptyTitle: { ...type.bodyMed, color: colors.text },
  emptyBody: { ...type.caption, color: colors.muted, marginTop: 4, lineHeight: 18 },
  skelWrap: { flex: 1, backgroundColor: colors.bg, padding: space.lg, gap: space.md },
  skelHero: {
    height: 36,
    width: "55%",
    borderRadius: radius.sm,
    backgroundColor: colors.bgDeep,
  },
  skelLine: {
    height: 14,
    width: "80%",
    borderRadius: 4,
    backgroundColor: colors.bgDeep,
  },
  skelCard: {
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.bgDeep,
    marginTop: space.sm,
  },
});
