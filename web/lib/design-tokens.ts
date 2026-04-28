/**
 * Football IQ design tokens — single source of truth for the modern uplift.
 *
 * Mirrors the values added to tailwind.config.ts so they can be referenced
 * imperatively (style attribute, framer variants, canvas/og rendering).
 *
 * Principles encoded here (see /plans/i-want-to-start-abstract-kurzweil.md):
 *   - One Bebas headline per viewport (display + h1 only)
 *   - Sections snap to the 96px rhythm via spacing.section
 *   - Pitch Green is a verb (CTAs and active states only)
 *   - Glass surfaces are reserved (hero stat strip + modals)
 */

export const colors = {
  navy: {
    950: "#05050A",
    900: "#0E121A",
    800: "#161B26",
    700: "#1F2632",
  },
  pitchGreen: "#2EFC5D",
  grassShadow: "#1A9E38",
  floodlight: "#FFFFFF",
  cardYellow: "#FACC15",
  redCard: "#EF4444",
  warningOrange: "#FF4D00",
  amber: "#F59E0B",
  coral: "#FF6B6B",
  teal: "#4ECDC4",
  purplePop: "#9B59B6",
  skyBlue: "#3B82F6",
} as const;

export const spacing = {
  // Section vertical rhythm — 96px desktop, 64px mobile
  section: { mobile: "py-16", desktop: "md:py-24 lg:py-32" },
  // Card padding
  card: "p-6 md:p-8",
  // Stack gaps
  stack: { tight: "gap-4", default: "gap-8", loose: "gap-12" },
  // Container width — one container per page
  container: "max-w-6xl mx-auto px-4 md:px-6",
  // Narrow content inside container
  prose: "max-w-3xl mx-auto",
} as const;

export const typography = {
  display: "font-bebas text-6xl md:text-8xl tracking-tight leading-[0.95]",
  h1: "font-bebas text-4xl md:text-6xl tracking-tight leading-tight",
  h2: "font-sans text-3xl md:text-5xl font-bold tracking-tight",
  h3: "font-sans text-xl md:text-2xl font-semibold",
  body: "font-sans text-base md:text-lg leading-relaxed",
  caption: "font-sans text-sm font-medium",
  mono: "font-mono text-sm font-medium tracking-tight",
} as const;

export const radii = {
  sm: "rounded-md", // 8px — inputs
  md: "rounded-lg", // 12px — buttons
  lg: "rounded-xl", // 16px — cards
  xl: "rounded-2xl", // 20px — hero modules, modals
  full: "rounded-full",
} as const;

export const shadows = {
  card: "shadow-card",
  elevated: "shadow-elevated",
  glowGreen: "shadow-glow-green",
} as const;

export const motion = {
  duration: {
    press: "duration-150",
    hover: "duration-200",
    enter: "duration-300",
    section: "duration-500",
  },
  ease: {
    out: "ease-out",
    in: "ease-in",
    spring: "[transition-timing-function:cubic-bezier(0.32,0.72,0,1)]",
  },
  press: "active:scale-[0.97] transition-transform duration-150",
  hoverLift: "transition-all duration-200 hover:-translate-y-0.5",
} as const;

export const breakpoints = {
  mobile: 390,
  tablet: 768,
  desktop: 1280,
} as const;

/** Game-mode accent palette — mirrors WEB_PLAYABLE_GAMES + APP_ONLY_GAMES */
export const accentColors = {
  "career-path": colors.pitchGreen,
  "transfer-guess": colors.cardYellow,
  connections: colors.skyBlue,
  "topical-quiz": colors.coral,
  timeline: colors.amber,
  "higher-lower": colors.teal,
  "starting-xi": colors.pitchGreen,
  "who-am-i": colors.purplePop,
  "the-grid": colors.amber,
  "the-chain": colors.skyBlue,
  threads: colors.coral,
  "goalscorer-recall": colors.warningOrange,
  "top-tens": colors.cardYellow,
  "whos-that": colors.teal,
} as const;
