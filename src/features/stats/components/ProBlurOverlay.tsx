/**
 * ProBlurOverlay - Gating wrapper for Pro-tier stat components.
 *
 * When isLocked:
 *   - Renders children in a View
 *   - Overlays a BlurView (expo-blur, intensity 20, tint dark) with a
 *     semi-transparent dark background
 *   - Centered lock icon + "GO PRO" CTA that calls onUpgrade on press
 *
 * When !isLocked:
 *   - Renders children as-is with no wrapping overhead
 */

import { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Lock } from 'lucide-react-native';
import { colors, fonts, borderRadius, spacing } from '@/theme';
import { HOME_COLORS } from '@/theme/home-design';

export interface ProBlurOverlayProps {
  children: React.ReactNode;
  isLocked: boolean;
  onUpgrade: () => void;
}

export const ProBlurOverlay = memo(function ProBlurOverlay({
  children,
  isLocked,
  onUpgrade,
}: ProBlurOverlayProps) {
  if (!isLocked) {
    // Render children with no wrapping — zero cost path
    return <>{children}</>;
  }

  return (
    <View style={styles.wrapper}>
      {/* Content rendered underneath */}
      {children}

      {/* Full-size blur overlay */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onUpgrade}
        accessibilityRole="button"
        accessibilityLabel="Unlock Pro stats. Tap to upgrade."
      >
        <BlurView intensity={20} tint="dark" style={styles.blurFill}>
          {/* Semi-transparent dark scrim on top of blur */}
          <View style={styles.scrim}>
            {/* Lock icon */}
            <View style={styles.iconWrapper}>
              <Lock size={24} color={HOME_COLORS.cardYellow} strokeWidth={2} />
            </View>

            {/* CTA text */}
            <Text style={styles.goProText}>GO PRO</Text>
            <Text style={styles.unlockText}>Unlock advanced stats</Text>
          </View>
        </BlurView>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.xl,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  goProText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 16,
    color: HOME_COLORS.cardYellow,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  unlockText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
