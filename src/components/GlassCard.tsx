import { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, borderRadius, spacing } from '@/theme';

export interface GlassCardProps {
  /** Card content */
  children: ReactNode;
  /** Blur intensity (0-100, default: 10) */
  intensity?: number;
  /** Additional container styles */
  style?: ViewStyle;
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
  testID,
}: GlassCardProps) {
  // Web doesn't support BlurView well, use fallback
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.fallback, style]} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      <BlurView intensity={intensity} style={styles.blur} tint="dark" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
});
