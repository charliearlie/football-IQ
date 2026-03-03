
/**
 * Design System V2 - Home Screen Tokens
 * AAA Sports Game aesthetic
 */

import { fonts } from './typography';

export const HOME_COLORS = {
  // Primary — Neon Green
  pitchGreen: "#2EFC5D",
  grassShadow: "#1A9E38",
  neonGreenGlow: "rgba(46, 252, 93, 0.3)",

  // Backgrounds — Pitch Black
  stadiumNavy: "#05050A",
  deepNight: "#020205",

  // Card/Surface — elevated dark
  surface: "#111116",
  surfaceShadow: "rgba(0, 0, 0, 0.6)",

  // Accents
  cardYellow: "#FACC15",
  cardYellowShadow: "#CA8A04",
  goldPrimary: "#FFD700",
  goldShadow: "#B8960F",
  accentBlue: "#00E5FF",

  // Functional
  redCard: "#EF4444",
  dangerRed: "#FF3366",

  // Borders (glass effect)
  border: "rgba(255, 255, 255, 0.08)",

  // Glass
  glassBg: "rgba(255, 255, 255, 0.03)",
  glassBorder: "rgba(255, 255, 255, 0.08)",

  // Text
  textMain: "#FFFFFF",
  textSecondary: "#A0ABC0",
};

/** @deprecated Use solid HOME_COLORS.surface instead of gradients */
export const HOME_GRADIENTS = {
  primary: ["#2EFC5D", "#1A9E38"],
  bonus: ["rgba(255,255,255,0.03)", "rgba(46, 252, 93, 0.05)"],
  event: ["rgba(178, 0, 255, 0.2)", "rgba(14, 18, 26, 0.8)"],
};

export const HOME_DIMENSIONS = {
  ringSize: 140,
  ringStroke: 12,
  buttonHeight: 44,
  buttonRadius: 12,     // Inner element radius
  cardRadius: 20,       // Main layout card radius
};

export const HOME_FONTS = {
  heading: fonts.headline,    // Bebas Neue (page headers, game titles, scores)
  body: fonts.body,           // Outfit (buttons, labels, descriptions)
  stats: fonts.stats,         // Space Grotesk (numbers, timers, counters)
};
