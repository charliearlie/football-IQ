/**
 * DayDetailSheet Component
 *
 * Content component for the day detail native formSheet.
 * Shows date, IQ earned, game mode completion icons, and CTA
 * to complete missing games in the archive.
 *
 * Rendered inside app/day-detail-sheet.tsx route with
 * presentation: 'formSheet' for native sheet + Liquid Glass on iOS 26.
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Grid3X3 } from 'lucide-react-native';
import { colors, fonts, borderRadius, spacing } from '@/theme';
import { CalendarDay } from '../../types/calendar.types';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { RULES_MAP } from '@/features/puzzles/constants/rules';
import { triggerMedium } from '@/lib/haptics';
import { ElevatedButton } from '@/components';

export interface DayDetailSheetProps {
  /** Day data to display */
  day: CalendarDay;
  /** Callback to navigate to archive for incomplete games */
  onCompleteGames: (date: string) => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Format date for display.
 * Returns "Tuesday 14th January 2026" format.
 */
function formatDetailDate(dateString: string): string {
  const date = new Date(dateString);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();

  // Add ordinal suffix
  const suffix =
    day === 1 || day === 21 || day === 31
      ? 'st'
      : day === 2 || day === 22
        ? 'nd'
        : day === 3 || day === 23
          ? 'rd'
          : 'th';

  return `${dayName} ${day}${suffix} ${month} ${year}`;
}

const ICON_SIZE = 26;

/**
 * Get icon component for a game mode.
 * Uses PNG icons from RULES_MAP with Grid3X3 Lucide fallback for the_grid.
 */
function GameModeIcon({
  gameMode,
  completed,
}: {
  gameMode: GameMode;
  completed: boolean;
}) {
  const rules = RULES_MAP[gameMode];
  const iconSource = rules?.icon;
  // Grid icon needs different colors based on background
  const gridIconColor = completed ? colors.pitchGreen : 'rgba(255, 255, 255, 0.6)';

  return (
    <View
      style={[
        styles.gameModeIcon,
        completed ? styles.gameModeCompleted : styles.gameModeIncomplete,
      ]}
    >
      {iconSource ? (
        <Image
          source={iconSource}
          style={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            opacity: completed ? 1 : 0.6,
          }}
          resizeMode="contain"
        />
      ) : (
        // Fallback for the_grid which has no PNG icon
        <Grid3X3 size={22} color={gridIconColor} />
      )}
    </View>
  );
}

/**
 * DayDetailSheet - Content for the calendar day detail native formSheet.
 *
 * Shows completion status and provides CTA to complete missing games.
 * Rendered inside a native formSheet route (app/day-detail-sheet.tsx).
 */
export function DayDetailSheet({
  day,
  onCompleteGames,
  testID,
}: DayDetailSheetProps) {
  const completedCount = day.count;
  const totalGames = day.gameModes.length;
  const hasIncomplete = completedCount < totalGames;
  const remainingGames = totalGames - completedCount;

  const handleCompletePress = () => {
    triggerMedium();
    onCompleteGames(day.date);
  };

  return (
    <View style={styles.container} testID={testID}>
      {/* Date */}
      <Text style={styles.dateText}>{formatDetailDate(day.date)}</Text>

      {/* IQ Earned */}
      <Text style={styles.iqText}>
        {day.totalIQ > 0 ? `+${day.totalIQ}` : '0'} IQ
      </Text>

      {/* Game Mode Icons */}
      <View style={styles.gameModeRow}>
        {day.gameModes.map((gm, index) => (
          <GameModeIcon
            key={`${gm.gameMode}-${index}`}
            gameMode={gm.gameMode}
            completed={gm.completed}
          />
        ))}
      </View>

      {/* Completion Count */}
      <Text style={styles.countText}>
        {completedCount} of {totalGames} games completed
      </Text>

      {/* CTA for incomplete days */}
      {hasIncomplete && (
        <View style={styles.ctaContainer}>
          <ElevatedButton
            title="Complete Missing Games"
            onPress={handleCompletePress}
            size="large"
            fullWidth
          />
          <Text style={styles.motivationText}>
            {remainingGames === 1
              ? '1 more game to perfect day!'
              : `${remainingGames} more games to perfect day!`}
          </Text>
        </View>
      )}

      {/* Perfect day message */}
      {!hasIncomplete && totalGames > 0 && (
        <View style={styles.perfectContainer}>
          <Text style={styles.perfectText}>🎉 Perfect Day!</Text>
        </View>
      )}

      {/* No games available message */}
      {totalGames === 0 && (
        <View style={styles.noGamesContainer}>
          <Text style={styles.noGamesText}>No games available for this day</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  dateText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.floodlightWhite,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  iqText: {
    fontFamily: fonts.headline,
    fontSize: 32,
    color: colors.pitchGreen,
    marginBottom: spacing.lg,
  },
  gameModeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  gameModeIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameModeCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: colors.pitchGreen,
  },
  gameModeIncomplete: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  countText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  ctaContainer: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  motivationText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.cardYellow,
    textAlign: 'center',
  },
  perfectContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  perfectText: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.cardYellow,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noGamesContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  noGamesText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
