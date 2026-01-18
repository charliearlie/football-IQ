import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Digital Pitch Design System - Typography
 *
 * Headlines: Bebas Neue - Strong, athletic, condensed
 * Body/UI: Montserrat - Clean, modern, high legibility (variable font)
 */

export const fonts = {
  headline: 'BebasNeue-Regular',
  body: 'Montserrat',
  subheading: 'Montserrat',
} as const;

export type FontFamily = (typeof fonts)[keyof typeof fonts];

/**
 * Font weight constants for Montserrat variable font.
 * Use these for consistent weight references.
 */
export const fontWeights = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;

/**
 * Pre-defined text styles for consistent typography across the app.
 * All styles use Floodlight White as the default color.
 */
export const textStyles: Record<string, TextStyle> = {
  // Large headlines (game titles, main headings)
  h1: {
    fontFamily: fonts.headline,
    fontSize: 32,
    lineHeight: 40,
    color: colors.floodlightWhite,
    letterSpacing: 1,
  },

  // Section headers
  h2: {
    fontFamily: fonts.headline,
    fontSize: 24,
    lineHeight: 32,
    color: colors.floodlightWhite,
    letterSpacing: 0.5,
  },

  // Small headers
  h3: {
    fontFamily: fonts.headline,
    fontSize: 20,
    lineHeight: 28,
    color: colors.floodlightWhite,
  },

  // Emphasized text, labels
  subtitle: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.floodlightWhite,
  },

  // Primary body text
  body: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.floodlightWhite,
  },

  // Secondary body text
  bodySmall: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  // Captions, labels, hints
  caption: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },

  // Button text - Bebas Neue for athletic/sporty feel
  button: {
    fontFamily: fonts.headline,
    fontSize: 18,
    lineHeight: 20,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Large button text
  buttonLarge: {
    fontFamily: fonts.headline,
    fontSize: 18,
    lineHeight: 24,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Small button text
  buttonSmall: {
    fontFamily: fonts.headline,
    fontSize: 14,
    lineHeight: 16,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
} as const;
