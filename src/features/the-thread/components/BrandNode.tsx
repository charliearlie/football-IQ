import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withSequence,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { colors, spacing, fonts, fontWeights } from "@/theme";
import { getTimelineConfig, getThreadTheme, TIMELINE_ANIMATIONS } from "../constants/timeline";
import type { ThreadBrand, ThreadType, ThreadGameStatus } from "../types/theThread.types";

const config = getTimelineConfig();

export interface BrandNodeProps {
  /** The brand data */
  brand: ThreadBrand;
  /** Index in the list (for stagger animations) */
  index: number;
  /** Thread type determines theme color */
  threadType: ThreadType;
  /** Current game status */
  gameStatus: ThreadGameStatus;
  /** Whether this brand is visible (false = hidden hint) */
  visible?: boolean;
  /** Test ID prefix */
  testID?: string;
}

/**
 * BrandNode - A single brand entry in the LaundryLine timeline.
 *
 * Layout: [Node 40px] [Years 90px] [Brand Name flex:1]
 *
 * When `visible` is false, brand name and years are masked with "???".
 * On game end (won/revealed), nodes animate with a glow cascade.
 */
export function BrandNode({
  brand,
  index,
  threadType,
  gameStatus,
  visible = true,
  testID,
}: BrandNodeProps) {
  const theme = getThreadTheme(threadType);
  const isGameOver = gameStatus === "won" || gameStatus === "revealed";

  // Animation shared values for reveal glow
  const glowProgress = useSharedValue(0);
  const nodeScale = useSharedValue(1);

  // Trigger glow cascade on game end
  useEffect(() => {
    if (isGameOver) {
      const delay = index * TIMELINE_ANIMATIONS.nodeStaggerDelay;

      // Glow in
      glowProgress.value = withDelay(
        delay,
        withSpring(1, TIMELINE_ANIMATIONS.nodeGlowSpring)
      );

      // Node bounce
      nodeScale.value = withDelay(
        delay,
        withSequence(
          withSpring(TIMELINE_ANIMATIONS.nodeBounceScale, TIMELINE_ANIMATIONS.nodeScaleSpring),
          withSpring(1, { damping: 15, stiffness: 150 })
        )
      );
    } else {
      // Reset for replay
      glowProgress.value = 0;
      nodeScale.value = 1;
    }
  }, [isGameOver, index, glowProgress, nodeScale]);

  const nodeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nodeScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => {
    if (!isGameOver) return {};
    return {
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
        [0, 12],
        Extrapolation.CLAMP
      ),
      shadowOffset: { width: 0, height: 0 },
    };
  });

  return (
    <View style={styles.container} testID={testID}>
      {/* Axis Column - Node */}
      <View style={styles.axisContainer}>
        <Animated.View
          style={[
            styles.node,
            { backgroundColor: visible ? theme.color : colors.glassBorder },
            nodeStyle,
            glowStyle,
          ]}
        />
      </View>

      {/* Years Column */}
      <View style={styles.yearsContainer}>
        <Text style={[styles.yearsText, !visible && styles.hiddenText]}>
          {visible ? brand.years : "????-????"}
        </Text>
      </View>

      {/* Brand Name Column */}
      <View style={styles.brandContainer}>
        <Text
          style={[styles.brandText, !visible && styles.hiddenText]}
          numberOfLines={1}
        >
          {visible ? brand.brand_name : "???"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: config.nodeHeight,
    flexDirection: "row",
    alignItems: "center",
  },
  axisContainer: {
    width: config.axisWidth,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  node: {
    width: config.nodeSize,
    height: config.nodeSize,
    borderRadius: config.nodeSize / 2,
    zIndex: 1,
  },
  yearsContainer: {
    width: config.yearsWidth,
    justifyContent: "center",
  },
  yearsText: {
    fontFamily: fonts.headline,
    fontSize: config.yearsFontSize,
    color: colors.floodlightWhite,
    letterSpacing: 0.5,
  },
  brandContainer: {
    flex: 1,
    justifyContent: "center",
    paddingRight: spacing.sm,
  },
  brandText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: config.brandFontSize,
    color: colors.floodlightWhite,
  },
  hiddenText: {
    color: colors.textSecondary,
    fontStyle: "italic",
  },
});
