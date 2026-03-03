/**
 * Premium Sports Game Design System - Spacing Scale
 *
 * Consistent spacing creates visual rhythm and hierarchy.
 * Based on a 4px base unit.
 */

export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 24px */
  xl: 24,
  /** 32px */
  '2xl': 32,
  /** 48px */
  '3xl': 48,
  /** 64px */
  '4xl': 64,
} as const;

/**
 * Border radius values for consistent rounded corners.
 * Inner elements: 16px (xl). Main layout cards: 20-24px (2xl-3xl).
 */
export const borderRadius = {
  /** 4px - Subtle rounding */
  sm: 4,
  /** 8px - Default rounding */
  md: 8,
  /** 12px - Medium rounding */
  lg: 12,
  /** 16px - Inner elements, buttons */
  xl: 16,
  /** 20px - Main layout cards */
  '2xl': 20,
  /** 24px - Largest cards */
  '3xl': 24,
  /** Full circle */
  full: 9999,
} as const;

/**
 * Shadow offset for 3D button effect (legacy naming)
 * @deprecated Use depthOffset instead for new components
 */
export const shadowOffset = {
  /** Small button press depth */
  buttonSmall: 3,
  /** Standard button press depth */
  button: 4,
  /** Large button press depth */
  buttonLarge: 5,
} as const;

/**
 * Depth offset values for 3D layered UI components.
 * These define how many pixels the "top face" sits above the "shadow layer".
 *
 * The "Solid Layer" architecture uses two absolute-positioned Views:
 * - Bottom layer: Fixed position, darker color (the "depth/shadow")
 * - Top layer: Animated translateY on press (the "face")
 */
export const depthOffset = {
  /** No depth - flat appearance */
  none: 0,
  /** Minimal depth for sunk/recessed elements (empty grid cells) */
  sunk: 1,
  /** Cards and containers */
  card: 4,
  /** Grid cells (filled state) */
  cell: 4,
  /** Tic-tac-toe cells */
  tictacCell: 4,
  /** Tiny buttons (for compact cards) */
  buttonTiny: 2,
  /** Small buttons */
  buttonSmall: 3,
  /** Standard buttons */
  button: 5,
  /** Large buttons */
  buttonLarge: 6,
} as const;

export type DepthLevel = keyof typeof depthOffset;

/**
 * Common layout measurements
 */
export const layout = {
  /** Standard screen horizontal padding */
  screenPadding: spacing.lg,
  /** Card internal padding */
  cardPadding: spacing.lg,
  /** Gap between items in a list */
  listGap: spacing.md,
  /** Tab bar height */
  tabBarHeight: 80,
} as const;
