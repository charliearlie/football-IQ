import { Dimensions } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

/**
 * Device size categories based on screen height.
 * - small: iPhone SE, iPhone 8 (< 700pt)
 * - default: iPhone 14, 15 (700-900pt)
 * - large: iPhone Pro Max, Plus models (> 900pt)
 */
export type DeviceSize = 'small' | 'default' | 'large';

export const getDeviceSize = (): DeviceSize => {
  if (screenHeight < 700) return 'small';
  if (screenHeight > 900) return 'large';
  return 'default';
};

/**
 * Timeline layout constants - responsive to device size.
 */
const TIMELINE_CONFIG = {
  small: {
    stepHeight: 52,
    nodeSize: 8,
    axisWidth: 32,
    yearWidth: 64,
    stepGap: 4,
    lineWidth: 2,
    clubFontSize: 14,
    yearFontSize: 16,
  },
  default: {
    stepHeight: 60,
    nodeSize: 10,
    axisWidth: 40,
    yearWidth: 80,
    stepGap: 8,
    lineWidth: 2,
    clubFontSize: 16,
    yearFontSize: 18,
  },
  large: {
    stepHeight: 64,
    nodeSize: 12,
    axisWidth: 44,
    yearWidth: 88,
    stepGap: 10,
    lineWidth: 2,
    clubFontSize: 17,
    yearFontSize: 20,
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
 * Animation configuration for timeline.
 */
export const TIMELINE_ANIMATIONS = {
  /** Line drawing duration in ms */
  lineDrawDuration: 300,
  /** Node pulse cycle duration in ms (full loop) */
  pulseDuration: 1600,
  /** Node pulse scale factor */
  pulseScale: 1.3,
  /** Club info slide-in delay after line draw */
  slideInDelay: 200,
  /** Club info slide-in spring config */
  slideInSpring: {
    damping: 15,
    stiffness: 120,
  },
  /** Victory reveal stagger delay between steps */
  victoryStaggerDelay: 200,
  /** Error flash duration in ms */
  errorFlashDuration: 300,
} as const;

/**
 * Screen layout constants.
 */
export const LAYOUT = {
  /** Header height */
  headerHeight: 56,
  /** ActionZone base height (without safe area) */
  actionZoneHeight: 120,
  /** Screen padding */
  screenPadding: 16,
} as const;
