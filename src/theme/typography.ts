import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Digital Pitch Design System - Typography
 *
 * Headlines: Bebas Neue - Strong, athletic, condensed
 * Body: Inter - Clean, modern, high legibility
 */

export const fonts = {
  headline: 'BebasNeue-Regular',
  subheading: 'Inter-Bold',
  body: 'Inter-Regular',
} as const;

export type FontFamily = (typeof fonts)[keyof typeof fonts];

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
    fontFamily: fonts.subheading,
    fontSize: 18,
    lineHeight: 24,
    color: colors.floodlightWhite,
  },

  // Primary body text
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.floodlightWhite,
  },

  // Secondary body text
  bodySmall: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  // Captions, labels, hints
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },

  // Button text
  button: {
    fontFamily: fonts.subheading,
    fontSize: 16,
    lineHeight: 20,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Large button text
  buttonLarge: {
    fontFamily: fonts.subheading,
    fontSize: 18,
    lineHeight: 24,
    color: colors.stadiumNavy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
} as const;
