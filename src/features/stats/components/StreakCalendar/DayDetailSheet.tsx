/**
 * DayDetailSheet Component
 *
 * Bottom sheet replacing the tooltip for day details.
 * Shows date, IQ earned, game mode completion icons, and CTA
 * to complete missing games in the archive.
 *
 * Benefits over tooltip:
 * - No clipping issues (slides from bottom)
 * - More content space
 * - Mobile-native interaction pattern
 * - Gesture dismiss support
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { Grid3X3, X } from 'lucide-react-native';
import { colors, fonts, borderRadius, spacing } from '@/theme';
import { CalendarDay } from '../../types/calendar.types';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { RULES_MAP } from '@/features/puzzles/constants/rules';
import { triggerMedium } from '@/lib/haptics';
import { ElevatedButton } from '@/components';

export interface DayDetailSheetProps {
  /** Day data to display (null when hidden) */
  day: CalendarDay | null;
  /** Whether sheet is visible */
  visible: boolean;
  /** Callback to dismiss sheet */
  onDismiss: () => void;
  /** Callback to navigate to archive for incomplete games */
  onCompleteGames: (date: string) => void;
  /** Test ID for testing */
  testID?: string;
}

const HANDLE_HEIGHT = 4;
const HANDLE_WIDTH = 40;

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
 * DayDetailSheet - Bottom sheet for calendar day details.
 *
 * Replaces tooltip with a mobile-native bottom sheet pattern.
 * Shows completion status and provides CTA to complete missing games.
 */
export function DayDetailSheet({
  day,
  visible,
  onDismiss,
  onCompleteGames,
  testID,
}: DayDetailSheetProps) {
  // Don't render anything when not visible - prevents touch interception during close
  if (!visible || !day) {
    return null;
  }

  const completedCount = day.count;
  const totalGames = day.gameModes.length;
  const hasIncomplete = completedCount < totalGames;
  const remainingGames = totalGames - completedCount;

  const handleCompletePress = () => {
    triggerMedium();
    onCompleteGames(day.date);
  };

  const handleDismiss = () => {
    onDismiss();
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <View style={styles.backdropFill} />
      </Pressable>

      {/* Sheet */}
      <View style={styles.sheet} testID={testID}>
        {/* Drag Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Close Button */}
        <Pressable
          onPress={handleDismiss}
          style={styles.closeButton}
          hitSlop={12}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <X size={20} color={colors.textSecondary} />
        </Pressable>

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
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.stadiumNavy,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'], // Safe area padding
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.glassBorder,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handle: {
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: HANDLE_HEIGHT / 2,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
