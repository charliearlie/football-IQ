import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Archive, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { spacing } from '@/theme';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { useHaptics } from '@/hooks/useHaptics';

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

const BANNER_DEPTH = 6;
const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.5 };

export function ArchiveDiscoveryBanner({
  variant,
  onPress,
  onDismiss,
  testID,
}: ArchiveDiscoveryBannerProps) {
  const content = VARIANT_CONTENT[variant];
  const { triggerLight } = useHaptics();

  const translateY = useSharedValue(0);

  const animatedTopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    triggerLight();
    translateY.value = withSpring(BANNER_DEPTH, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    translateY.value = withSpring(0, SPRING_CONFIG);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.wrapper}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={testID}
        style={styles.pressable}
      >
        {/* Shadow Layer */}
        <View style={styles.shadowLayer} />

        {/* Top/Face Layer */}
        <Animated.View style={[styles.container, animatedTopStyle]}>
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
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingBottom: BANNER_DEPTH,
  },
  pressable: {
    overflow: 'visible',
  },
  shadowLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: BANNER_DEPTH,
    backgroundColor: HOME_COLORS.surfaceShadow,
    borderRadius: 20,
  },
  container: {
    borderRadius: 20,
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
    fontFamily: HOME_FONTS.body,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: HOME_FONTS.body,
    fontWeight: '700',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
