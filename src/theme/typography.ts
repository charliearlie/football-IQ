import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Design System V2 - Typography
 *
 * Headlines: Bebas Neue - Strong, athletic, condensed
 *   Used ONLY for: page headers, game mode titles, large scores, player names in grids
 * Body/UI: Outfit - Modern, geometric, clean
 *   Used for: buttons, sub-headings, descriptions, tags, navigation
 * Stats: Space Grotesk - Monospaced feel for data
 *   Used for: timers, step counters, stat numbers, scores
 */

export const fonts = {
  headline: 'BebasNeue-Regular',
  body: 'Outfit-Regular',
  bodyMedium: 'Outfit-Medium',
  bodySemiBold: 'Outfit-SemiBold',
  bodyBold: 'Outfit-Bold',
  bodyExtraBold: 'Outfit-ExtraBold',
  subheading: 'Outfit-SemiBold',
  stats: 'SpaceGrotesk-Bold',
} as const;

export type FontFamily = (typeof fonts)[keyof typeof fonts];

/**
 * Font weight constants for Outfit.
 * Use heavy weights (600, 700, 800) to establish visual hierarchy.
 */
export const fontWeights = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
} as const;

/**
 * Pre-defined text styles for consistent typography across the app.
 * All styles use Pure White as the default color.
 */
export const textStyles: Record<string, TextStyle> = {
  // Large headlines (game titles, main headings) — Bebas Neue
  h1: {
    fontFamily: fonts.headline,
    fontSize: 32,
    lineHeight: 40,
    color: colors.floodlightWhite,
    letterSpacing: 1,
  },

  // Section headers — Bebas Neue
  h2: {
    fontFamily: fonts.headline,
    fontSize: 24,
    lineHeight: 32,
    color: colors.floodlightWhite,
    letterSpacing: 0.5,
  },

  // Small headers — Bebas Neue
  h3: {
    fontFamily: fonts.headline,
    fontSize: 20,
    lineHeight: 28,
    color: colors.floodlightWhite,
  },

  // Emphasized text, labels — Outfit Bold
  subtitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.floodlightWhite,
  },

  // Primary body text — Outfit Regular
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.floodlightWhite,
  },

  // Secondary body text — Outfit Regular
  bodySmall: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  // Captions, labels, hints — Outfit Regular
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },

  // Button text — Outfit ExtraBold
  button: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Large button text — Outfit ExtraBold
  buttonLarge: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Small button text — Outfit Bold
  buttonSmall: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    lineHeight: 16,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },

  // Tiny button text (for compact cards) — Outfit Bold
  buttonTiny: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },

  // Stats/Numbers — Space Grotesk Bold
  stat: {
    fontFamily: fonts.stats,
    fontSize: 14,
    lineHeight: 18,
    color: colors.floodlightWhite,
  },

  // Timer display — Space Grotesk Bold
  timer: {
    fontFamily: fonts.stats,
    fontSize: 13,
    lineHeight: 18,
    color: colors.pitchGreen,
  },

  // Step counter — Space Grotesk Bold
  stepCounter: {
    fontFamily: fonts.stats,
    fontSize: 16,
    lineHeight: 20,
    color: colors.floodlightWhite,
  },
} as const;
