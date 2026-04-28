/**
 * ClutchRating - Displays the user's last-guess save percentage.
 *
 * Shows a large clutch % number, a bicolor progress bar (green/red),
 * and a contextual sub-label describing saves vs pressure moments.
 */

import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts, spacing, borderRadius } from '@/theme';

export interface ClutchRatingProps {
  clutchPercent: number;       // 0-100
  clutchWins: number;          // number of last-guess saves
  pressureMoments: number;     // total times in pressure situations
  label: string;               // e.g. "CLUTCH GOD"
}

export const ClutchRating = memo(function ClutchRating({
  clutchPercent,
  clutchWins,
  pressureMoments,
  label,
}: ClutchRatingProps) {
  const clampedPercent = Math.max(0, Math.min(100, clutchPercent));
  const greenFlex = clampedPercent;
  const redFlex = 100 - clampedPercent;

  return (
    <Animated.View entering={FadeInDown.springify().damping(15).stiffness(300).mass(0.5)}>
      <View style={styles.card}>
        <Text style={styles.title}>CLUTCH RATING</Text>

        {/* Large percentage */}
        <Text style={styles.percentValue}>{clampedPercent}%</Text>

        {/* Label */}
        <Text style={styles.label}>{label}</Text>

        {/* Bicolor bar */}
        <View style={styles.barContainer}>
          {greenFlex > 0 && (
            <View style={[styles.barFill, { flex: greenFlex }]} />
          )}
          {redFlex > 0 && (
            <View style={[styles.barChoke, { flex: redFlex }]} />
          )}
        </View>

        {/* Sub-label */}
        <Text style={styles.subLabel}>
          {clutchWins} last-guess {clutchWins === 1 ? 'save' : 'saves'} from{' '}
          {pressureMoments} pressure {pressureMoments === 1 ? 'moment' : 'moments'}
        </Text>
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
  title: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.floodlightWhite,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  percentValue: {
    fontFamily: fonts.stats,
    fontSize: 48,
    color: colors.floodlightWhite,
    lineHeight: 56,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.pitchGreen,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  barContainer: {
    height: 8,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  barFill: {
    height: 8,
    backgroundColor: colors.pitchGreen,
  },
  barChoke: {
    height: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  subLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
