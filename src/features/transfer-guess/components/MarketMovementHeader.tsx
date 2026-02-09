import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ArrowRight } from 'lucide-react-native';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Rect, Stop } from 'react-native-svg';
import { colors, spacing, fonts, borderRadius } from '@/theme';
import { formatTransferFee } from '../utils/formatTransferFee';

export interface MarketMovementHeaderProps {
  /** Origin club name */
  fromClub: string;
  /** Destination club name */
  toClub: string;
  /** Transfer fee (e.g., "€80M", "12m") */
  fee: string;
  /** Hex color for origin club badge */
  fromClubColor?: string;
  /** Hex color for destination club badge */
  toClubColor?: string;
  /** Short abbreviation for origin club (e.g., "BVB") */
  fromClubAbbreviation?: string;
  /** Short abbreviation for destination club (e.g., "MNU") */
  toClubAbbreviation?: string;
  /** Test ID for testing */
  testID?: string;
}

function getAbbreviation(clubName: string, abbreviation?: string): string {
  if (abbreviation) return abbreviation.toUpperCase();
  return clubName.slice(0, 3).toUpperCase();
}

/**
 * MarketMovementHeader - The "Scouting Report" hero card for transfer details.
 *
 * Layout:
 * ┌─────────────────────────────────────────────┐
 * │          TRANSFER FEE (yellow label)        │
 * │           £12,000,000 (large white)         │
 * │                                             │
 * │   [BVB]  ───── → ──────  [MNU]             │
 * │  (circle)   connector    (circle)           │
 * │  BORUSSIA    (animated)  MANCHESTER         │
 * │  DORTMUND                UNITED             │
 * └─────────────────────────────────────────────┘
 */
export function MarketMovementHeader({
  fromClub,
  toClub,
  fee,
  fromClubColor,
  toClubColor,
  fromClubAbbreviation,
  toClubAbbreviation,
  testID,
}: MarketMovementHeaderProps) {
  const formattedFee = formatTransferFee(fee);
  const fromAbbr = getAbbreviation(fromClub, fromClubAbbreviation);
  const toAbbr = getAbbreviation(toClub, toClubAbbreviation);

  // Pulsing arrow animation
  const arrowOpacity = useSharedValue(0.6);

  useEffect(() => {
    arrowOpacity.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [arrowOpacity]);

  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value,
  }));

  const fromBorderColor = fromClubColor || colors.glassBorder;
  const toBorderColor = toClubColor || colors.glassBorder;
  const fromBg = fromClubColor ? `${fromClubColor}1A` : 'rgba(30, 41, 59, 1)';
  const toBg = toClubColor ? `${toClubColor}1A` : 'rgba(30, 41, 59, 1)';
  const fromTextColor = fromClubColor || colors.textSecondary;
  const toTextColor = toClubColor || colors.textSecondary;

  return (
    <View style={styles.container} testID={testID}>
      {/* Green radial gradient shine (SVG — RN doesn't support CSS radial-gradient) */}
      <Svg style={styles.shineOverlay} width="300" height="300" viewBox="0 0 300 300">
        <Defs>
          <SvgRadialGradient
            id="shineGradient"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#58CC02" stopOpacity="0.1" />
            <Stop offset="1" stopColor="#58CC02" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Rect x="0" y="0" width="300" height="300" fill="url(#shineGradient)" />
      </Svg>

      {/* Transfer Fee */}
      <View style={styles.priceTag}>
        <Text style={styles.feeLabel}>TRANSFER FEE</Text>
        <Text style={styles.feeValue} testID={`${testID}-fee`}>
          {formattedFee}
        </Text>
      </View>

      {/* Clubs Row */}
      <View style={styles.clubsRow}>
        {/* From Club */}
        <View style={styles.club}>
          <View
            style={[
              styles.clubLogo,
              {
                borderColor: fromBorderColor,
                backgroundColor: fromBg,
              },
            ]}
          >
            <Text style={[styles.clubAbbr, { color: fromTextColor }]}>
              {fromAbbr}
            </Text>
          </View>
          <Text
            style={styles.clubName}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            testID={`${testID}-from-club`}
          >
            {fromClub.toUpperCase()}
          </Text>
        </View>

        {/* Connector */}
        <View style={styles.connector}>
          <View style={styles.connectorLine} />
          <Animated.View style={[styles.connectorArrow, arrowAnimatedStyle]}>
            <ArrowRight size={16} color={colors.pitchGreen} strokeWidth={2.5} />
          </Animated.View>
        </View>

        {/* To Club */}
        <View style={styles.club}>
          <View
            style={[
              styles.clubLogo,
              {
                borderColor: toBorderColor,
                backgroundColor: toBg,
              },
            ]}
          >
            <Text style={[styles.clubAbbr, { color: toTextColor }]}>
              {toAbbr}
            </Text>
          </View>
          <Text
            style={styles.clubName}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            testID={`${testID}-to-club`}
          >
            {toClub.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.glassBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    position: 'relative',
  },
  shineOverlay: {
    position: 'absolute',
    top: -100,
    left: -50,
    zIndex: 0,
  },
  priceTag: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  feeLabel: {
    fontFamily: fonts.body,
    fontWeight: '700',
    fontSize: 10,
    color: colors.cardYellow,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  feeValue: {
    fontFamily: fonts.headline,
    fontSize: 48,
    color: colors.floodlightWhite,
    lineHeight: 48,
    textShadowColor: 'rgba(250, 204, 21, 0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  clubsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  club: {
    width: '35%',
    alignItems: 'center',
  },
  clubLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  clubAbbr: {
    fontFamily: fonts.headline,
    fontSize: 24,
  },
  clubName: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.floodlightWhite,
    textAlign: 'center',
    lineHeight: 16,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.sm,
    marginBottom: 24, // Align with logos, not the text below
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectorArrow: {
    backgroundColor: colors.stadiumNavy,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.pitchGreen,
  },
});
