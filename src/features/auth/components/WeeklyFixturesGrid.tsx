/**
 * WeeklyFixturesGrid Component
 *
 * Two-column grid displaying all game mode fixtures for the briefing screen.
 * Shows the weekly schedule to introduce users to available content.
 */

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors, spacing, fonts, fontWeights } from '@/theme';
import { FixtureCard } from './FixtureCard';
import { BRIEFING_FIXTURES } from '../constants/briefingSchedule';

interface WeeklyFixturesGridProps {
  /** Test ID for testing */
  testID?: string;
}

/**
 * WeeklyFixturesGrid - Schedule display grid
 *
 * Renders a two-column grid of fixture cards showing
 * all available game modes and their schedule.
 */
export function WeeklyFixturesGrid({ testID }: WeeklyFixturesGridProps) {
  const { width } = useWindowDimensions();

  // Calculate card width for 2-column layout with gap
  // Account for screen padding (lg on each side) and gap between cards
  const containerPadding = spacing.lg * 2;
  const gap = spacing.sm;
  const cardWidth = (width - containerPadding - gap) / 2;

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.header}>YOUR WEEKLY FIXTURES</Text>

      <View style={styles.grid}>
        {BRIEFING_FIXTURES.map((fixture, index) => (
          <View
            key={fixture.gameMode + fixture.days}
            style={[styles.cardWrapper, { width: cardWidth }]}
          >
            <FixtureCard
              fixture={fixture}
              testID={testID ? `${testID}-card-${index}` : undefined}
            />
          </View>
        ))}
      </View>

      <Text style={styles.hint}>
        New puzzles drop daily at midnight
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cardWrapper: {
    // Width calculated dynamically
  },
  hint: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
