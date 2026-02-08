import { View, StyleSheet, Platform, Pressable, Text } from "react-native";
import { colors, spacing, fonts } from "@/theme";
import { ClubAutocomplete } from "@/components";
import type { UnifiedClub } from "@/services/club";

export interface TheThreadActionZoneProps {
  /** Called when user selects a club from the autocomplete dropdown */
  onClubSelect: (club: UnifiedClub) => void;
  /** Called when user submits typed text without selecting from dropdown */
  onTextSubmit?: (text: string) => void;
  /** Whether to trigger shake animation */
  shouldShake: boolean;
  /** Whether the game is over */
  isGameOver: boolean;
  /** Callback when input gains focus */
  onFocus?: () => void;
  /** Called when user taps give up */
  onGiveUp: () => void;
  /** Called when user wants to reveal a hidden hint */
  onRevealHint?: () => void;
  /** Whether the user can reveal another hint */
  canRevealHint?: boolean;
  /** Number of hints revealed so far */
  hintsRevealed?: number;
  /** Total number of hidden brands available */
  totalHiddenBrands?: number;
  /** Test ID for testing */
  testID?: string;
}

/**
 * TheThreadActionZone - Input area for The Thread game.
 *
 * Layout:
 * - ClubAutocomplete (search clubs with dropdown above)
 * - "Give up" text link (red, shown while playing)
 *
 * The input field shakes on incorrect guesses for visual feedback.
 */
export function TheThreadActionZone({
  onClubSelect,
  onTextSubmit,
  shouldShake,
  isGameOver,
  onFocus,
  onGiveUp,
  onRevealHint,
  canRevealHint = false,
  hintsRevealed = 0,
  totalHiddenBrands = 0,
  testID,
}: TheThreadActionZoneProps) {
  return (
    <View style={styles.container} testID={testID}>
      <ClubAutocomplete
        onSelect={onClubSelect}
        onSubmitText={onTextSubmit}
        shouldShake={shouldShake}
        disabled={isGameOver}
        placeholder="Which club had these sponsors?"
        onFocus={onFocus}
        testID={testID ? `${testID}-autocomplete` : undefined}
      />

      {/* Reveal Hint button - shown when hidden brands are available */}
      {!isGameOver && canRevealHint && (
        <Pressable
          onPress={onRevealHint}
          style={({ pressed }) => [
            styles.revealHintButton,
            pressed && styles.revealHintButtonPressed,
          ]}
          testID={testID ? `${testID}-reveal-hint` : undefined}
        >
          <Text style={styles.revealHintText}>
            Reveal Hint ({hintsRevealed}/{totalHiddenBrands})
          </Text>
        </Pressable>
      )}

      {/* Give Up link - shown while playing */}
      {!isGameOver && (
        <Pressable
          onPress={onGiveUp}
          style={({ pressed }) => [
            styles.giveUpLink,
            pressed && styles.giveUpLinkPressed,
          ]}
          testID={testID ? `${testID}-giveup` : undefined}
        >
          <Text style={styles.giveUpText}>Give up</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === "ios" ? spacing["2xl"] : spacing.lg,
    backgroundColor: colors.stadiumNavy,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    gap: spacing.md,
  },
  revealHintButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardYellow,
    backgroundColor: "transparent",
  },
  revealHintButtonPressed: {
    opacity: 0.7,
  },
  revealHintText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.cardYellow,
  },
  giveUpLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  giveUpLinkPressed: {
    opacity: 0.7,
  },
  giveUpText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.redCard,
  },
});
