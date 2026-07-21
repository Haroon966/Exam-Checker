import { colors, space } from "./theme";

export const screen = {
  flex: 1,
  backgroundColor: colors.bg,
} as const;

export const pad = {
  paddingHorizontal: space.lg,
  paddingTop: space.md,
  paddingBottom: space.xl,
} as const;
