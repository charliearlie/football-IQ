/**
 * Tier Level-Up Celebration
 *
 * Full-screen celebration modal shown when user crosses a tier threshold.
 * Features:
 * - Confetti animation
 * - Tier-specific color theming
 * - Unique haptic pattern (Heavy -> Success -> Success -> Heavy)
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
import { TrendingUp, Share2 } from "lucide-react-native";
import { Confetti } from "@/components/Confetti";
import { ElevatedButton } from "@/components/ElevatedButton";
import { triggerLevelUp } from "@/lib/haptics";
import {
  getTierColor,
  formatTotalIQ,
} from "@/features/stats/utils/tierProgression";
import type { IQTier } from "@/features/stats/utils/tierProgression";
import type { TierLevelUpCelebrationProps } from "@/features/notifications/types";
import {
  colors,
  spacing,
  borderRadius,
  fonts,
  textStyles,
} from "@/theme";

const TIER_PROMOTION_MESSAGES: Record<number, string> = {
  1: "Welcome to Football IQ!",
  2: "You've joined the Youth Academy!",
  3: "You've made the Reserve Team!",
  4: "You're making an impact off the bench!",
  5: "The gaffer's got you in the rotation!",
  6: "You've cemented your First Team place!",
  7: "You're first name on the teamsheet!",
  8: "Your name echoes through the stadium!",
  9: "The whole nation salutes you!",
  10: "You are the Greatest Of All Time!",
};

const TIER_GRADIENT_COLORS: Record<number, { gradient: [string, string]; glow: string }> = {
  1: { gradient: ["#1e293b", "#1e293b"], glow: "#6B7280" },
  2: { gradient: ["#1e293b", "#1a1f2e"], glow: "#6B7280" },
  3: { gradient: ["#1e293b", "#172554"], glow: "#3B82F6" },
  4: { gradient: ["#1e293b", "#14332a"], glow: "#22C55E" },
  5: { gradient: ["#1e293b", "#14332a"], glow: "#22C55E" },
  6: { gradient: ["#1e293b", "#14332a"], glow: "#22C55E" },
  7: { gradient: ["#1e293b", "#422006"], glow: "#E5B413" },
  8: { gradient: ["#1e293b", "#422006"], glow: "#F59E0B" },
  9: { gradient: ["#1e293b", "#431407"], glow: "#F97316" },
  10: { gradient: ["#1e293b", "#422006"], glow: "#FFD700" },
};

/**
 * The shareable Tier Level-Up card component.
 */
function TierLevelUpCard({
  tier,
  totalIQ,
}: {
  tier: IQTier;
  totalIQ: number;
}) {
  const tierColor = getTierColor(tier.tier);
  const gradientColors = TIER_GRADIENT_COLORS[tier.tier] ?? TIER_GRADIENT_COLORS[1];

  return (
    <LinearGradient
      colors={gradientColors.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.shareCard, { borderColor: tierColor }]}
    >
      <Svg style={styles.cardGlow} width="200" height="200" viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="tierGlow" cx="50%" cy="50%" rx="50%" ry="50%" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={gradientColors.glow} stopOpacity="0.3" />
            <Stop offset="1" stopColor={gradientColors.glow} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="200" height="200" fill="url(#tierGlow)" />
      </Svg>

      {/* Tier Badge Icon */}
      <View style={styles.badgeContainer}>
        <TrendingUp size={64} color={tierColor} strokeWidth={1.5} />
      </View>

      {/* Title */}
      <Text style={[styles.cardTitle, { color: tierColor }]}>LEVEL UP!</Text>

      {/* Tier Name */}
      <Text style={styles.tierName}>{tier.name}</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTotalIQ(totalIQ)}</Text>
          <Text style={styles.statLabel}>Total IQ</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>Football IQ</Text>
      </View>
    </LinearGradient>
  );
}

export function TierLevelUpCelebration({
  visible,
  tier,
  totalIQ,
  onDismiss,
  onShare,
  testID,
}: TierLevelUpCelebrationProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Animation values
  const cardScale = useSharedValue(0.8);

  // Trigger haptics and confetti when modal appears
  useEffect(() => {
    if (visible) {
      // Trigger haptics
      triggerLevelUp();

      // Start card spring animation
      cardScale.value = withSpring(1, {
        damping: 12,
        stiffness: 150,
      });

      // Start confetti after small delay
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
      // Capture the card as image
      const uri = await viewShotRef.current?.capture?.();

      if (uri) {
        const message = `Just reached ${tier.name} on Football IQ! ${formatTotalIQ(totalIQ)} and climbing!`;

        await Share.share(
          Platform.select({
            ios: { url: uri, message },
            default: { message: `${message}\n\nDownload: football-iq.app` },
          }) || { message },
        );
      }

      await onShare();
    } catch (error) {
      console.error("[TierLevelUp] Share error:", error);
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, tier, totalIQ, onShare]);

  const tierColor = getTierColor(tier.tier);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      testID={testID}
    >
      <View style={styles.overlay}>
        {/* Content - uses plain View so confetti z-index works above it */}
        <View style={styles.container}>
          {/* Card */}
          <Animated.View style={[styles.cardWrapper, cardAnimatedStyle]}>
            <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
              <TierLevelUpCard tier={tier} totalIQ={totalIQ} />
            </ViewShot>
          </Animated.View>

          {/* Subtitle */}
          <Animated.Text entering={FadeIn.delay(300)} style={styles.subtitle}>
            {TIER_PROMOTION_MESSAGES[tier.tier] ?? `You've reached ${tier.name}!`}
          </Animated.Text>

          {/* Buttons */}
          <Animated.View
            entering={FadeIn.delay(400)}
            style={styles.buttonContainer}
          >
            <ElevatedButton
              title={isSharing ? "Sharing..." : "Share"}
              onPress={handleShare}
              disabled={isSharing}
              icon={<Share2 size={18} color={colors.stadiumNavy} />}
              testID={testID ? `${testID}-share` : undefined}
            />
          </Animated.View>

          {/* Dismiss link */}
          <Animated.View entering={FadeIn.delay(500)}>
            <Pressable
              onPress={onDismiss}
              style={styles.dismissButton}
              testID={testID ? `${testID}-dismiss` : undefined}
            >
              <Text style={styles.dismissText}>Continue</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Confetti layer - rendered last to ensure it's on top */}
        <Confetti
          active={showConfetti}
          testID={testID ? `${testID}-confetti` : undefined}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    overflow: 'visible', // Ensure confetti isn't clipped
  },
  container: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  cardWrapper: {
    marginBottom: spacing.lg,
  },

  // Share Card Styles
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
  badgeContainer: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.headline,
    fontSize: 36,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  tierName: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.floodlightWhite,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  statValue: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.floodlightWhite,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
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

  // Modal Styles
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
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
