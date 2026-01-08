/**
 * Scoreboard component for Goalscorer Recall.
 *
 * Displays goals in two columns (home | away) with GoalSlot items.
 * Handles high-scoring games with ScrollView.
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { RefObject } from 'react';
import { colors, textStyles, spacing, borderRadius, fonts, fontWeights } from '@/theme';
import { GoalSlot } from './GoalSlot';
import type { GoalWithState } from '../types/goalscorerRecall.types';

interface ScoreboardProps {
  homeTeam: string;
  awayTeam: string;
  homeGoals: GoalWithState[];
  awayGoals: GoalWithState[];
  lastFoundGoalId?: string;
  /** Optional ref for parent to control scroll position */
  scrollRef?: RefObject<ScrollView>;
}

export function Scoreboard({
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  lastFoundGoalId,
  scrollRef,
}: ScoreboardProps) {
  return (
    <View style={styles.container}>
      {/* Column Headers */}
      <View style={styles.headerRow}>
        <View style={styles.columnHeader}>
          <Text style={[textStyles.caption, styles.teamLabel]} numberOfLines={1}>
            {homeTeam}
          </Text>
        </View>
        <View style={styles.columnHeader}>
          <Text style={[textStyles.caption, styles.teamLabel]} numberOfLines={1}>
            {awayTeam}
          </Text>
        </View>
      </View>

      {/* Goals Columns */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        <View style={styles.columnsContainer}>
          {/* Home Goals */}
          <View style={styles.column}>
            {homeGoals.length > 0 ? (
              homeGoals.map((goal) => (
                <GoalSlot
                  key={goal.id}
                  goal={goal}
                  isJustFound={goal.id === lastFoundGoalId}
                />
              ))
            ) : (
              <View style={styles.emptyColumn}>
                <Text style={styles.emptyText}>No goals</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Away Goals */}
          <View style={styles.column}>
            {awayGoals.length > 0 ? (
              awayGoals.map((goal) => (
                <GoalSlot
                  key={goal.id}
                  goal={goal}
                  isJustFound={goal.id === lastFoundGoalId}
                />
              ))
            ) : (
              <View style={styles.emptyColumn}>
                <Text style={styles.emptyText}>No goals</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  columnHeader: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  teamLabel: {
    color: colors.floodlightWhite,
    opacity: 0.7,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  columnsContainer: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.xs,
  },
  emptyColumn: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    color: colors.floodlightWhite,
    opacity: 0.4,
  },
});
