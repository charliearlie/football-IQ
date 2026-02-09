import { View, StyleSheet, Platform, Pressable, Text } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, fonts, layout } from '@/theme';
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
  /** Called when user taps give up (only shown when all clues revealed) */
  onGiveUp?: () => void;
  /** Whether all career steps have been revealed */
  allCluesRevealed?: boolean;
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
 * Positioned absolutely at the bottom with glass effect.
 */
export function ActionZone({
  onPlayerSelect,
  onTextSubmit,
  onRevealNext,
  canRevealMore,
  shouldShake,
  isGameOver,
  onFocus,
  onGiveUp,
  allCluesRevealed,
  testID,
}: ActionZoneProps) {
  return (
    <View style={styles.wrapper} testID={testID}>
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.container}>
        <PlayerAutocomplete
          onSelect={onPlayerSelect}
          onSubmitText={onTextSubmit}
          shouldShake={shouldShake}
          isGameOver={isGameOver}
          onFocus={onFocus}
          testID={testID ? `${testID}-autocomplete` : undefined}
          // The component handles its own internal styling, but we ensure it contrasts well
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

        {/* Give Up - shown only when all clues revealed */}
        {allCluesRevealed && !isGameOver && onGiveUp && (
          <Pressable
            onPress={onGiveUp}
            style={({ pressed }) => [
              styles.revealLink,
              pressed && styles.revealLinkPressed,
            ]}
            testID={testID ? `${testID}-giveup` : undefined}
          >
            <Text style={styles.giveUpText}>Give up</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)', // Semi-transparent stadiumNavy
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
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
  giveUpText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.redCard,
  },
});
