/**
 * PremiumUpsellBanner Component
 *
 * A persistent banner on the Home screen encouraging free users to subscribe.
 * Shows dynamic pricing from RevenueCat when available.
 * Returns null for premium users.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Crown, ChevronRight } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { GlassCard } from '@/components/GlassCard';
import { useAuth } from '@/features/auth';
import { PremiumUpsellBannerProps } from '../types/ads.types';
import { colors, spacing, borderRadius, fonts, textStyles } from '@/theme';

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
export function PremiumUpsellBanner({ testID }: Omit<PremiumUpsellBannerProps, 'onPress'>) {
  const router = useRouter();
  const { profile } = useAuth();

  // Don't show for premium users
  if (profile?.is_premium) {
    return null;
  }

  const handlePress = () => {
    router.push({
      pathname: '/premium-modal',
      params: { mode: 'upsell' },
    });
  };

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Pressable
        onPress={handlePress}
          style={({ pressed }) => [
            styles.container,
            pressed && styles.pressed,
          ]}
          testID={testID}
          accessibilityLabel="Go Premium - Unlock all historical puzzles"
          accessibilityRole="button"
        >
          <GlassCard style={styles.card}>
            <View style={styles.content}>
              {/* Crown Icon */}
              <View style={styles.iconContainer}>
                <Crown size={28} color={colors.stadiumNavy} fill={colors.cardYellow} />
              </View>

              {/* Text Content */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>Go Premium</Text>
                <Text style={styles.subtitle}>
                  Unlock 1,000+ Historical Puzzles
                </Text>
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
    marginHorizontal: spacing.xl,
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardYellow,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
});
