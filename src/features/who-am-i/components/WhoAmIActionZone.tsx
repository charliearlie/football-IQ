/**
 * WhoAmIActionZone Component
 *
 * Input area for player guesses and action buttons.
 * Uses the shared PlayerAutocomplete for player search.
 */

import { View, StyleSheet, Pressable, Text } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, fonts } from '@/theme';
import { PlayerAutocomplete } from '@/components';
import { UnifiedPlayer } from '@/services/oracle/types';

export interface WhoAmIActionZoneProps {
  onPlayerSelect: (player: UnifiedPlayer) => void;
  onTextSubmit: (text: string) => void;
  onRevealNextClue: () => void;
  canRevealMore: boolean;
  shouldShake: boolean;
  isGameOver: boolean;
  onGiveUp?: () => void;
  cluesRevealed: number;
  totalClues: number;
  testID?: string;
}

export function WhoAmIActionZone({
  onPlayerSelect,
  onTextSubmit,
  onRevealNextClue,
  canRevealMore,
  shouldShake,
  isGameOver,
  onGiveUp,
  cluesRevealed,
  totalClues,
  testID,
}: WhoAmIActionZoneProps) {
  if (isGameOver) return null;

  return (
    <View style={styles.container} testID={testID}>
      <PlayerAutocomplete
        onSelect={onPlayerSelect}
        onSubmitText={onTextSubmit}
        shouldShake={shouldShake}
        isGameOver={isGameOver}
        testID={testID ? `${testID}-autocomplete` : undefined}
      />

      <View style={styles.actionsRow}>
        {canRevealMore && (
          <Pressable
            style={styles.revealButton}
            onPress={onRevealNextClue}
            testID={testID ? `${testID}-reveal` : undefined}
          >
            <Text style={styles.revealText}>
              Next clue ({cluesRevealed}/{totalClues})
            </Text>
            <ChevronRight size={16} color={colors.amber} />
          </Pressable>
        )}

        {!canRevealMore && onGiveUp && (
          <Pressable
            style={styles.giveUpButton}
            onPress={onGiveUp}
            testID={testID ? `${testID}-give-up` : undefined}
          >
            <Text style={styles.giveUpText}>Give Up</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  revealText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.amber,
  },
  giveUpButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  giveUpText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
