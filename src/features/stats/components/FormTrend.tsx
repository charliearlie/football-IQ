/**
 * FormTrend - Sparkline chart for accuracy trend over time.
 *
 * Renders an SVG area/line sparkline showing the user's recent accuracy,
 * plus a comparison of current-week vs lifetime accuracy.
 * A label badge (e.g. "ON FIRE") sits to the right of the title.
 */

import { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts, spacing, borderRadius } from '@/theme';

export interface FormTrendProps {
  dataPoints: { date: string; accuracy: number }[];
  currentWeekAccuracy: number;
  lifetimeAccuracy: number;
  label: string; // e.g. "ON FIRE"
}

const SPARKLINE_HEIGHT = 60;
const SPARKLINE_PADDING_V = 4;
const EFFECTIVE_HEIGHT = SPARKLINE_HEIGHT - SPARKLINE_PADDING_V * 2;

function buildSparklinePaths(
  dataPoints: { date: string; accuracy: number }[],
  width: number
): { linePath: string; fillPath: string } | null {
  if (dataPoints.length < 2) return null;

  const values = dataPoints.map((d) => Math.max(0, Math.min(100, d.accuracy)));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const xStep = width / (dataPoints.length - 1);

  const points = values.map((v, i) => ({
    x: i * xStep,
    y: SPARKLINE_PADDING_V + EFFECTIVE_HEIGHT - ((v - minVal) / range) * EFFECTIVE_HEIGHT,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');

  const fillPath =
    `M ${points[0].x.toFixed(2)},${SPARKLINE_HEIGHT} ` +
    points.map((p) => `L ${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') +
    ` L ${points[points.length - 1].x.toFixed(2)},${SPARKLINE_HEIGHT} Z`;

  return { linePath, fillPath };
}

export const FormTrend = memo(function FormTrend({
  dataPoints,
  currentWeekAccuracy,
  lifetimeAccuracy,
  label,
}: FormTrendProps) {
  const isAboveLifetime = currentWeekAccuracy >= lifetimeAccuracy;

  // We'll render into a fixed width; onLayout is avoided to keep the component simple
  const CHART_WIDTH = 280;

  const paths = useMemo(
    () => buildSparklinePaths(dataPoints, CHART_WIDTH),
    [dataPoints]
  );

  return (
    <Animated.View entering={FadeInDown.springify().damping(15).stiffness(300).mass(0.5)}>
      <View style={styles.card}>
        {/* Header row: title + label badge */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>FORM</Text>
          {label.length > 0 && (
            <View style={styles.labelBadge}>
              <Text style={styles.labelBadgeText}>{label}</Text>
            </View>
          )}
        </View>

        {/* Sparkline */}
        <View style={styles.sparklineWrapper}>
          {paths !== null ? (
            <Svg width={CHART_WIDTH} height={SPARKLINE_HEIGHT}>
              <Defs>
                <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.pitchGreen} stopOpacity={0.18} />
                  <Stop offset="1" stopColor={colors.pitchGreen} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              {/* Fill area */}
              <Path d={paths.fillPath} fill="url(#sparkFill)" />
              {/* Line */}
              <Path
                d={paths.linePath}
                fill="none"
                stroke={colors.pitchGreen}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : (
            <View style={styles.noDataPlaceholder}>
              <Text style={styles.noDataText}>Not enough data yet</Text>
            </View>
          )}
        </View>

        {/* Comparison row */}
        <View style={styles.comparisonRow}>
          <Text style={[styles.weekValue, isAboveLifetime ? styles.valueGreen : styles.valueRed]}>
            {currentWeekAccuracy}%
          </Text>
          <Text style={styles.comparisonMid}> this week vs </Text>
          <Text style={styles.lifetimeValue}>{lifetimeAccuracy}%</Text>
          <Text style={styles.comparisonMid}> lifetime</Text>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.floodlightWhite,
    letterSpacing: 1,
  },
  labelBadge: {
    backgroundColor: 'rgba(46, 252, 93, 0.15)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  labelBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.pitchGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sparklineWrapper: {
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  noDataPlaceholder: {
    height: SPARKLINE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: 280,
  },
  noDataText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  weekValue: {
    fontFamily: fonts.stats,
    fontSize: 14,
    lineHeight: 20,
  },
  valueGreen: {
    color: colors.pitchGreen,
  },
  valueRed: {
    color: colors.redCard,
  },
  comparisonMid: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  lifetimeValue: {
    fontFamily: fonts.stats,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
