import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Archive, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '@/theme';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';

type BannerVariant = 'default' | 'daily-complete' | 'streak';

interface ArchiveDiscoveryBannerProps {
  variant: BannerVariant;
  onPress: () => void;
  onDismiss: () => void;
  testID?: string;
}

const VARIANT_CONTENT: Record<
  BannerVariant,
  { heading: string; body: string; cta: string }
> = {
  default: {
    heading: 'PAST GAMES',
    body: 'Play any game from the last 3 days free',
    cta: 'EXPLORE',
  },
  'daily-complete': {
    heading: 'DAILY COMPLETE!',
    body: 'Keep your streak alive — replay past days',
    cta: 'PLAY MORE',
  },
  streak: {
    heading: 'TEST YOUR HISTORY',
    body: '450+ puzzles in the archive',
    cta: 'DIVE IN',
  },
};

export function ArchiveDiscoveryBanner({
  variant,
  onPress,
  onDismiss,
  testID,
}: ArchiveDiscoveryBannerProps) {
  const content = VARIANT_CONTENT[variant];

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.wrapper}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
        testID={testID}
      >
        <LinearGradient
          colors={['#1E3A8A', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {/* Close Button */}
          <Pressable
            onPress={onDismiss}
            style={styles.closeButton}
            hitSlop={8}
            testID={`${testID || 'archive-banner'}-close`}
          >
            <X size={18} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>

          <View style={styles.contentContainer}>
            {/* Left Content */}
            <View style={styles.leftContent}>
              <View style={styles.headerRow}>
                <Archive size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.headerText}>{content.heading}</Text>
              </View>
              <Text style={styles.bodyText}>{content.body}</Text>
            </View>

            {/* Right CTA Button */}
            <View style={styles.ctaButton}>
              <Text style={styles.ctaText}>{content.cta}</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  gradient: {
    padding: spacing.lg, // 16
    minHeight: 80,
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 8,
    zIndex: 20,
    padding: 4,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  headerText: {
    fontFamily: HOME_FONTS.heading, // BebasNeue-Regular
    fontSize: 20,
    color: '#FFFFFF',
    includeFontPadding: false,
    marginBottom: -2, // Adjustment for Bebas line height
  },
  bodyText: {
    fontFamily: HOME_FONTS.body, // Montserrat
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: HOME_FONTS.heading, // BebasNeue-Regular
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
