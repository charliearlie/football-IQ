import { View, StyleSheet, Platform, Pressable, Text } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, fonts, borderRadius } from '@/theme';
import { PlayerAutocomplete } from '@/components';
import { UnifiedPlayer } from '@/services/oracle/types';

export interface ActionZoneProps {
  /** Called when user selects a player from the autocomplete dropdown */
  onPlayerSelect: (player: UnifiedPlayer) => void;
  /** Called when user submits typed text without selecting from dropdown */
  onTextSubmit: (text: string) => void;
  /** Handler for revealing next step */
  onRevealNext: () => void;
  /** Whether more steps can be revealed */
  canRevealMore: boolean;
  /** Whether to trigger shake animation */
  shouldShake: boolean;
  /** Whether the game is over */
  isGameOver: boolean;
  /** Callback when input gains focus (for scroll-to-latest behavior) */
  onFocus?: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ActionZone - The input and action buttons area.
 *
 * Layout:
 * - PlayerAutocomplete (inline input + submit button with dropdown)
 * - "Reveal next step" text link (amber, only shown when more steps available)
 *
 * The input field shakes on incorrect guesses for visual feedback.
 */
export function ActionZone({
  onPlayerSelect,
  onTextSubmit,
  onRevealNext,
  canRevealMore,
  shouldShake,
  isGameOver,
  onFocus,
  testID,
}: ActionZoneProps) {
  return (
    <View style={styles.container} testID={testID}>
      <PlayerAutocomplete
        onSelect={onPlayerSelect}
        onSubmitText={onTextSubmit}
        shouldShake={shouldShake}
        isGameOver={isGameOver}
        onFocus={onFocus}
        testID={testID ? `${testID}-autocomplete` : undefined}
      />

      {/* Reveal Next - subtle text link (costly action) */}
      {canRevealMore && !isGameOver && (
        <Pressable
          onPress={onRevealNext}
          style={({ pressed }) => [
            styles.revealLink,
            pressed && styles.revealLinkPressed,
          ]}
          testID={`${testID}-reveal`}
        >
          <ChevronRight size={18} color={colors.amber} />
          <Text style={styles.revealText}>Reveal next step</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.lg,
    backgroundColor: colors.stadiumNavy,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    gap: spacing.md,
  },
  revealLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  revealLinkPressed: {
    opacity: 0.7,
  },
  revealText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.amber,
  },
});
