/**
 * MonthHeader Component
 *
 * Displays month name with optional flame icon showing longest streak
 * within that month. Creates a "micro-challenge" every 30 days.
 *
 * Now includes navigation arrows for single-month view navigation.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, fonts, spacing, borderRadius } from '@/theme';

export interface MonthHeaderProps {
  /** Month name (e.g., "January 2026") */
  monthName: string;
  /** Longest streak within this month */
  longestStreak: number;
  /** Total IQ earned this month */
  totalIQ: number;
  /** Whether this is the current month */
  isCurrentMonth?: boolean;
  /** Callback to navigate to previous (older) month */
  onPrevious?: () => void;
  /** Callback to navigate to next (newer) month */
  onNext?: () => void;
  /** Whether there's a previous month to navigate to */
  hasPrevious?: boolean;
  /** Whether there's a next month to navigate to */
  hasNext?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * MonthHeader - Displays month name with streak flame indicator and navigation.
 *
 * The flame icon creates a "micro-challenge" per month, which is
 * less intimidating than a full year but keeps users engaged daily.
 *
 * Navigation arrows allow browsing through months in single-month view.
 */
export function MonthHeader({
  monthName,
  longestStreak,
  totalIQ,
  isCurrentMonth = false,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  testID,
}: MonthHeaderProps) {
  return (
    <View style={styles.container} testID={testID}>
      {/* Previous Month Arrow (goes to older months) */}
      <Pressable
        onPress={onPrevious}
        disabled={!hasPrevious}
        style={[styles.navButton, !hasPrevious && styles.navButtonDisabled]}
        hitSlop={8}
        accessibilityLabel="Previous month"
        accessibilityRole="button"
      >
        <ChevronLeft
          size={24}
          color={hasPrevious ? colors.floodlightWhite : 'rgba(255, 255, 255, 0.2)'}
        />
      </Pressable>

      {/* Center Content: Month name, flame, IQ */}
      <View style={styles.centerContent}>
        <View style={styles.monthRow}>
          <Text style={[styles.monthName, isCurrentMonth && styles.monthNameCurrent]}>
            {monthName}
          </Text>
          {longestStreak > 0 && (
            <View style={styles.flameContainer}>
              <Flame
                size={14}
                color={longestStreak >= 7 ? colors.cardYellow : colors.warningOrange}
                fill={longestStreak >= 7 ? colors.cardYellow : 'transparent'}
              />
              <Text style={styles.streakText}>{longestStreak}</Text>
            </View>
          )}
        </View>
        {totalIQ > 0 && (
          <Text style={styles.iqText}>+{totalIQ} IQ</Text>
        )}
      </View>

      {/* Next Month Arrow (goes to newer months) */}
      <Pressable
        onPress={onNext}
        disabled={!hasNext}
        style={[styles.navButton, !hasNext && styles.navButtonDisabled]}
        hitSlop={8}
        accessibilityLabel="Next month"
        accessibilityRole="button"
      >
        <ChevronRight
          size={24}
          color={hasNext ? colors.floodlightWhite : 'rgba(255, 255, 255, 0.2)'}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  navButtonDisabled: {
    backgroundColor: 'transparent',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  monthName: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  monthNameCurrent: {
    color: colors.floodlightWhite,
  },
  flameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
  },
  streakText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    color: colors.cardYellow,
  },
  iqText: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '600',
    color: colors.pitchGreen,
    marginTop: 2,
  },
});
