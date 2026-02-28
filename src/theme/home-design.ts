
/**
 * Design Tokens specifically for the Home Screen
 * Premium Sports Game aesthetic
 */

import { fonts } from './typography';
import { colors } from './colors';

export const HOME_COLORS = {
  // Primary
  pitchGreen: "#58CC02",
  grassShadow: "#46A302",

  // Backgrounds
  stadiumNavy: "#0F172A",
  deepNight: "#020617",

  // Card/Surface (solid, replaces glassmorphism)
  surface: "#1E293B",
  surfaceShadow: "rgba(0, 0, 0, 0.4)",

  // Accents
  cardYellow: "#FACC15",
  cardYellowShadow: "#CA8A04",

  // Functional
  redCard: "#EF4444",

  // Borders (subtle)
  border: "rgba(255, 255, 255, 0.08)",

  // Legacy glass aliases (for backward compat)
  glassBg: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.08)",

  // Text
  textMain: "#F8FAFC",
  textSecondary: "#94A3B8",
};

/** @deprecated Use solid HOME_COLORS.surface instead of gradients */
export const HOME_GRADIENTS = {
  primary: ["#58CC02", "#16a34a"],
  bonus: ["rgba(255,255,255,0.05)", "rgba(88, 204, 2, 0.05)"],
  event: ["#1e293b", "#172554"],
};

export const HOME_DIMENSIONS = {
  ringSize: 140,
  ringStroke: 12,
  buttonHeight: 44,
  buttonRadius: 12,     // Inner element radius
  cardRadius: 20,       // Main layout card radius
};

export const HOME_FONTS = {
  heading: fonts.headline,  // Bebas Neue (page headers, game titles, scores)
  body: fonts.body,         // Inter (buttons, labels, descriptions, stats)
};

// Helper for NativeWind/Tailwind config extension if needed
export const tailwindExtension = {
  colors: {
    "pitch-green": HOME_COLORS.pitchGreen,
    "grass-shadow": HOME_COLORS.grassShadow,
    "stadium-navy": HOME_COLORS.stadiumNavy,
    "card-yellow": HOME_COLORS.cardYellow,
    "surface": HOME_COLORS.surface,
  },
  boxShadow: {
    "3d-green": `0px 4px 0px ${HOME_COLORS.grassShadow}`,
    "3d-yellow": `0px 4px 0px ${HOME_COLORS.cardYellowShadow}`,
    "3d-dark": `0px 4px 0px ${HOME_COLORS.surfaceShadow}`,
  }
};
