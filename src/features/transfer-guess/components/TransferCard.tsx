import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ArrowRight } from 'lucide-react-native';
import { GlassCard } from '@/components';
import { colors, spacing, textStyles, fonts, borderRadius } from '@/theme';

export interface TransferCardProps {
  /** Origin club name */
  fromClub: string;
  /** Destination club name */
  toClub: string;
  /** Transfer year */
  year: number;
  /** Transfer fee (e.g., "€80M") */
  fee: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * TransferCard - The main transfer information display.
 *
 * Shows the transfer details (from club → to club, year, fee)
 * with a subtle floating animation for visual interest.
 */
export function TransferCard({
  fromClub,
  toClub,
  year,
  fee,
  testID,
}: TransferCardProps) {
  const floatY = useSharedValue(0);

  // Start floating animation on mount
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // infinite
      true // reverse
    );
  }, [floatY]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View style={[styles.container, floatStyle]} testID={testID}>
      <GlassCard style={styles.card}>
        {/* Club transfer row */}
        <View style={styles.clubRow}>
          <View style={styles.clubContainer}>
            <View style={styles.clubBadge}>
              <Text style={styles.clubInitial}>{fromClub[0]}</Text>
            </View>
            <Text style={styles.clubName} numberOfLines={2}>
              {fromClub}
            </Text>
          </View>

          <View style={styles.arrowContainer}>
            <ArrowRight size={32} color={colors.cardYellow} strokeWidth={2.5} />
          </View>

          <View style={styles.clubContainer}>
            <View style={[styles.clubBadge, styles.clubBadgeTo]}>
              <Text style={styles.clubInitial}>{toClub[0]}</Text>
            </View>
            <Text style={styles.clubName} numberOfLines={2}>
              {toClub}
            </Text>
          </View>
        </View>

        {/* Year and fee row */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Year</Text>
            <Text style={styles.detailValue}>{year}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Fee</Text>
            <Text style={styles.detailValue}>{fee}</Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  card: {
    padding: spacing.xl,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  clubContainer: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  clubBadge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textSecondary,
  },
  clubBadgeTo: {
    borderColor: colors.pitchGreen,
  },
  clubInitial: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
  },
  clubName: {
    ...textStyles.bodySmall,
    color: colors.floodlightWhite,
    textAlign: 'center',
    maxWidth: 100,
  },
  arrowContainer: {
    paddingHorizontal: spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailValue: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.cardYellow,
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.glassBorder,
    marginHorizontal: spacing.lg,
  },
});
