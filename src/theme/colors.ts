/**
 * Digital Pitch Design System - Color Palette
 *
 * These colors define the visual identity of Football IQ.
 * Stadium Navy provides the high-contrast dark background,
 * while Pitch Green delivers the vibrant, action-oriented feel.
 */

export const colors = {
  // Primary action color
  pitchGreen: '#58CC02',

  // Shadow/depth for 3D button effects
  grassShadow: '#46A302',

  // Main background color
  stadiumNavy: '#0F172A',

  // Primary text color
  floodlightWhite: '#F8FAFC',

  // Highlights, alerts, career path clues
  cardYellow: '#FACC15',

  // Errors, incorrect guesses
  redCard: '#EF4444',

  // Glass card effects
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',

  // Semantic aliases
  primary: '#58CC02',
  primaryShadow: '#46A302',
  background: '#0F172A',
  text: '#F8FAFC',
  textSecondary: 'rgba(248, 250, 252, 0.7)',
  warning: '#FACC15',
  error: '#EF4444',
  success: '#58CC02',
} as const;

export type ColorName = keyof typeof colors;
