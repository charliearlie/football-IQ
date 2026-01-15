/**
 * Digital Pitch Design System - Spacing Scale
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
 * Border radius values for consistent rounded corners
 */
export const borderRadius = {
  /** 4px - Subtle rounding */
  sm: 4,
  /** 8px - Default rounding */
  md: 8,
  /** 12px - Medium rounding */
  lg: 12,
  /** 16px - Friendly, not sharp (buttons) */
  xl: 16,
  /** 24px - Pills, tags */
  '2xl': 24,
  /** Full circle */
  full: 9999,
} as const;

/**
 * Shadow offset for 3D button effect (legacy naming)
 * Values create prominent tactile depth like Duolingo/Headspace
 * @deprecated Use depthOffset instead for new components
 */
export const shadowOffset = {
  /** Small button press depth */
  buttonSmall: 5,
  /** Standard button press depth */
  button: 8,
  /** Large button press depth */
  buttonLarge: 10,
} as const;

/**
 * Depth offset values for 3D layered UI components.
 * These define how many pixels the "top face" sits above the "shadow layer".
 *
 * The "Solid Layer" architecture uses two absolute-positioned Views:
 * - Bottom layer: Fixed position, darker color (the "depth/shadow")
 * - Top layer: Animated translateY on press (the "face")
 *
 * @see src/features/tic-tac-toe/components/GridCell.tsx for reference implementation
 */
export const depthOffset = {
  /** No depth - flat appearance */
  none: 0,
  /** Minimal depth for sunk/recessed elements (empty grid cells) */
  sunk: 1,
  /** Cards and containers */
  card: 2,
  /** Grid cells (filled state) */
  cell: 3,
  /** Tic-tac-toe cells */
  tictacCell: 4,
  /** Small buttons */
  buttonSmall: 5,
  /** Standard buttons */
  button: 8,
  /** Large buttons */
  buttonLarge: 10,
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
