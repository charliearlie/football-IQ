import { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView, BlurTargetView } from 'expo-blur';
import { colors, borderRadius, spacing, shadows, type ShadowLevel } from '@/theme';

export interface GlassCardProps {
  /** Card content */
  children: ReactNode;
  /** Blur intensity (0-100, default: 10) */
  intensity?: number;
  /** Additional container styles */
  style?: ViewStyle;
  /** Additional content styles (e.g. padding) */
  contentStyle?: ViewStyle;
  /** Inner border color override */
  borderColor?: string;
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
  contentStyle,
  borderColor,
  showShadow = true,
  shadowLevel = 'lg',
  testID,
}: GlassCardProps) {
  // Get shadow style based on level
  const shadowStyle = showShadow ? shadows[shadowLevel] : undefined;
  
  // Use provided borderColor or default from styles
  const borderStyle = borderColor ? { borderColor } : undefined;

  // Web doesn't support BlurView well, use fallback
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.shadowWrapper,
          styles.fallback,
          shadowStyle,
          style,
          borderStyle
        ]}
        testID={testID}
      >
        <View style={[styles.webContent, contentStyle]}>{children}</View>
      </View>
    );
  }

  // Use wrapper approach: outer view for shadow (no overflow:hidden),
  // inner view for blur clipping (overflow:hidden).
  // Android uses BlurTargetView for stable RenderNode-based blur (SDK 55+).
  const InnerWrapper = Platform.OS === 'android' ? BlurTargetView : View;

  return (
    <View
      style={[styles.shadowWrapper, shadowStyle, style]}
      testID={testID}
    >
      <InnerWrapper style={[styles.innerContainer, borderStyle]}>
        <BlurView intensity={intensity} style={styles.blur} tint="dark" />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </InnerWrapper>
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
    borderWidth: 1,
    borderColor: colors.glassBorder,
    // Padding moved to inner content wrapper for consistency if needed, 
    // or just applied to fallback. Let's keep fallback simple but support contentStyle.
    // Actually, fallback currently applies padding directly.
    padding: 0, // Reset padding here, apply to inner view
  },
  webContent: {
    padding: spacing.lg,
  },
});
