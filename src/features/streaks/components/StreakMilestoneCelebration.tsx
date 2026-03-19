/**
 * Streak Milestone Celebration
 *
 * Full-screen celebration modal shown when user reaches a streak milestone (7, 30, 100 days).
 * Features:
 * - Confetti animation
 * - Milestone-specific theming and rewards display
 * - Unique haptic pattern
 * - Shareable card for social media
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Share,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import ViewShot from "react-native-view-shot";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Flame, Share2, Gift, Award } from "lucide-react-native";
import { Confetti } from "@/components/Confetti";
import { ElevatedButton } from "@/components/ElevatedButton";
import { triggerLevelUp } from "@/lib/haptics";
import {
  colors,
  spacing,
  borderRadius,
  fonts,
  textStyles,
} from "@/theme";
import type { StreakMilestone } from "../types/streakMilestone.types";

export interface StreakMilestoneCelebrationProps {
  visible: boolean;
  milestone: StreakMilestone;
  currentStreak: number;
  onDismiss: () => void;
  onShare: () => Promise<void>;
  userId?: string | null;
  testID?: string;
}

const MILESTONE_THEME: Record<number, { gradient: [string, string]; glow: string; accent: string }> = {
  7: { gradient: ["#0A0A12", "#0A1220"], glow: "#3B82F6", accent: "#60A5FA" },
  30: { gradient: ["#0A0A12", "#1A0A20"], glow: "#A855F7", accent: "#C084FC" },
  100: { gradient: ["#0A0A12", "#201A0A"], glow: "#FFD700", accent: "#FFD700" },
};

function getRewardLabel(milestone: StreakMilestone): string {
  switch (milestone.reward.type) {
    case 'archive_unlock':
      return `+${milestone.reward.days} Free Archive Day`;
    case 'pro_trial':
      return `${milestone.reward.days}-Day Pro Trial`;
    case 'badge':
      return `"${milestone.reward.badgeName}" Badge`;
  }
}

/**
 * The shareable milestone card.
 */
function MilestoneCard({
  milestone,
  currentStreak,
}: {
  milestone: StreakMilestone;
  currentStreak: number;
}) {
  const theme = MILESTONE_THEME[milestone.days] ?? MILESTONE_THEME[7];

  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[cardStyles.shareCard, { borderColor: theme.accent }]}
    >
      <Svg style={cardStyles.cardGlow} width="200" height="200" viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="milestoneGlow" cx="50%" cy="50%" rx="50%" ry="50%" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={theme.glow} stopOpacity="0.3" />
            <Stop offset="1" stopColor={theme.glow} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="200" height="200" fill="url(#milestoneGlow)" />
      </Svg>

      {/* Flame Icon */}
      <View style={cardStyles.iconContainer}>
        <Flame size={64} color={theme.accent} strokeWidth={1.5} />
      </View>

      {/* Streak Count */}
      <Text style={[cardStyles.streakCount, { color: theme.accent }]}>{currentStreak}</Text>
      <Text style={cardStyles.streakLabel}>DAY STREAK</Text>

      {/* Reward Badge */}
      <View style={[cardStyles.rewardBadge, { borderColor: theme.accent }]}>
        <Gift size={14} color={theme.accent} />
        <Text style={[cardStyles.rewardText, { color: theme.accent }]}>
          {getRewardLabel(milestone)}
        </Text>
      </View>

      {/* Footer */}
      <View style={cardStyles.cardFooter}>
        <Text style={cardStyles.footerText}>Football IQ</Text>
      </View>
    </LinearGradient>
  );
}

export function StreakMilestoneCelebration({
  visible,
  milestone,
  currentStreak,
  onDismiss,
  onShare,
  userId,
  testID,
}: StreakMilestoneCelebrationProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const cardScale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      triggerLevelUp();

      cardScale.value = withSpring(1, {
        damping: 12,
        stiffness: 150,
      });

      const timer = setTimeout(() => {
        setShowConfetti(true);
      }, 200);

      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
      cardScale.value = 0.8;
    }
  }, [visible, cardScale]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const handleShare = useCallback(async () => {
    if (isSharing) return;

    setIsSharing(true);

    try {
      const uri = await viewShotRef.current?.capture?.();

      if (uri) {
        const scoutUrl = userId
          ? `https://football-iq.app/scout/${userId}`
          : 'https://football-iq.app';
        const message = `${milestone.shareText}\n\nSee my Scout Report: ${scoutUrl}`;

        await Share.share(
          Platform.select({
            ios: { url: uri, message },
            default: { message },
          }) || { message },
        );

        await onShare();
      }
    } catch (error) {
      console.error("[StreakMilestone] Share error:", error);
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, milestone, onShare, userId]);

  const theme = MILESTONE_THEME[milestone.days] ?? MILESTONE_THEME[7];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      testID={testID}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          {/* Card */}
          <Animated.View style={[modalStyles.cardWrapper, cardAnimatedStyle]}>
            <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
              <MilestoneCard milestone={milestone} currentStreak={currentStreak} />
            </ViewShot>
          </Animated.View>

          {/* Message */}
          <Animated.Text entering={FadeIn.delay(300)} style={modalStyles.subtitle}>
            {milestone.message}
          </Animated.Text>

          {/* Reward callout */}
          <Animated.View entering={FadeIn.delay(350)} style={modalStyles.rewardCallout}>
            <Award size={16} color={theme.accent} />
            <Text style={[modalStyles.rewardCalloutText, { color: theme.accent }]}>
              Reward: {getRewardLabel(milestone)}
            </Text>
          </Animated.View>

          {/* Buttons */}
          <Animated.View entering={FadeIn.delay(400)} style={modalStyles.buttonContainer}>
            <ElevatedButton
              title={isSharing ? "Sharing..." : "Share"}
              onPress={handleShare}
              disabled={isSharing}
              icon={<Share2 size={18} color={colors.stadiumNavy} />}
              testID={testID ? `${testID}-share` : undefined}
            />
          </Animated.View>

          {/* Dismiss */}
          <Animated.View entering={FadeIn.delay(500)}>
            <Pressable
              onPress={onDismiss}
              style={modalStyles.dismissButton}
              testID={testID ? `${testID}-dismiss` : undefined}
            >
              <Text style={modalStyles.dismissText}>Continue</Text>
            </Pressable>
          </Animated.View>
        </View>

        <Confetti
          active={showConfetti}
          testID={testID ? `${testID}-confetti` : undefined}
        />
      </View>
    </Modal>
  );
}

const cardStyles = StyleSheet.create({
  shareCard: {
    width: 280,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
  cardGlow: {
    position: "absolute",
    right: -50,
    top: -50,
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  streakCount: {
    fontFamily: fonts.headline,
    fontSize: 48,
    textAlign: "center",
    lineHeight: 52,
  },
  streakLabel: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  rewardText: {
    fontFamily: fonts.headline,
    fontSize: 13,
  },
  cardFooter: {
    marginTop: spacing.sm,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  container: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  cardWrapper: {
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  rewardCallout: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  rewardCalloutText: {
    fontFamily: fonts.headline,
    fontSize: 14,
  },
  buttonContainer: {
    marginBottom: spacing.md,
  },
  dismissButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  dismissText: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.floodlightWhite,
    textAlign: "center",
  },
});
