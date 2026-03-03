/**
 * MonthReportCard - Current month stats with an animated SVG progress ring.
 *
 * Layout:
 *   - Month label header ("MARCH 2026")
 *   - Left: 80px SVG ring (daysPlayed / totalDaysInMonth), centre text inside
 *   - Right: stat rows for Games, Perfects, IQ Earned
 *
 * The ring stroke animates from 0 → filled on mount using react-native-reanimated
 * and a derived strokeDashoffset on the SVG Circle.
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import { MonthReport } from '../types/scoutReport.types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 80;
const STROKE_WIDTH = 7;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface MonthReportCardProps {
  report: MonthReport;
  testID?: string;
}

interface StatRowProps {
  label: string;
  value: string | number;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function MonthReportCard({ report, testID }: MonthReportCardProps) {
  const { daysPlayed, totalDaysInMonth, monthLabel, gamesPlayed, perfectScores, iqEarned } =
    report;

  const fillRatio = totalDaysInMonth > 0 ? daysPlayed / totalDaysInMonth : 0;

  // Animates from full offset (no arc) down to the filled offset
  const animatedOffset = useSharedValue(CIRCUMFERENCE);

  useEffect(() => {
    const targetOffset = CIRCUMFERENCE * (1 - fillRatio);
    animatedOffset.value = withTiming(targetOffset, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [fillRatio, animatedOffset]);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  return (
    <View style={styles.card} testID={testID}>
      {/* Month label */}
      <Text style={styles.monthLabel}>{monthLabel.toUpperCase()}</Text>

      <View style={styles.body}>
        {/* Ring */}
        <View style={styles.ringContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Track */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress arc */}
            <AnimatedCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={colors.pitchGreen}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeLinecap="round"
              // Rotate so arc starts at 12 o'clock
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              animatedProps={animatedCircleProps}
            />
          </Svg>
          {/* Centre text overlay */}
          <View style={styles.ringLabel} pointerEvents="none">
            <Text style={styles.ringText}>
              {daysPlayed}/{totalDaysInMonth}
            </Text>
            <Text style={styles.ringSubtext}>days</Text>
          </View>
        </View>

        {/* Stat rows */}
        <View style={styles.statsContainer}>
          <StatRow label="Games" value={gamesPlayed} />
          <StatRow label="Perfects" value={perfectScores} />
          <StatRow label="IQ Earned" value={`+${iqEarned}`} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  monthLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: {
    fontFamily: fonts.stats,
    fontSize: 13,
    color: colors.floodlightWhite,
    lineHeight: 16,
  },
  ringSubtext: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 9,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  statValue: {
    fontFamily: fonts.stats,
    fontSize: 14,
    color: colors.floodlightWhite,
  },
});
