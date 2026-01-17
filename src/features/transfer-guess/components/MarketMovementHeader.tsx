import { View, Text, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { colors, spacing, fonts, fontWeights, borderRadius } from '@/theme';

export interface MarketMovementHeaderProps {
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
 * MarketMovementHeader - The "Transaction Banner" for transfer details.
 *
 * Premium typography-focused design without club badges.
 * Large Bebas Neue club names with pitchGreen arrow connector.
 *
 * Layout:
 * ┌─────────────────────────────────────────┐
 * │   REAL MADRID  →  MANCHESTER UNITED     │
 * │          €80M | 2024/25                 │
 * └─────────────────────────────────────────┘
 */
export function MarketMovementHeader({
  fromClub,
  toClub,
  year,
  fee,
  testID,
}: MarketMovementHeaderProps) {
  // Format season display (e.g., "2024/25")
  const season = `${year}/${String(year + 1).slice(2)}`;

  return (
    <View style={styles.container} testID={testID}>
      {/* Transfer Fee - HERO element at top */}
      <Text style={styles.fee} testID={`${testID}-fee`}>
        {fee}
      </Text>

      {/* Club names with arrow connector */}
      <View style={styles.clubRow}>
        <Text
          style={styles.clubName}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          testID={`${testID}-from-club`}
        >
          {fromClub.toUpperCase()}
        </Text>

        <View style={styles.arrowContainer}>
          <ArrowRight
            size={28}
            color={colors.pitchGreen}
            strokeWidth={2.5}
          />
        </View>

        <Text
          style={styles.clubName}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          testID={`${testID}-to-club`}
        >
          {toClub.toUpperCase()}
        </Text>
      </View>

      {/* Season - de-emphasized */}
      <Text style={styles.season} testID={`${testID}-season`}>
        {season}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  clubName: {
    flex: 1,
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  arrowContainer: {
    paddingHorizontal: spacing.xs,
  },
  fee: {
    fontFamily: fonts.headline,
    fontSize: 36,
    color: colors.cardYellow,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  season: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
