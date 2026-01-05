import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import { ViewStyle } from 'react-native';

/**
 * Theme-consistent colors for skeleton shimmer effect.
 * Matches Digital Pitch glass card colors.
 */
const SKELETON_COLORS = {
  dark: [
    'rgba(255, 255, 255, 0.05)', // glassBackground
    'rgba(255, 255, 255, 0.12)', // slightly brighter for shimmer
    'rgba(255, 255, 255, 0.05)', // back to glassBackground
  ] as string[],
};

export interface SkeletonBoxProps {
  /** Width of the skeleton element */
  width: number | string;
  /** Height of the skeleton element */
  height: number;
  /** Border radius (default: 8) */
  radius?: number;
  /** Make it a circle (ignores radius) */
  circle?: boolean;
  /** Additional styles */
  style?: ViewStyle;
}

/**
 * SkeletonBox - A single skeleton placeholder element.
 *
 * Uses moti/skeleton with theme-consistent colors for shimmer effect.
 */
export function SkeletonBox({
  width,
  height,
  radius = 8,
  circle = false,
  style,
}: SkeletonBoxProps) {
  return (
    <MotiView style={style}>
      <Skeleton
        colorMode="dark"
        colors={SKELETON_COLORS.dark}
        width={typeof width === 'number' ? width : '100%'}
        height={height}
        radius={circle ? 'round' : radius}
      />
    </MotiView>
  );
}

export interface SkeletonGroupProps {
  /** Whether to show skeletons (true) or hide them (false) */
  show: boolean;
  /** Children to render */
  children: React.ReactNode;
}

/**
 * SkeletonGroup - Wrapper for transitioning between skeleton and content.
 *
 * When `show` is true, renders children (skeletons).
 * When `show` is false, hides children (actual content should be rendered separately).
 */
export function SkeletonGroup({ show, children }: SkeletonGroupProps) {
  if (!show) {
    return null;
  }

  return <MotiView>{children}</MotiView>;
}

export { SKELETON_COLORS };
