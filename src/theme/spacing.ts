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
 * Shadow offset for 3D button effect
 * Values create prominent tactile depth like Duolingo/Headspace
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
