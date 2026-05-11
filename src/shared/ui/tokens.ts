/**
 * tokens.ts — Typed re-exports of locked Zarkili design tokens.
 *
 * Source of truth: design-handoff/tokens/{colors,spacing,typography}.json
 * These are the only token values W21+ UI primitives may reference.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const colors = {
  // Brand
  coralBlossom: "#E3A9A0",
  warmOat: "#D1BFB3",
  creamSilk: "#F2EDDD",
  mintFresh: "#BBEDDA",
  // Semantic
  primary: "#E3A9A0",
  primaryHover: "#D99A90",
  primaryPressed: "#CF8B80",
  background: "#F2EDDD",
  surface: "#FFFFFF",
  border: "#E5E0D1",
  foreground: "#1A1A1A",
  textMuted: "#6B6B6B",
  accent: "#BBEDDA",
  accentForeground: "#2D4A42",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",
  // Opacity overlays
  primary10: "rgba(227, 169, 160, 0.1)",
  primary20: "rgba(227, 169, 160, 0.2)",
  black50: "rgba(0, 0, 0, 0.5)",
  hover: "rgba(0, 0, 0, 0.05)",
  pressed: "rgba(0, 0, 0, 0.1)",
  // States
  disabled: "#B0B0B0",
  disabledBg: "#F5F5F5",
  white: "#FFFFFF",
} as const;

export type ColorToken = keyof typeof colors;

// ---------------------------------------------------------------------------
// Spacing — 4pt grid
// ---------------------------------------------------------------------------

export const spacing = {
  s0: 0,
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s7: 28,
  s8: 32,
  s10: 40,
  s12: 48,
  s16: 64,
  s20: 80,
  s24: 96,
  // Semantic
  pageHorizontal: 16,
  pageVertical: 24,
  cardPadding: 16,
  cardPaddingLarge: 20,
  sectionGap: 24,
  elementGap: 12,
  elementGapSmall: 8,
  touchTarget: 44,
} as const;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fontWeights = {
  light: "300",
  regular: "400",
  medium: "500",
  semibold: "600",
} as const;

export const textStyles = {
  heading1: { fontSize: 32, lineHeight: 40, fontWeight: "600", letterSpacing: -0.5 },
  heading2: { fontSize: 24, lineHeight: 32, fontWeight: "600", letterSpacing: -0.25 },
  heading3: { fontSize: 20, lineHeight: 28, fontWeight: "600", letterSpacing: 0 },
  heading4: { fontSize: 18, lineHeight: 24, fontWeight: "600", letterSpacing: 0 },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: "400", letterSpacing: 0 },
  body: { fontSize: 14, lineHeight: 20, fontWeight: "400", letterSpacing: 0 },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: "400", letterSpacing: 0 },
  labelLarge: { fontSize: 16, lineHeight: 24, fontWeight: "500", letterSpacing: 0.15 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "500", letterSpacing: 0.1 },
  labelSmall: { fontSize: 12, lineHeight: 16, fontWeight: "500", letterSpacing: 0.5 },
  overline: { fontSize: 10, lineHeight: 16, fontWeight: "600", letterSpacing: 1.5 },
} as const;

export type TextStyleToken = keyof typeof textStyles;
