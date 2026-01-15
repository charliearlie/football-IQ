/**
 * TacticalRadarChart - 6-axis radar visualization
 *
 * A custom SVG radar chart showing proficiency across all game modes.
 * Features:
 * - 6 axes at 60-degree intervals (hexagonal shape)
 * - Animated "grow from center" on mount
 * - Interactive axis labels with highlight on tap
 * - Filled polygon representing actual proficiency values
 */

import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { memo, useState, useEffect, useMemo, useCallback } from 'react';
import Svg, { Path, Circle, Line, G, Polygon } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withDelay,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import { GameProficiency } from '../../types/stats.types';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Radar axis configuration
 * Angles are in degrees, starting from top (270°) going clockwise
 */
const RADAR_AXES: Array<{
  angle: number;
  label: string;
  gameMode: GameMode;
  shortLabel: string;
}> = [
  { angle: 270, label: 'Deduction', gameMode: 'career_path', shortLabel: 'DED' },
  { angle: 330, label: 'Market Knowledge', gameMode: 'guess_the_transfer', shortLabel: 'MKT' },
  { angle: 30, label: 'Rapid Recall', gameMode: 'guess_the_goalscorers', shortLabel: 'RCL' },
  { angle: 90, label: 'Pattern Recognition', gameMode: 'the_grid', shortLabel: 'PAT' },
  { angle: 150, label: 'Current Affairs', gameMode: 'topical_quiz', shortLabel: 'AFF' },
  { angle: 210, label: 'Strategic Logic', gameMode: 'tic_tac_toe', shortLabel: 'LOG' },
];

/**
 * Convert polar coordinates (angle + value) to cartesian (x, y)
 */
function polarToCartesian(
  angle: number,
  value: number,
  center: number,
  radius: number
): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  const scaledRadius = (value / 100) * radius;
  return {
    x: center + scaledRadius * Math.cos(radians),
    y: center + scaledRadius * Math.sin(radians),
  };
}

/**
 * Build SVG path string from proficiency data
 */
function buildRadarPath(
  proficiencies: GameProficiency[],
  center: number,
  radius: number
): string {
  const points = RADAR_AXES.map((axis) => {
    const prof = proficiencies.find((p) => p.gameMode === axis.gameMode);
    const value = prof?.percentage ?? 0;
    return polarToCartesian(axis.angle, value, center, radius);
  });

  // Build SVG path: M x0,y0 L x1,y1 L x2,y2 ... Z
  const pathData =
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
    ' Z';

  return pathData;
}

/**
 * Get text anchor based on angle for proper label positioning
 */
function getTextAnchor(angle: number): 'start' | 'middle' | 'end' {
  if (angle > 180 && angle < 360) return 'end';
  if (angle > 0 && angle < 180) return 'start';
  return 'middle';
}

/**
 * Get vertical alignment offset for labels
 */
function getVerticalOffset(angle: number): number {
  if (angle === 270) return -12; // Top
  if (angle === 90) return 18; // Bottom
  return 4; // Sides
}

export interface TacticalRadarChartProps {
  proficiencies: GameProficiency[];
  testID?: string;
}

function TacticalRadarChartComponent({ proficiencies, testID }: TacticalRadarChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [highlightedAxis, setHighlightedAxis] = useState<string | null>(null);

  // Chart dimensions - responsive to screen
  const SIZE = Math.min(screenWidth - spacing.xl * 2 - 40, 320);
  const CENTER = SIZE / 2;
  const RADIUS = SIZE / 2 - 40; // Leave room for labels
  const LABEL_RADIUS = RADIUS + 28; // Labels outside the chart

  // Animation value for grow-from-center effect
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      300, // Wait for card to appear
      withSpring(1, {
        damping: 14,
        stiffness: 80,
        mass: 0.8,
      })
    );
  }, [scale]);

  // Memoize the radar path calculation
  const radarPath = useMemo(
    () => buildRadarPath(proficiencies, CENTER, RADIUS),
    [proficiencies, CENTER, RADIUS]
  );

  // Data points for dots at each vertex
  const dataPoints = useMemo(
    () =>
      RADAR_AXES.map((axis) => {
        const prof = proficiencies.find((p) => p.gameMode === axis.gameMode);
        const value = prof?.percentage ?? 0;
        return {
          ...polarToCartesian(axis.angle, value, CENTER, RADIUS),
          value,
          gameMode: axis.gameMode,
        };
      }),
    [proficiencies, CENTER, RADIUS]
  );

  // Animated props for the filled path - scale from center
  const animatedPathProps = useAnimatedProps(() => {
    // Create scale transform around center point
    const s = scale.value;
    return {
      // We'll use opacity and a visual trick since transform on Path is complex
      opacity: interpolate(s, [0, 0.5, 1], [0, 0.5, 1]),
      strokeWidth: interpolate(s, [0, 1], [0, 2.5]),
    };
  });

  // Build background grid points (hexagon at each percentage level)
  const gridLevels = [25, 50, 75, 100];
  const buildGridPath = useCallback(
    (percentage: number) => {
      const points = RADAR_AXES.map((axis) =>
        polarToCartesian(axis.angle, percentage, CENTER, RADIUS)
      );
      return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    },
    [CENTER, RADIUS]
  );

  const handleAxisPress = useCallback((gameMode: string) => {
    setHighlightedAxis((prev) => (prev === gameMode ? null : gameMode));
  }, []);

  // Get highlighted skill name
  const highlightedSkill = highlightedAxis
    ? RADAR_AXES.find((a) => a.gameMode === highlightedAxis)?.label
    : null;

  const highlightedValue = highlightedAxis
    ? proficiencies.find((p) => p.gameMode === highlightedAxis)?.percentage ?? 0
    : null;

  return (
    <View style={styles.container} testID={testID}>
      {/* Highlighted skill display */}
      <View style={styles.highlightContainer}>
        {highlightedSkill ? (
          <>
            <Text style={styles.highlightLabel}>{highlightedSkill}</Text>
            <Text style={styles.highlightValue}>{highlightedValue}%</Text>
          </>
        ) : (
          <Text style={styles.highlightHint}>Tap an axis to see details</Text>
        )}
      </View>

      <View style={styles.chartContainer}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Background grid hexagons */}
          <G opacity={0.3}>
            {gridLevels.map((level) => (
              <Polygon
                key={level}
                points={buildGridPath(level)}
                fill="none"
                stroke={colors.glassBorder}
                strokeWidth={1}
              />
            ))}
          </G>

          {/* Axis lines from center to edge */}
          <G opacity={0.2}>
            {RADAR_AXES.map((axis) => {
              const endpoint = polarToCartesian(axis.angle, 100, CENTER, RADIUS);
              return (
                <Line
                  key={axis.gameMode}
                  x1={CENTER}
                  y1={CENTER}
                  x2={endpoint.x}
                  y2={endpoint.y}
                  stroke={colors.glassBorder}
                  strokeWidth={1}
                />
              );
            })}
          </G>

          {/* Filled radar area */}
          <AnimatedPath
            d={radarPath}
            fill={colors.pitchGreen}
            fillOpacity={0.25}
            stroke={colors.pitchGreen}
            animatedProps={animatedPathProps}
          />

          {/* Data points at each vertex */}
          {dataPoints.map((point, i) => (
            <AnimatedCircle
              key={RADAR_AXES[i].gameMode}
              cx={point.x}
              cy={point.y}
              r={highlightedAxis === RADAR_AXES[i].gameMode ? 7 : 5}
              fill={
                highlightedAxis === RADAR_AXES[i].gameMode
                  ? colors.cardYellow
                  : colors.pitchGreen
              }
              stroke={colors.floodlightWhite}
              strokeWidth={2}
            />
          ))}
        </Svg>

        {/* Axis labels (positioned absolutely around the chart) */}
        {RADAR_AXES.map((axis) => {
          const labelPos = polarToCartesian(axis.angle, 100, CENTER, LABEL_RADIUS);
          const isHighlighted = highlightedAxis === axis.gameMode;

          return (
            <Pressable
              key={axis.gameMode}
              onPress={() => handleAxisPress(axis.gameMode)}
              style={[
                styles.axisLabel,
                {
                  left: labelPos.x - 35,
                  top: labelPos.y + getVerticalOffset(axis.angle) - 10,
                },
              ]}
              hitSlop={8}
            >
              <Text
                style={[
                  styles.axisLabelText,
                  isHighlighted && styles.axisLabelHighlighted,
                ]}
              >
                {axis.shortLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {RADAR_AXES.map((axis) => {
          const prof = proficiencies.find((p) => p.gameMode === axis.gameMode);
          const isHighlighted = highlightedAxis === axis.gameMode;

          return (
            <Pressable
              key={axis.gameMode}
              onPress={() => handleAxisPress(axis.gameMode)}
              style={[styles.legendItem, isHighlighted && styles.legendItemHighlighted]}
            >
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: isHighlighted ? colors.cardYellow : colors.pitchGreen },
                ]}
              />
              <Text style={[styles.legendText, isHighlighted && styles.legendTextHighlighted]}>
                {axis.shortLabel}
              </Text>
              <Text style={styles.legendValue}>{prof?.percentage ?? 0}%</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Memoize to prevent unnecessary re-renders
export const TacticalRadarChart = memo(TacticalRadarChartComponent, (prev, next) => {
  // Only re-render if proficiency values actually change
  return JSON.stringify(prev.proficiencies) === JSON.stringify(next.proficiencies);
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  highlightContainer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  highlightLabel: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.cardYellow,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  highlightValue: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 14,
    color: colors.floodlightWhite,
  },
  highlightHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chartContainer: {
    position: 'relative',
  },
  axisLabel: {
    position: 'absolute',
    width: 70,
    alignItems: 'center',
  },
  axisLabelText: {
    fontFamily: fonts.headline,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  axisLabelHighlighted: {
    color: colors.cardYellow,
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  legendItemHighlighted: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  legendText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 11,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  legendTextHighlighted: {
    color: colors.cardYellow,
  },
  legendValue: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 11,
    color: colors.floodlightWhite,
  },
});
