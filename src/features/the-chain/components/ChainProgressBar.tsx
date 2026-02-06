/**
 * ChainProgressBar - Visual progress indicator for The Chain
 *
 * Shows steps taken vs par with animated fill and color coding.
 * - Green: Under par (on track for Eagle/Birdie)
 * - Yellow: At par
 * - Orange/Red: Over par
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { Flag, Trophy } from "lucide-react-native";
import { colors, fonts, spacing, borderRadius } from "@/theme";

export interface ChainProgressBarProps {
  /** Number of steps taken (links added) */
  stepsTaken: number;
  /** Par value for this puzzle */
  par: number;
  /** Whether the chain is complete */
  isComplete: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Get progress bar color based on steps vs par.
 */
function getProgressColor(stepsTaken: number, par: number): string {
  const diff = stepsTaken - par;
  if (diff <= -2) return colors.pitchGreen; // Eagle territory
  if (diff <= 0) return colors.pitchGreen; // Birdie/Par territory
  if (diff === 1) return colors.cardYellow; // Bogey
  if (diff === 2) return colors.amber; // Double bogey
  return colors.warningOrange; // Triple bogey+
}

/**
 * Get motivational label based on progress.
 */
function getProgressLabel(
  stepsTaken: number,
  par: number,
  isComplete: boolean
): string {
  if (isComplete) {
    const diff = stepsTaken - par;
    if (diff <= -2) return "Eagle!";
    if (diff === -1) return "Birdie!";
    if (diff === 0) return "Par!";
    if (diff === 1) return "Bogey";
    if (diff === 2) return "Double Bogey";
    return "Complete";
  }

  if (stepsTaken === 0) return "Start your chain";
  const remaining = par - stepsTaken;
  if (remaining > 0) return `${remaining} to par`;
  if (remaining === 0) return "At par";
  return `${Math.abs(remaining)} over par`;
}

export function ChainProgressBar({
  stepsTaken,
  par,
  isComplete,
  testID,
}: ChainProgressBarProps) {
  const progressColor = getProgressColor(stepsTaken, par);
  const label = getProgressLabel(stepsTaken, par, isComplete);

  // Animated values
  const fillWidth = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  // Calculate fill percentage (cap at 100% for display, but allow visual overflow indication)
  const maxSteps = Math.max(par + 2, stepsTaken); // Allow 2 steps over par before capping
  const fillPercentage = Math.min((stepsTaken / maxSteps) * 100, 100);

  // Par marker position (percentage)
  const parPosition = (par / maxSteps) * 100;

  useEffect(() => {
    // Animate fill width
    fillWidth.value = withSpring(fillPercentage, {
      damping: 15,
      stiffness: 100,
    });

    // Pulse animation when step is added
    if (stepsTaken > 0) {
      pulseScale.value = withSequence(
        withTiming(1.05, { duration: 100 }),
        withSpring(1, { damping: 10 })
      );
    }

    // Glow on completion
    if (isComplete) {
      glowOpacity.value = withSpring(1, { damping: 12 });
    }
  }, [stepsTaken, fillPercentage, isComplete, fillWidth, pulseScale, glowOpacity]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%`,
    transform: [{ scaleY: pulseScale.value }],
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value * 0.5,
  }));

  return (
    <Animated.View
      style={[styles.container, animatedContainerStyle]}
      testID={testID}
    >
      {/* Header: Steps and Label */}
      <View style={styles.header}>
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsValue}>{stepsTaken}</Text>
          <Text style={styles.stepsLabel}>
            {stepsTaken === 1 ? "step" : "steps"}
          </Text>
        </View>
        <Text style={[styles.label, { color: progressColor }]}>{label}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.barContainer}>
        {/* Background track */}
        <View style={styles.barBackground}>
          {/* Animated fill */}
          <Animated.View
            style={[
              styles.barFill,
              { backgroundColor: progressColor },
              animatedFillStyle,
            ]}
          />

          {/* Par marker */}
          <View style={[styles.parMarker, { left: `${parPosition}%` }]}>
            <View style={styles.parLine} />
            <View style={styles.parBadge}>
              <Flag size={10} color={colors.floodlightWhite} />
            </View>
          </View>
        </View>

        {/* Par label below */}
        <Text style={[styles.parLabel, { left: `${parPosition}%` }]}>
          Par {par}
        </Text>
      </View>

      {/* Completion celebration */}
      {isComplete && stepsTaken <= par && (
        <View style={styles.celebrationBadge}>
          <Trophy size={14} color={colors.cardYellow} />
          <Text style={styles.celebrationText}>
            {stepsTaken < par ? "Under par!" : "Made par!"}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    shadowColor: colors.pitchGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  stepsContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  stepsValue: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
  },
  stepsLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  label: {
    fontFamily: fonts.headline,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  barContainer: {
    position: "relative",
    height: 32,
    marginBottom: spacing.sm, // Space for par label below
  },
  barBackground: {
    height: 12,
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.md,
    overflow: "visible",
    position: "relative",
  },
  barFill: {
    height: "100%",
    borderRadius: borderRadius.md,
    minWidth: 4,
  },
  parMarker: {
    position: "absolute",
    top: -4,
    transform: [{ translateX: -8 }],
    alignItems: "center",
  },
  parLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.floodlightWhite,
    borderRadius: 1,
  },
  parBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  parLabel: {
    position: "absolute",
    top: 22, // Below the flag badge
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textSecondary,
    transform: [{ translateX: -8 }], // Align with parMarker
  },
  celebrationBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    borderRadius: borderRadius.lg,
    alignSelf: "center",
  },
  celebrationText: {
    fontFamily: fonts.headline,
    fontSize: 12,
    color: colors.cardYellow,
    letterSpacing: 0.5,
  },
});
