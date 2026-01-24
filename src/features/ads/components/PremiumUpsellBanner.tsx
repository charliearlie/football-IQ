/**
 * PremiumUpsellBanner Component
 *
 * A persistent banner on the Home screen encouraging free users to subscribe.
 * Shows dynamic pricing from RevenueCat when available.
 * Returns null for premium users.
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Crown, ChevronRight, X } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/features/auth";
import { PremiumUpsellBannerProps } from "../types/ads.types";
import { colors, spacing, borderRadius, fonts, textStyles } from "@/theme";

/**
 * PremiumUpsellBanner - Upsell banner for the Home screen.
 *
 * Displays a compelling CTA to encourage premium subscription.
 * Opens PremiumUpsellModal when pressed.
 *
 * @example
 * ```tsx
 * <StreakHeader ... />
 * <PremiumUpsellBanner testID="home-upsell-banner" />
 * <DailyStackCards ... />
 * ```
 */
export function PremiumUpsellBanner({
  testID,
}: Omit<PremiumUpsellBannerProps, "onPress">) {
  const router = useRouter();
  const { profile } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show for premium users or if dismissed
  if (profile?.is_premium || isDismissed) {
    return null;
  }

  const handlePress = () => {
    router.push({
      pathname: "/premium-modal",
      params: { mode: "upsell" },
    });
  };

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        testID={testID}
        accessibilityLabel="Go Pro - Unlock all historical puzzles"
        accessibilityRole="button"
      >
        <GlassCard style={styles.card}>
          {/* Dismiss button - top right corner */}
          <Pressable
            onPress={() => setIsDismissed(true)}
            style={styles.dismissButton}
            hitSlop={12}
            accessibilityLabel="Dismiss banner"
            accessibilityRole="button"
          >
            <X size={12} color="rgba(255, 255, 255, 0.35)" />
          </Pressable>

          <View style={styles.content}>
            {/* Crown Icon */}
            <View style={styles.iconContainer}>
              <Crown
                size={28}
                color={colors.stadiumNavy}
                fill={colors.cardYellow}
              />
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>Go Pro</Text>
              <Text style={styles.subtitle}>Unlock the full archive</Text>
            </View>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <ChevronRight size={24} color={colors.cardYellow} />
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  card: {
    borderColor: colors.cardYellow,
    borderWidth: 1.5,
  },
  dismissButton: {
    position: "absolute",
    top: 6,
    right: 6,
    padding: 6,
    zIndex: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardYellow,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 20,
    letterSpacing: 1,
    color: colors.cardYellow,
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.floodlightWhite,
    marginTop: 2,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
