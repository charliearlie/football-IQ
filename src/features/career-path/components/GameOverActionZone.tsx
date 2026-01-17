import { View, Text, StyleSheet, Platform } from 'react-native';
import { ElevatedButton } from '@/components';
import { colors, spacing, fonts, textStyles } from '@/theme';

export interface GameOverActionZoneProps {
  /** The correct answer (player name) */
  answer: string;
  /** Whether the player won the game */
  won: boolean;
  /** Callback when "See how you scored" is pressed */
  onSeeScore: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * GameOverActionZone - Shown when the game ends (win or lose).
 *
 * Replaces the input ActionZone with:
 * - The player's name displayed prominently
 * - A button to view the score/result modal
 */
export function GameOverActionZone({
  answer,
  won,
  onSeeScore,
  testID,
}: GameOverActionZoneProps) {
  return (
    <View style={styles.container} testID={testID}>
      {/* Answer display */}
      <View style={styles.answerContainer}>
        <Text style={styles.answerLabel}>
          {won ? 'Correct!' : 'The answer was'}
        </Text>
        <Text
          style={[
            styles.answerText,
            won ? styles.answerWon : styles.answerLost,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {answer}
        </Text>
      </View>

      {/* See score button */}
      <ElevatedButton
        title="See how you scored"
        onPress={onSeeScore}
        fullWidth
        testID={`${testID}-button`}
      />
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
  answerContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  answerLabel: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  answerText: {
    fontFamily: fonts.headline,
    fontSize: 28,
    letterSpacing: 1,
    textAlign: 'center',
  },
  answerWon: {
    color: colors.pitchGreen,
  },
  answerLost: {
    color: colors.floodlightWhite,
  },
});
