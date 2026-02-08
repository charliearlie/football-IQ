import { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { getTimelineConfig, getThreadTheme, TIMELINE_ANIMATIONS, LAYOUT } from "../constants/timeline";
import type { ThreadType, ThreadGameStatus } from "../types/theThread.types";

const config = getTimelineConfig();

export interface ThreadAxisProps {
  /** Total number of brand nodes */
  nodeCount: number;
  /** Thread type determines theme color */
  threadType: ThreadType;
  /** Current game status */
  gameStatus: ThreadGameStatus;
  /** Test ID */
  testID?: string;
}

/**
 * ThreadAxis - The vertical dashed line connecting brand nodes.
 *
 * - Playing: Dashed line at 40% opacity
 * - Won/Revealed: Solid line with glow effect
 *
 * Uses View-based dash segments for simplicity.
 */
export function ThreadAxis({
  nodeCount,
  threadType,
  gameStatus,
  testID,
}: ThreadAxisProps) {
  const theme = getThreadTheme(threadType);
  const isGameOver = gameStatus === "won" || gameStatus === "revealed";

  // Calculate total height based on node count
  // Height = (nodeCount * nodeHeight) + headerSectionHeight
  const totalHeight = useMemo(() => {
    return (nodeCount * config.nodeHeight) + LAYOUT.headerSectionHeight;
  }, [nodeCount]);

  // Generate dash segments
  const dashSegments = useMemo(() => {
    const segments: { top: number; isDash: boolean }[] = [];
    let currentY = LAYOUT.headerSectionHeight; // Start below header

    while (currentY < totalHeight) {
      // Dash segment
      segments.push({ top: currentY, isDash: true });
      currentY += config.dashLength;

      // Gap segment (skip)
      currentY += config.dashGap;
    }

    return segments;
  }, [totalHeight]);

  // Animation for dashed to solid transition
  const solidProgress = useSharedValue(0);
  const glowProgress = useSharedValue(0);

  useEffect(() => {
    if (isGameOver) {
      // Animate to solid
      solidProgress.value = withTiming(1, {
        duration: TIMELINE_ANIMATIONS.lineSolidifyDuration,
      });
      // Delayed glow
      glowProgress.value = withDelay(
        TIMELINE_ANIMATIONS.glowDelay,
        withTiming(1, { duration: TIMELINE_ANIMATIONS.glowDuration })
      );
    } else {
      // Reset
      solidProgress.value = 0;
      glowProgress.value = 0;
    }
  }, [isGameOver, solidProgress, glowProgress]);

  // Animated style for the solid line
  const solidLineStyle = useAnimatedStyle(() => ({
    opacity: solidProgress.value,
  }));

  // Animated style for the dashed segments
  const dashedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      solidProgress.value,
      [0, 1],
      [0.4, 0],
      Extrapolation.CLAMP
    ),
  }));

  // Animated style for glow
  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: theme.color,
    shadowOpacity: interpolate(
      glowProgress.value,
      [0, 1],
      [0, TIMELINE_ANIMATIONS.glowOpacity],
      Extrapolation.CLAMP
    ),
    shadowRadius: interpolate(
      glowProgress.value,
      [0, 1],
      [0, 8],
      Extrapolation.CLAMP
    ),
    shadowOffset: { width: 0, height: 0 },
  }));

  if (nodeCount === 0) return null;

  return (
    <View
      style={[styles.container, { height: totalHeight }]}
      pointerEvents="none"
      testID={testID}
    >
      {/* Dashed line (fades out on reveal) */}
      <Animated.View style={[styles.dashContainer, dashedStyle]}>
        {dashSegments.map((segment, index) => (
          <View
            key={index}
            style={[
              styles.dash,
              {
                top: segment.top,
                backgroundColor: theme.color,
                height: config.dashLength,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Solid line (fades in on reveal) */}
      <Animated.View
        style={[
          styles.solidLine,
          {
            top: LAYOUT.headerSectionHeight,
            height: totalHeight - LAYOUT.headerSectionHeight,
            backgroundColor: theme.color,
          },
          solidLineStyle,
          glowStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    top: 0,
    width: config.axisWidth,
    zIndex: 0,
  },
  dashContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  dash: {
    position: "absolute",
    left: config.axisWidth / 2 - config.lineWidth / 2,
    width: config.lineWidth,
    borderRadius: config.lineWidth / 2,
  },
  solidLine: {
    position: "absolute",
    left: config.axisWidth / 2 - config.lineWidth / 2,
    width: config.lineWidth,
    borderRadius: config.lineWidth / 2,
  },
});
