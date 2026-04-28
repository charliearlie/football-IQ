/**
 * KnowledgeProfile - Hexagonal radar/spider chart for 6 knowledge axes.
 *
 * Renders a standard hexagon (60-degree intervals) using react-native-svg,
 * with a filled polygon connecting the 6 data points and vertex labels.
 * Wrapped in a glass card with entrance animation.
 */

import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Polygon, Line, G } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts, spacing, borderRadius } from '@/theme';

export interface KnowledgeProfileProps {
  axes: { label: string; value: number }[]; // 6 axes, 0-100 each
  insight: string;
}

const CHART_SIZE = 220;
const CENTER = CHART_SIZE / 2;
const RADIUS = 80;
const LABEL_RADIUS = RADIUS + 22;
const DOT_RADIUS = 4;

/**
 * Hexagon uses 60-degree intervals starting from the top vertex (270 degrees).
 * Angles in degrees: 270, 330, 30, 90, 150, 210
 */
const HEX_ANGLES_DEG = [270, 330, 30, 90, 150, 210];

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function polarToXY(angleDeg: number, r: number): { x: number; y: number } {
  const rad = degToRad(angleDeg);
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

function buildHexPoints(r: number): string {
  return HEX_ANGLES_DEG.map((a) => {
    const { x, y } = polarToXY(a, r);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

function buildDataPoints(values: number[]): string {
  return HEX_ANGLES_DEG.map((a, i) => {
    const clamped = Math.max(0, Math.min(100, values[i] ?? 0));
    const r = (clamped / 100) * RADIUS;
    const { x, y } = polarToXY(a, r);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

/** Label anchor/offset helpers so text doesn't overlap the chart */
function getLabelAnchor(angleDeg: number): 'start' | 'middle' | 'end' {
  if (angleDeg === 270 || angleDeg === 90) return 'middle';
  if (angleDeg > 270 || angleDeg < 90) return 'start';
  return 'end';
}

function getLabelDy(angleDeg: number): number {
  if (angleDeg === 270) return -4;
  if (angleDeg === 90) return 12;
  return 4;
}

const GRID_LEVELS = [25, 50, 75, 100];

export const KnowledgeProfile = memo(function KnowledgeProfile({
  axes,
  insight,
}: KnowledgeProfileProps) {
  const values = axes.map((a) => a.value);
  const dataPolygon = buildDataPoints(values);

  return (
    <Animated.View entering={FadeInDown.springify().damping(15).stiffness(300).mass(0.5)}>
      <View style={styles.card}>
        <Text style={styles.title}>KNOWLEDGE PROFILE</Text>

        <View style={styles.chartWrapper}>
          <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
            {/* Background grid hexagons */}
            <G opacity={0.25}>
              {GRID_LEVELS.map((level) => (
                <Polygon
                  key={level}
                  points={buildHexPoints((level / 100) * RADIUS)}
                  fill="none"
                  stroke={colors.glassBorder}
                  strokeWidth={1}
                />
              ))}
            </G>

            {/* Axis spoke lines */}
            <G opacity={0.2}>
              {HEX_ANGLES_DEG.map((angle, i) => {
                const endpoint = polarToXY(angle, RADIUS);
                return (
                  <Line
                    key={i}
                    x1={CENTER}
                    y1={CENTER}
                    x2={endpoint.x.toFixed(2)}
                    y2={endpoint.y.toFixed(2)}
                    stroke={colors.glassBorder}
                    strokeWidth={1}
                  />
                );
              })}
            </G>

            {/* Data polygon — filled area */}
            <Polygon
              points={dataPolygon}
              fill={colors.pitchGreen}
              fillOpacity={0.2}
              stroke={colors.pitchGreen}
              strokeWidth={2}
            />

            {/* Value dots at each data vertex */}
            {HEX_ANGLES_DEG.map((angle, i) => {
              const clamped = Math.max(0, Math.min(100, values[i] ?? 0));
              const r = (clamped / 100) * RADIUS;
              const { x, y } = polarToXY(angle, r);
              return (
                <Circle
                  key={i}
                  cx={x.toFixed(2)}
                  cy={y.toFixed(2)}
                  r={DOT_RADIUS}
                  fill={colors.pitchGreen}
                />
              );
            })}
          </Svg>

          {/* Axis labels — rendered as absolute Views over the SVG */}
          {HEX_ANGLES_DEG.map((angle, i) => {
            const { x, y } = polarToXY(angle, LABEL_RADIUS);
            const anchor = getLabelAnchor(angle);
            const dy = getLabelDy(angle);
            return (
              <Text
                key={i}
                style={[
                  styles.axisLabel,
                  {
                    position: 'absolute',
                    left: x - 36,
                    top: y + dy - 8,
                    width: 72,
                    textAlign:
                      anchor === 'start' ? 'left' : anchor === 'end' ? 'right' : 'center',
                  },
                ]}
                numberOfLines={2}
              >
                {axes[i]?.label ?? ''}
              </Text>
            );
          })}
        </View>

        <Text style={styles.insight}>{insight}</Text>
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
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.floodlightWhite,
    letterSpacing: 1,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  chartWrapper: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  axisLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.floodlightWhite,
    lineHeight: 14,
  },
  insight: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
});
