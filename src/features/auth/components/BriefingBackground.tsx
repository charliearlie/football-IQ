/**
 * BriefingBackground Component
 *
 * SVG-based tactical pattern overlay for the onboarding briefing screen.
 * Renders faint formation lines and player position dots suggesting
 * a 4-3-3 formation to evoke the "football manager" aesthetic.
 *
 * Uses very subtle opacity to avoid distracting from content.
 */

import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

// Very subtle pattern colors
const LINE_COLOR = 'rgba(255, 255, 255, 0.04)';
const DOT_COLOR = 'rgba(255, 255, 255, 0.06)';
const ARROW_COLOR = 'rgba(255, 255, 255, 0.03)';
const LINE_WIDTH = 1;

/**
 * BriefingBackground - Tactical formation overlay
 *
 * Creates a subtle background pattern suggesting a 4-3-3 formation
 * with connecting lines and movement arrows.
 */
export function BriefingBackground() {
  const { width, height } = useWindowDimensions();

  // Formation positions (as percentage of screen)
  // Arranged in a 4-3-3 pattern
  const positions = {
    // Goalkeeper
    gk: { x: 0.5, y: 0.9 },
    // Defense (4)
    lb: { x: 0.15, y: 0.75 },
    lcb: { x: 0.35, y: 0.78 },
    rcb: { x: 0.65, y: 0.78 },
    rb: { x: 0.85, y: 0.75 },
    // Midfield (3)
    lm: { x: 0.25, y: 0.55 },
    cm: { x: 0.5, y: 0.58 },
    rm: { x: 0.75, y: 0.55 },
    // Attack (3)
    lw: { x: 0.2, y: 0.32 },
    st: { x: 0.5, y: 0.28 },
    rw: { x: 0.8, y: 0.32 },
  };

  // Convert percentage to actual coordinates
  const pos = (p: { x: number; y: number }) => ({
    x: p.x * width,
    y: p.y * height,
  });

  // Connection lines between positions
  const connections: [keyof typeof positions, keyof typeof positions][] = [
    // GK to defense
    ['gk', 'lcb'],
    ['gk', 'rcb'],
    // Defense line
    ['lb', 'lcb'],
    ['lcb', 'rcb'],
    ['rcb', 'rb'],
    // Defense to midfield
    ['lcb', 'lm'],
    ['lcb', 'cm'],
    ['rcb', 'cm'],
    ['rcb', 'rm'],
    // Midfield line
    ['lm', 'cm'],
    ['cm', 'rm'],
    // Midfield to attack
    ['lm', 'lw'],
    ['cm', 'st'],
    ['rm', 'rw'],
    // Attack line
    ['lw', 'st'],
    ['st', 'rw'],
  ];

  // Movement arrows (showing attacking intent)
  const arrows: { from: keyof typeof positions; direction: 'up' | 'diagonal-left' | 'diagonal-right' }[] = [
    { from: 'lw', direction: 'up' },
    { from: 'st', direction: 'up' },
    { from: 'rw', direction: 'up' },
    { from: 'lm', direction: 'diagonal-left' },
    { from: 'rm', direction: 'diagonal-right' },
  ];

  const renderArrow = (
    from: { x: number; y: number },
    direction: 'up' | 'diagonal-left' | 'diagonal-right',
    index: number
  ) => {
    const length = height * 0.08;
    let endX = from.x;
    let endY = from.y - length;

    if (direction === 'diagonal-left') {
      endX = from.x - length * 0.5;
      endY = from.y - length * 0.7;
    } else if (direction === 'diagonal-right') {
      endX = from.x + length * 0.5;
      endY = from.y - length * 0.7;
    }

    // Arrow head
    const arrowSize = 8;
    const angle = Math.atan2(endY - from.y, endX - from.x);
    const arrowLeft = {
      x: endX - arrowSize * Math.cos(angle - Math.PI / 6),
      y: endY - arrowSize * Math.sin(angle - Math.PI / 6),
    };
    const arrowRight = {
      x: endX - arrowSize * Math.cos(angle + Math.PI / 6),
      y: endY - arrowSize * Math.sin(angle + Math.PI / 6),
    };

    return (
      <React.Fragment key={`arrow-${index}`}>
        {/* Arrow line */}
        <Line
          x1={from.x}
          y1={from.y}
          x2={endX}
          y2={endY}
          stroke={ARROW_COLOR}
          strokeWidth={LINE_WIDTH}
          strokeDasharray="4,4"
        />
        {/* Arrow head */}
        <Path
          d={`M ${endX} ${endY} L ${arrowLeft.x} ${arrowLeft.y} M ${endX} ${endY} L ${arrowRight.x} ${arrowRight.y}`}
          stroke={ARROW_COLOR}
          strokeWidth={LINE_WIDTH}
          fill="none"
        />
      </React.Fragment>
    );
  };

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="fadeGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0F172A" stopOpacity="0" />
            <Stop offset="0.3" stopColor="#0F172A" stopOpacity="0" />
            <Stop offset="1" stopColor="#0F172A" stopOpacity="0.8" />
          </LinearGradient>
        </Defs>

        {/* Connection lines */}
        {connections.map(([from, to], index) => {
          const fromPos = pos(positions[from]);
          const toPos = pos(positions[to]);
          return (
            <Line
              key={`line-${index}`}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke={LINE_COLOR}
              strokeWidth={LINE_WIDTH}
            />
          );
        })}

        {/* Position dots */}
        {Object.entries(positions).map(([key, position]) => {
          const p = pos(position);
          return (
            <Circle
              key={`dot-${key}`}
              cx={p.x}
              cy={p.y}
              r={6}
              fill={DOT_COLOR}
            />
          );
        })}

        {/* Movement arrows */}
        {arrows.map((arrow, index) => {
          const fromPos = pos(positions[arrow.from]);
          return renderArrow(fromPos, arrow.direction, index);
        })}
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
