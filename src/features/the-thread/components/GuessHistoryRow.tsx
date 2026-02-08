import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors, spacing, fonts, fontWeights } from "@/theme";
import { ClubShield } from "@/components/ClubShield";
import type { UnifiedClub } from "@/services/club";
import { LAYOUT } from "../constants/timeline";

const MAX_VISIBLE_SHIELDS = 5;

export interface GuessHistoryRowProps {
  /** Array of incorrect guesses */
  guesses: UnifiedClub[];
  /** Test ID for testing */
  testID?: string;
}

/**
 * GuessHistoryRow - Displays previous incorrect guesses as dimmed club shields.
 *
 * Shows up to 5 shields, then "+N more" text.
 * Opacity: 0.5 for dimmed effect.
 */
export function GuessHistoryRow({ guesses, testID }: GuessHistoryRowProps) {
  if (guesses.length === 0) return null;

  const visibleGuesses = guesses.slice(0, MAX_VISIBLE_SHIELDS);
  const remainingCount = guesses.length - MAX_VISIBLE_SHIELDS;

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>Previous guesses:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shieldsContainer}
      >
        {visibleGuesses.map((club, index) => (
          <View
            key={`${club.id}-${index}`}
            style={styles.shieldWrapper}
            testID={testID ? `${testID}-shield-${index}` : undefined}
          >
            <ClubShield
              primaryColor={club.primary_color}
              secondaryColor={club.secondary_color}
              size={28}
            />
          </View>
        ))}
        {remainingCount > 0 && (
          <View style={styles.moreContainer}>
            <Text style={styles.moreText}>+{remainingCount}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: LAYOUT.guessHistoryHeight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  shieldsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  shieldWrapper: {
    opacity: 0.5,
  },
  moreContainer: {
    paddingHorizontal: spacing.sm,
    justifyContent: "center",
  },
  moreText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
