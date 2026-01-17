/**
 * LockedMonthOverlay Component
 *
 * Blur overlay for premium-gated months (older than 60 days).
 * Shows a "Velvet Rope" upsell with crown icon and CTA text.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Crown } from 'lucide-react-native';
import { colors, fonts, borderRadius, spacing } from '@/theme';
import { triggerHeavy } from '@/lib/haptics';

export interface LockedMonthOverlayProps {
  /** Callback when overlay is pressed */
  onPress: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * LockedMonthOverlay - Premium blur overlay for old months.
 *
 * Displays a blurred view with crown icon and upsell messaging.
 * Uses expo-blur for native blur effect, falls back to opacity on web.
 */
export function LockedMonthOverlay({
  onPress,
  testID,
}: LockedMonthOverlayProps) {
  const handlePress = () => {
    triggerHeavy(); // "Velvet Rope" haptic
    onPress();
  };

  // Use BlurView on native, opacity overlay on web
  const BlurComponent = Platform.OS === 'web' ? View : BlurView;

  return (
    <Pressable
      style={styles.container}
      onPress={handlePress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Unlock your full Football legacy. Tap to go Pro."
    >
      <BlurComponent
        style={styles.blur}
        intensity={Platform.OS === 'web' ? undefined : 80}
        tint="dark"
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Crown size={28} color={colors.cardYellow} />
          </View>

          <Text style={styles.title}>Unlock Your Full Legacy</Text>

          <Text style={styles.subtitle}>
            See your complete 2026 Football journey
          </Text>

          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>Go Pro</Text>
          </View>
        </View>
      </BlurComponent>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  blur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Web fallback
    ...(Platform.OS === 'web' && {
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
    }),
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.cardYellow,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  ctaButton: {
    backgroundColor: colors.cardYellow,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  ctaText: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.stadiumNavy,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
