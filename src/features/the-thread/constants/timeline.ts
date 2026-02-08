import { Dimensions } from "react-native";
import { colors } from "@/theme";
import type { ThreadType } from "../types/theThread.types";

const { height: screenHeight } = Dimensions.get("window");

/**
 * Device size categories based on screen height.
 * - small: iPhone SE, iPhone 8 (< 700pt)
 * - default: iPhone 14, 15 (700-900pt)
 * - large: iPhone Pro Max, Plus models (> 900pt)
 */
export type DeviceSize = "small" | "default" | "large";

export const getDeviceSize = (): DeviceSize => {
  if (screenHeight < 700) return "small";
  if (screenHeight > 900) return "large";
  return "default";
};

/**
 * Timeline layout constants - responsive to device size.
 */
const TIMELINE_CONFIG = {
  small: {
    nodeHeight: 56,
    nodeSize: 10,
    axisWidth: 36,
    yearsWidth: 80,
    nodeGap: 6,
    lineWidth: 2,
    dashLength: 6,
    dashGap: 4,
    brandFontSize: 14,
    yearsFontSize: 16,
  },
  default: {
    nodeHeight: 64,
    nodeSize: 12,
    axisWidth: 40,
    yearsWidth: 90,
    nodeGap: 8,
    lineWidth: 2,
    dashLength: 8,
    dashGap: 5,
    brandFontSize: 16,
    yearsFontSize: 18,
  },
  large: {
    nodeHeight: 70,
    nodeSize: 14,
    axisWidth: 44,
    yearsWidth: 100,
    nodeGap: 10,
    lineWidth: 2,
    dashLength: 10,
    dashGap: 6,
    brandFontSize: 17,
    yearsFontSize: 20,
  },
} as const;

/**
 * Get timeline configuration for current device.
 */
export const getTimelineConfig = () => {
  const deviceSize = getDeviceSize();
  return TIMELINE_CONFIG[deviceSize];
};

/**
 * Static timeline config for default device (used for type inference).
 */
export type TimelineConfig = typeof TIMELINE_CONFIG.default;

/**
 * Theme configuration for thread types.
 * - sponsor: Card Yellow (#FACC15) - 🤝
 * - supplier: Pitch Green (#58CC02) - 🧵
 */
export const THREAD_THEME = {
  sponsor: {
    color: colors.cardYellow,
    shadowColor: "#B8960F",
    emoji: "🤝",
    label: "Kit Sponsors",
  },
  supplier: {
    color: colors.pitchGreen,
    shadowColor: colors.grassShadow,
    emoji: "🧵",
    label: "Kit Suppliers",
  },
} as const;

/**
 * Get theme configuration for a thread type.
 */
export const getThreadTheme = (threadType: ThreadType) => {
  return THREAD_THEME[threadType];
};

/**
 * Animation configuration for timeline.
 */
export const TIMELINE_ANIMATIONS = {
  /** Duration for dashed line to become solid */
  lineSolidifyDuration: 600,
  /** Delay before glow effect starts */
  glowDelay: 400,
  /** Glow effect duration */
  glowDuration: 300,
  /** Glow opacity when active */
  glowOpacity: 0.6,
  /** Stagger delay between node animations on reveal */
  nodeStaggerDelay: 100,
  /** Node glow spring config */
  nodeGlowSpring: {
    damping: 12,
    stiffness: 150,
  },
  /** Node scale bounce on reveal */
  nodeScaleSpring: {
    damping: 10,
    stiffness: 120,
  },
  /** Maximum scale for node bounce */
  nodeBounceScale: 1.2,
} as const;

/**
 * Screen layout constants.
 */
export const LAYOUT = {
  /** Header height */
  headerHeight: 56,
  /** ActionZone base height (without safe area) */
  actionZoneHeight: 140,
  /** Screen padding */
  screenPadding: 16,
  /** Header section height (emoji + label) */
  headerSectionHeight: 80,
  /** Guess history row height */
  guessHistoryHeight: 52,
} as const;
