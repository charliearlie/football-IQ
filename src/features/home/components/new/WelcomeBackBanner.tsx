import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Flame, RotateCcw, Snowflake, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { spacing } from '@/theme';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import type { WelcomeBackBannerData } from '@/features/home/hooks/useWelcomeBackBanner';

interface WelcomeBackBannerProps {
  data: WelcomeBackBannerData;
  onDismiss: () => void;
  testID?: string;
}

const BANNER_DEPTH = 6;

const BORDER_COLORS: Record<WelcomeBackBannerData['type'], string> = {
  milestone: 'rgba(217, 119, 6, 0.3)',
  'streak-lost': 'rgba(55, 65, 81, 0.5)',
  'streak-saved': 'rgba(37, 99, 235, 0.3)',
};

const GRADIENT_COLORS: Record<WelcomeBackBannerData['type'], readonly [string, string]> = {
  milestone: ['#D97706', '#EA580C'],
  'streak-lost': ['#374151', '#1F2937'],
  'streak-saved': ['#2563EB', '#1D4ED8'],
};

function BannerIcon({ type }: { type: WelcomeBackBannerData['type'] }) {
  if (type === 'milestone') {
    return <Flame size={24} color="#FACC15" />;
  }
  if (type === 'streak-saved') {
    return <Snowflake size={24} color="#93C5FD" />;
  }
  return <RotateCcw size={24} color="#9CA3AF" />;
}

export function WelcomeBackBanner({
  data,
  onDismiss,
  testID,
}: WelcomeBackBannerProps) {
  const gradientColors = GRADIENT_COLORS[data.type];
  const borderColor = BORDER_COLORS[data.type];

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.wrapper}
      testID={testID}
    >
      {/* Shadow Layer */}
      <View style={styles.shadowLayer} />

      {/* Top/Face Layer */}
      <View style={[styles.container, { borderColor }]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {/* Close Button */}
          <Pressable
            onPress={onDismiss}
            style={styles.closeButton}
            hitSlop={8}
            testID={`${testID || 'welcome-back-banner'}-close`}
          >
            <X size={18} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>

          {/* Content Row */}
          <View style={styles.contentRow}>
            <View style={styles.iconContainer}>
              <BannerIcon type={data.type} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.headingText}>{data.heading}</Text>
              <Text style={styles.bodyText}>{data.body}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 24,
    paddingBottom: BANNER_DEPTH,
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
  },
  gradient: {
    padding: spacing.lg,
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  headingText: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 20,
    color: HOME_COLORS.textMain,
    includeFontPadding: false,
    marginBottom: -2,
  },
  bodyText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 12,
    color: HOME_COLORS.textMain,
    opacity: 0.9,
    marginTop: 4,
  },
});
