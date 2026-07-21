/**
 * Exam Checker design tokens — from ui-ux-pro-max
 * Style: Flat Design | Teal focus + action orange | Plus Jakarta Sans
 */
export const colors = {
  primary: "#0D9488",
  primarySoft: "#CCFBF1",
  secondary: "#14B8A6",
  cta: "#F97316",
  ctaPressed: "#EA580C",
  bg: "#F0FDFA",
  bgDeep: "#CCFBF1",
  surface: "#FFFFFF",
  text: "#134E4A",
  muted: "#0F766E",
  mutedSoft: "#5EEAD4",
  line: "#99F6E4",
  ok: "#059669",
  okSoft: "#D1FAE5",
  warn: "#D97706",
  warnSoft: "#FEF3C7",
  bad: "#DC2626",
  badSoft: "#FEE2E2",
  white: "#FFFFFF",
  cameraBg: "#0F172A",
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

export const touch = {
  min: 48,
};

export const type = {
  hero: { fontSize: 32, lineHeight: 40, fontFamily: "PlusJakartaSans_700Bold" as const },
  title: { fontSize: 24, lineHeight: 32, fontFamily: "PlusJakartaSans_700Bold" as const },
  subtitle: { fontSize: 18, lineHeight: 26, fontFamily: "PlusJakartaSans_600SemiBold" as const },
  body: { fontSize: 16, lineHeight: 24, fontFamily: "PlusJakartaSans_400Regular" as const },
  bodyMed: { fontSize: 16, lineHeight: 24, fontFamily: "PlusJakartaSans_500Medium" as const },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: "PlusJakartaSans_500Medium" as const },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "PlusJakartaSans_600SemiBold" as const,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
};

// Legacy aliases used during migration
export const colorsLegacyMap = {
  brand: colors.primary,
  accent: colors.cta,
  ink: colors.text,
  card: colors.surface,
};
