import { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, borderRadius, spacing, shadows, type ShadowLevel } from '@/theme';

export interface GlassCardProps {
  /** Card content */
  children: ReactNode;
  /** Blur intensity (0-100, default: 10) */
  intensity?: number;
  /** Additional container styles */
  style?: ViewStyle;
  /** Enable drop shadow for depth (default: true) */
  showShadow?: boolean;
  /** Shadow intensity level (default: 'lg' for prominent depth) */
  shadowLevel?: ShadowLevel;
  /** Test ID for testing */
  testID?: string;
}

/**
 * GlassCard - Frosted Glass Effect Container
 *
 * A container with a blurred, semi-transparent background
 * for a modern glass-morphism effect.
 *
 * Uses expo-blur for native blur on iOS/Android,
 * with a fallback for web.
 */
export function GlassCard({
  children,
  intensity = 10,
  style,
  showShadow = true,
  shadowLevel = 'lg',
  testID,
}: GlassCardProps) {
  // Get shadow style based on level
  const shadowStyle = showShadow ? shadows[shadowLevel] : undefined;

  // Web doesn't support BlurView well, use fallback
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.shadowWrapper,
          styles.fallback,
          shadowStyle,
          style,
        ]}
        testID={testID}
      >
        {children}
      </View>
    );
  }

  // Use wrapper approach: outer view for shadow (no overflow:hidden),
  // inner view for blur clipping (overflow:hidden)
  return (
    <View
      style={[styles.shadowWrapper, shadowStyle, style]}
      testID={testID}
    >
      <View style={styles.innerContainer}>
        <BlurView intensity={intensity} style={styles.blur} tint="dark" />
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Outer wrapper - shadow renders here (no overflow:hidden!)
  shadowWrapper: {
    borderRadius: borderRadius.xl,
    // Background color required for Android elevation
    backgroundColor: colors.stadiumNavy,
  },
  // Inner container - clips blur effect
  innerContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    backgroundColor: colors.glassBackground,
    padding: spacing.lg,
  },
  fallback: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
