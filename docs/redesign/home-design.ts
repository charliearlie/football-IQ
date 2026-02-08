
/**
 * Design Tokens specifically for the Home Redesign 2.0
 * Derived from the "Pitch Perfect" HTML Prototype
 */

export const HOME_COLORS = {
  // Primary
  pitchGreen: "#58CC02",
  grassShadow: "#46A302", // For 3D button depth
  
  // Backgrounds
  stadiumNavy: "#0F172A",
  deepNight: "#020617",
  
  // Accents
  cardYellow: "#FACC15",
  cardYellowShadow: "#CDA412", // Manually calculated dark shade for 3D yellow
  
  // Functional
  redCard: "#EF4444",
  
  // Glassmorphism
  glassBg: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.1)",
  
  // Text
  textMain: "#F8FAFC",
  textSecondary: "rgba(248, 250, 252, 0.7)",
};

export const HOME_GRADIENTS = {
  // Use with react-native-linear-gradient or equivalent wrapper
  primary: ["#58CC02", "#16a34a"], // Green to Dark Green
  bonus: ["rgba(255,255,255,0.05)", "rgba(88, 204, 2, 0.05)"], // Subtle green tint
  event: ["#1e293b", "#172554"], // Slate to Blue
};

export const HOME_DIMENSIONS = {
  ringSize: 140,
  ringStroke: 12,
  buttonHeight: 44, // Square-ish look for play buttons
  buttonRadius: 12,
  cardRadius: 12,
};

export const HOME_FONTS = {
  heading: "BebasNeue-Regular",
  body: "Montserrat-VariableFont_wght",
};

// Helper for NativeWind/Tailwind config extension if needed
export const tailwindExtension = {
  colors: {
    "pitch-green": HOME_COLORS.pitchGreen,
    "grass-shadow": HOME_COLORS.grassShadow,
    "stadium-navy": HOME_COLORS.stadiumNavy,
    "card-yellow": HOME_COLORS.cardYellow,
    "glass-bg": HOME_COLORS.glassBg,
  },
  boxShadow: {
    "3d-green": `0px 4px 0px ${HOME_COLORS.grassShadow}`,
    "3d-yellow": `0px 4px 0px ${HOME_COLORS.cardYellowShadow}`,
  }
};