/**
 * ChainPlayerCard - Enhanced player display card for The Chain
 *
 * Shows a player in the chain with their name, flag, and role badge.
 * Gamified styling with glows, icons, and celebration animations.
 */

import React, { memo, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { Play, Flag, Sparkles } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { FlagIcon } from "@/components/FlagIcon/FlagIcon";
import { colors, fonts, spacing, borderRadius, glows } from "@/theme";
import { ChainPlayer } from "../types/theChain.types";

export interface ChainPlayerCardProps {
  /** Player data */
  player: ChainPlayer;
  /** Card variant - determines badge and border color */
  variant: "start" | "end" | "link";
  /** Whether to highlight the card (e.g., completed goal) */
  isHighlighted?: boolean;
  /** Test ID for testing */
  testID?: string;
}

function ChainPlayerCardComponent({
  player,
  variant,
  isHighlighted = false,
  testID,
}: ChainPlayerCardProps) {
  // Animation values
  const glowOpacity = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const badgePulse = useSharedValue(1);

  const getBadgeText = () => {
    switch (variant) {
      case "start":
        return "START";
      case "end":
        return "GOAL";
      default:
        return null;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case "start":
        return colors.pitchGreen;
      case "end":
        return colors.cardYellow;
      default:
        return isHighlighted ? colors.pitchGreen : "transparent";
    }
  };

  const getBadgeColor = () => {
    switch (variant) {
      case "start":
        return colors.pitchGreen;
      case "end":
        return colors.cardYellow;
      default:
        return colors.pitchGreen;
    }
  };

  const getGlowColor = () => {
    switch (variant) {
      case "start":
        return colors.pitchGreen;
      case "end":
        return colors.cardYellow;
      default:
        return "transparent";
    }
  };

  // Trigger animations based on state
  useEffect(() => {
    if (variant === "start" || variant === "end") {
      // Subtle glow for start/end cards (reduced intensity)
      glowOpacity.value = withTiming(0.2, { duration: 500 });
    }

    if (isHighlighted && variant === "end") {
      // Celebration animation for completed goal
      cardScale.value = withSequence(
        withTiming(1.02, { duration: 150 }),
        withSpring(1, { damping: 10 })
      );
      glowOpacity.value = withSpring(0.4, { damping: 12 });
      // Pulse the badge
      badgePulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        3,
        false
      );
    }
  }, [variant, isHighlighted, glowOpacity, cardScale, badgePulse]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgePulse.value }],
  }));

  const badgeText = getBadgeText();
  const borderColor = getBorderColor();
  const badgeColor = getBadgeColor();
  const glowColor = getGlowColor();

  const renderBadgeIcon = () => {
    switch (variant) {
      case "start":
        return <Play size={10} color={colors.stadiumNavy} fill={colors.stadiumNavy} />;
      case "end":
        return isHighlighted ? (
          <Sparkles size={10} color={colors.stadiumNavy} />
        ) : (
          <Flag size={10} color={colors.stadiumNavy} />
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.container, animatedCardStyle]}>
      {/* Glow effect behind card */}
      {(variant === "start" || variant === "end") && (
        <Animated.View
          style={[
            styles.glowLayer,
            { backgroundColor: glowColor },
            animatedGlowStyle,
          ]}
        />
      )}

      <GlassCard
        style={styles.card}
        testID={testID}
      >
        <View style={styles.content}>
          {/* Flag and Name */}
          <View style={styles.playerInfo}>
            {player.nationality_code && (
              <View style={styles.flagContainer}>
                <FlagIcon
                  code={player.nationality_code}
                  size={20}
                  testID={`${testID}-flag`}
                />
              </View>
            )}
            <Text
              style={[
                styles.playerName,
                variant !== "link" && styles.playerNameLarge,
              ]}
              numberOfLines={1}
            >
              {player.name}
            </Text>
          </View>

          {/* Badge with Icon */}
          {badgeText && (
            <Animated.View
              style={[
                styles.badge,
                { backgroundColor: badgeColor },
                animatedBadgeStyle,
              ]}
            >
              {renderBadgeIcon()}
              <Text style={styles.badgeText}>{badgeText}</Text>
            </Animated.View>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  glowLayer: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: borderRadius.lg + 4,
    opacity: 0,
  },
  card: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  flagContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  playerName: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.floodlightWhite,
    flex: 1,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  playerNameLarge: {
    fontSize: 18,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  badgeText: {
    fontFamily: fonts.headline,
    fontSize: 11,
    color: colors.stadiumNavy,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export const ChainPlayerCard = memo(ChainPlayerCardComponent);
