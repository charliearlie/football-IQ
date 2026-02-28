import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Premium Sports Game Design System - Typography
 *
 * Headlines: Bebas Neue - Strong, athletic, condensed
 *   Used ONLY for: page headers, game mode titles, large scores
 * Body/UI: Inter - Clean, modern, high legibility (variable font)
 *   Used for: buttons, sub-headings, descriptions, stats, nav
 */

export const fonts = {
  headline: 'BebasNeue-Regular',
  body: 'Inter',
  subheading: 'Inter',
} as const;

export type FontFamily = (typeof fonts)[keyof typeof fonts];

/**
 * Font weight constants for Inter variable font.
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
 * All styles use Floodlight White as the default color.
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

  // Emphasized text, labels — Inter Bold
  subtitle: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.floodlightWhite,
  },

  // Primary body text — Inter Regular
  body: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.floodlightWhite,
  },

  // Secondary body text — Inter Regular
  bodySmall: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  // Captions, labels, hints — Inter Regular
  caption: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },

  // Button text — Inter ExtraBold (replaces Bebas Neue)
  button: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.extraBold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Large button text — Inter ExtraBold
  buttonLarge: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.extraBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Small button text — Inter Bold
  buttonSmall: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.bold,
    fontSize: 14,
    lineHeight: 16,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },

  // Tiny button text (for compact cards) — Inter Bold
  buttonTiny: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.bold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
} as const;
