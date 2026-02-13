/**
 * First Win Celebration
 *
 * Full-screen celebration modal shown when user completes their first puzzle.
 * Features:
 * - Confetti animation
 * - Pitch green theming (welcoming color)
 * - Haptic pattern (reuses triggerPerfectDay)
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
import { PartyPopper, Share2 } from "lucide-react-native";
import { Confetti } from "@/components/Confetti";
import { ElevatedButton } from "@/components/ElevatedButton";
import { triggerPerfectDay } from "@/lib/haptics";
import {
  colors,
  spacing,
  borderRadius,
  fonts,
  textStyles,
} from "@/theme";

export interface FirstWinCelebrationProps {
  visible: boolean;
  onDismiss: () => void;
  onShare: () => Promise<void>;
  testID?: string;
}

/**
 * The shareable First Win card component.
 */
function FirstWinCard() {
  return (
    <LinearGradient
      colors={["#1e293b", "#14332a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.shareCard}
    >
      <Svg style={styles.cardGlow} width="200" height="200" viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="firstWinGlow" cx="50%" cy="50%" rx="50%" ry="50%" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#22C55E" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#22C55E" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="200" height="200" fill="url(#firstWinGlow)" />
      </Svg>

      {/* Party Popper Icon */}
      <View style={styles.iconContainer}>
        <PartyPopper size={64} color={colors.pitchGreen} strokeWidth={1.5} />
      </View>

      {/* Title */}
      <Text style={styles.cardTitle}>YOU'RE A NATURAL!</Text>

      {/* Welcome Message */}
      <Text style={styles.welcomeText}>Welcome to Football IQ</Text>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>Football IQ</Text>
      </View>
    </LinearGradient>
  );
}

export function FirstWinCelebration({
  visible,
  onDismiss,
  onShare,
  testID,
}: FirstWinCelebrationProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Animation values
  const cardScale = useSharedValue(0.8);

  // Trigger haptics and confetti when modal appears
  useEffect(() => {
    if (visible) {
      // Trigger haptics (reuse Perfect Day pattern)
      triggerPerfectDay();

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
        const message =
          "Just completed my first Football IQ puzzle! Think you can beat my score?";

        await Share.share(
          Platform.select({
            ios: { url: uri, message },
            default: { message: `${message}\n\nDownload: football-iq.app` },
          }) || { message },
        );
      }

      await onShare();
    } catch (error) {
      console.error("[FirstWin] Share error:", error);
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, onShare]);

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
              <FirstWinCard />
            </ViewShot>
          </Animated.View>

          {/* Subtitle */}
          <Animated.Text entering={FadeIn.delay(300)} style={styles.subtitle}>
            You completed your first puzzle!
          </Animated.Text>

          {/* Buttons */}
          <Animated.View
            entering={FadeIn.delay(400)}
            style={styles.buttonContainer}
          >
            <ElevatedButton
              title={isSharing ? "Sharing..." : "Share your first score"}
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
    borderColor: colors.pitchGreen,
    overflow: "hidden",
  },
  cardGlow: {
    position: "absolute",
    right: -50,
    top: -50,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.headline,
    fontSize: 32,
    color: colors.pitchGreen,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  welcomeText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.floodlightWhite,
    textAlign: "center",
    marginBottom: spacing.lg,
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
