/**
 * WhosThatActionZone Component
 *
 * Input area for player guesses.
 * Uses the shared PlayerAutocomplete for player search.
 */

import { View, StyleSheet, Text, Platform } from 'react-native';
import { colors, spacing, fonts } from '@/theme';
import { PlayerAutocomplete } from '@/components';
import { UnifiedPlayer } from '@/services/oracle/types';
import { getGameModeColor } from '@/theme/gameModeColors';

const modeColor = getGameModeColor('whos-that');

export interface WhosThatActionZoneProps {
  onPlayerSelect: (player: UnifiedPlayer) => void;
  shouldShake: boolean;
  isGameOver: boolean;
  remainingGuesses: number;
  maxGuesses: number;
  testID?: string;
}

export function WhosThatActionZone({
  onPlayerSelect,
  shouldShake,
  isGameOver,
  remainingGuesses,
  maxGuesses,
  testID,
}: WhosThatActionZoneProps) {
  if (isGameOver) return null;

  const guessesUsed = maxGuesses - remainingGuesses;

  return (
    <View style={styles.container} testID={testID}>
      {/* Status row: guesses left + life dots */}
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>
          {remainingGuesses} {remainingGuesses === 1 ? 'GUESS' : 'GUESSES'} LEFT
        </Text>
        <View style={styles.lifeDots}>
          {Array.from({ length: maxGuesses }, (_, i) => (
            <View
              key={i}
              style={[
                styles.lifeDot,
                i < guessesUsed && styles.lifeDotUsed,
              ]}
            />
          ))}
        </View>
      </View>

      <PlayerAutocomplete
        onSelect={onPlayerSelect}
        shouldShake={shouldShake}
        isGameOver={isGameOver}
        selectOnly
        filter={(player) => !!player.position_category}
        searchOptions={{ activeOnly: true }}
        testID={testID ? `${testID}-autocomplete` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    backgroundColor: colors.stadiumNavy,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  statusText: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  lifeDots: {
    flexDirection: 'row',
    gap: 4,
  },
  lifeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: modeColor.primary,
    shadowColor: modeColor.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 3,
  },
  lifeDotUsed: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
});
