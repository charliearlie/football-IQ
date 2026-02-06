/**
 * ChainLinkRow - Enhanced connection display between linked players
 *
 * Shows the shared club and year overlap between two players in the chain.
 * Gamified styling with checkmarks, glowing connectors, and animations.
 */

import React, { memo, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolateColor,
  FadeIn,
  SlideInLeft,
} from "react-native-reanimated";
import { Check, Link } from "lucide-react-native";
import { FlagIcon } from "@/components/FlagIcon/FlagIcon";
import { colors, fonts, spacing, borderRadius } from "@/theme";
import { ChainLink } from "../types/theChain.types";

export interface ChainLinkRowProps {
  /** Link data including player and shared club info */
  link: ChainLink;
  /** Step number (1-indexed) */
  stepNumber: number;
  /** Whether this is the most recently added link */
  isLatest?: boolean;
  /** Whether the chain is complete (all links confirmed) */
  isComplete?: boolean;
  /** Test ID for testing */
  testID?: string;
}

function ChainLinkRowComponent({
  link,
  stepNumber,
  isLatest = false,
  isComplete = false,
  testID,
}: ChainLinkRowProps) {
  const overlapYears = link.overlap_end - link.overlap_start + 1;
  const yearRange =
    link.overlap_start === link.overlap_end
      ? `${link.overlap_start}`
      : `${link.overlap_start}-${link.overlap_end}`;
  const yearDisplay =
    overlapYears === 1
      ? yearRange
      : `${yearRange} (${overlapYears}yr${overlapYears > 1 ? "s" : ""})`;

  // Animation values
  const badgeScale = useSharedValue(1);
  const badgeGlow = useSharedValue(0);
  const connectorGlow = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    contentOpacity.value = withDelay(
      stepNumber * 50, // Stagger based on step
      withTiming(1, { duration: 300 })
    );

    if (isLatest && !isComplete) {
      // Pulse animation for latest
      badgeScale.value = withSequence(
        withTiming(1.15, { duration: 200, easing: Easing.out(Easing.back(2)) }),
        withSpring(1.05, { damping: 8 })
      );
      badgeGlow.value = withSpring(0.6, { damping: 10 });
      connectorGlow.value = withSpring(0.8, { damping: 12 });
    } else if (isComplete) {
      // Settled state for completed chain
      badgeScale.value = withSpring(1, { damping: 15 });
      badgeGlow.value = withTiming(0.3, { duration: 500 });
      connectorGlow.value = withTiming(0.4, { duration: 500 });
    } else {
      // Normal confirmed state
      badgeScale.value = 1;
      badgeGlow.value = 0.2;
      connectorGlow.value = 0.2;
    }
  }, [isLatest, isComplete, stepNumber, badgeScale, badgeGlow, connectorGlow, contentOpacity]);

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    shadowOpacity: badgeGlow.value,
  }));

  const animatedConnectorStyle = useAnimatedStyle(() => ({
    shadowOpacity: connectorGlow.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View style={styles.container} testID={testID}>
      {/* Left side: Connector line and step badge */}
      <View style={styles.connectorColumn}>
        {/* Top connector line */}
        <Animated.View
          style={[styles.connectorLine, animatedConnectorStyle]}
        />

        {/* Step badge with checkmark */}
        <Animated.View
          style={[
            styles.stepBadge,
            isLatest && !isComplete && styles.stepBadgeLatest,
            animatedBadgeStyle,
          ]}
        >
          <Check
            size={14}
            color={colors.stadiumNavy}
            strokeWidth={3}
          />
        </Animated.View>

        {/* Bottom connector line */}
        <Animated.View
          style={[styles.connectorLine, animatedConnectorStyle]}
        />
      </View>

      {/* Right side: Link details */}
      <Animated.View style={[styles.detailsColumn, animatedContentStyle]}>
        {/* Club connection card */}
        <View style={styles.clubCard}>
          {/* Club name row */}
          <View style={styles.clubRow}>
            <Link size={12} color={colors.pitchGreen} />
            <Text style={styles.clubName} numberOfLines={1}>
              {link.shared_club_name}
            </Text>
            <View style={styles.yearBadge}>
              <Text style={styles.yearRange}>{yearDisplay}</Text>
            </View>
          </View>

          {/* Player info */}
          <View style={styles.playerRow}>
            {link.player.nationality_code && (
              <FlagIcon
                code={link.player.nationality_code}
                size={16}
                testID={`${testID}-flag`}
              />
            )}
            <Text style={styles.playerName} numberOfLines={1}>
              {link.player.name}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    minHeight: 72,
  },
  connectorColumn: {
    width: 40,
    alignItems: "center",
    paddingVertical: 0,
  },
  connectorLine: {
    flex: 1,
    width: 3,
    backgroundColor: colors.pitchGreen,
    minHeight: 12,
    borderRadius: 1.5,
    shadowColor: colors.pitchGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    elevation: 2,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.pitchGreen,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
    shadowColor: colors.pitchGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
  stepBadgeLatest: {
    backgroundColor: colors.pitchGreen,
  },
  detailsColumn: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
    justifyContent: "center",
  },
  clubCard: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  clubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  clubName: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.pitchGreen,
    fontWeight: "600",
    flex: 1,
  },
  yearBadge: {
    backgroundColor: "rgba(88, 204, 2, 0.15)",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  yearRange: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.pitchGreen,
    fontWeight: "500",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  playerName: {
    fontFamily: fonts.headline,
    fontSize: 15,
    color: colors.floodlightWhite,
    flex: 1,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export const ChainLinkRow = memo(ChainLinkRowComponent);
