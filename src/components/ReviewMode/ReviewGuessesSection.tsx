import { View, Text, StyleSheet } from 'react-native';
import { XCircle } from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius, fonts } from '@/theme';

export interface ReviewGuessesSectionProps {
  /** Array of incorrect guesses made by the user */
  guesses: string[];
  /** Label to display above the guesses (default: "Your guesses:") */
  label?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ReviewGuessesSection - Displays the user's incorrect guesses in review mode
 *
 * Shows a numbered list of all incorrect guesses the user made during the game.
 * Returns null if no guesses were made.
 */
export function ReviewGuessesSection({
  guesses,
  label = 'Your guesses:',
  testID,
}: ReviewGuessesSectionProps) {
  // Don't render anything if no guesses
  if (guesses.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.guessList}>
        {guesses.map((guess, index) => (
          <View key={index} style={styles.guessRow}>
            <XCircle size={16} color={colors.redCard} strokeWidth={2} />
            <Text style={styles.guessNumber}>{index + 1}.</Text>
            <Text style={styles.guessText}>{guess}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  label: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  guessList: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  guessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  guessNumber: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    width: 20,
  },
  guessText: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    flex: 1,
  },
});
