/**
 * Digital Pitch Design System - Shadow Presets
 *
 * Cross-platform shadow system for React Native.
 * iOS uses shadowColor/Offset/Opacity/Radius, Android uses elevation.
 *
 * IMPORTANT: Android elevation requires a background color to render.
 * Ensure your component has a backgroundColor set.
 */

import { Platform, ViewStyle } from 'react-native';

/**
 * Shadow preset interface for type safety.
 */
export interface ShadowPreset {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

/**
 * Create a shadow preset with iOS and Android support.
 */
function createShadow(
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number
): ShadowPreset {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: elevation,
  };
}

/**
 * Shadow presets for different elevation levels.
 *
 * Use these by spreading into your styles:
 * ```tsx
 * const styles = StyleSheet.create({
 *   card: {
 *     ...shadows.md,
 *     backgroundColor: colors.stadiumNavy,
 *   },
 * });
 * ```
 */
export const shadows = {
  /** No shadow */
  none: createShadow('#000', 0, 0, 0, 0),

  /** Subtle shadow for slight depth (e.g., input fields) */
  sm: createShadow('#000', 2, 0.15, 4, 2),

  /** Medium shadow for cards */
  md: createShadow('#000', 4, 0.25, 8, 4),

  /** Large shadow for elevated cards - prominent depth */
  lg: createShadow('#000', 6, 0.35, 12, 8),

  /** Extra large shadow for popovers and floating elements */
  xl: createShadow('#000', 10, 0.4, 20, 12),

  /** Heavy shadow for maximum depth (e.g., bottom sheets) */
  '2xl': createShadow('#000', 14, 0.5, 28, 16),
} as const;

/**
 * Glow effect presets for highlighted states.
 * Uses colored shadows to create a glow effect.
 */
export const glows = {
  /** Green glow for success/active states */
  green: createShadow('#58CC02', 0, 0.5, 12, 0),

  /** Yellow glow for warnings/highlights */
  yellow: createShadow('#FACC15', 0, 0.5, 12, 0),

  /** Red glow for errors/danger states */
  red: createShadow('#EF4444', 0, 0.5, 12, 0),

  /** Amber glow for attention states */
  amber: createShadow('#F59E0B', 0, 0.5, 12, 0),
} as const;

/**
 * Combine shadow and glow for highlighted cards.
 * Only works on iOS - Android doesn't support colored shadows.
 */
export function combineWithGlow(
  shadow: ShadowPreset,
  glowColor: string,
  glowOpacity: number = 0.4,
  glowRadius: number = 12
): ViewStyle {
  if (Platform.OS === 'android') {
    // Android doesn't support colored shadows, just return elevation
    return { elevation: shadow.elevation };
  }

  return {
    ...shadow,
    shadowColor: glowColor,
    shadowOpacity: glowOpacity,
    shadowRadius: glowRadius,
  };
}

export type ShadowLevel = keyof typeof shadows;
export type GlowColor = keyof typeof glows;
