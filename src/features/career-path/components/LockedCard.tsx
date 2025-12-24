import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Lock } from 'lucide-react-native';
import { GlassCard } from '@/components';
import { colors, spacing, textStyles, borderRadius } from '@/theme';

export interface LockedCardProps {
  /** The step number to display */
  stepNumber: number;
  /** Test ID for testing */
  testID?: string;
}

/**
 * LockedCard - A blurred, locked career step card.
 *
 * Shows the step number but hides the content behind a blur overlay
 * with a lock icon, indicating the step hasn't been revealed yet.
 */
export function LockedCard({ stepNumber, testID }: LockedCardProps) {
  return (
    <View style={styles.container} testID={testID}>
      <GlassCard style={styles.card}>
        <View style={styles.content}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNumber}>{stepNumber}</Text>
          </View>
          <Text style={styles.lockedText}>???</Text>
        </View>
      </GlassCard>

      {/* Blur overlay */}
      {Platform.OS !== 'web' ? (
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={20}
          tint="dark"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.webOverlay]} />
      )}

      {/* Lock icon centered */}
      <View style={styles.lockOverlay}>
        <View style={styles.lockCircle}>
          <Lock size={20} color={colors.textSecondary} strokeWidth={2} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  card: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    ...textStyles.subtitle,
    fontSize: 14,
    color: colors.textSecondary,
  },
  lockedText: {
    ...textStyles.body,
    color: colors.textSecondary,
    flex: 1,
  },
  webOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
