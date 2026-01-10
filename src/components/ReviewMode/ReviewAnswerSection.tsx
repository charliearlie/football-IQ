import { View, Text, StyleSheet } from 'react-native';
import { Trophy, XCircle } from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius } from '@/theme';

export interface ReviewAnswerSectionProps {
  /** The correct answer */
  answer: string;
  /** Whether the user won the game */
  won: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ReviewAnswerSection - Displays the correct answer in review mode
 *
 * Shows "You got it!" with a trophy icon when the user won,
 * or "The answer was:" with an X icon when they lost.
 */
export function ReviewAnswerSection({
  answer,
  won,
  testID,
}: ReviewAnswerSectionProps) {
  const Icon = won ? Trophy : XCircle;
  const iconColor = won ? colors.pitchGreen : colors.redCard;
  const label = won ? 'You got it!' : 'The answer was:';

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Icon size={20} color={iconColor} strokeWidth={2} />
        <Text style={[styles.label, { color: iconColor }]}>{label}</Text>
      </View>
      <View style={[styles.answerBox, won ? styles.wonBox : styles.lostBox]}>
        <Text style={styles.answer}>{answer}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    ...textStyles.subtitle,
    fontSize: 16,
  },
  answerBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
  },
  wonBox: {
    backgroundColor: 'rgba(88, 204, 2, 0.1)',
    borderColor: colors.pitchGreen,
  },
  lostBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.redCard,
  },
  answer: {
    ...textStyles.subtitle,
    color: colors.floodlightWhite,
    textAlign: 'center',
  },
});
