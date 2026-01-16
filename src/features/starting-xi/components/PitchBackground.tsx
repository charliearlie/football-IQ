/**
 * PitchBackground Component
 *
 * SVG-based football pitch markings overlay.
 * Renders standard pitch lines: touchlines, center line, center circle,
 * penalty areas, goal areas, and penalty spots.
 *
 * Uses semi-transparent white lines to overlay on the green pitch background.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect, Circle, Line, Path } from 'react-native-svg';

interface PitchBackgroundProps {
  /** Width of the pitch container */
  width: number;
  /** Height of the pitch container */
  height: number;
}

// Line color and width
const LINE_COLOR = 'rgba(255, 255, 255, 0.25)';
const LINE_WIDTH = 2;

/**
 * PitchBackground - Football pitch markings
 *
 * Coordinate system matches the position system:
 * - Top of SVG = attacking end (y=0 in position coords)
 * - Bottom of SVG = defensive end (y=100 in position coords)
 */
export function PitchBackground({ width, height }: PitchBackgroundProps) {
  // Calculate proportional sizes based on actual pitch dimensions
  // Standard pitch: 105m x 68m, but we use vertical orientation
  const penaltyAreaWidth = width * 0.6; // Wider penalty area
  const penaltyAreaHeight = height * 0.16;
  const goalAreaWidth = width * 0.35;
  const goalAreaHeight = height * 0.06;
  const centerCircleRadius = Math.min(width, height) * 0.12;
  const penaltySpotRadius = 3;

  // Positions
  const centerX = width / 2;
  const centerY = height / 2;

  // Penalty areas (top and bottom)
  const topPenaltyX = (width - penaltyAreaWidth) / 2;
  const bottomPenaltyX = (width - penaltyAreaWidth) / 2;

  // Goal areas (top and bottom)
  const topGoalAreaX = (width - goalAreaWidth) / 2;
  const bottomGoalAreaX = (width - goalAreaWidth) / 2;

  // Penalty spots
  const topPenaltySpotY = height * 0.11;
  const bottomPenaltySpotY = height * 0.89;

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={width} height={height}>
        {/* Outer boundary */}
        <Rect
          x={LINE_WIDTH / 2}
          y={LINE_WIDTH / 2}
          width={width - LINE_WIDTH}
          height={height - LINE_WIDTH}
          stroke={LINE_COLOR}
          strokeWidth={LINE_WIDTH}
          fill="none"
          rx={8}
          ry={8}
        />

        {/* Center line */}
        <Line
          x1={0}
          y1={centerY}
          x2={width}
          y2={centerY}
          stroke={LINE_COLOR}
          strokeWidth={LINE_WIDTH}
        />

        {/* Center circle */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={centerCircleRadius}
          stroke={LINE_COLOR}
          strokeWidth={LINE_WIDTH}
          fill="none"
        />

        {/* Center spot */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={penaltySpotRadius}
          fill={LINE_COLOR}
        />

        {/* Top penalty area (attacking end) */}
        <Rect
          x={topPenaltyX}
          y={0}
          width={penaltyAreaWidth}
          height={penaltyAreaHeight}
          stroke={LINE_COLOR}
          strokeWidth={LINE_WIDTH}
          fill="none"
        />

        {/* Top goal area */}
        <Rect
          x={topGoalAreaX}
          y={0}
          width={goalAreaWidth}
          height={goalAreaHeight}
          stroke={LINE_COLOR}
          strokeWidth={LINE_WIDTH}
          fill="none"
        />

        {/* Top penalty spot */}
        <Circle
          cx={centerX}
          cy={topPenaltySpotY}
          r={penaltySpotRadius}
          fill={LINE_COLOR}
        />

        {/* Top penalty arc */}
        <Path
          d={`M ${centerX - centerCircleRadius * 0.7} ${penaltyAreaHeight}
              A ${centerCircleRadius} ${centerCircleRadius} 0 0 0
              ${centerX + centerCircleRadius * 0.7} ${penaltyAreaHeight}`}
          stroke={LINE_COLOR}
          strokeWidth={LINE_WIDTH}
          fill="none"
        />

        {/* Bottom penalty area (defensive end) */}
        <Rect
          x={bottomPenaltyX}
          y={height - penaltyAreaHeight}
          width={penaltyAreaWidth}
          height={penaltyAreaHeight}
          stroke={LINE_COLOR}
          strokeWidth={LINE_WIDTH}
          fill="none"
        />

        {/* Bottom goal area */}
        <Rect
          x={bottomGoalAreaX}
          y={height - goalAreaHeight}
          width={goalAreaWidth}
          height={goalAreaHeight}
          stroke={LINE_COLOR}
          strokeWidth={LINE_WIDTH}
          fill="none"
        />

        {/* Bottom penalty spot */}
        <Circle
          cx={centerX}
          cy={bottomPenaltySpotY}
          r={penaltySpotRadius}
          fill={LINE_COLOR}
        />

        {/* Bottom penalty arc */}
        <Path
          d={`M ${centerX - centerCircleRadius * 0.7} ${height - penaltyAreaHeight}
              A ${centerCircleRadius} ${centerCircleRadius} 0 0 1
              ${centerX + centerCircleRadius * 0.7} ${height - penaltyAreaHeight}`}
          stroke={LINE_COLOR}
          strokeWidth={LINE_WIDTH}
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
